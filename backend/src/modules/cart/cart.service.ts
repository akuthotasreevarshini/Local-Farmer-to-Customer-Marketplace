import { Cart } from '../../models/Cart';
import { Product } from '../../models/Product';
import { AppError } from '../../middleware/errorHandler';
import { Types } from 'mongoose';

export async function getCart(userId: string) {
  let cart = await Cart.findOne({ userId }).populate({ path: 'items.productId', select: 'name pricePerUnit unit images availableQuantity status deliveryCharge farmerId' });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  if (!Types.ObjectId.isValid(productId)) throw new AppError('Invalid product ID.', 400);
  if (quantity < 1) throw new AppError('Quantity must be at least 1.', 400);

  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') throw new AppError('Product not available.', 404);
  if (product.availableQuantity < quantity) throw new AppError(`Only ${product.availableQuantity} units available.`, 400);

  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });

  const existingIdx = cart.items.findIndex((i) => String(i.productId) === productId);
  if (existingIdx >= 0) {
    const newQty = cart.items[existingIdx]!.quantity + quantity;
    if (newQty > product.availableQuantity) throw new AppError(`Only ${product.availableQuantity} units available.`, 400);
    cart.items[existingIdx]!.quantity = newQty;
  } else {
    cart.items.push({ productId: new Types.ObjectId(productId), quantity, priceAtAdd: product.pricePerUnit });
  }
  await cart.save();
  return getCart(userId);
}

export async function updateCartItem(userId: string, productId: string, quantity: number) {
  if (!Types.ObjectId.isValid(productId)) throw new AppError('Invalid product ID.', 400);
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError('Cart not found.', 404);
  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => String(i.productId) !== productId);
  } else {
    const idx = cart.items.findIndex((i) => String(i.productId) === productId);
    if (idx < 0) throw new AppError('Item not in cart.', 404);
    cart.items[idx]!.quantity = quantity;
  }
  await cart.save();
  return getCart(userId);
}

export async function removeFromCart(userId: string, productId: string) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError('Cart not found.', 404);
  cart.items = cart.items.filter((i) => String(i.productId) !== productId);
  await cart.save();
  return getCart(userId);
}

export async function clearCart(userId: string) {
  await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } }, { upsert: true });
  return { message: 'Cart cleared.' };
}
