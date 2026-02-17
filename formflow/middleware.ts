import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/auth (NextAuth routes)
     * - api/register (public registration)  
     * - f/ (public form responses)
     * - login, register (auth pages)
     * - _next (Next.js internals)
     * - static files
     */
    '/((?!api/auth|api/register|api/responses|f/|login|register|_next|favicon.ico|uploads).*)',
  ],
};
