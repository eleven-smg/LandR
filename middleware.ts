import { NextRequest, NextResponse } from "next/server"

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
}

export function middleware(req: NextRequest) {
  const session = req.cookies.get("landr_session")
  if (session && session.value.length > 0) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = "/signin"
  url.search = "next=" + encodeURIComponent(req.nextUrl.pathname)
  return NextResponse.redirect(url)
}
