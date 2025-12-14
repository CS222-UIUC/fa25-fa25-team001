import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(_req) {
    // Middleware logic can go here if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    // Authenticated pages
    "/profile",

    // Authenticated APIs (require session / mutate user data)
    "/api/friends/:path*",
    "/api/followers/:path*",
    "/api/following/:path*",
    "/api/lists/:path*",
    "/api/reviews/:path*",
    "/api/watchlater/:path*",
    "/api/upload/:path*",
    "/api/steam/:path*",
    "/api/playstation/:path*",
    "/api/xbox/:path*",
    "/api/users/favorites",
  ]
}