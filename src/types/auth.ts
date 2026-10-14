import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    sessionToken?: string;
    user: { id: string } & DefaultSession["user"];
  }

  interface User {
    sessionToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    sessionToken?: string;
  }
}
