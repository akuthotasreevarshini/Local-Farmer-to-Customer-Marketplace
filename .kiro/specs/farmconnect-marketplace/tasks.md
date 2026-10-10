# Implementation Plan: FarmConnect Marketplace

## Overview

Full-stack MERN marketplace (React 18 + Vite + TypeScript + Tailwind CSS + Node.js + Express + MongoDB Atlas) connecting local farmers directly to customers. Implementation proceeds in eight phases: project scaffolding → backend foundation → auth → core marketplace → advanced features (comparison, group buying, Easy Mode, i18n) → admin → testing → deployment prep.

---

## Tasks

### Phase 1 — Project Scaffolding & Infrastructure

- [x] 1. Initialise monorepo structure and tooling
  - Create root `package.json` with `workspaces: ["frontend", "backend"]`
  - Scaffold `frontend/` with `npm create vite@latest -- --template react-ts`
  - Scaffold `backend/` with `npm init` and install `express`, `typescript`, `ts-node`, `nodemon`
  - Add root `.gitignore` covering `node_modules`, `dist`, `.env`
  - Create `frontend/.env.example` and `backend/.env.example` listing every required variable with descriptions
  - _Requirements: 23.1, 23.2_

- [x] 2. Configure backend TypeScript and Express entry point
  - Add `tsconfig.json` with `"strict": true`, `"outDir": "dist"`, `"rootDir": "src"`
  - Create `src/server.ts` (process entry, DB connect, `process.exit(1)` on timeout)
  - Create `src/app.ts` (Express app, middleware registration, router mounting)
  - Create `src/config/env.ts` (validates required env vars at startup, throws if missing)
  - Create `src/config/db.ts` (Mongoose connect with 10-second timeout)
  - Add `npm run dev` (nodemon), `npm run build` (tsc), `npm run start` scripts
  - _Requirements: 22.1, 22.3, 22.7, 22.8_

- [x] 3. Register global backend middleware
  - Install and configure `helmet`, `cors`, `express-rate-limit`, `express-validator` / `zod`
  - Create `src/middleware/auth.ts` (JWT verification + role guard stubs)
  - Create `src/middleware/errorHandler.ts` (global error handler → `{ success, message, errors? }`)
  - Create `src/middleware/rateLimiter.ts` (10 req / 15 min per IP for `/api/auth/login`)
  - Create `src/middleware/validate.ts` (Zod schema wrapper middleware)
  - Mount middleware in `app.ts` in the correct order (helmet → cors → json → rateLimiter → routes → errorHandler)
  - Expose `GET /api/health` returning HTTP 200 + UTC ISO timestamp
  - _Requirements: 19.1, 19.2, 19.3, 19.7, 22.5, 22.6_

- [x] 4. Configure frontend Vite, Tailwind, and base layout
  - Install `tailwindcss`, `postcss`, `autoprefixer`; run `npx tailwindcss init -p`
  - Extend Tailwind theme with design tokens: forest green `#2D6A2D`, leaf green `#5DAB24`, warm cream `#FAF3E0`, earthy brown `#8B5E3C`
  - Install `lucide-react`; confirm icon set renders in a smoke-test component
  - Create `src/components/layout/Navbar.tsx` and `Footer.tsx` shells
  - Create `src/components/common/LoadingSpinner.tsx`, `EmptyState.tsx`, `ErrorBoundary.tsx`, `Modal.tsx`, `Toast.tsx`
  - Verify `npm run build` produces a clean `dist/` bundle
  - _Requirements: 20.1, 20.7, 21.5, 21.6, 23.3_

- [x] 5. Set up React Router v6 with route-level code splitting
  - Install `react-router-dom@6`
  - Create `src/router/index.tsx` with all 34 routes using `React.lazy` + `Suspense`
  - Create stub page components for every route in the route map
  - Create `src/components/auth/ProtectedRoute.tsx` and `RoleGuard.tsx` shells
  - Wire `BrowserRouter` in `main.tsx`
  - _Requirements: 21.1_

- [x] 6. Initialise Zustand stores and Axios instance
  - Install `zustand`, `axios`
  - Create `src/stores/useAuthStore.ts` (`user`, `accessToken`, `isAuthenticated`, `login()`, `logout()`, `setToken()`)
  - Create `src/stores/useCartStore.ts` (`cartCount`, `syncCart()`)
  - Create `src/stores/useLangStore.ts` (`language`, `setLanguage()`)
  - Create `src/stores/useNotifStore.ts` (`unreadCount`, `notifications[]`, `markRead()`)
  - Create `src/api/axiosInstance.ts` with request interceptor (attach JWT) and response interceptor (single refresh retry → redirect to `/login` on failure)
  - _Requirements: 21.2, 21.3_

---

### Phase 2 — Database Models

