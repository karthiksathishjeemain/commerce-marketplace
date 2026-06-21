import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

function emptyToUndefined(val: unknown) {
  if (val === "" || val === null || val === undefined) return undefined;
  return val;
}

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgresql://")),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().startsWith("whsec_").optional()
  ),
  FRONTEND_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    console.error("[env] Invalid environment variables:", missing);
    throw new Error(`Server configuration error: ${missing}`);
  }

  const allowedOrigins = result.data.FRONTEND_URL.split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    throw new Error("Server configuration error: FRONTEND_URL is required");
  }

  for (const origin of allowedOrigins) {
    try {
      new URL(origin);
    } catch {
      throw new Error(`Server configuration error: invalid FRONTEND_URL origin "${origin}"`);
    }
  }

  return {
    ...result.data,
    FRONTEND_URL: allowedOrigins[0],
    ALLOWED_ORIGINS: allowedOrigins,
  };
}

export const env = parseEnv();
