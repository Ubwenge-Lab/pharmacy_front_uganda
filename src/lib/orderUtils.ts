import type { Order, OrderItem } from '@/types';

/**
 * Normalises the two order-item field shapes returned by different endpoints:
 *   GET /orders/:id            → { items: OrderItem[] }
 *   GET /orders/my-orders      → { orderItems: OrderItem[] }  (or items)
 *   GET /orders/pharmacy-orders → { orderItems: OrderItem[] }
 *
 * Always use this helper instead of accessing order.items / order.orderItems directly.
 * Backend contract: see src/docs/PATIENT_BRANCH_BACKEND_CONTRACT.md
 */
export function getOrderItems(order: Order): OrderItem[] {
  return order.orderItems ?? order.items ?? [];
}