- [x] 7. Define all 13 Mongoose models
  - Create `src/models/User.ts` — `IUser` interface, schema, indexes (`email` unique, `role`, `isActive`)
  - Create `src/models/RefreshToken.ts` — `IRefreshToken` interface, TTL index on `expiresAt`
  - Create `src/models/FarmerProfile.ts` — `IFarmerProfile` interface, indexes (`userId` unique, `verificationStatus`, `district`, `state`)
  - Create `src/models/Product.ts` — `IProduct` interface + `ProductCategory` enum, compound text index, status index
  - Create `src/models/Address.ts` — `IAddress` interface, index on `userId`
  - Create `src/models/Cart.ts` — `ICart` / `ICartItem` interfaces, `userId` unique index
  - Create `src/models/Order.ts` — `IOrder` / `IOrderItem` / `IStatusHistoryEntry` interfaces, indexes on `customerId`, `status`, `createdAt`, `items.farmerId`
  - Create `src/models/PriceSnapshot.ts` — `IPriceSnapshot` interface, indexes on `productId`, `farmerId`, `timestamp`
  - Create `src/models/Review.ts` — `IReview` interface, unique compound index `{ productId, customerId, orderId }`, index on `status`
  - Create `src/models/Favorite.ts` — `IFavorite` interface, unique compound index `{ userId, type, targetId }`
  - Create `src/models/GroupBuy.ts` — `IGroupBuy` interface, indexes on `productId`, `farmerId`, `status`, `expiresAt`
  - Create `src/models/GroupBuyParticipant.ts` — `IGroupBuyParticipant` interface, unique compound index `{ groupBuyId, customerId }`
  - Create `src/models/Notification.ts` — `INotification` interface + `NotificationType` union, compound indexes
  - _Requirements: 22.4_

---

### Phase 3 — Authentication & RBAC

- [ ] 8. Implement Auth service and routes
  - Create `src/utils/jwt.ts` (sign access token 15 min, sign/verify refresh token 7 days)
  - Create `src/utils/password.ts` (bcrypt hash cost ≥ 12, compare helper)
  - Create `src/modules/auth/auth.service.ts` — register, login, refresh, logout logic
  - Create `src/modules/auth/auth.controller.ts` — request/response wiring
  - Create `src/modules/auth/auth.router.ts` — `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`
  - Apply rate limiter to `POST /login` (10 req / 15 min per IP → HTTP 429)
  - Implement Zod schemas for all auth request bodies; return HTTP 400 with field-level details on failure
  - Handle duplicate email → HTTP 409; invalid credentials → HTTP 401 without specifying field; password complexity failure → HTTP 400 with which rule failed
  - Set Refresh_Token in HTTP-only, Secure, SameSite=Strict cookie (7-day expiry); clear cookie on logout/invalid refresh
  - _Requirements: 1.1–1.12_

  - [-] 8.1 Write property test for password complexity rejection (P1)
    - **Property 1: Password complexity rejection is total**
    - Generate arbitrary strings; assert any string missing uppercase, lowercase, digit, or special char is rejected with HTTP 400
    - **Validates: Requirements 1.1, 1.12**

- [x] 9. Implement RBAC middleware and complete ProtectedRoute / RoleGuard
  - Finish `src/middleware/auth.ts`: verify JWT signature + expiry, extract role, attach `req.user`
  - Implement role guard factory for Customer-only, Farmer-only, Admin-only routes → HTTP 403 on mismatch
  - Implement `ProtectedRoute.tsx`: redirect to `/login` if not authenticated
  - Implement `RoleGuard.tsx`: render 403 page if role does not match `requiredRole`
  - _Requirements: 1.11, 19.8_

- [-] 10. Build Login and Register pages
  - Create `src/pages/LoginPage.tsx` — form with email + password, calls `POST /api/auth/login`, stores access token in `useAuthStore`, handles HTTP 401 inline error
  - Create `src/pages/RegisterPage.tsx` — form with name, email, password, role selector (Customer / Farmer), calls `POST /api/auth/register`, handles HTTP 400 field errors inline, HTTP 409 email conflict
  - Wire logout action in `Navbar.tsx` to call `POST /api/auth/logout` and clear auth store
  - _Requirements: 1.1–1.12_

---

### Phase 4 — Farmer Profile

- [ ] 11. Implement Farmer Profile service and routes
  - Create `src/utils/cloudinary.ts` (upload helper, destroy helper for rollback)
  - Create `src/modules/farmers/farmers.service.ts` — create default profile on Farmer registration (status `pending`), update profile fields with validation, upload photo to Cloudinary
  - Create `src/modules/farmers/farmers.controller.ts` and `farmers.router.ts`
  - Routes: `GET /api/farmers/:id`, `PATCH /api/farmers/:id` (Farmer-only), `POST /api/farmers/:id/photo`
  - Validate field lengths per Requirement 2.2; reject invalid image type/size (HTTP 400 / HTTP 415); handle Cloudinary failure → HTTP 502; leave existing photo unchanged on failure
  - Hook Farmer registration: auto-create FarmerProfile document after `POST /api/auth/register` with role=Farmer
  - _Requirements: 2.1–2.8_

