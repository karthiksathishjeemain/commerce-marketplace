"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Address, Cart } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth";

function CheckoutContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");

  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    Promise.all([api.cart.get(), api.addresses.list()])
      .then(([cartRes, addrRes]) => {
        setCart(cartRes.cart);
        setAddresses(addrRes.addresses);
        const defaultAddr = addrRes.addresses.find((a) => a.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
        else if (addrRes.addresses.length > 0) setSelectedAddress(addrRes.addresses[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { address } = await api.addresses.create({ ...newAddress, isDefault: addresses.length === 0 });
      setAddresses((prev) => [...prev, address]);
      setSelectedAddress(address.id);
      setShowAddressForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save address");
    }
  }

  async function handleCheckout() {
    if (!selectedAddress) {
      setError("Please select a delivery address");
      return;
    }
    setCheckingOut(true);
    setError("");
    try {
      const { checkoutUrl } = await api.orders.checkout(selectedAddress);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
      setCheckingOut(false);
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">Loading...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg text-muted">Your cart is empty</p>
        <Link href="/products"><Button className="mt-4">Shop Now</Button></Link>
      </div>
    );
  }

  const shipping = cart.subtotal >= 999 ? 0 : 49;
  const tax = Math.round(cart.subtotal * 0.18 * 100) / 100;
  const total = cart.subtotal + shipping + tax;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {cancelled && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Payment was cancelled. Your cart is still saved.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border border-border bg-surface p-6">
            <h2 className="font-semibold mb-4">Delivery Address</h2>

            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors ${
                      selectedAddress === addr.id ? "border-brand bg-brand/5" : "border-border hover:border-brand/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="mt-1 accent-brand"
                    />
                    <div>
                      <p className="font-medium text-sm">{addr.label}{addr.isDefault && " (Default)"}</p>
                      <p className="text-sm text-muted mt-0.5">
                        {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted mb-4">No saved addresses. Add one below.</p>
            )}

            {!showAddressForm ? (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddressForm(true)}>
                + Add New Address
              </Button>
            ) : (
              <form onSubmit={handleAddAddress} className="mt-4 space-y-3 border-t border-border pt-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Label" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} required />
                  <Input label="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} required />
                  <Input label="Address Line 1" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} required className="sm:col-span-2" />
                  <Input label="Address Line 2" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} />
                  <Input label="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} required />
                  <Input label="Postal Code" value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} required />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Save Address</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-lg border border-border bg-surface p-6">
            <h2 className="font-semibold mb-4">Payment</h2>
            <p className="text-sm text-muted">
              You will be redirected to Stripe&apos;s secure checkout to complete your payment.
              We accept all major credit and debit cards.
            </p>
          </section>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 h-fit sticky top-24">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm mb-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted truncate mr-2">{item.product.name} × {item.quantity}</span>
                <span className="shrink-0">{formatPrice(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm border-t border-border pt-3">
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Tax (18% GST)</span><span>{formatPrice(tax)}</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <Button className="w-full mt-4" size="lg" onClick={handleCheckout} disabled={checkingOut || !selectedAddress}>
            {checkingOut ? "Redirecting to Stripe..." : "Pay with Stripe"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
