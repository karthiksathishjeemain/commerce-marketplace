import { prisma } from "../lib/prisma";

export async function fulfillPaidOrder(
  orderId: string,
  stripePaymentId?: string | null
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.status !== "PENDING") {
    return false;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        ...(stripePaymentId ? { stripePaymentId } : {}),
      },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  });

  return true;
}
