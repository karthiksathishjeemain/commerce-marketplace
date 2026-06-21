"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Package, ShoppingBag, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import clsx from "clsx";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return <div className="p-8 text-center text-muted">Loading...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-200px)] bg-surface-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-6 flex gap-6">
        <aside className="hidden md:block w-56 shrink-0">
          <div className="rounded-lg border border-border bg-surface p-4 sticky top-24">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Admin Panel</p>
            <nav className="space-y-1">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === href ? "bg-brand/10 text-brand font-medium" : "text-muted hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
            <Link href="/" className="flex items-center gap-2 mt-4 pt-4 border-t border-border text-sm text-muted hover:text-brand">
              <ArrowLeft className="h-4 w-4" /> Back to store
            </Link>
          </div>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
