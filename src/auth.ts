import { CredentialsSignin } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { TOTP } from "otpauth";
import { authConfig } from "@/auth.config";
import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

class TotpRequired extends CredentialsSignin {
  code = "totp_required";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        code: { label: "Código", type: "text" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        const code = String(credentials?.code || "").trim();
        if (!email || !password) return null;

        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user) return null;
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        if (user.totpEnabled) {
          if (!code) throw new TotpRequired();
          if (!user.totpSecretEncrypted) return null;
          const secret = decryptSecret(user.totpSecretEncrypted);
          const totp = new TOTP({ secret, digits: 6, period: 30 });
          if (totp.validate({ token: code, window: 1 }) === null) return null;
        }

        const sessionToken = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
        await prisma.session.create({
          data: {
            sessionToken,
            userId: user.id,
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          sessionToken,
        };
      },
    }),
  ],
});
