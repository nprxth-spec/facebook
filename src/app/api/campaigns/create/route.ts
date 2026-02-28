import { auth } from "@/lib/auth";
import { getFacebookToken } from "@/lib/tokens";
import { NextRequest, NextResponse } from "next/server";

const FB_API = "https://graph.facebook.com/v19.0";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getVerifiedBeneficiary(
    adAccountId: string,
    token: string
): Promise<string | null> {
    const actId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    try {
        const accountRes = await fetch(
            `${FB_API}/${actId}?fields=default_dsa_beneficiary&access_token=${token}`
        );
        const accountData = await accountRes.json().catch(() => ({}));

        const dsa = accountData?.default_dsa_beneficiary;
        if (dsa && !accountData?.error) return String(dsa).trim();

        // NOTE: Do NOT fall back to agency ID — agencies are NOT valid DSA beneficiaries.
        // Only personal profile IDs (verified individuals) are accepted by Facebook.
        return null;
    } catch {
        return null;
    }
}

async function uploadImageToFacebook(
    adAccountId: string,
    token: string,
    imageFile: File
): Promise<{ hash: string; url: string }> {
    const actId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const formData = new FormData();
    formData.append("filename", imageFile, imageFile.name);
    formData.append("access_token", token);

    const res = await fetch(`${FB_API}/${actId}/adimages`, {
        method: "POST",
        body: formData,
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || "Image upload failed");

    const imageData = Object.values(data.images || {})[0] as any;
    return { hash: imageData.hash, url: imageData.url };
}

async function uploadVideoToFacebook(
    adAccountId: string,
    token: string,
    videoFile: File
): Promise<string> {
    const actId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const formData = new FormData();
    formData.append("file", videoFile, videoFile.name);
    formData.append("access_token", token);

    const res = await fetch(`${FB_API}/${actId}/advideos`, {
        method: "POST",
        body: formData,
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || "Video upload failed");
    return data.id;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getFacebookToken(session.user.id);
    if (!token) return NextResponse.json({ error: "Facebook account not connected" }, { status: 400 });

    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const adAccountId = (formData.get("adAccountId") as string)?.trim();
    const pageId = (formData.get("pageId") as string)?.trim();
    const campaignObjective = (formData.get("campaignObjective") as string) || "OUTCOME_ENGAGEMENT";
    const dailyBudgetRaw = parseFloat((formData.get("dailyBudget") as string) || "400");
    const campaignCount = Math.max(1, parseInt((formData.get("campaignCount") as string) || "1", 10));
    const adSetCount = Math.max(1, parseInt((formData.get("adSetCount") as string) || "1", 10));
    const adsCount = Math.max(1, parseInt((formData.get("adsCount") as string) || "1", 10));
    const targetCountry = (formData.get("targetCountry") as string) || "TH";
    const placementsRaw = (formData.get("placements") as string) || "facebook,instagram,messenger";
    const placements = placementsRaw.split(",").map((p) => p.trim()).filter(Boolean);
    const ageMin = Math.min(65, Math.max(18, parseInt((formData.get("ageMin") as string) || "20", 10)));
    const ageMax = Math.min(65, Math.max(18, parseInt((formData.get("ageMax") as string) || "50", 10)));
    const primaryText = (formData.get("primaryText") as string)?.trim() || null;
    const headline = (formData.get("headline") as string)?.trim() || null;
    const greeting = (formData.get("greeting") as string)?.trim() || null;
    const beneficiaryNameRaw = (formData.get("beneficiaryName") as string)?.trim() || null;
    const manualInterestsRaw = (formData.get("manualInterests") as string) || null;
    const exclusionIdsRaw = (formData.get("exclusionAudienceIds") as string) || null;
    const existingFbVideoId = (formData.get("existingFbVideoId") as string)?.trim() || null;
    const mediaType = (formData.get("mediaType") as string) || null;
    const iceBreakersRaw = (formData.get("iceBreakers") as string) || null;

    if (!adAccountId || !pageId) {
        return NextResponse.json({ error: "adAccountId and pageId are required" }, { status: 400 });
    }

    const cleanId = adAccountId.replace(/^act_/, "");
    const actId = `act_${cleanId}`;

    // Parse optional JSON fields
    let manualInterests: { id: string; name: string }[] = [];
    try { if (manualInterestsRaw) manualInterests = JSON.parse(manualInterestsRaw); } catch { /* ignore */ }
    let exclusionAudienceIds: string[] = [];
    try { if (exclusionIdsRaw) exclusionAudienceIds = JSON.parse(exclusionIdsRaw); } catch { /* ignore */ }
    let iceBreakers: { question: string; payload: string }[] = [];
    try { if (iceBreakersRaw) iceBreakers = JSON.parse(iceBreakersRaw); } catch { /* ignore */ }
    const templateId = (formData.get("templateId") as string) || null;

    // Media
    const mediaFile = formData.get("file") as File | null;
    if (!mediaFile && !existingFbVideoId) {
        return NextResponse.json({ error: "Please provide a media file or select from library" }, { status: 400 });
    }

    // Fetch account info for currency
    const accountRes = await fetch(`${FB_API}/${actId}?fields=currency,name,business_country_code&access_token=${token}`);
    const accountInfo = await accountRes.json();
    if (!accountRes.ok || accountInfo.error) {
        return NextResponse.json({ error: `Failed to fetch account: ${accountInfo.error?.message || "Unknown"}` }, { status: 400 });
    }
    const currency = accountInfo.currency || "USD";
    const minBudgetUnit = currency === "THB" ? 4000 : 500; // min cents
    const dailyBudget = Math.max(minBudgetUnit, Math.round(dailyBudgetRaw * 100));

    // Beneficiary
    let beneficiaryId: string | null = beneficiaryNameRaw;
    if (!beneficiaryId) {
        beneficiaryId = await getVerifiedBeneficiary(adAccountId, token);
    }
    // Note: For Thailand targeting, beneficiary is required by Facebook DSA for certain categories.
    // We no longer block here — if beneficiary is missing and FB requires it, the API will return a clear error.
    if (targetCountry === "TH" && !beneficiaryId) {
        console.warn("[Beneficiary] TH targeting without beneficiary — continuing, let Facebook decide");
    }

    // Upload media
    let fbVideoId: string | null = existingFbVideoId;
    let imageHash: string | null = null;
    const isVideo = mediaType === "video" || !!existingFbVideoId;

    try {
        if (mediaFile && !existingFbVideoId) {
            if (mediaFile.type.startsWith("video/")) {
                fbVideoId = await uploadVideoToFacebook(adAccountId, token, mediaFile);
            } else {
                const img = await uploadImageToFacebook(adAccountId, token, mediaFile);
                imageHash = img.hash;
            }
        }
    } catch (e: any) {
        return NextResponse.json({ error: `Media upload failed: ${e.message}` }, { status: 500 });
    }

    // Ice breakers for messenger
    const validIceBreakers = iceBreakers.filter((ib) => ib.question?.trim());

    const campaignIds: string[] = [];
    const adSetIds: string[] = [];
    const adIds: string[] = [];

    try {
        for (let c = 0; c < campaignCount; c++) {
            if (c > 0) await sleep(300);

            // Create Campaign
            const campaignBody: Record<string, unknown> = {
                name: `Auto Campaign ${c + 1} - ${new Date().toLocaleDateString("th-TH")}`,
                objective: campaignObjective,
                status: "PAUSED",
                special_ad_categories: [],
                is_adset_budget_sharing_enabled: false,
                access_token: token,
            };
            const campaignRes = await fetch(`${FB_API}/${actId}/campaigns`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(campaignBody),
            });
            const campaignData = await campaignRes.json();
            if (!campaignRes.ok || campaignData.error) {
                const err = campaignData.error || {};
                throw new Error(`Campaign failed: ${err.error_user_msg || err.message || "Unknown"} (code ${err.code ?? "?"})`);
            }
            campaignIds.push(campaignData.id);

            const adSetsPerCampaign = Math.ceil(adSetCount / campaignCount);
            const adsPerAdSet = Math.ceil(adsCount / adSetCount);

            for (let s = 0; s < adSetsPerCampaign; s++) {
                if (s > 0) await sleep(200);

                // Build targeting
                const targeting: Record<string, unknown> = {
                    geo_locations: { countries: [targetCountry] },
                    age_min: Math.min(ageMin, ageMax),
                    age_max: Math.max(ageMin, ageMax),
                    publisher_platforms: placements,
                    targeting_automation: {
                        advantage_audience: 0
                    }
                };

                // Only include interests with valid numeric IDs (AI-suggested interests use name as id — skip those)
                const validInterests = manualInterests.filter((i) => i.id && /^\d+$/.test(String(i.id)));
                if (validInterests.length > 0) {
                    targeting.flexible_spec = [{ interests: validInterests.map((i) => ({ id: Number(i.id), name: i.name })) }];
                }

                if (exclusionAudienceIds.length > 0) {
                    targeting.excluded_custom_audiences = exclusionAudienceIds.map((id) => ({ id }));
                }

                // Determine optimization goal based on campaign objective
                const isMessenger = placements.includes("messenger");

                type AdSetGoalConfig = {
                    optimizationGoal: string;
                    billingEvent: string;
                    destinationType?: string;
                    needsPagePromotedObject?: boolean;
                };

                // Facebook-validated objective → adset config combinations
                // Ref: https://developers.facebook.com/docs/marketing-api/campaign-structure
                const goalMap: Record<string, AdSetGoalConfig> = {
                    // OUTCOME_ENGAGEMENT 
                    // User requested "ปลายทางของข้อความ" (Destination: Messenger/Messaging Apps)
                    OUTCOME_ENGAGEMENT: {
                        optimizationGoal: "CONVERSATIONS",
                        billingEvent: "IMPRESSIONS",
                        destinationType: "MESSENGER",
                        needsPagePromotedObject: true,
                    },
                    OUTCOME_TRAFFIC: {
                        optimizationGoal: "LINK_CLICKS",
                        billingEvent: "IMPRESSIONS",
                        destinationType: "WEBSITE",
                        needsPagePromotedObject: false,
                    },
                    OUTCOME_LEADS: {
                        optimizationGoal: "LEAD_GENERATION",
                        billingEvent: "IMPRESSIONS",
                        destinationType: "ON_AD",
                        needsPagePromotedObject: true,
                    },
                    OUTCOME_AWARENESS: {
                        optimizationGoal: "REACH",
                        billingEvent: "IMPRESSIONS",
                        needsPagePromotedObject: false,
                    },
                    OUTCOME_SALES: {
                        optimizationGoal: "OFFSITE_CONVERSIONS",
                        billingEvent: "IMPRESSIONS",
                        destinationType: "WEBSITE",
                        needsPagePromotedObject: false,
                    },
                };
                const goalConfig: AdSetGoalConfig = goalMap[campaignObjective] ?? { optimizationGoal: "REACH", billingEvent: "IMPRESSIONS", needsPagePromotedObject: false };

                const adSetBody: Record<string, unknown> = {
                    name: `AdSet ${s + 1} - ${new Date().toLocaleDateString("en-US")}`,
                    campaign_id: campaignData.id,
                    optimization_goal: goalConfig.optimizationGoal,
                    billing_event: goalConfig.billingEvent,
                    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
                    daily_budget: dailyBudget,
                    status: "PAUSED",
                    targeting,
                    access_token: token,
                };

                // If destination_type is MESSENGER, messenger must be in publisher_platforms
                if (goalConfig.destinationType === "MESSENGER") {
                    const platforms = Array.isArray(targeting.publisher_platforms)
                        ? targeting.publisher_platforms as string[]
                        : ["facebook"];
                    if (!platforms.includes("messenger")) {
                        targeting.publisher_platforms = [...platforms, "messenger"];
                    }
                }

                if (goalConfig.needsPagePromotedObject) {
                    adSetBody.promoted_object = { page_id: pageId };
                }

                if (goalConfig.destinationType) adSetBody.destination_type = goalConfig.destinationType;



                // Thailand DSA regulation
                // Only send regional_regulation_identities when we have a verified beneficiary
                if (targetCountry === "TH" && beneficiaryId) {
                    console.log(`[Beneficiary] Using for TH: ${beneficiaryId}`);
                    // adSetBody.regional_regulation_identities = {
                    //    universal_beneficiary: String(beneficiaryId),
                    //    universal_payer: String(beneficiaryId),
                    // };
                } else if (targetCountry === "TH") {
                    console.warn("[Beneficiary] TH adset created WITHOUT beneficiary — may fail DSA check");
                }

                // Full body log for debugging
                console.log("[AdSet] Full body:", JSON.stringify(adSetBody, null, 2));

                const adSetRes = await fetch(`${FB_API}/${actId}/adsets`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(adSetBody),
                });
                const adSetData = await adSetRes.json();
                if (!adSetRes.ok || adSetData.error) {
                    const err = adSetData.error || {};
                    console.error("[AdSet] Create Failed. Full Error:", JSON.stringify(err, null, 2));
                    console.error("[AdSet] Body that caused error:", JSON.stringify(adSetBody, null, 2));
                    try {
                        require("fs").writeFileSync("error_log.txt", JSON.stringify({ error: err, body: adSetBody }, null, 2));
                    } catch (e) { }
                    throw new Error(`AdSet failed: ${err.error_user_msg || err.message || "Unknown"} (Subcode: ${err.error_subcode ?? "none"})`);
                }
                adSetIds.push(adSetData.id);

                for (let a = 0; a < adsPerAdSet; a++) {
                    if (a > 0) await sleep(150);

                    // Build creative story spec
                    let objectStorySpec: {
                        page_id: string;
                        video_data?: Record<string, any>;
                        link_data?: Record<string, any>;
                    };
                    // Fetch video thumbnail — Facebook REQUIRES image_url in video_data
                    let videoThumbnailUrl: string | null = null;

                    if (fbVideoId) {
                        try {
                            // Try 'picture' field first (simplest, no extra permissions)
                            const thumbRes = await fetch(
                                `${FB_API}/${fbVideoId}?fields=picture,thumbnails{uri,is_preferred}&access_token=${token}`
                            );
                            const thumbData = await thumbRes.json();

                            if (thumbData?.picture) {
                                videoThumbnailUrl = thumbData.picture;
                            } else {
                                // Fallback: preferred thumbnail from thumbnails list
                                const thumbs: Array<{ uri: string; is_preferred?: boolean }> =
                                    thumbData?.thumbnails?.data || [];
                                const preferred = thumbs.find((t) => t.is_preferred) || thumbs[0];
                                videoThumbnailUrl = preferred?.uri || null;
                            }
                        } catch (e) {
                            console.warn("[Creative] Thumbnail fetch error:", e);
                        }

                        // If still no thumbnail, throw — FB will reject without it
                        if (!videoThumbnailUrl) {
                            throw new Error("Creative failed: ไม่สามารถดึง thumbnail ของ video ได้ — Facebook บังคับให้ระบุ image_url");
                        }

                        const videoData: Record<string, unknown> = {
                            video_id: fbVideoId,
                            image_url: videoThumbnailUrl,
                        };
                        if (primaryText) videoData.message = primaryText;
                        if (headline) videoData.title = headline;
                        if (greeting) videoData.call_to_action = { type: "LEARN_MORE", value: { link: `https://m.me/${pageId}` } };
                        if (validIceBreakers.length > 0) {
                            videoData.call_to_action = {
                                type: "MESSAGE_PAGE",
                                value: { app_destination: "MESSENGER" },
                            };
                        }
                        objectStorySpec = {
                            page_id: pageId,
                            video_data: videoData,
                        };

                    } else if (imageHash) {
                        const linkData: Record<string, unknown> = {
                            image_hash: imageHash,
                            link: `https://www.facebook.com/${pageId}`,
                            call_to_action: { type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER" } },
                        };
                        if (primaryText) linkData.message = primaryText;
                        if (headline) linkData.name = headline;
                        objectStorySpec = {
                            page_id: pageId,
                            link_data: linkData,
                        };
                    } else {
                        throw new Error("No valid media for creative");
                    }

                    const creativeBody: Record<string, unknown> = {
                        name: `Creative ${a + 1} - ${Date.now()}`,
                        object_story_spec: objectStorySpec,
                        access_token: token,
                    };

                    // Add messenger ice breakers if applicable
                    if (templateId) {
                        // Use existing messenger template by ID
                        if (objectStorySpec.link_data) {
                            objectStorySpec.link_data.call_to_action = {
                                type: "MESSAGE_PAGE",
                                value: { page_welcome_message: JSON.stringify({ "id": templateId }) }
                            };
                        } else if (objectStorySpec.video_data) {
                            objectStorySpec.video_data.call_to_action = {
                                type: "MESSAGE_PAGE",
                                value: { page_welcome_message: JSON.stringify({ "id": templateId }) }
                            };
                        }
                    } else if (validIceBreakers.length > 0) {
                        creativeBody.messenger_sponsored_message = {
                            message: { text: greeting || primaryText || "สวัสดีครับ 👋" },
                            ice_breakers: validIceBreakers.map((ib) => ({
                                question: ib.question,
                                payload: ib.payload || ib.question,
                            })),
                        };
                    }

                    const creativeRes = await fetch(`${FB_API}/${actId}/adcreatives`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(creativeBody),
                    });
                    const creativeData = await creativeRes.json();
                    if (!creativeRes.ok || creativeData.error) {
                        const err = creativeData.error || {};
                        require("fs").writeFileSync("error_log.txt", JSON.stringify({ error: err, body: creativeBody }, null, 2));
                        throw new Error(`Creative failed: ${err.error_user_msg || err.message || "Unknown"}`);
                    }

                    const adRes = await fetch(`${FB_API}/${actId}/ads`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: `Ad ${a + 1} - Auto`,
                            adset_id: adSetData.id,
                            creative: { creative_id: creativeData.id },
                            status: "PAUSED",
                            access_token: token,
                        }),
                    });
                    const adData = await adRes.json();
                    if (!adRes.ok || adData.error) {
                        const err = adData.error || {};
                        throw new Error(`Ad failed: ${err.error_user_msg || err.message || "Unknown"}`);
                    }
                    adIds.push(adData.id);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `✅ สร้างแคมเปญสำเร็จ! (PAUSED)\n📊 โครงสร้าง: ${campaignCount} Campaign × ${adSetCount} AdSet × ${adsCount} Ad`,
            campaignId: campaignIds[0],
            structure: { campaigns: campaignIds.length, adSets: adSetIds.length, ads: adIds.length },
        });
    } catch (e: any) {
        console.error("[campaigns/create] Error:", e.message);
        return NextResponse.json({ error: e.message || "Campaign creation failed" }, { status: 500 });
    }
}
