import { Router, Response, Request } from "express";
import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";
import { env } from "../config/env";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { AuthRequest, authenticate } from "../middleware/auth";
import { checkoutSchema } from "../schemas";
import { generateOrderNumber, formatOrder, param } from "../utils/helpers";
import { fulfillPaidOrder } from "../services/orderFulfillment";
import Stripe from "stripe";

const router = Router();

const SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 49;
const TAX_RATE = 0.18;

function calculateTotals(subtotal: number) {
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shippingCost + tax) * 100) / 100;
  return { shippingCost, tax, total };
}

router.post(
  "/checkout",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { addressId } = checkoutSchema.parse(req.body);
    const userId = req.user!.userId;

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new AppError(404, "Address not found");
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError(400, "Cart is empty", "EMPTY_CART");
    }

    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new AppError(400, `${item.product.name} is no longer available`);
      }
      if (item.product.stock < item.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for ${item.product.name}`,
          "INSUFFICIENT_STOCK"
        );
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );
    const { shippingCost, tax, total } = calculateTotals(subtotal);
    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        addressId,
        status: "PENDING",
        subtotal,
        shippingCost,
        tax,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            name: item.product.name,
            imageUrl: item.product.imageUrl,
          })),
        },
      },
      include: { items: true, address: true },
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.product.name,
          description: item.product.brand,
          images: [item.product.imageUrl],
        },
        unit_amount: Math.round(Number(item.product.price) * 100),
      },
      quantity: item.quantity,
    }));

    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: "inr",
          product_data: {
            name: "GST (18%)",
            description: "Goods and Services Tax",
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(shippingCost * 100),
              currency: "inr",
            },
            display_name: shippingCost === 0 ? "Free Shipping" : "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId,
      },
      success_url: `${env.FRONTEND_URL}/orders/${order.id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/checkout?cancelled=true`,
      customer_email: req.user!.email,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    res.json({
      order: formatOrder(order),
      checkoutUrl: session.url,
    });
  })
);

router.get(
  "/",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      include: {
        items: true,
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ orders: orders.map(formatOrder) });
  })
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await prisma.order.findFirst({
      where: { id: param(req.params.id), userId: req.user!.userId },
      include: { items: true, address: true },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    res.json({ order: formatOrder(order) });
  })
);

router.post(
  "/:id/confirm-payment",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orderId = param(req.params.id);
    const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : null;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.userId },
      include: { items: true, address: true },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (order.status !== "PENDING") {
      res.json({ order: formatOrder(order) });
      return;
    }

    const stripeSessionId = sessionId ?? order.stripeSessionId;
    if (!stripeSessionId) {
      throw new AppError(400, "No Stripe session found for this order");
    }

    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

    if (session.metadata?.orderId !== order.id) {
      throw new AppError(400, "Session does not match this order");
    }

    if (session.payment_status !== "paid") {
      throw new AppError(400, "Payment not completed");
    }

    await fulfillPaidOrder(
      order.id,
      typeof session.payment_intent === "string" ? session.payment_intent : null
    );

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, address: true },
    });

    res.json({ order: formatOrder(updated!) });
  })
);

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"];
  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).json({ error: "Missing webhook signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await fulfillPaidOrder(
        orderId,
        typeof session.payment_intent === "string" ? session.payment_intent : null
      );
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    }
  }

  res.json({ received: true });
}

export default router;
