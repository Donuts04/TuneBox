export function getClientSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    let sessionId = window.localStorage.getItem("tunebox-session-id");
    if (!sessionId) {
      // Use Web Crypto if available, else fallback to random string
      if ("randomUUID" in crypto && typeof crypto.randomUUID === "function") {
        sessionId = crypto.randomUUID();
      } else {
        sessionId =
          Math.random().toString(36).slice(2) + Date.now().toString(36);
      }
      window.localStorage.setItem("tunebox-session-id", sessionId);
    }
    return sessionId;
  } catch {
    // If storage is unavailable, generate ephemeral id (per page load)
    return "randomUUID" in crypto && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
