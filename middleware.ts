import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth/tokens";

// Pages reachable without a session.
function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = isPublicPath(pathname);

  // 1. Try the access token.
  let userId = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value);

  // 2. Access token missing/expired → silently mint a new one from the
  //    long-lived refresh token, and slide the refresh window forward. This is
  //    what makes the session effectively "never log out".
  let newAccess: string | null = null;
  let newRefresh: string | null = null;
  if (!userId) {
    const refreshUserId = await verifyRefreshToken(
      req.cookies.get(REFRESH_COOKIE)?.value,
    );
    if (refreshUserId) {
      userId = refreshUserId;
      [newAccess, newRefresh] = await Promise.all([
        signAccessToken(refreshUserId),
        signRefreshToken(refreshUserId),
      ]);
      // Make the refreshed tokens visible to this same request's render.
      req.cookies.set(ACCESS_COOKIE, newAccess);
      req.cookies.set(REFRESH_COOKIE, newRefresh);
    }
  }

  const authed = Boolean(userId);

  // Persist any refreshed tokens onto whatever response we return.
  const attach = (res: NextResponse) => {
    if (newAccess) res.cookies.set(ACCESS_COOKIE, newAccess, accessCookieOptions());
    if (newRefresh)
      res.cookies.set(REFRESH_COOKIE, newRefresh, refreshCookieOptions());
    return res;
  };

  // Signed-in user hitting /login or /register → straight to the app.
  if (authed && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return attach(NextResponse.redirect(url));
  }

  // Anonymous user hitting a protected page → login, remembering where to return.
  if (!authed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return attach(NextResponse.next({ request: req }));
}

export const config = {
  // Run on everything except Next internals and static files (anything with a
  // file extension, e.g. .png/.json/.svg/.ico — manifest, icons, sw.js).
  matcher: ["/((?!_next/static|_next/image|.*\\.).*)"],
};
