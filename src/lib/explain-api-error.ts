/**
 * Map raw API / third-party error strings to user-facing titles, causes, and next steps.
 * Used by ErrorExplanationDialog and short toast titles.
 */

export type ExplainedError = {
  titleTh: string;
  titleEn: string;
  causeTh: string;
  causeEn: string;
  stepsTh: string[];
  stepsEn: string[];
  /**
   * Optional UI action hint for ErrorExplanationDialog.
   * Helps avoid asking the user to manually disconnect/reconnect.
   */
  actionKind?: "reconnect_google";
};

const UNKNOWN_TH = "เกิดข้อผิดพลาด";
const UNKNOWN_EN = "Something went wrong";

function defaultExplained(raw: string): ExplainedError {
  const hasRaw = raw.trim().length > 0;
  return {
    titleTh: UNKNOWN_TH,
    titleEn: UNKNOWN_EN,
    causeTh: hasRaw
      ? "ระบบส่งข้อความข้อผิดพลาดกลับมา แต่เราไม่มีคำอธิบายเฉพาะสำหรับข้อความนี้"
      : "ไม่มีรายละเอียดข้อผิดพลาดจากเซิร์ฟเวอร์",
    causeEn: hasRaw
      ? "The server returned an error message we don't have a specific explanation for yet."
      : "No error details were returned from the server.",
    stepsTh: [
      "ลองรีเฟรชหน้าแล้วทำรายการใหม่",
      "ถ้ายังไม่หาย ให้ลองออกจากระบบแล้วเข้าใหม่",
      "หากเป็นปัญหาซ้ำ แจ้งทีมพร้อมแนบข้อความด้านล่าง (รายละเอียดจากระบบ)",
    ],
    stepsEn: [
      "Refresh the page and try again.",
      "If it persists, sign out and sign back in.",
      "If it keeps happening, contact support and include the technical details below.",
    ],
  };
}

/**
 * @param raw - Usually `Error.message` or `data.error` from JSON
 */
