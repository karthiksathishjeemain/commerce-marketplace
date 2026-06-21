"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Cart } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadCart();
  }, [user, authLoading, router]);

  async function loadCart() {
    try {
      const { cart } = await api.cart.get();
      setCart(cart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }

  async function updateQty(itemId: string, quantity: number) {
    setUpdating(itemId);
    try {
      const { cart } = await api.cart.updateItem(itemId, quantity);
      setCart(cart);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId);
    try {
      const { cart } = await api.cart.removeItem(itemId);
      setCart(cart);
      window.dispatchEvent(new Event("cart-updated"));
    } finally {
      setUpdating(null);
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted mb-6">Add some products to get started</p>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const shipping = cart.subtotal >= 999 ? 0 : 49;
  const tax = Math.round(cart.subtotal * 0.18 * 100) / 100;
  const total = cart.subtotal + shipping + tax;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({cart.itemCount} items)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-lg border border-border bg-surface p-4">
              <Link href={`/products/${item.product.slug}`} className="relative h-24 w-24 shrink-0 rounded-md overflow-hidden bg-surface-muted">
                <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`} className="font-medium text-sm hover:text-brand line-clamp-2">
                  {item.product.name}
                </Link>
                <p className="text-xs text-muted mt-0.5">{item.product.brand}</p>
                <p className="font-semibold text-sm mt-1">{formatPrice(item.product.price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-border rounded-md">
                    <button
                      className="p-1.5 hover:bg-surface-muted disabled:opacity-50"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      disabled={updating === item.id}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-sm">{item.quantity}</span>
                    <button
                      className="p-1.5 hover:bg-surface-muted disabled:opacity-50"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      disabled={updating === item.id || item.quantity >= item.product.stock}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted hover:text-red-600 p-1"
                    disabled={updating === item.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(item.lineTotal)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 h-fit sticky top-24">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tax (18% GST)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          {cart.subtotal < 999 && (
            <p className="text-xs text-muted mt-3">
              Add {formatPrice(999 - cart.subtotal)} more for free shipping
            </p>
          )}
          <Link href="/checkout" className="block mt-4">
            <Button className="w-full" size="lg">Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