- [~] 12. Build Farmer Profile Edit page
  - Create `src/pages/farmer/FarmerProfileEditPage.tsx` — form for farm name, description, district, state, phone, photo upload (drag-and-drop + file picker)
  - Show inline validation errors; show Toast on success/failure
  - Display verification status badge ("Pending Verification" / "Verified" / "Rejected")
  - _Requirements: 2.1–2.8_

---

### Phase 5 — Product Listing Management

- [~] 13. Implement Product service and routes
  - Create `src/modules/products/products.service.ts` — create, update, deactivate, delete, handle images
  - Create `src/modules/products/products.controller.ts` and `products.router.ts`
  - Routes: `POST /api/products` (verified Farmer), `GET /api/products/:id`, `PATCH /api/products/:id`, `DELETE /api/products/:id`, `PATCH /api/products/:id/status`
  - Validate all product fields per Requirement 3.1; validate category enum from allowed list (Req 3.11)
  - Enforce ownership check → HTTP 403; block deletion with active orders → error response (Req 3.8, 3.9)
  - Atomically set status to `out-of-stock` when `availableQuantity` hits 0 (Req 3.7)
  - Upload up to 5 images to Cloudinary; on any upload failure destroy already-uploaded assets and return HTTP 502 (Req 3.3)
  - Exclude unverified Farmer listings from customer-facing queries (Req 2.7)
  - _Requirements: 3.1–3.11_

- [~] 14. Build Farmer Product management pages
  - Create `src/pages/farmer/FarmerProductListPage.tsx` — table of own listings with status badges, edit/delete/deactivate actions
  - Create `src/pages/farmer/FarmerProductFormPage.tsx` — create/edit form (name, category, description, unit, price, quantity, harvest date, image upload up to 5)
  - Show inline field errors; show Toast on success/failure; disable delete when active orders exist
  - _Requirements: 3.1–3.9_

---

### Phase 6 — Product Discovery, Search, and Detail Pages

- [ ] 15. Implement Product search and filtering (backend)
  - Create `src/modules/products/search.service.ts` (or extend `products.service.ts`)
  - Route: `GET /api/products` with query params: `q`, `category`, `district`, `state`, `minPrice`, `maxPrice`, `availability`, `sort`, `page`, `pageSize`
  - Apply text search (case-insensitive), AND-composed filters, sort options, pagination (default 20, max 100)
  - Return HTTP 400 for `minPrice > maxPrice` (Req 4.6)
  - Return HTTP 200 with empty array + descriptive message when no results (Req 4.12)
  - Return HTTP 200 with empty array when page exceeds total pages (Req 4.11)
  - Exclude inactive and out-of-stock products from default results (Req 3.6, 3.7)
  - _Requirements: 4.1–4.12_

  - [~] 15.1 Write property test for search AND composition (P12)
    - **Property 12: Search filter AND composition**
    - Generate arbitrary multi-filter combinations; assert every result satisfies all filters
    - **Validates: Requirements 4.8**

  - [~] 15.2 Write property test for pagination result window (P13)
    - **Property 13: Pagination result window**
    - Generate arbitrary page P and size N; assert returned items are exactly positions [(P-1)*N, P*N) and empty if P > totalPages
    - **Validates: Requirements 4.10, 4.11**

- [~] 16. Build Product List and Detail pages (frontend)
  - Create `src/pages/ProductListPage.tsx` — search bar, category/location/price/availability filters, sort dropdown, `ProductCard` grid, `Pagination` component
  - Create `src/components/common/ProductCard.tsx` — image, name, price, farmer name, average rating badge, out-of-stock overlay
  - Create `src/pages/ProductDetailPage.tsx` — full product info (all fields from Req 5.1), image gallery, harvest date, seller info, 10 most-recent approved reviews (Req 5.3), average rating (Req 5.4), Add-to-Cart button
  - Create `src/pages/FarmerProfilePage.tsx` — farm name, description, location, photo, verification badge, active product grid (Req 5.2)
  - _Requirements: 4.1–4.12, 5.1–5.4_

---

### Phase 7 — Shopping Cart

- [ ] 17. Implement Cart service and routes (backend)
  - Create `src/modules/cart/cart.service.ts` — add item, update quantity, remove item, clear, server-side subtotal calculation
  - Create `src/modules/cart/cart.controller.ts` and `cart.router.ts`
  - Routes: `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:productId`, `DELETE /api/cart/items/:productId`
  - Enforce quantity range [1, 999]; reject unauthenticated requests (HTTP 401); reject quantity > 999 (HTTP 400); decrement to 0 removes item (Req 7.6)
  - Calculate subtotal server-side; never accept client-supplied price (Req 7.8, 7.9)
  - Persist cart state between sessions (Req 7.10)
  - Block adding out-of-stock product → HTTP 409 (Req 3.10)
  - _Requirements: 7.1–7.11_

  - [~] 17.1 Write property test for cart quantity invariant (P2)
    - **Property 2: Cart quantity invariant**
    - Generate arbitrary add/update sequences; assert every cart item quantity is always in [1, 999], below-1 removes item, above-999 rejected
    - **Validates: Requirements 7.1, 7.3, 7.4, 7.5, 7.6**

  - [~] 17.2 Write property test for server-side cart total correctness (P3)
    - **Property 3: Server-side cart total correctness**
    - Generate arbitrary item sets with differing `pricePerUnit` and `clientSubmittedPrice`; assert server total = Σ(currentPrice × qty)
    - **Validates: Requirements 7.8, 7.9, 8.4, 19.4**

