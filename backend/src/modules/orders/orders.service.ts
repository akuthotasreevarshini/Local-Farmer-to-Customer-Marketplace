import { Order, OrderStatus } from '../../models/Order';
import { Cart } from '../../models/Cart';
import { Product } from '../../models/Product';
import { Address } from '../../models/Address';
import { Notification } from '../../models/Notification';
import { AppError } from '../../middleware/errorHandler';
import { Types } from 'mongoose';

const FARMER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed'],
  confirmed: ['packed'],
  packed: ['dispatched'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
};

export async function placeOrder(customerId: string, body: { addressId?: string; paymentMethod: 'cod' | 'gateway' }) {
  const cart = await Cart.findOne({ userId: customerId }).populate<{ items: Array<{ productId: { _id: Types.ObjectId; name: string; unit: string; pricePerUnit: number; deliveryCharge: number; farmerId: Types.ObjectId; availableQuantity: number; status: string }; quantity: number; priceAtAdd: number }> }>({ path: 'items.productId', select: 'name unit pricePerUnit deliveryCharge farmerId availableQuantity status' });
  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty.', 400);

  let deliveryAddress: { line1: string; district: string; state: string; pincode: string; line2?: string } = { line1: 'N/A', district: 'N/A', state: 'N/A', pincode: '000000' };
  if (body.addressId && Types.ObjectId.isValid(body.addressId)) {
    const addr = await Address.findOne({ _id: body.addressId, userId: customerId }).lean();
    if (addr) deliveryAddress = { line1: addr.line1, line2: addr.line2, district: addr.district, state: addr.state, pincode: addr.pincode };
  }

  const orderItems = [];
  let grandTotal = 0;
  const farmerSet = new Set<string>();

  for (const item of cart.items) {
    const p = item.productId;
    if (!p || p.status !== 'active') throw new AppError(`Product "${String(p?.name ?? 'unknown')}" is no longer available.`, 400);
    if (p.availableQuantity < item.quantity) throw new AppError(`Insufficient stock for "${p.name}".`, 400);
    orderItems.push({ productId: p._id, farmerId: p.farmerId, name: p.name, unit: p.unit, priceSnapshot: p.pricePerUnit, quantity: item.quantity });
    grandTotal += p.pricePerUnit * item.quantity;
    farmerSet.add(String(p.farmerId));
  }
  grandTotal += farmerSet.size * (cart.items[0]?.productId?.deliveryCharge ?? 0);

  // Decrement stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.productId._id, { $inc: { availableQuantity: -item.quantity } });
  }

  const order = await Order.create({
    customerId,
    items: orderItems,
    deliveryAddress,
    status: 'placed',
    paymentMethod: body.paymentMethod ?? 'cod',
    grandTotal,
    statusHistory: [{ status: 'placed', changedAt: new Date(), changedBy: new Types.ObjectId(customerId) }],
  });

  // Notify farmers
  for (const farmerId of farmerSet) {
    await Notification.create({ userId: farmerId, title: 'New Order', message: `Order #${String(order._id).slice(-6)} received.`, type: 'order_created', isRead: false });
  }

  // Clear cart
  await Cart.findOneAndUpdate({ userId: customerId }, { $set: { items: [] } });

  return order;
}

export async function getCustomerOrders(customerId: string, { page = 1, limit = 10 }: { page?: number; limit?: number }) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ customerId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments({ customerId }),
  ]);
  return { orders, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getOrderById(orderId: string, userId: string) {
  if (!Types.ObjectId.isValid(orderId)) throw new AppError('Invalid order ID.', 400);
  const order = await Order.findById(orderId).populate('items.productId', 'name images').lean();
  if (!order) throw new AppError('Order not found.', 404);
  const isCustomer = String(order.customerId) === userId;
  const isFarmer = order.items.some((i) => String(i.farmerId) === userId);
  if (!isCustomer && !isFarmer) throw new AppError('Access denied.', 403);
  return order;
}

export async function getFarmerOrders(farmerId: string, { page = 1, limit = 10, status }: { page?: number; limit?: number; status?: string }) {
  const filter: Record<string, unknown> = { 'items.farmerId': new Types.ObjectId(farmerId) };
  if (status) filter['status'] = status;
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  return { orders, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateOrderStatus(orderId: string, farmerId: string, newStatus: OrderStatus) {
  if (!Types.ObjectId.isValid(orderId)) throw new AppError('Invalid order ID.', 400);
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  const allowed = FARMER_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) throw new AppError(`Cannot move order from ${order.status} to ${newStatus}.`, 400);

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, changedAt: new Date(), changedBy: new Types.ObjectId(farmerId) });
  await order.save();

  await Notification.create({ userId: order.customerId, title: 'Order Update', message: `Your order status changed to ${newStatus}.`, type: 'order_status_changed', isRead: false });
  return order;
}

export async function cancelOrder(orderId: string, customerId: string) {
  if (!Types.ObjectId.isValid(orderId)) throw new AppError('Invalid order ID.', 400);
  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.status !== 'placed') throw new AppError('Only placed orders can be cancelled.', 400);

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { availableQuantity: item.quantity } });
  }

  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', changedAt: new Date(), changedBy: new Types.ObjectId(customerId) });
  await order.save();
  return order;
}
