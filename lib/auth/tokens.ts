import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Edge-safe token layer (jose works in both the edge middleware and the Node
// server-action runtimes). NO node:crypto imports here.

export const ACCESS_COOKIE = "bt_access";
export const REFRESH_COOKIE = "bt_refresh";

// Short-lived access token, silently re-minted from the refresh token by the
// middleware. The long, sliding refresh window is what makes the session feel
// like it "never logs out".
const ACCESS_TTL = "15m";
const ACCESS_MAX_AGE = 60 * 15; // seconds
const REFRESH_TTL = "365d";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 365; // seconds

type TokenType = "access" | "refresh";

// A stable fallback so dev sessions survive server restarts. ALWAYS set
// AUTH_SECRET in production — see .env.example.
const DEV_FALLBACK_SECRET =
  "budget-tracker-dev-secret-change-me-in-production-please";

let warnedAboutSecret = false;

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw && !warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn(
      "[auth] AUTH_SECRET is not set — using an insecure dev fallback. " +
        "Set AUTH_SECRET in your environment for production.",
    );
  }
  return new TextEncoder().encode(raw || DEV_FALLBACK_SECRET);
}

async function sign(userId: string, typ: TokenType, ttl: string): Promise<string> {
  return new SignJWT({ typ })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(getSecret());
}

export function signAccessToken(userId: string): Promise<string> {
  return sign(userId, "access", ACCESS_TTL);
}

export function signRefreshToken(userId: string): Promise<string> {
  return sign(userId, "refresh", REFRESH_TTL);
}

// Returns the user id when the token is valid (signature + not expired + right
// type), otherwise null. Never throws.
async function verify(
  token: string | undefined,
  typ: TokenType,
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload }: { payload: JWTPayload } = await jwtVerify(
      token,
      getSecret(),
      { algorithms: ["HS256"] },
    );
    if (payload.typ !== typ || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function verifyAccessToken(token: string | undefined): Promise<string | null> {
  return verify(token, "access");
}

export function verifyRefreshToken(token: string | undefined): Promise<string | null> {
  return verify(token, "refresh");
}

// Cookie option objects shared by the middleware (response.cookies.set) and the
// server actions (cookies().set). httpOnly so JS can't read the tokens.
type CookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

function baseOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function accessCookieOptions(): CookieOptions {
  return baseOptions(ACCESS_MAX_AGE);
}

export function refreshCookieOptions(): CookieOptions {
  return baseOptions(REFRESH_MAX_AGE);
}

// maxAge 0 → expire immediately (logout).
export function clearCookieOptions(): CookieOptions {
  return baseOptions(0);
}