- [~] 18. Build Cart page (frontend)
  - Create `src/pages/CartPage.tsx` — line items with product image, name, quantity stepper (1–999), remove button, server-fetched subtotal
  - Show insufficient-inventory warnings per Req 7.11 (identify affected products and their available quantities)
  - Disable checkout button when inventory warnings exist
  - Sync `useCartStore.cartCount` on every cart mutation
  - _Requirements: 7.1–7.11_

---

### Phase 8 — Checkout and Order Lifecycle

- [ ] 19. Implement Order service and routes (backend)
  - Create `src/modules/orders/orders.service.ts` — checkout (validate stock, create order with price snapshots, atomic inventory decrement with MongoDB transaction and rollback), order status transitions
  - Create `src/modules/orders/orders.controller.ts` and `orders.router.ts`
  - Routes: `POST /api/orders/checkout`, `GET /api/orders` (Customer), `GET /api/orders/:id`, `PATCH /api/orders/:id/status` (Farmer/Admin), `POST /api/orders/:id/cancel` (Customer)
  - Implement COD and gateway payment method stubs (Req 8.8, 8.9)
  - Validate delivery address presence (Req 8.3); snapshot prices at checkout (Req 8.4); server-calculate grand total (Req 8.4)
  - Atomic decrement with rollback on failure (Req 8.5)
  - Enforce status transition rules: Farmer may only do `placed→confirmed→packed→dispatched`; Customer may cancel `placed` or `confirmed`; Admin may do anything (Req 9.1–9.5)
  - Trigger `Notification_Service` on order creation and status change (Req 8.6, 9.6)
  - _Requirements: 8.1–8.9, 9.1–9.7_

  - [~] 19.1 Write property test for checkout atomic inventory decrement (P4)
    - **Property 4: Checkout atomic inventory decrement**
    - Simulate arbitrary valid checkout requests with mocked DB; assert all inventory decremented by exact ordered quantities, and any single failure rolls back all changes
    - **Validates: Requirements 8.1, 8.5**

  - [~] 19.2 Write property test for order total = price-snapshot sum (P5)
    - **Property 5: Order total is a price-snapshot sum**
    - Generate arbitrary order item sets; assert `grandTotal` = Σ(`priceSnapshot` × `quantity`), and snapshots never change after order creation
    - **Validates: Requirements 8.4, 6.5, 6.6**

  - [~] 19.3 Write property test for Farmer order status transition validity (P15)
    - **Property 15: Order status transition validity (Farmer)**
    - Generate arbitrary `(currentStatus, requestedStatus, role)` triples; assert only `placed→confirmed`, `confirmed→packed`, `packed→dispatched` are accepted for Farmer role; all others rejected with HTTP 403
    - **Validates: Requirements 9.2**

- [~] 20. Build Checkout and Order tracking pages (frontend)
  - Create `src/pages/CheckoutPage.tsx` — address selector/entry form, order summary with price snapshots, payment method selector (COD first), Place Order button
  - Create `src/pages/OrderListPage.tsx` — paginated order history with status chips
  - Create `src/pages/OrderDetailPage.tsx` — status timeline (Placed → Delivered), all order items, delivery address, cancel button (shown only for placed/confirmed), estimated delivery date
  - Wire status update actions for Farmer in `FarmerOrderDetailPage.tsx`
  - _Requirements: 8.1–8.9, 9.1–9.7_

---

### Phase 9 — Price Comparison

- [ ] 21. Implement Compare service and routes (backend)
  - Create `src/modules/compare/compare.service.ts` — query matching products from verified Farmers where `availableQuantity ≥ requestedQuantity`, compute `totalEstimatedCost = (pricePerUnit × Q) + deliveryCharge`, sort by cost asc then harvestDate desc, record `PriceSnapshot` for each result
  - Create `src/modules/compare/compare.controller.ts` and `compare.router.ts`
  - Route: `GET /api/compare?name=&category=&quantity=`
  - Return empty list with descriptive message when no listings meet stock requirement (Req 6.1)
  - Use updated prices for new comparisons; leave existing snapshots unchanged (Req 6.6)
  - _Requirements: 6.1–6.6_

  - [~] 21.1 Write property test for price comparison sort correctness (P6)
    - **Property 6: Price comparison sort correctness**
    - Generate arbitrary result sets; assert sorted by `totalEstimatedCost` asc, ties broken by `harvestDate` desc
    - **Validates: Requirements 6.2**

  - [~] 21.2 Write property test for price comparison total calculation (P7)
    - **Property 7: Price comparison total calculation**
    - Generate arbitrary `(pricePerUnit, deliveryCharge, Q, availableQuantity)` tuples; assert `totalEstimatedCost = pricePerUnit×Q + deliveryCharge` and only listings where `availableQuantity ≥ Q` appear
    - **Validates: Requirements 6.1, 6.3**

