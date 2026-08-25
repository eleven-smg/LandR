/**
 * Taps that arrive from inside Instagram, TikTok, Facebook or Snapchat open in
 * that app's built-in mini browser. The visitor is not signed in there, saved
 * passwords do not exist, and card payments are often refused, so Telegram
 * joins and OnlyFans logins quietly fail. These helpers push the visitor into
 * the real app, or at least into the real browser.
 */

const IN_APP_MARKERS = [
  "instagram",
  "fban",
  "fbav",
  "fb_iab",
  "fbios",
  "tiktok",
  "musical_ly",
  "bytelocale",
  "snapchat",
  "line/",
  "pinterest",
  "twitter",
  "micromessenger",
]

export function isInAppBrowser(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return IN_APP_MARKERS.some((marker) => ua.includes(marker))
}

export function isAndroid(userAgent: string): boolean {
  return userAgent.toLowerCase().includes("android")
}

export function isIos(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")
}

function hostOf(url: URL): string {
  return url.hostname.replace(/^www\./, "").toLowerCase()
}

/** Android package names, used to build an intent:// link that opens the app. */
const PACKAGES: Record<string, string> = {
  "t.me": "org.telegram.messenger",
  "telegram.me": "org.telegram.messenger",
  "instagram.com": "com.instagram.android",
  "tiktok.com": "com.zhiliaoapp.musically",
  "twitter.com": "com.twitter.android",
  "x.com": "com.twitter.android",
  "youtube.com": "com.google.android.youtube",
  "youtu.be": "com.google.android.youtube",
  "reddit.com": "com.reddit.frontpage",
  "threads.net": "com.instagram.barcelona",
  "threads.com": "com.instagram.barcelona",
}

/** iOS custom schemes. OnlyFans has no public scheme, so it is deliberately absent. */
export function appSchemeFor(target: string): string | null {
  let url: URL
  try {
    url = new URL(target)
  } catch {
    return null
  }
  const host = hostOf(url)
  const path = url.pathname.replace(/^\//, "")

  if (host === "t.me" || host === "telegram.me") {
    if (path.startsWith("+")) return "tg://join?invite=" + encodeURIComponent(path.slice(1))
    if (path.startsWith("joinchat/")) return "tg://join?invite=" + encodeURIComponent(path.slice(9))
    if (path) return "tg://resolve?domain=" + encodeURIComponent(path.split("/")[0])
    return "tg://"
  }
  if (host === "instagram.com") {
    if (path) return "instagram://user?username=" + encodeURIComponent(path.split("/")[0])
    return "instagram://app"
  }
  if (host === "twitter.com" || host === "x.com") {
    if (path) return "twitter://user?screen_name=" + encodeURIComponent(path.split("/")[0])
    return "twitter://"
  }
  if (host === "youtube.com" || host === "youtu.be") {
    return "vnd.youtube://" + url.href.replace(/^https?:\/\//, "")
  }
  if (host === "tiktok.com") {
    return "snssdk1233://"
  }
  return null
}

/**
 * intent:// with a browser_fallback_url is the one reliable way out of an
 * Android in-app webview: it opens the app when installed and the real browser
 * when it is not.
 */
export function androidIntentFor(target: string): string | null {
  let url: URL
  try {
    url = new URL(target)
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null

  const host = hostOf(url)
  const pkg = PACKAGES[host]
  const withoutScheme = url.href.replace(/^https?:\/\//, "")
  const fallback = "S.browser_fallback_url=" + encodeURIComponent(url.href)
  const parts = ["scheme=" + url.protocol.replace(":", ""), "action=android.intent.action.VIEW"]
  if (pkg) parts.push("package=" + pkg)
  parts.push(fallback)
  return "intent://" + withoutScheme + "#Intent;" + parts.join(";") + ";end"
}

/**
 * iOS cannot be forced out of a webview, so try the app scheme and fall back to
 * the normal link a moment later. The visitor also gets a manual button.
 */
export function iosBounceHtml(target: string, scheme: string | null): string {
  const safeTarget = target.replace(/"/g, "&quot;")
  const jump = scheme
    ? "window.location.href = " + JSON.stringify(scheme) + "; setTimeout(go, 1200);"
    : "setTimeout(go, 250);"
  return (
    "<!doctype html><html><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
    "<title>Opening...</title></head>" +
    "<body style=\"margin:0;background:#0b0d13;color:#fff;font-family:system-ui,sans-serif;" +
    "display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center\">" +
    "<div style=\"padding:24px\"><p style=\"font-size:15px;opacity:.75\">Opening the app...</p>" +
    "<a href=\"" +
    safeTarget +
    "\" style=\"display:inline-block;margin-top:14px;padding:12px 18px;border-radius:9999px;" +
    "background:#fff;color:#000;font-weight:600;text-decoration:none\">Continue</a>" +
    "<p style=\"margin-top:14px;font-size:12px;opacity:.45\">If nothing happens, tap Continue.</p></div>" +
    "<script>function go(){window.location.href=" +
    JSON.stringify(target) +
    "}" +
    jump +
    "</script></body></html>"
  )
}
