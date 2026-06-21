"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ShoppingCart, Search, User, Menu, X, Package, Shield } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [pathname, searchParams]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) {
      router.push("/products");
      return;
    }
    router.push(`/products?search=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
      <div className="relative w-full">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products, brands..."
          className="w-full rounded-md border border-border bg-surface-muted py-2 pl-4 pr-10 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-brand"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

function MobileHeaderSearch({ onSearch }: { onSearch: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    onSearch();
    if (!q) {
      router.push("/products");
      return;
    }
    router.push(`/products?search=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSearch} className="mb-3 flex gap-2">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white"
      >
        Go
      </button>
    </form>
  );
}

export function Header() {
  const { user, logout, loading } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    api.cart
      .get()
      .then(({ cart }) => setCartCount(cart.itemCount))
      .catch(() => setCartCount(0));
  }, [user]);

  useEffect(() => {
    const handler = () => {
      if (user) {
        api.cart.get().then(({ cart }) => setCartCount(cart.itemCount)).catch(() => {});
      }
    };
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface shadow-sm">
      <div className="bg-brand text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 py-1.5 flex justify-between">
          <span>Free delivery on orders above ₹999</span>
          <span className="hidden sm:inline">Secure payments via Stripe</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Package className="h-7 w-7 text-brand" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Bazaar<span className="text-brand">Hub</span>
            </span>
          </Link>

          <Suspense fallback={<div className="hidden md:flex flex-1 max-w-2xl" />}>
            <HeaderSearch />
          </Suspense>

          <nav className="hidden md:flex items-center gap-1 ml-auto">
            {!loading && user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-brand rounded-md hover:bg-surface-muted"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-brand rounded-md hover:bg-surface-muted"
                >
                  <User className="h-4 w-4" />
                  {user.firstName}
                </Link>
                <Link
                  href="/cart"
                  className="relative flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-brand rounded-md hover:bg-surface-muted"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>
              </>
            ) : !loading ? (
              <>
                <Link href="/login" className="px-3 py-2 text-sm text-muted hover:text-brand">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  Register
                </Link>
              </>
            ) : null}
          </nav>

          <button
            className="md:hidden ml-auto p-2 text-muted"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden mt-3 pt-3 border-t border-border space-y-1">
            <Suspense fallback={null}>
              <MobileHeaderSearch onSearch={() => setMenuOpen(false)} />
            </Suspense>
            <Link href="/products" className="block px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>
              All Products
            </Link>
            {user ? (
              <>
                <Link href="/cart" className="block px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                  Cart ({cartCount})
                </Link>
                <Link href="/account" className="block px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                  Account
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className="block px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                )}
                <button onClick={logout} className="block w-full text-left px-3 py-2 text-sm text-red-600">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link href="/register" className="block px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export function CategoryBar({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <div className="border-b border-border bg-surface-muted/50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          <Link
            href="/products"
            className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-brand transition-colors"
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-brand transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-elevated">
      <div className="mx-auto max-w-7xl px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-6 w-6 text-brand" />
            <span className="font-bold text-lg">BazaarHub</span>
          </div>
          <p className="text-sm text-muted">
            Your trusted marketplace for electronics, fashion, home essentials, books, and more.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Shop</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/products" className="hover:text-brand">All Products</Link></li>
            <li><Link href="/products?category=electronics" className="hover:text-brand">Electronics</Link></li>
            <li><Link href="/products?category=fashion" className="hover:text-brand">Fashion</Link></li>
            <li><Link href="/products?category=home-kitchen" className="hover:text-brand">Home & Kitchen</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Account</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/orders" className="hover:text-brand">Your Orders</Link></li>
            <li><Link href="/account" className="hover:text-brand">Profile & Addresses</Link></li>
            <li><Link href="/cart" className="hover:text-brand">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Support</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>Payments secured by Stripe</li>
            <li>7-day return policy</li>
            <li>24/7 customer support</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} BazaarHub Marketplace. All rights reserved.
      </div>
    </footer>
  );
}
