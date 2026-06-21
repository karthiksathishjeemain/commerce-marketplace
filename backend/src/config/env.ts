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

const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgresql://")),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().startsWith("whsec_").optional()
  ),
  FRONTEND_URL: z.string().url(),
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
  return result.data;
}

export const env = parseEnv();
