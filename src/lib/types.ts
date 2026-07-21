export type Role = 'customer' | 'call_center' | 'microadmin' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  image: string;
  role: Role;
  emailVerified: boolean;
}

export interface LoginLog {
  _id: string;
  user?: { _id: string; firstName: string; lastName: string; email: string; role: Role } | null;
  email: string;
  success: boolean;
  reason?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { pagination?: Pagination };
  details?: unknown;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  catImage: string;
  description: string;
  categoryType: string;
  products?: string[];
  createdAt: string;
}

export interface Product {
  _id: string;
  skuid: string;
  slug: string;
  name: string;
  images: string[];
  description: string;
  mrp?: number;
  price: number;
  gstRate?: number;
  installationCharge?: number;
  quantity: number;
  category: { _id: string; name: string; slug: string } | string;
  isTopSeller: boolean;
  productType: string;
  shipment_width?: string;
  shipment_height?: string;
  shipment_length?: string;
  weight?: string;
  fragile?: boolean;
  warrantyMonths?: number;
  hsnCode?: string;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  _id: string;
  orderId: string;
  user?: { firstName: string; lastName: string; email: string } | string;
  items: Array<{ product: unknown; quantity: number; price: number }>;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

export interface Overview {
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  lowStock: number;
  pendingRepairs: number;
  newEnquiries: number;
  revenue: number;
  ordersByStatus: Record<string, number>;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface Review {
  _id: string;
  image: string;
  name: string;
  position: string;
  description: string;
  createdAt: string;
}

export interface Certification {
  _id: string;
  title: string;
  description: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  image: string;
  verificationId: string;
  isActive: boolean;
}

export interface RepairAttachment {
  url: string;
  type: 'image' | 'video';
  filename?: string;
  size?: number;
  uploadedAt?: string;
}

export interface RepairRequest {
  _id: string;
  requestId: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  pincode: string;
  description: string;
  status: 'pending' | 'completed';
  paymentStatus: string;
  attachments?: RepairAttachment[];
  createdAt: string;
}

export interface AmcEnquiry {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  message?: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: string;
}