export function explainApiError(raw: string | null | undefined): ExplainedError {
  const msg = (raw ?? "").trim();
  const lower = msg.toLowerCase();

  // ── Facebook: account checkpoint / must complete steps on facebook.com ──
  if (
    /cannot access the app till you log in/i.test(msg) ||
    /cannot access the app until you log in/i.test(msg) ||
    (/follow the instructions given/i.test(msg) && /facebook\.com/i.test(lower))
  ) {
    return {
      titleTh: "Facebook ขอให้แก้สถานะบัญชีก่อน",
      titleEn: "Facebook requires action on your account",
      causeTh:
        "Meta บล็อกการใช้แอปชั่วคราวจนกว่าคุณจะเข้า facebook.com ด้วยบัญชีนี้แล้วทำขั้นตอนที่ขึ้น (เช่น ยืนยันตัวตน ความปลอดภัย หรือข้อกำหนดอื่นของ Facebook)",
      causeEn:
        "Meta is blocking app access until you log in at facebook.com with this account and complete any prompts (security check, identity verification, etc.).",
      stepsTh: [
        "เปิด https://www.facebook.com ในเบราว์เซอร์ (หรือแอป) แล้วล็อกอินด้วยบัญชีเดียวกับที่ใช้เชื่อมแอป",
        "ทำทุกขั้นตอนที่ Facebook แสดงจนเข้าใช้งานได้ปกติ ไม่มีหน้าเตือนค้าง",
        "จากนั้นกลับมาที่แอป → ตั้งค่า → เชื่อมต่อ Facebook ใหม่ (ยกเลิกแล้วเชื่อมใหม่)",
        "ถ้าแอปอยู่โหมด Development ให้แน่ใจว่าบัญชีนี้อยู่ใน Roles (Tester/Developer) ของแอปใน Meta Developer",
      ],
      stepsEn: [
        "Open https://www.facebook.com and log in with the same Facebook account you use for this app.",
        "Complete every on-screen step until your account works normally with no blocking prompts.",
        "Return to this app → Settings → disconnect and reconnect Facebook.",
        "If the app is in Development mode, ensure this user is added under App Roles in Meta Developer.",
      ],
    };
  }

  // ── Meta / Facebook Marketing API ──
  if (
    /ad account owner has not grant/i.test(msg) ||
    /ads_management or ads_read/i.test(msg) ||
    (/\(#200\)/i.test(msg) && /ads_read|ads_management/i.test(msg))
  ) {
    return {
      titleTh: "ไม่มีสิทธิ์เข้าถึงบัญชีโฆษณา (Facebook)",
      titleEn: "No access to this ad account (Facebook)",
      causeTh:
        "บัญชี Facebook ที่ใช้ล็อกอิน/เชื่อมต่อกับแอป ยังไม่ได้รับสิทธิ์ ads_read หรือ ads_management สำหรับบัญชีโฆษณา (act_) ที่เลือก — หรือใช้ token ของโปรไฟล์ที่ไม่ตรงกับเจ้าของ/ผู้ที่ถูกมอบสิทธิ์จริง",
      causeEn:
        "The Facebook user token used by the app doesn't have `ads_read` / `ads_management` for the selected ad account, or you're using a profile that isn't the one granted access in Business Manager.",
      stepsTh: [
        "ใน Meta Business Suite → ตั้งค่าธุรกิจ → บัญชีโฆษณา → ตรวจว่า Facebook user ที่คุณลิงก์กับแอปมีบทบาทที่อ่าน/จัดการโฆษณาได้",
        "ในแอปเรา: ไปที่การเชื่อมต่อ Facebook แล้วลองเชื่อมต่อใหม่ (หรือลิงก์บัญชี Facebook ของผู้ที่ถูก grant จริง)",
        "ถ้ามีหลายบัญชี Facebook เชื่อมไว้ ให้ตรวจว่าบัญชีที่มีสิทธิ์กับ act_ นั้นถูกเชื่อมในแอป",
        "ดูคู่มือสิทธิ์: https://developers.facebook.com/docs/marketing-api/get-started/authorization/#permissions-and-features",
      ],
      stepsEn: [
        "In Meta Business Suite → Business settings → Ad accounts → ensure the Facebook user you linked has an Ads role on that account.",
        "In our app: reconnect Facebook (Settings → connections) using the Facebook profile that was actually granted access.",
        "If you linked multiple Facebook accounts, make sure the one with access to this `act_` is connected.",
        "See: https://developers.facebook.com/docs/marketing-api/get-started/authorization/#permissions-and-features",
      ],
    };
  }

  if (/session has expired|oauthException|invalid oauth/i.test(msg) || /error validating access token/i.test(lower)) {
    return {
      titleTh: "Facebook: token หมดอายุหรือไม่ถูกต้อง",
      titleEn: "Facebook: session or token issue",
      causeTh: "Access token ของ Facebook หมดอายุ ถูกเพิกถอน หรือไม่ถูกต้อง",
      causeEn: "The Facebook access token expired, was revoked, or is invalid.",
      stepsTh: [
        "ไปที่การตั้งค่า → เชื่อมต่อ Facebook → ยกเลิกแล้วเชื่อมต่อใหม่",
        "ล็อกอิน Facebook ด้วยบัญชีที่ถูกต้องระหว่างขั้นตอน OAuth",
      ],
      stepsEn: [
        "Go to Settings → Facebook connection → disconnect and reconnect.",
        "Complete OAuth while logged into the correct Facebook account.",
      ],
    };
  }

  if (/facebook not connected|facebook account not connected/i.test(lower)) {
    return {
      titleTh: "ยังไม่ได้เชื่อมต่อ Facebook",
      titleEn: "Facebook not connected",
      causeTh: "แอปยังไม่มี access token ของ Facebook สำหรับผู้ใช้นี้",
      causeEn: "No Facebook access token is stored for this user.",
      stepsTh: ["ไปที่การตั้งค่าแล้วเชื่อมต่อบัญชี Facebook"],
      stepsEn: ["Connect your Facebook account in Settings."],
    };
  }

  // ── Google / Sheets ──
  if (/insufficient permission|permission denied|google sheets|spreadsheets|drive\.google/i.test(lower)) {
    return {
      titleTh: "Google Sheets: สิทธิ์ไม่พอ",
      titleEn: "Google Sheets: permission issue",
      causeTh: "บัญชี Google ที่เชื่อมไว้ไม่มีสิทธิ์แก้ไขไฟล์ Sheet นี้ หรือ token หมดอายุ/ถูกเพิกถอน",
      causeEn: "The linked Google account can't edit this spreadsheet, or the Google token expired/was revoked.",
      stepsTh: [
        "เปิด Sheet แล้วแชร์ให้บัญชี Google ที่คุณใช้ล็อกอิน (อย่างน้อย Editor)",
        "ในแอปให้เชื่อมต่อ Google ใหม่เพื่อขอสิทธิ์ที่จำเป็น",
      ],
      stepsEn: [
        "Share the spreadsheet with the Google account you use to sign in (at least Editor).",
        "Reconnect Google in the app to refresh permissions.",
      ],
    };
  }

  if (/invalid_grant|refresh token|reconnect google/i.test(lower)) {
    return {
      titleTh: "Google: ต้องเชื่อมต่อใหม่",
      titleEn: "Google: reconnect required",
      causeTh: "การอนุญาตของ Google หมดอายุหรือถูกเพิกถอน",
      causeEn: "Google authorization expired or was revoked.",
      stepsTh: ["ไปที่การตั้งค่า → เชื่อมต่อ Google ใหม่"],
      stepsEn: ["Reconnect Google in Settings."],
      actionKind: "reconnect_google",
    };
  }

  // ── Auth / DB (common in logs) ──
  if (/exceeded the compute time quota|compute time quota/i.test(lower)) {
    return {
      titleTh: "ฐานข้อมูล: เกินโควต้า",
      titleEn: "Database: quota exceeded",
      causeTh: "ผู้ให้บริการฐานข้อมูล (เช่น Neon) แจ้งว่าโปรเจกต์ใช้ compute เกินโควต้าของแพลนปัจจุบัน",
      causeEn: "Your database provider reported that the project exceeded its compute-time quota.",
      stepsTh: [
        "ตรวจแดชบอร์ดของผู้ให้บริการ DB ว่าโควต้าเหลือเท่าไหร่",
        "อัปเกรดแพลน หรือรอรีเซ็ตโควต้า (ถ้าเป็นแพลนฟรี)",
        "ลดการเรียก API/งานที่ยิง DB ถี่ ๆ ชั่วคราว",
      ],
      stepsEn: [
        "Check your DB provider dashboard for quota usage.",
        "Upgrade the plan or wait for the quota reset (free tiers).",
        "Reduce heavy DB usage temporarily (cron jobs, frequent polling).",
      ],
    };
  }

  if (/unauthorized|not authenticated|401/i.test(lower) && !/ad account/i.test(lower)) {
    return {
      titleTh: "ยังไม่ได้เข้าสู่ระบบ",
      titleEn: "Not signed in",
      causeTh: "เซิร์ฟเวอร์ปฏิเสธคำขอเพราะไม่พบ session ที่ถูกต้อง",
      causeEn: "The server rejected the request because there is no valid session.",
      stepsTh: ["ลองเข้าสู่ระบบใหม่"],
      stepsEn: ["Try signing in again."],
    };
  }

  if (/rate.?limit|too many|429|rate_limited/i.test(lower)) {
    return {
      titleTh: "เรียก API ถี่เกินไป",
      titleEn: "Too many requests",
      causeTh: "ระบบจำกัดความถี่การเรียก API ชั่วคราว",
      causeEn: "The request was rate-limited temporarily.",
      stepsTh: ["รอสักครู่แล้วลองใหม่", "ลดการกดซ้ำหรือ sync ถี่ ๆ"],
      stepsEn: ["Wait a moment and try again.", "Avoid repeated clicks or frequent syncs."],
    };
  }

  if (/failed to fetch|networkerror|load failed/i.test(lower)) {
    return {
      titleTh: "เชื่อมต่อเครือข่ายไม่สำเร็จ",
      titleEn: "Network error",
      causeTh: "เบราว์เซอร์ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ (อินเทอร์เน็ต VPN ไฟร์วอลล์ หรือเซิร์ฟเวอร์ล่ม)",
      causeEn: "The browser couldn't reach the server (network, VPN, firewall, or server outage).",
      stepsTh: ["ตรวจสัญญาณอินเทอร์เน็ต", "ลองรีเฟรชหรือปิด VPN ชั่วคราว"],
      stepsEn: ["Check your internet connection.", "Refresh or temporarily disable VPN/firewall rules."],
    };
  }

  if (/too many ad accounts/i.test(lower)) {
    return {
      titleTh: "เลือกบัญชีโฆษณาเยอะเกินไป",
      titleEn: "Too many ad accounts",
      causeTh: "การส่งออกครั้งเดียวจำกัดจำนวนบัญชีโฆษณาต่อคำขอ",
      causeEn: "This export limits how many ad accounts can be included in one request.",
      stepsTh: ["ลดจำนวนบัญชีที่เลือกแล้วแบ่งส่งออกเป็นหลายครั้ง"],
      stepsEn: ["Select fewer accounts or split the export into multiple runs."],
    };
  }

  return defaultExplained(msg);
}
