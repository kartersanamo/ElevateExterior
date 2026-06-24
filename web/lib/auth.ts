import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email:
            typeof credentials?.email === "string"
              ? credentials.email.trim().toLowerCase()
              : credentials?.email,
          password: credentials?.password,
        });
        if (!parsed.success) return null;

        if (
          !checkRateLimit(`login:${parsed.data.email}`, 10, 15 * 60 * 1000)
        ) {
          return null;
        }

        const user = await db.adminUser.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) return null;

        const valid = await verifyPassword(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