- [~] 22. Build Compare page (frontend)
  - Create `src/pages/ComparePage.tsx` — search by product name or category, quantity input, result cards with unit price / delivery charge / total estimated cost / harvest date
  - Show "Best Value" badge on listing(s) with lowest total cost (Req 6.4)
  - Recalculate totals and exclude insufficient-stock listings on quantity change (Req 6.3)
  - _Requirements: 6.1–6.6_

---

### Phase 10 — Reviews and Ratings

- [ ] 23. Implement Review service and routes (backend)
  - Create `src/modules/reviews/reviews.service.ts` — submit review (check delivered order exists, check no duplicate, create with status `pending`), approve/reject (Admin), auto-approve after 24 h, recalculate `averageRating` and `reviewCount` on approval, edit pending review
  - Create `src/modules/reviews/reviews.controller.ts` and `reviews.router.ts`
  - Routes: `POST /api/reviews`, `PATCH /api/reviews/:id` (Customer edit), `PATCH /api/reviews/:id/status` (Admin), `GET /api/products/:id/reviews`
  - Enforce: only delivered orders enable review (Req 10.2); one review per product per order (Req 10.3); reject edit of approved/rejected review (Req 10.8)
  - Trigger notification to Farmer on new review, to Customer on approve/reject (Req 15.1, 15.2)
  - _Requirements: 10.1–10.8_

  - [~] 23.1 Write property test for review eligibility gate (P9)
    - **Property 9: Review eligibility gate**
    - Generate arbitrary `(customerId, productId, orderId, orderStatus)` combinations; assert review accepted iff order status = delivered and no duplicate exists
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [~] 23.2 Write property test for average rating consistency (P10)
    - **Property 10: Average rating consistency**
    - Generate arbitrary sets of approved ratings; assert stored `averageRating` = arithmetic mean rounded to 1 decimal place and `reviewCount` = count of approved reviews
    - **Validates: Requirements 10.5, 5.4**

---

### Phase 11 — Favorites

- [~] 24. Implement Favorites service and routes (backend)
  - Create `src/modules/favorites/favorites.service.ts` — add (reject duplicates → HTTP 409), remove (reject missing → 404), list with refreshed product availability
  - Create `src/modules/favorites/favorites.controller.ts` and `favorites.router.ts` (Customer-only)
  - Routes: `POST /api/favorites`, `DELETE /api/favorites/:targetId`, `GET /api/favorites`
  - Reject unauthenticated requests (HTTP 401); return `out-of-stock` / `no-longer-available` indicators (Req 11.5, 11.6)
  - _Requirements: 11.1–11.6_

- [~] 25. Build Favorites page (frontend)
  - Create `src/pages/FavoritesPage.tsx` — saved products (with current price/availability refreshed ≤5 min) and saved farmer profiles; out-of-stock and no-longer-available indicators; remove button per item
  - _Requirements: 11.1–11.6_

---

### Phase 12 — Notifications

- [ ] 26. Implement Notification service and routes (backend)
  - Create `src/modules/notifications/notifications.service.ts` — create notification for all trigger events (Req 15.1, 15.2), fetch 50 most recent, archive beyond 50, mark as read
  - Create `src/modules/notifications/notifications.controller.ts` and `notifications.router.ts`
  - Routes: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `GET /api/notifications/unread-count`
  - Notification must be created within 30 seconds of triggering event (Req 8.6, 9.6)
  - _Requirements: 15.1–15.6_

  - [~] 26.1 Write property test for notification unread count invariant (P14)
    - **Property 14: Notification unread count invariant**
    - Generate arbitrary sequences of create and mark-read events; assert badge value always equals count of `isRead=false` records (capped at "99+" when > 99)
    - **Validates: Requirements 15.3, 15.5**

- [~] 27. Build Notifications panel (frontend)
  - Update `Navbar.tsx` — unread badge from `useNotifStore`; badge shows "99+" when count > 99 (Req 15.3)
  - Create `src/pages/NotificationsPage.tsx` — 50 most recent notifications sorted by creation desc, title + message + relative time; mark-as-read on click decrements badge (Req 15.4, 15.5)
  - _Requirements: 15.1–15.6_

---

### Phase 13 — Community Group Buying

