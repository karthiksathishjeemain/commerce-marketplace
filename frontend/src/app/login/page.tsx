"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Sign in</h1>
        <p className="text-sm text-muted text-center mb-6">Welcome back to BazaarHub</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand hover:underline">Register</Link>
        </p>

        <div className="mt-6 pt-4 border-t border-border text-xs text-muted">
          <p className="font-medium mb-1">Demo accounts:</p>
          <p>Admin: admin@marketplace.com / Admin@123456</p>
          <p>User: demo@marketplace.com / User@123456</p>
        </div>
      </div>
    </div>
  );
}
