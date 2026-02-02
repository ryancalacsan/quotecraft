import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/q/(.*)', // Public quote view
  '/api/webhooks/(.*)', // Clerk + Stripe webhooks
  '/api/checkout', // Stripe checkout session creation (public clients pay)
  '/api/demo/login', // Demo sign-in token endpoint
  '/api/cron/(.*)', // Cron jobs (authenticated via CRON_SECRET header)
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