- [ ] 28. Implement GroupBuy service and routes (backend)
  - Create `src/modules/groupbuy/groupbuy.service.ts` — create group buy (validate discountedPrice < regularPrice, expiresAt ≥ now+1h), join (reject expired, reject duplicate participation), check threshold and mark Confirmed, mark Expired on timeout, create individual Orders at discounted price on Confirmation
  - Create `src/modules/groupbuy/groupbuy.controller.ts` and `groupbuy.router.ts`
  - Routes: `POST /api/groupbuys` (verified Farmer), `GET /api/groupbuys`, `POST /api/groupbuys/:id/join` (Customer), `GET /api/groupbuys/:id`
  - Reject discounted price ≥ regular price → error (Req 14.2); reject expiry < now+1h → error (Req 14.3); reject duplicate participation (Req 14.7); reject join after expiry (Req 14.6)
  - On confirmation: trigger Order creation for each participant at discounted price via `Order_Service` (Req 14.10); notify all participants (Req 14.8)
  - On expiry without threshold: mark Expired, notify all participants (Req 14.9)
  - _Requirements: 14.1–14.10_

  - [~] 28.1 Write property test for group buy discounted price constraint (P8)
    - **Property 8: Group buy discounted price constraint**
    - Generate arbitrary `(discountedPricePerUnit, regularPricePerUnit)` pairs; assert GroupBuy accepted iff `discountedPricePerUnit < regularPricePerUnit`
    - **Validates: Requirements 14.1, 14.2**

- [~] 29. Build Group Buy pages (frontend)
  - Create `src/pages/GroupBuyListPage.tsx` — list of open group buys: product name, farmer, discounted price, min threshold, current committed quantity, time remaining countdown
  - Create `src/pages/farmer/FarmerGroupBuyPage.tsx` — create group buy form (product selector, discounted price, min quantity, expiry date/time); list of own group buys with status
  - Join button on GroupBuyListPage with quantity input; show error on duplicate join or expired event
  - _Requirements: 14.1–14.10_

---

### Phase 14 — i18n (English & Telugu)

- [ ] 30. Set up i18next with English and Telugu bundles
  - Install `i18next`, `react-i18next`
  - Create `src/locales/en/translation.json` — all static UI strings for Customer, Farmer, and Admin interfaces
  - Create `src/locales/te/translation.json` — Telugu translations for all keys
  - Configure i18next with async bundle loading, `fallbackLng: 'en'`, `lng` from `useLangStore`
  - Default to English for first-time visitors (Req 13.2)
  - Persist language selection to `localStorage`; fall back to session-only if unavailable (Req 13.4)
  - Ensure missing Telugu keys fall back to English string, never raw key (Req 13.6)
  - _Requirements: 13.1–13.7_

  - [~] 30.1 Write property test for i18n fallback completeness (P11)
    - **Property 11: i18n fallback completeness**
    - Generate arbitrary translation keys absent from `te` bundle; assert rendered string equals corresponding `en` value, never a raw key
    - **Validates: Requirements 13.6**

- [~] 31. Integrate language switcher into Navbar
  - Create/complete `src/components/common/LanguageSwitcher.tsx` — toggle between EN / TE without page reload (Req 13.3)
  - Apply `useTranslation` hook across all existing pages and components
  - _Requirements: 13.1–13.7_

---

### Phase 15 — Farmer Easy Mode

- [~] 32. Implement Easy Mode toggle and step-form scaffolding
  - Create `src/components/easy-mode/EasyModeToggle.tsx` — toggle with Farmer dashboard; persist preference to Farmer profile via `PATCH /api/farmers/:id` (Req 12.1, 12.10)
  - Create `src/pages/farmer/EasyModeProductFormPage.tsx` — step-by-step form with one field per screen (name → category → description → unit → price → quantity → harvest date → images), StepIndicator, back-navigation preserving earlier-step values (Req 12.4)
  - Create `src/components/easy-mode/StepIndicator.tsx`
  - All controls: minimum 48×48 CSS pixel touch targets (Req 12.2); icons ≥ 32×32 px beside every primary action (Req 12.3)
  - Instructions at Flesch-Kincaid Grade Level ≤ 6 (Req 12.9)
  - _Requirements: 12.1–12.10_

- [~] 33. Implement voice guidance (Web Speech API)
  - Create `src/components/easy-mode/VoiceInputField.tsx` — microphone button that reads field label+instructions aloud (`SpeechSynthesis`) and transcribes speech to field (`SpeechRecognition`)
  - Create `src/components/easy-mode/VoiceConfirmDialog.tsx` — show recognized text; Farmer accepts or rejects before applying to field (Req 12.8)
  - Detect `SpeechRecognition` / `webkitSpeechRecognition` availability; render `<textarea>` fallback with explanatory text if unavailable; never block form submission (Req 12.7)
  - Support `language: 'en' | 'te'` prop (Req 12.5, 12.6)
  - _Requirements: 12.5–12.8_

- [~] 34. Checkpoint — Easy Mode and i18n integration
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 16 — Admin Panel

