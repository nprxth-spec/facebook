import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAllFacebookTokens } from "@/lib/tokens";
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { runWithConcurrency } from "@/lib/concurrency";

const FB_API = "https://graph.facebook.com/v19.0";

function isMissingAdsPermissionError(err: unknown) {
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const code = (err as any)?.code;
  return (
    code === 200 ||
    /Ad account owner has NOT grant/i.test(message) ||
    /ads_management or ads_read/i.test(message) ||
    /ads_management/i.test(message) ||
    /ads_read/i.test(message)
  );
}

interface AdsInsightsQuery {
  from?: string;
  to?: string;
  search?: string;
  refresh?: string;
}

const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes

const MAX_INSIGHTS_ACCOUNTS =
  Number.parseInt(process.env.MAX_INSIGHTS_ACCOUNTS || "20") || 20;
const MAX_INSIGHTS_RANGE_DAYS =
  Number.parseInt(process.env.MAX_INSIGHTS_RANGE_DAYS || "31") || 31;
const ADS_INSIGHTS_CONCURRENCY =
  Number.parseInt(process.env.ADS_INSIGHTS_CONCURRENCY || "4") || 4;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fbTokens = await getAllFacebookTokens(session.user.id);
  if (!fbTokens.length) {
    return NextResponse.json({ error: "Facebook account not connected" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const query: AdsInsightsQuery = {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    refresh: searchParams.get("refresh") ?? undefined,
  };

  if (!query.from || !query.to) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 });
  }

  // Guard: limit maximum date span to avoid extremely heavy requests
  try {
    const fromDate = new Date(query.from);
    const toDate = new Date(query.to);
    const diffMs = toDate.getTime() - fromDate.getTime();
    const diffDays = diffMs > 0 ? diffMs / (24 * 60 * 60 * 1000) : 0;
    if (diffDays > MAX_INSIGHTS_RANGE_DAYS) {
      return NextResponse.json(
        {
          error: `Date range too large. Please select at most ${MAX_INSIGHTS_RANGE_DAYS} days.`,
        },
        { status: 400 }
      );
    }
  } catch {
    // ถ้าพาร์สไม่ได้ ปล่อยให้ไป error จาก Meta แทน
  }

  // Only use ad accounts that are active in Manager Accounts
  const managerAccounts = await prisma.managerAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { accountId: true, name: true },
  });

  if (!managerAccounts.length) {
    return NextResponse.json({ ads: [] });
  }

  if (managerAccounts.length > MAX_INSIGHTS_ACCOUNTS) {
    console.warn(
      `[AdsInsights] Too many manager accounts (${managerAccounts.length}). Limiting to first ${MAX_INSIGHTS_ACCOUNTS}.`
    );
  }

  const limitedAccounts = managerAccounts.slice(0, MAX_INSIGHTS_ACCOUNTS);

  const cacheKey = `ads_${session.user.id}_${query.from}_${query.to}_${query.search || "none"}`;

  // Serve from cache if available (skip if refresh=true)
  if (query.refresh !== "true") {
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  const timeRange = JSON.stringify({ since: query.from, until: query.to });
  const allAds: any[] = [];

  // Parallel fetch across active ad accounts with concurrency limit
  await runWithConcurrency(
    limitedAccounts,
    ADS_INSIGHTS_CONCURRENCY,
    async (acc) => {
      try {
        const accountPath = acc.accountId.startsWith("act_")
          ? acc.accountId
          : `act_${acc.accountId}`;

        const fields = [
          "id",
          "name",
          "effective_status",
          "configured_status",
          "adset{name,targeting,targeting_optimization_types,optimization_goal}",
          "adcreatives{image_url,thumbnail_url,actor_id{id,name,username},instagram_actor_id,effective_object_story_id,object_story_id,object_story_spec{page_id{id,name,username},link_data{picture},video_data{image_url},photo_data{url}}}",
          `insights.time_range(${timeRange}){impressions,clicks,spend,cost_per_result,objective,actions}`,
        ].join(",");

        let lastErr: unknown = null;
        let fetched = false;

        // Try each token until we find one that is granted for this ad account.
        for (const { token } of fbTokens) {
          const adsForToken: any[] = [];
          let url: string | null = `${FB_API}/${accountPath}/ads?fields=${encodeURIComponent(fields)}&limit=100&access_token=${token}`;

          try {
            while (url) {
              const res = await fetch(url);
              const data: any = await res.json();
              if (data.error) {
                const e = new Error(data.error.message ?? "Facebook API error") as any;
                e.code = data.error.code;
                throw e;
              }

              const chunk = (data.data ?? []).map((ad: any) => {
                // Flatten insights array into the ad root object for the dashboard mapper
                const insight = ad.insights?.data?.[0] || {};
                return {
                  ...ad,
                  impressions: insight.impressions,
                  clicks: insight.clicks,
                  spend: insight.spend,
                  cost_per_result: insight.cost_per_result,
                  objective: insight.objective,
                  actions: insight.actions,
                  _accountName: acc.name,
                  // Map 'id' to 'ad_id' and 'name' to 'ad_name' so old mapping works
                  ad_id: ad.id,
                  ad_name: ad.name,
                  account_id: acc.accountId,
                };
              });
              adsForToken.push(...chunk);
              url = data.paging?.next ?? null;
            }

            allAds.push(...adsForToken);
            fetched = true;
            break;
          } catch (err) {
            lastErr = err;
            if (!isMissingAdsPermissionError(err)) {
              // If it's not a permission issue, don't waste time trying other tokens.
              break;
            }
          }
        }

        if (!fetched && lastErr) {
          console.error("FB ads batch fetch failed for account", acc.accountId, lastErr);
        }
      } catch (err) {
        console.error("FB ads batch fetch error for account", acc.accountId, err);
      }
      return null;
    }
  );

  // --- Page name lookup: DB first, Facebook API as fallback ---
  // Collect all page IDs referenced by ads
  const allPageIds = new Set<string>();
  for (const ad of allAds) {
    const creatives: any[] = ad.adcreatives?.data || [];
    for (const c of creatives) {
      const actorObj = typeof c.actor_id === "object" && c.actor_id !== null ? c.actor_id : null;
      const actorIdStr = typeof c.actor_id === "string" ? c.actor_id : null;
      const spec = c.object_story_spec;
      const specPageId = spec?.page_id != null ? String(spec.page_id) : null;
      const storyPid = (c.effective_object_story_id || c.object_story_id || "").split("_")[0] || null;
      const pid = actorObj?.id || actorIdStr || specPageId || storyPid || null;
      if (pid) allPageIds.add(String(pid));
      break;
    }
  }

  // 1. Look up in local DB (no API quota!)
  const pagesData: Record<string, { name: string; username?: string | null }> = {};
  if (allPageIds.size > 0) {
    const dbPages = await prisma.facebookPage.findMany({
      where: { userId: session.user.id, pageId: { in: Array.from(allPageIds) } },
      select: { pageId: true, name: true, username: true },
    });
    dbPages.forEach((p) => { pagesData[p.pageId] = { name: p.name, username: p.username }; });

    // 2. Fallback: batch-fetch from Facebook for page IDs not in DB
    const missingFromDb = Array.from(allPageIds).filter((id) => !pagesData[id]);
    if (missingFromDb.length > 0) {
      const fbChunks = [];
      for (let i = 0; i < missingFromDb.length; i += 50) {
        const chunk = missingFromDb.slice(i, i + 50);
        const pUrl = new URL(`${FB_API}`);
        pUrl.searchParams.set("ids", chunk.join(","));
        pUrl.searchParams.set("fields", "name,username");
        // Try multiple tokens because a token might not have ads/page grant for some cases.
        fbChunks.push(
          (async () => {
            for (const { token } of fbTokens) {
              try {
                pUrl.searchParams.set("access_token", token);
                const r = await fetch(pUrl.toString());
                const d = await r.json();
                if (d && !d.error) return d;
              } catch {
                // try next token
              }
            }
            return null;
          })()
        );
      }
      const results = await Promise.all(fbChunks);
      results.forEach((d) => { if (d && !d.error) Object.assign(pagesData, d); });
    }
  }


  const searchLower = query.search?.toLowerCase() ?? "";

  const normalized = allAds
    .map((ad) => {
      const spend = Number(ad.spend ?? 0);
      const impressions = Number(ad.impressions ?? 0);
      const clicks = Number(ad.clicks ?? 0);
      const actions = ad.actions ?? [];

      const targeting = ad.adset?.targeting ?? ad.targeting ?? {};
      const geo = targeting.geo_locations ?? {};
      const countries: string[] = geo.countries ?? [];
      let ageMin = targeting.age_min ?? null;
      let ageMax = targeting.age_max ?? null;

      // Advantage+ Audience uses age_range [min, max]
      if (targeting.age_range && Array.isArray(targeting.age_range) && targeting.age_range.length === 2) {
        ageMin = targeting.age_range[0];
        ageMax = targeting.age_range[1];
      }

      if (targeting.flexible_spec) {
        targeting.flexible_spec.forEach((spec: any) => {
          if (spec.age_min !== undefined) ageMin = spec.age_min;
          if (spec.age_max !== undefined) ageMax = spec.age_max;
        });
      }

      let interests: string[] = (targeting.interests ?? []).map((i: any) => i.name).filter(Boolean);
      if (targeting.flexible_spec) {
        targeting.flexible_spec.forEach((spec: any) => {
          if (spec.interests) {
            interests.push(...spec.interests.map((i: any) => i.name).filter(Boolean));
          }
          if (spec.behaviors) {
            interests.push(...spec.behaviors.map((i: any) => i.name).filter(Boolean));
          }
          if (spec.work_employers) {
            interests.push(...spec.work_employers.map((i: any) => i.name).filter(Boolean));
          }
          if (spec.work_positions) {
            interests.push(...spec.work_positions.map((i: any) => i.name).filter(Boolean));
          }
          if (spec.education_schools) {
            interests.push(...spec.education_schools.map((i: any) => i.name).filter(Boolean));
          }
          if (spec.education_majors) {
            interests.push(...spec.education_majors.map((i: any) => i.name).filter(Boolean));
          }
        });
      }
      interests = Array.from(new Set(interests));

      const creative = ad.adcreatives?.data?.[0] ?? null;
      let picture = "";
      let pageId: string | null = null;
      let pageName: string | null = null;
      let pageUsername: string | null = null;

      if (creative) {
        const creatives = ad.adcreatives?.data || [];
        for (const c of creatives) {
          const actorObj = typeof c.actor_id === "object" && c.actor_id !== null ? c.actor_id : null;
          const actorIdStr = typeof c.actor_id === "string" ? c.actor_id : null;
          const spec = c.object_story_spec;
          const specPageId = spec?.page_id != null ? String(spec.page_id) : null;
          const storyPid = (c.effective_object_story_id || c.object_story_id || "").split("_")[0] || null;

          const pid = actorObj?.id || actorIdStr || specPageId || storyPid || null;

          if (pid) {
            pageId = String(pid);
            pageName = actorObj?.name || pagesData[pid]?.name || null;
            pageUsername = actorObj?.username || pagesData[pid]?.username || null;
            break;
          }
        }

        picture =
          creative.image_url ||
          creative.thumbnail_url ||
          creative.object_story_spec?.link_data?.picture ||
          creative.object_story_spec?.video_data?.image_url ||
          creative.object_story_spec?.photo_data?.url ||
          "";
      }

      if (!picture) {
        picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          ad.ad_name || ad.name || "Ad"
        )}&background=random&color=fff&size=120`;
      }

      let resultValue = 0;
      let costPerResult = 0;
      let specificResultFound = false;

      const resultAction = actions.find((a: any) => a.action_type === "offsite_conversion") ?? null;
      if (resultAction) {
        resultValue = Number(resultAction.value ?? 0);
        specificResultFound = true;
      } else if (ad.objective === "MESSAGES" || ad.adset?.optimization_goal === "CONVERSATIONS") {
        const found = actions.find(
          (a: any) =>
            a.action_type === "onsite_conversion.messaging_conversation_started_7d" ||
            a.action_type === "messaging_conversation_started_7d"
        );
        resultValue = found ? Number(found.value ?? 0) : 0;
        specificResultFound = true;
      } else if (ad.objective && ad.objective !== "POST_ENGAGEMENT") {
        const priorityActions = [
          "onsite_conversion.messaging_conversation_started_7d",
          "messaging_conversation_started_7d",
          "lead",
          "landing_page_view",
          "link_click",
        ];
        for (const actionType of priorityActions) {
          const found = actions.find((a: any) => a.action_type === actionType);
          if (found) {
            resultValue = Number(found.value ?? 0);
            specificResultFound = true;
            break;
          }
        }
      }

      if (!specificResultFound && !resultValue) {
        resultValue = clicks || impressions;
      }

      if (resultValue > 0 && spend > 0) {
        costPerResult = spend / resultValue;
      } else if (ad.cost_per_result) {
        costPerResult = Number(ad.cost_per_result);
      } else if (spend > 0) {
        costPerResult = spend / (resultValue || 1);
      }

      const storyId = creative?.effective_object_story_id || creative?.object_story_id;
      const adPostUrl = storyId ? `https://facebook.com/${storyId}` : null;
      // พยายามสร้างลิงก์ให้ชี้ไปยังบัญชีโฆษณาที่ถูกต้องใน Ads Manager
      const rawAccountId = String(ad.account_id ?? "");
      const numericAccountId = rawAccountId.startsWith("act_")
        ? rawAccountId.slice(4)
        : rawAccountId;
      // ใช้ account id เดียวกันเป็นทั้ง global_scope_id / business_id / act
      const adsManagerUrl =
        `https://adsmanager.facebook.com/adsmanager/manage/campaigns` +
        `?global_scope_id=${numericAccountId}` +
        `&business_id=${numericAccountId}` +
        `&act=${numericAccountId}`;

      return {
        id: ad.ad_id as string,
        name: (ad.ad_name || ad.name) as string,
        accountId: ad.account_id as string,
        accountName: ad._accountName as string,
        adsManagerUrl,
        adPostUrl,
        pageId: pageId as string | null,
        pageName: pageName as string | null,
        pageUsername: pageUsername as string | null,
        image: picture as string,
        targeting: { countries, ageMin, ageMax, interests },
        objective: ad.objective ?? null,
        result: resultValue,
        spend,
        costPerResult,
        status: ad.effective_status ?? ad.configured_status ?? "UNKNOWN",
      };
    })
    .filter((ad) => {
      if (!searchLower) return true;
      return (
        ad.name.toLowerCase().includes(searchLower) ||
        ad.accountName.toLowerCase().includes(searchLower) ||
        (ad.pageName ?? "").toLowerCase().includes(searchLower)
      );
    });

  const responseData = { ads: normalized };

  // Store in cache (Redis if configured, else in-memory)
  try {
    await cacheSet(cacheKey, responseData, CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn("[AdsInsights] Failed to write cache:", err);
  }

  return NextResponse.json(responseData);
}
