import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorBoundary from '../components/common/ErrorBoundary'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import RoleGuard from '../components/auth/RoleGuard'
import ForbiddenPage from '../pages/ForbiddenPage'
import AIAssistant from '../components/common/AIAssistant'
import VoiceAssistant from '../components/common/VoiceAssistant'

// Public
const HomePage            = lazy(() => import('../pages/HomePage'))
const LoginPage           = lazy(() => import('../pages/LoginPage'))
const RegisterPage        = lazy(() => import('../pages/RegisterPage'))
const ProductListPage     = lazy(() => import('../pages/ProductListPage'))
const ProductDetailPage   = lazy(() => import('../pages/ProductDetailPage'))
const FarmerProfilePage   = lazy(() => import('../pages/FarmerProfilePage'))
const ComparePage         = lazy(() => import('../pages/ComparePage'))
const GroupBuyListPage    = lazy(() => import('../pages/GroupBuyListPage'))
const FarmersMapPage      = lazy(() => import('../pages/FarmersMapPage'))
const NotFoundPage        = lazy(() => import('../pages/NotFoundPage'))

// Customer
const CartPage            = lazy(() => import('../pages/CartPage'))
const CheckoutPage        = lazy(() => import('../pages/CheckoutPage'))
const OrderListPage       = lazy(() => import('../pages/OrderListPage'))
const OrderDetailPage     = lazy(() => import('../pages/OrderDetailPage'))
const FavoritesPage       = lazy(() => import('../pages/FavoritesPage'))
const NotificationsPage   = lazy(() => import('../pages/NotificationsPage'))
const CustomerProfilePage = lazy(() => import('../pages/CustomerProfilePage'))

// Farmer
const FarmerDashboardPage    = lazy(() => import('../pages/farmer/FarmerDashboardPage'))
const FarmerProductListPage  = lazy(() => import('../pages/farmer/FarmerProductListPage'))
const FarmerProductFormPage  = lazy(() => import('../pages/farmer/FarmerProductFormPage'))
const EasyModeProductFormPage = lazy(() => import('../pages/farmer/EasyModeProductFormPage'))
const FarmerOrderListPage    = lazy(() => import('../pages/farmer/FarmerOrderListPage'))
const FarmerOrderDetailPage  = lazy(() => import('../pages/farmer/FarmerOrderDetailPage'))
const FarmerProfileEditPage  = lazy(() => import('../pages/farmer/FarmerProfileEditPage'))
const FarmerGroupBuyPage     = lazy(() => import('../pages/farmer/FarmerGroupBuyPage'))

// Admin
const AdminDashboardPage     = lazy(() => import('../pages/admin/AdminDashboardPage'))
const AdminUserListPage      = lazy(() => import('../pages/admin/AdminUserListPage'))
const AdminUserDetailPage    = lazy(() => import('../pages/admin/AdminUserDetailPage'))
const AdminFarmerListPage    = lazy(() => import('../pages/admin/AdminFarmerListPage'))
const AdminFarmerDetailPage  = lazy(() => import('../pages/admin/AdminFarmerDetailPage'))
const AdminProductListPage   = lazy(() => import('../pages/admin/AdminProductListPage'))
const AdminProductDetailPage = lazy(() => import('../pages/admin/AdminProductDetailPage'))
const AdminOrderListPage     = lazy(() => import('../pages/admin/AdminOrderListPage'))
const AdminReviewListPage    = lazy(() => import('../pages/admin/AdminReviewListPage'))
const AdminReportsPage       = lazy(() => import('../pages/admin/AdminReportsPage'))

function AppLayout() {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={
            <div className="flex min-h-[60vh] items-center justify-center bg-[#FAF3E0]">
              <LoadingSpinner size={48} />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
      {/* Floating assistants — always visible */}
      <AIAssistant />
      <VoiceAssistant />
    </ErrorBoundary>
  )
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      // Public
      { path: '/',               element: <HomePage /> },
      { path: '/login',          element: <LoginPage /> },
      { path: '/register',       element: <RegisterPage /> },
      { path: '/products',       element: <ProductListPage /> },
      { path: '/products/:id',   element: <ProductDetailPage /> },
      { path: '/farmers/:id',    element: <FarmerProfilePage /> },
      { path: '/compare',        element: <ComparePage /> },
      { path: '/group-buys',     element: <GroupBuyListPage /> },
      { path: '/map',            element: <FarmersMapPage /> },

      // Auth required
      { element: <ProtectedRoute />, children: [
        { path: '/notifications', element: <NotificationsPage /> },
      ]},

      // Customer only
      { element: <ProtectedRoute />, children: [
        { element: <RoleGuard requiredRole="customer" />, children: [
          { path: '/cart',       element: <CartPage /> },
          { path: '/checkout',   element: <CheckoutPage /> },
          { path: '/orders',     element: <OrderListPage /> },
          { path: '/orders/:id', element: <OrderDetailPage /> },
          { path: '/favorites',  element: <FavoritesPage /> },
          { path: '/profile',    element: <CustomerProfilePage /> },
        ]},
      ]},

      // Farmer only
      { element: <ProtectedRoute />, children: [
        { element: <RoleGuard requiredRole="farmer" />, children: [
          { path: '/farmer/dashboard',             element: <FarmerDashboardPage /> },
          { path: '/farmer/products',              element: <FarmerProductListPage /> },
          { path: '/farmer/products/new',          element: <FarmerProductFormPage /> },
          { path: '/farmer/products/new/easy',     element: <EasyModeProductFormPage /> },
          { path: '/farmer/products/:id/edit',     element: <FarmerProductFormPage /> },
          { path: '/farmer/orders',                element: <FarmerOrderListPage /> },
          { path: '/farmer/orders/:id',            element: <FarmerOrderDetailPage /> },
          { path: '/farmer/profile',               element: <FarmerProfileEditPage /> },
          { path: '/farmer/group-buys',            element: <FarmerGroupBuyPage /> },
        ]},
      ]},

      // Admin only
      { element: <ProtectedRoute />, children: [
        { element: <RoleGuard requiredRole="admin" />, children: [
          { path: '/admin/dashboard',          element: <AdminDashboardPage /> },
          { path: '/admin/users',              element: <AdminUserListPage /> },
          { path: '/admin/users/:id',          element: <AdminUserDetailPage /> },
          { path: '/admin/farmers',            element: <AdminFarmerListPage /> },
          { path: '/admin/farmers/:id',        element: <AdminFarmerDetailPage /> },
          { path: '/admin/products',           element: <AdminProductListPage /> },
          { path: '/admin/products/:id',       element: <AdminProductDetailPage /> },
          { path: '/admin/orders',             element: <AdminOrderListPage /> },
          { path: '/admin/reviews',            element: <AdminReviewListPage /> },
          { path: '/admin/reports',            element: <AdminReportsPage /> },
        ]},
      ]},

      { path: '/forbidden', element: <ForbiddenPage /> },
      { path: '*',          element: <NotFoundPage /> },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
