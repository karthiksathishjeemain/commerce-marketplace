import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load .env locally only — Vercel injects env vars directly
if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgresql://")),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  FRONTEND_URL: z.string().url(),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
