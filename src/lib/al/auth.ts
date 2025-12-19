import { cache } from 'react';
import { jwtVerify } from 'jose';
// src/lib/al/auth.ts (versi diperbaiki)
import { cookies } from 'next/headers';

interface Session {
   userId: string;
   // Permissions removed - fetched from backend when needed
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export const getServerSession = cache(async (): Promise<Session | null> => {
   const timestamp = new Date().toISOString();
   console.log(`\n[${timestamp}] [AUTH.TS] ========== getServerSession START ==========`);

   const cookieStore = await cookies();
   const token = cookieStore.get('accessToken')?.value;

   if (!token) {
      console.log(`[${timestamp}] [AUTH.TS] ❌ NO accessToken cookie found`);
      console.log(
         `[${timestamp}] [AUTH.TS] Available cookies:`,
         Array.from(cookieStore.getAll()).map((c) => c.name)
      );
      console.log(`[${timestamp}] [AUTH.TS] ========== getServerSession END (null) ==========\n`);
      return null;
   }

   console.log(`[${timestamp}] [AUTH.TS] ✅ accessToken found: ${token.substring(0, 20)}...`);

   try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      console.log(`[${timestamp}] [AUTH.TS] ✅ JWT verified, user_id:`, payload.user_id);

      if (!payload.user_id) {
         console.log(`[${timestamp}] [AUTH.TS] ❌ No user_id in payload`);
         return null;
      }

      // NO /auth/me call needed - just return session with userId
      // Permissions are cached in Redis and fetched by backend middleware
      console.log(`[${timestamp}] [AUTH.TS] ✅ Session valid, user:`, payload.user_id);
      console.log(
         `[${timestamp}] [AUTH.TS] ========== getServerSession END (success) ==========\n`
      );

      return {
         userId: payload.user_id as string,
      };
   } catch (error) {
      console.log(`[${timestamp}] [AUTH.TS] ❌ JWT verification failed:`, error);
      console.log(`[${timestamp}] [AUTH.TS] ========== getServerSession END (error) ==========\n`);
      return null;
   }
});
