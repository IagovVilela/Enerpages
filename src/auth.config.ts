import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.sessionToken = user.sessionToken;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      if (token.sessionToken) session.sessionToken = token.sessionToken;
      return session;
    },
  },
} satisfies NextAuthConfig;
