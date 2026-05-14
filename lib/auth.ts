import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, ...message) {
      console.error("[next-auth][error]", code, ...message);
    },
    warn(code, ...message) {
      console.warn("[next-auth][warn]", code, ...message);
    },
    debug(code, ...message) {
      console.log("[next-auth][debug]", code, ...message);
    },
  },
  ...authConfig,
});

// Extend session type to include user.id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }
}
