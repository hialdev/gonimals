import type { NextRequest } from 'next/server';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { paths } from 'src/routes/al/paths';

// Tangani baik GET maupun POST
export async function GET(req: NextRequest) {
   return handleRefresh(req);
}

export async function POST(req: NextRequest) {
   return handleRefresh(req);
}

async function handleRefresh(req: NextRequest) {
   const timestamp = new Date().toISOString();
   console.log(`\n[${timestamp}] [REFRESH] ========== handleRefresh START ==========`);

   const cookieStore = await cookies();
   if (cookieStore) {
      const refreshToken = cookieStore.get('refreshToken')?.value;
      const returnTo = req.nextUrl.searchParams.get('returnTo') ?? '/dashboard';

      console.log(`[${timestamp}] [REFRESH] Return to:`, returnTo);
      console.log(
         `[${timestamp}] [REFRESH] Refresh token:`,
         refreshToken ? `✅ exists (${refreshToken.substring(0, 20)}...)` : '❌ missing'
      );

      if (refreshToken) {
         try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  Cookie: `refreshToken=${refreshToken}`,
               },
               credentials: 'include',
               cache: 'no-store',
            });

            if (!res.ok) {
               console.error(`[${timestamp}] [REFRESH] Backend failed:`, res.status);
               return NextResponse.redirect(
                  new URL(
                     `${paths.auth.signIn}?returnTo=${encodeURIComponent(returnTo)}`,
                     process.env.NEXT_PUBLIC_APP_URL
                  )
               );
            }

            const data = await res.json();
            const at = data.data?.access_token;
            console.log(`[${timestamp}] [REFRESH] Got access token:`, at);

            if (!at) {
               console.error(`[${timestamp}] [REFRESH] No access token in response`);
               return NextResponse.redirect(
                  new URL(
                     `${paths.auth.signIn}?returnTo=${encodeURIComponent(returnTo)}`,
                     process.env.NEXT_PUBLIC_APP_URL
                  )
               );
            }

            // Set cookie BEFORE creating redirect (Next.js requirement)

            cookieStore.set('accessToken', at, {
               httpOnly: process.env.NEXT_PUBLIC_COOKIE_HTTPONLY === 'true',
               secure: process.env.NODE_ENV === 'production',
               sameSite: (process.env.NEXT_PUBLIC_COOKIE_SAMESITE === 'strict'
                  ? 'strict'
                  : 'lax') as 'strict' | 'lax',
               path: '/',
               maxAge:
                  process.env.NEXT_PUBLIC_COOKIE_AGE &&
                  parseInt(process.env.NEXT_PUBLIC_COOKIE_AGE) > 0
                     ? parseInt(process.env.NEXT_PUBLIC_COOKIE_AGE) * 60
                     : 15 * 60,
            });

            console.log(`[${timestamp}] [REFRESH] ✅ Cookie set via cookies() API`);
            console.log(`[${timestamp}] [REFRESH] Now redirecting to:`, returnTo);

            // NOW create redirect response AFTER cookie is set
            const response = NextResponse.redirect(
               new URL(returnTo, process.env.NEXT_PUBLIC_APP_URL)
            );

            return response;
         } catch {
            return NextResponse.redirect(
               new URL(
                  `${paths.auth.signIn}?returnTo=${encodeURIComponent(returnTo)}`,
                  process.env.NEXT_PUBLIC_APP_URL
               )
            );
         }
      } else {
         return NextResponse.redirect(
            new URL(
               `${paths.auth.signIn}?returnTo=${encodeURIComponent(returnTo)}`,
               process.env.NEXT_PUBLIC_APP_URL
            )
         );
      }
   }
   return NextResponse.redirect(new URL(paths.auth.signIn, process.env.NEXT_PUBLIC_APP_URL));
}