- [~] 35. Implement Admin services and routes (backend)
  - Create `src/modules/admin/admin.service.ts` covering:
    - User management: paginated user list (filter by role/status, 20/page), suspend/reactivate → HTTP 403 on all requests for suspended users (Req 16.1, 16.2), delete user (cascade: cart, inactive products, farmer profile; reject if active orders → HTTP 409) (Req 16.6, 16.7)
    - Farmer verification: list pending, verify (update status to `verified`, notify Farmer), reject with reason 1–500 chars (Req 16.3–16.5)
    - Product moderation: paginated product list (filter by status/category), deactivate with reason 1–500 chars (notify Farmer), reactivate, reject deactivating already-inactive product → HTTP 409 (Req 17.1–17.5)
    - Order monitoring: paginated order list (filter by status/date range/farmer, 20/page), update any order status (Req 18.1)
    - Reporting: aggregate metrics endpoint (order count, revenue, unique customers, unique farmers, top-10 products), daily new-user registration counts, Order export as JSON; validate date ranges (start ≤ end) → HTTP 400 (Req 18.2–18.6)
    - Review moderation: approve/reject reviews (Req 10.4–10.6)
  - Create `src/modules/admin/admin.controller.ts` and `admin.router.ts`
  - _Requirements: 16.1–16.7, 17.1–17.5, 18.1–18.6, 9.3, 10.4–10.6_

- [~] 36. Build Admin dashboard and management pages (frontend)
  - Create `src/pages/admin/AdminDashboardPage.tsx` — charts visualising aggregate metrics from Req 18.2 (install `recharts` or `chart.js`)
  - Create `src/pages/admin/AdminUserListPage.tsx` and `AdminUserDetailPage.tsx` — filter by role/status, suspend/reactivate/delete actions
  - Create `src/pages/admin/AdminFarmerListPage.tsx` and `AdminFarmerDetailPage.tsx` — pending verification queue, verify/reject actions (rejection reason text field)
  - Create `src/pages/admin/AdminProductListPage.tsx` and `AdminProductDetailPage.tsx` — filter by status/category, deactivate (reason field) / reactivate actions
  - Create `src/pages/admin/AdminOrderListPage.tsx` — filter by status/date/farmer, status override actions
  - Create `src/pages/admin/AdminReviewListPage.tsx` — approve/reject actions
  - Create `src/pages/admin/AdminReportsPage.tsx` — date-range pickers, metrics charts, "Export JSON" button
  - _Requirements: 16.1–16.7, 17.1–17.5, 18.1–18.6_

---

### Phase 17 — Accessibility and Responsive UI Polish

- [~] 37. Audit and fix accessibility across all pages
  - Add `aria-label` or `<label>` to every form field across all 34 routes (Req 20.4)
  - Add visible focus indicators to all focusable elements (Req 20.5)
  - Add meaningful `alt` text to all `<img>` tags; set `alt=""` on decorative images (Req 20.6)
  - Replace `<div>`-based layout wrappers with semantic HTML5 elements (`nav`, `main`, `section`, `article`, `header`, `footer`) (Req 20.7)
  - Verify keyboard-only navigation reaches every interactive element (Req 20.3)
  - Verify no horizontal scrolling at 320 px viewport (Req 20.8)
  - Check WCAG 2.1 AA contrast ratios on custom Tailwind tokens (Req 20.2)
  - _Requirements: 20.1–20.8_

---

### Phase 18 — Testing

- [~] 38. Set up Vitest and fast-check for backend
  - Install `vitest`, `fast-check`, `@vitest/coverage-v8`, `mongodb-memory-server`
  - Create `vitest.config.ts` with `environment: 'node'`, `coverage.threshold.lines: 80`
  - Add `npm run test` (watch) and `npm run test:run` (CI single pass) scripts
  - _Requirements: (testing infrastructure for all properties)_

- [~] 39. Write backend unit tests for all service modules
  - `src/modules/auth/auth.service.test.ts` — password hashing, token issuance, refresh, revocation, rate limit
  - `src/modules/orders/orders.service.test.ts` — subtotal calculation, grand total, inventory decrement/rollback
  - `src/modules/compare/compare.service.test.ts` — sort, total cost, stock filter
  - `src/modules/groupbuy/groupbuy.service.test.ts` — discount validation, threshold detection, expiry
  - `src/modules/reviews/reviews.service.test.ts` — eligibility, average rating recalculation
  - `src/modules/notifications/notifications.service.test.ts` — recipient selection per event type
  - _Requirements: 1, 6–10, 14, 15_

- [~] 40. Consolidate and run all property-based tests
  - Collect all PBT tasks (P1–P15) written in earlier phases into `src/__tests__/properties/`
  - Ensure each file has header comment: `// Feature: farmconnect-marketplace, Property N: <property_text>`
  - Set `numRuns: 100` minimum in each `fc.assert` call
  - Run full suite with `npm run test:run`; fix any failing properties
  - _Requirements: all Correctness Properties (P1–P15)_

