import { auth } from "@/lib/auth";
import { getFacebookToken } from "@/lib/tokens";
import { NextResponse } from "next/server";

const FB_API = "https://graph.facebook.com/v19.0";

async function fetchName(id: string, token: string): Promise<string | null> {
    try {
        const res = await fetch(`${FB_API}/${id}?fields=name&access_token=${token}`);
        const data = await res.json();
        return data?.name || null;
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getFacebookToken(session.user.id);
    if (!token) return NextResponse.json({ error: "No Facebook token" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get("adAccountId")?.trim();
    if (!adAccountId) return NextResponse.json({ beneficiaries: [] });

    const cleanId = adAccountId.replace(/^act_/, "");
    const actId = `act_${cleanId}`;

    try {
        const beneficiariesMap = new Map<string, string>();

        // NOTE: We do NOT use /me here — the current user's profile ID is NOT necessarily
        // a verified DSA beneficiary. Only use IDs that Facebook has explicitly verified.

        // ── PRIORITY 1: Existing AdSets (most reliable — already accepted by Facebook) ──

        try {
            const adSetsRes = await fetch(
                `${FB_API}/${actId}/adsets?fields=regional_regulation_identities&limit=20&access_token=${token}`
            );
            const adSetsData = await adSetsRes.json().catch(() => ({}));
            for (const adset of adSetsData?.data || []) {
                const rri = adset.regional_regulation_identities;
                if (!rri) continue;
                const bid = rri.universal_beneficiary;
                if (bid) beneficiariesMap.set(String(bid), String(bid));
                const pid = rri.universal_payer;
                if (pid) beneficiariesMap.set(String(pid), String(pid));
            }
        } catch { /* ignore */ }

        // ── PRIORITY 2: Current user's own profile (/me) — as fallback ──
        // This is often the intended beneficiary even if not explicitly listed in DSA settings yet.
        try {
            const meRes = await fetch(`${FB_API}/me?fields=id,name&access_token=${token}`);
            const meData = await meRes.json().catch(() => ({}));
            if (meData?.id && meData?.name && !beneficiariesMap.has(String(meData.id))) {
                beneficiariesMap.set(String(meData.id), meData.name);
            }
        } catch { /* ignore */ }

        // ── PRIORITY 3: Account-level DSA fields ──
        try {
            const accountRes = await fetch(
                `${FB_API}/${actId}?fields=default_dsa_beneficiary,default_dsa_payor,adv_delivery_settings{dsa_verified_beneficiaries,dsa_verified_payors},business{id,name}&access_token=${token}`
            );
            const accountData = await accountRes.json().catch(() => ({}));

            const processList = (list: any[]) => {
                if (!Array.isArray(list)) return;
                for (const item of list) {
                    if (item.id && item.name) beneficiariesMap.set(String(item.id), item.name);
                    else if (item.id) beneficiariesMap.set(String(item.id), String(item.id));
                    else if (typeof item === "string") beneficiariesMap.set(item, item);
                }
            };
            const dsaSettings = accountData?.adv_delivery_settings;
            processList(dsaSettings?.dsa_verified_beneficiaries);
            processList(dsaSettings?.dsa_verified_payors);

            if (accountData.default_dsa_beneficiary)
                beneficiariesMap.set(String(accountData.default_dsa_beneficiary), String(accountData.default_dsa_beneficiary));
            if (accountData.default_dsa_payor)
                beneficiariesMap.set(String(accountData.default_dsa_payor), String(accountData.default_dsa_payor));
        } catch { /* ignore */ }

        // ── PRIORITY 3: Assigned users ──
        try {
            const usersRes = await fetch(`${FB_API}/${actId}/assigned_users?fields=id,name&access_token=${token}`);
            const usersData = await usersRes.json().catch(() => ({}));
            for (const user of usersData?.data || []) {
                const uid = String(user.id);
                if (!beneficiariesMap.has(uid)) beneficiariesMap.set(uid, user.name || uid);
            }
        } catch { /* ignore */ }

        // ── Resolve names for IDs without friendly names ──
        const resolveTasks: Promise<void>[] = [];
        for (const [id, name] of beneficiariesMap.entries()) {
            if (name === id && id.length > 5) {
                resolveTasks.push((async () => {
                    const fetchedName = await fetchName(id, token);
                    if (fetchedName) beneficiariesMap.set(id, fetchedName);
                })());
            }
        }
        await Promise.all(resolveTasks);

        const beneficiaries = Array.from(beneficiariesMap.entries()).map(([id, name]) => ({
            id,
            name: name === id ? name : `${name} (ID: ${id})`,
        }));

        return NextResponse.json({ beneficiaries });
    } catch (e: any) {
        console.error("[Beneficiaries] Final error:", e.message);
        return NextResponse.json({ beneficiaries: [] });
    }
}
