// Shared API response types for FarmConnect frontend

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  totalPages: number
  items?: T[]
}

export interface Product {
  _id: string
  farmerId: { _id: string; name: string } | string
  name: string
  category: string
  description: string
  unit: string
  pricePerUnit: number
  deliveryCharge: number
  availableQuantity: number
  harvestDate: string
  images: string[]
  status: string
  averageRating: number
  reviewCount: number
  createdAt: string
  farmerProfile?: { district: string; state: string; farmName: string } | null
}

export interface ProductsData {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

export interface GroupBuy {
  _id: string
  productId: { _id: string; name: string; unit: string; images: string[]; category: string; pricePerUnit?: number } | string
  farmerId: { _id: string; name: string } | string
  discountedPricePerUnit: number
  minimumQuantity: number
  committedQuantity: number
  expiresAt: string
  status: 'open' | 'confirmed' | 'expired'
  participantCount?: number
  createdAt: string
}

export interface CartItem {
  productId: {
    _id: string
    name: string
    pricePerUnit: number
    unit: string
    images: string[]
    availableQuantity: number
    status: string
    deliveryCharge: number
    farmerId: string
  }
  quantity: number
  priceAtAdd: number
}

export interface Cart {
  _id: string
  userId: string
  items: CartItem[]
  updatedAt: string
}

export interface OrderItem {
  productId: { _id: string; name: string; images: string[] } | string
  farmerId: string
  name: string
  unit: string
  priceSnapshot: number
  quantity: number
}

export interface Order {
  _id: string
  customerId: string
  items: OrderItem[]
  deliveryAddress: { line1: string; line2?: string; district: string; state: string; pincode: string }
  status: string
  paymentMethod: string
  grandTotal: number
  statusHistory: Array<{ status: string; changedAt: string; changedBy: string }>
  createdAt: string
}

export interface FarmerProfile {
  _id: string
  userId: { _id: string; name: string; email: string } | string
  farmName: string
  farmDescription: string
  district: string
  state: string
  profilePhotoUrl: string
  contactPhone: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  easyModeEnabled: boolean
  productCount?: number
  recentProducts?: Product[]
}

export interface CompareProduct {
  _id: string
  name: string
  unit: string
  pricePerUnit: number
  normalizedPricePerKg: number | null
  deliveryCharge: number
  availableQuantity: number
  harvestDate: string
  averageRating: number
  images: string[]
  farmer: { _id: string; name: string; district: string; state: string; farmName: string }
}
