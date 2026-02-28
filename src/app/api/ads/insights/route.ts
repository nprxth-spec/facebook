import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFacebookToken } from "@/lib/tokens";
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";

const FB_API = "https://graph.facebook.com/v19.0";

interface AdsInsightsQuery {
  from?: string;
  to?: string;
  search?: string;
  refresh?: string;
}

const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getFacebookToken(session.user.id);
  if (!token) {
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

  // Only use ad accounts that are active in Manager Accounts
  const managerAccounts = await prisma.managerAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { accountId: true, name: true },
  });

  if (!managerAccounts.length) {
    return NextResponse.json({ ads: [] });
  }

  const cacheKey = `ads_${session.user.id}_${query.from}_${query.to}_${query.search || "none"}`;

  // Serve from cache if available (skip if refresh=true)
  if (query.refresh !== "true") {
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  const timeRange = JSON.stringify({ since: query.from, until: query.to });
  const allAds: any[] = [];

  // Parallel fetch across all active ad accounts
  await Promise.all(
    managerAccounts.map(async (acc) => {
      try {
        const accountPath = acc.accountId.startsWith("act_")
          ? acc.accountId
          : `act_${acc.accountId}`;

        const insightsUrl = new URL(`${FB_API}/${accountPath}/insights`);
        insightsUrl.searchParams.set("level", "ad");
        insightsUrl.searchParams.set("time_range", timeRange);
        insightsUrl.searchParams.set(
          "fields",
          "ad_id,ad_name,account_id,impressions,clicks,spend,cost_per_result,objective,actions"
        );
        insightsUrl.searchParams.set("limit", "500");
        insightsUrl.searchParams.set("access_token", token);

        const insRes = await fetch(insightsUrl.toString());
        const insData = await insRes.json();

        if (insData?.data && Array.isArray(insData.data) && insData.data.length > 0) {
          const adIds = insData.data.map((i: any) => i.ad_id);

          // Fetch ad metadata in chunks of 50 (parallel)
          const chunkPromises = [];
          for (let i = 0; i < adIds.length; i += 50) {
            const chunk = adIds.slice(i, i + 50);
            const adsUrl = new URL(`${FB_API}`);
            adsUrl.searchParams.set("ids", chunk.join(","));
            adsUrl.searchParams.set(
              "fields",
              "id,name,effective_status,configured_status,adset{name,targeting,targeting_optimization_types,optimization_goal},adcreatives{image_url,thumbnail_url,actor_id{id,name,username},instagram_actor_id,effective_object_story_id,object_story_id,object_story_spec{page_id{id,name,username},link_data{picture},video_data{image_url},photo_data{url}}}"
            );
            adsUrl.searchParams.set("access_token", token);
            chunkPromises.push(
              fetch(adsUrl.toString())
                .then((res) => res.json())
                .catch(() => ({}))
            );
          }

          const chunkResults = await Promise.all(chunkPromises);
          const mergedAdsData = Object.assign({}, ...chunkResults);

          insData.data.forEach((insight: any) => {
            const adMetadata = mergedAdsData[insight.ad_id] || {};
            allAds.push({ ...insight, ...adMetadata, _accountName: acc.name });
          });
        }
      } catch (err) {
        console.error("FB ads insights error for account", acc.accountId, err);
      }
    })
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
        pUrl.searchParams.set("access_token", token);
        fbChunks.push(fetch(pUrl.toString()).then((r) => r.json()).catch(() => null));
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

      const resultAction = actions.find((a: any) => a.action_type === "offsite_conversion") ?? null;
      if (resultAction) {
        resultValue = Number(resultAction.value ?? 0);
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
          if (found) { resultValue = Number(found.value ?? 0); break; }
        }
      }

      if (!resultValue) {
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
      const adsManagerUrl = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${ad.account_id}`;

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
  await cacheSet(cacheKey, responseData, CACHE_TTL_SECONDS);

  return NextResponse.json(responseData);
}
