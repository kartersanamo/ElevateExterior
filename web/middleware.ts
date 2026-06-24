import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/request-ip";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  if (
    pathname.startsWith("/api/auth") &&
    req.method === "POST" &&
    !checkRateLimit(
      `login-ip:${getClientIpFromRequest(req)}`,
      30,
      15 * 60 * 1000
    )
  ) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please try again later." },
      { status: 429 }
    );
  }

  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname === "/login";
  const mustChangePassword = Boolean(session?.user?.mustChangePassword);

  if (isAdmin && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isLoggedIn && isAdmin && mustChangePassword && pathname !== "/admin/account") {
    return NextResponse.redirect(new URL("/admin/account", req.nextUrl.origin));
  }

  if (isLoggedIn && isLogin) {
    if (mustChangePassword) {
      return NextResponse.redirect(new URL("/admin/account", req.nextUrl.origin));
    }
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl?.startsWith("/admin")) {
      return NextResponse.redirect(new URL(callbackUrl, req.nextUrl.origin));
    }
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/login", "/api/auth/:path*"],
};
