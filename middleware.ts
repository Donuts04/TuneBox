import { NextRequest, NextResponse } from "next/server";

// Session management functions
function getSessionId(request: NextRequest): string | null {
  return request.cookies.get("tunebox-session-id")?.value || null;
}

function setSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set("tunebox-session-id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

function createSessionId(): string {
  return crypto.randomUUID();
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check if session cookie exists
  const existingSessionId = getSessionId(request);

  // If no session cookie, create one
  if (!existingSessionId) {
    const newSessionId = createSessionId();
    setSessionCookie(response, newSessionId);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
