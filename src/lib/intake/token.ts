import { randomBytes } from "node:crypto";

export function createIntakeToken() {
  return randomBytes(24).toString("base64url");
}

export function intakeExpiresAt(days = 14) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function intakePublicUrl(token: string, origin?: string) {
  const base =
    origin?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.RAILWAY_SERVICE_ENERPAGES_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/intake/${token}`;
}