- [~] 41. Write frontend component and store tests
  - `src/components/common/ProductCard.test.tsx`
  - `src/pages/CartPage.test.tsx` — quantity stepper, inventory warning display
  - `src/pages/CheckoutPage.test.tsx` — address validation, price snapshot display
  - `src/pages/farmer/EasyModeProductFormPage.test.tsx` — step navigation, data preservation on back
  - `src/components/easy-mode/VoiceInputField.test.tsx` — Speech API available and unavailable branches
  - `src/stores/*.test.ts` — all Zustand store actions and state transitions
  - `src/api/axiosInstance.test.ts` — token refresh flow, redirect on refresh failure
  - `src/i18n/fallback.test.ts` — missing Telugu key returns English value, language persistence in localStorage
  - _Requirements: 7, 8, 12, 13, 21.2, 21.3_

- [~] 42. Write integration tests
  - Full checkout flow (local MongoDB via `mongodb-memory-server`, no mocks)
  - Group buy threshold reached → individual orders created at discounted price
  - Farmer verification → product visibility transition within 60 seconds
  - Rate limiter: 10 login attempts → HTTP 429 on 11th
  - _Requirements: 1.10, 2.8, 8, 14.10_

- [~] 43. Checkpoint — all tests passing
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 19 — Deployment Preparation

- [~] 44. Write database seeding script
  - Create `backend/scripts/seed.ts` — insert ≥ 3 Farmer accounts (verified), ≥ 10 Product listings across multiple categories, ≥ 2 Customer accounts, sample group buy event, sample orders
  - Add `npm run seed` script to `backend/package.json`
  - _Requirements: 23.7_

- [~] 45. Add deployment configuration files
  - Create `backend/Procfile`: `web: node dist/server.js` (Render)
  - Create `frontend/vercel.json` with SPA rewrite rule (`"rewrites": [{"source":"/(.*)", "destination":"/index.html"}]`)
  - Alternatively create `frontend/netlify.toml` with `[[redirects]]` SPA rule
  - Confirm `npm run build` in both `frontend/` and `backend/` completes without TypeScript or build errors
  - _Requirements: 23.3, 23.4, 23.5, 23.6_

- [~] 46. Write root README and environment variable templates
  - Complete `README.md` at repo root: prerequisites, environment variable setup guide, database seeding command, commands to start frontend and backend locally, production deployment steps for Vercel + Render
  - Finalise `frontend/.env.example` and `backend/.env.example` — every required variable, description, and sample value
  - Confirm all secrets are env-var only; verify no credentials appear in source or version control
  - _Requirements: 19.6, 23.1, 23.2_

- [~] 47. Final checkpoint
  - Ensure all tests pass, `npm run build` succeeds in both workspaces, seed script populates demo data, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for full traceability.
- Property-based tests (P1–P15) use **fast-check** with `numRuns: 100` minimum.
- Unit tests and property tests are complementary — both should be present for critical service logic.
- Checkpoints at tasks 34, 43, and 47 gate later phases to avoid compounding broken states.
- All financial calculations (cart subtotals, order grand totals, comparison totals) are server-side only — the client never supplies prices.
- MongoDB Atlas transactions are required for checkout (Task 19) and group buy order creation (Task 28) to satisfy atomicity guarantees.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "4"] },
    { "id": 1, "tasks": ["2", "5", "6"] },
    { "id": 2, "tasks": ["3", "7"] },
    { "id": 3, "tasks": ["8", "9"] },
    { "id": 4, "tasks": ["8.1", "10", "11"] },
    { "id": 5, "tasks": ["12", "13"] },
    { "id": 6, "tasks": ["14", "15"] },
    { "id": 7, "tasks": ["15.1", "15.2", "16"] },
    { "id": 8, "tasks": ["17"] },
    { "id": 9, "tasks": ["17.1", "17.2", "18"] },
    { "id": 10, "tasks": ["19"] },
    { "id": 11, "tasks": ["19.1", "19.2", "19.3", "20"] },
    { "id": 12, "tasks": ["21"] },
    { "id": 13, "tasks": ["21.1", "21.2", "22"] },
    { "id": 14, "tasks": ["23"] },
    { "id": 15, "tasks": ["23.1", "23.2", "24"] },
    { "id": 16, "tasks": ["25", "26"] },
    { "id": 17, "tasks": ["26.1", "27"] },
    { "id": 18, "tasks": ["28"] },
    { "id": 19, "tasks": ["28.1", "29", "30"] },
    { "id": 20, "tasks": ["30.1", "31"] },
    { "id": 21, "tasks": ["32"] },
    { "id": 22, "tasks": ["33"] },
    { "id": 23, "tasks": ["35"] },
    { "id": 24, "tasks": ["36"] },
    { "id": 25, "tasks": ["37", "38"] },
    { "id": 26, "tasks": ["39", "41"] },
    { "id": 27, "tasks": ["40", "42"] },
    { "id": 28, "tasks": ["44", "45", "46"] }
  ]
}
```
