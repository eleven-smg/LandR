import { NextRequest, NextResponse } from "next/server"

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
}

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const expectedUser = process.env.DASHBOARD_USER || "admin"
  const expectedPass = process.env.DASHBOARD_PASSWORD || ""

  if (auth && auth.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6))
    const sep = decoded.indexOf(":")
    const user = decoded.slice(0, sep)
    const pass = decoded.slice(sep + 1)
    if (expectedPass.length > 0 && user === expectedUser && pass === expectedPass) {
      return NextResponse.next()
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": "Basic realm=LandR" },
  })
}
