# Requirements Document

## Introduction

FarmConnect is a full-stack MERN-based marketplace that directly connects local farmers to customers, eliminating intermediaries. The platform supports English and Telugu, includes a Farmer Easy Mode with voice guidance for low-literacy users, enables real price comparison across farmers (including delivery cost normalization), and supports community group buying. It is built for a hackathon and must be a fully deployable, production-quality application with JWT-based RBAC, Cloudinary image uploads, and a mobile-first responsive UI.

## Glossary

- **Platform**: The FarmConnect web application as a whole.
- **Farmer**: A registered seller who lists agricultural produce on the Platform.
- **Customer**: A registered buyer who browses and purchases produce on the Platform.
- **Admin**: A Platform administrator who moderates content and manages users.
- **Product**: An agricultural item listed for sale by a Farmer.
- **Order**: A confirmed purchase transaction between a Customer and one or more Farmers.
- **Cart**: A temporary collection of Products a Customer intends to purchase.
- **Price_Snapshot**: A point-in-time record of a Product's price used in Order history and price comparison.
- **Easy_Mode**: A Farmer-facing UI variant with large controls, icons, and voice guidance for users with limited literacy or tech experience.
- **Group_Buy**: A community purchasing event where multiple Customers combine quantities to meet a minimum threshold set by a Farmer.
- **RBAC**: Role-Based Access Control — enforcement of distinct permissions for the Customer, Farmer, and Admin roles.
- **JWT**: JSON Web Token used for stateless authentication.
- **Refresh_Token**: A long-lived token stored in an HTTP-only cookie used to issue new access tokens.
- **i18n**: Internationalisation layer (powered by i18next) that serves English and Telugu UI strings.
- **Auth_Service**: The backend module responsible for registration, login, token issuance, and token refresh.
- **Product_Service**: The backend module responsible for Product CRUD, image upload, and inventory management.
- **Order_Service**: The backend module responsible for Cart, Checkout, Order lifecycle, and server-side price calculation.
- **Compare_Service**: The backend module that aggregates Price_Snapshots from multiple Farmers for the same Product category.
- **Group_Buy_Service**: The backend module that manages Group_Buy creation, participation, and threshold enforcement.
- **Notification_Service**: The backend module that creates and delivers in-app notifications.
- **Review_Service**: The backend module that manages Product and Farmer reviews and ratings.
- **Admin_Service**: The backend module for user management, Farmer verification, Product moderation, and reporting.
- **Speech_API**: The browser's Web Speech API used for voice input and output in Easy_Mode.
- **Cloudinary**: The third-party image hosting service used for Product and profile photos.
- **MongoDB_Atlas**: The hosted MongoDB cluster used as the primary database in production.

---

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a visitor, I want to register an account and log in securely, so that I can access role-specific features as a Customer, Farmer, or Admin.

#### Acceptance Criteria

1. THE Auth_Service SHALL accept registration requests containing a name (1–100 characters), a valid email address (max 254 characters, RFC 5321 format), a password (8–128 characters containing at least one uppercase letter, one lowercase letter, one digit, and one special character), and a role of either "Customer" or "Farmer".
2. WHEN a registration request is received, THE Auth_Service SHALL validate that the email address is not already associated with an existing account.
3. IF a duplicate email address is detected during registration, THEN THE Auth_Service SHALL return an HTTP 409 response with an error message indicating the email address is already in use.
4. WHEN all field validation checks pass, THE Auth_Service SHALL hash the password using bcrypt with a minimum cost factor of 12 before persisting it.
5. WHEN a login request containing valid credentials is received, THE Auth_Service SHALL issue a signed JWT access token with an expiry of 15 minutes and a Refresh_Token stored in an HTTP-only, Secure, SameSite=Strict cookie with an expiry of 7 days.
6. IF a login request contains an invalid email address or incorrect password, THEN THE Auth_Service SHALL return an HTTP 401 response without specifying which field is incorrect.
7. WHEN a request to refresh the access token is received with a Refresh_Token that is non-expired, not revoked, and cryptographically valid, THE Auth_Service SHALL issue a new JWT access token without requiring the user to re-enter credentials.
8. IF a Refresh_Token is expired, revoked, or not found, THEN THE Auth_Service SHALL return an HTTP 401 response and clear the HTTP-only cookie.
9. WHEN a logout request is received, THE Auth_Service SHALL invalidate the Refresh_Token and clear the HTTP-only cookie.
10. THE Auth_Service SHALL enforce rate limiting of 10 login attempts per IP address per 15-minute window, returning HTTP 429 after the limit is exceeded.
11. THE Platform SHALL apply RBAC so that Customer-only, Farmer-only, and Admin-only routes reject requests carrying tokens issued for other roles with HTTP 403.
12. IF a registration request is received with a password that does not meet the complexity requirements in Criterion 1, THEN THE Auth_Service SHALL return an HTTP 400 response with an error message describing which complexity requirement was not satisfied.

---

### Requirement 2: Farmer Profile Management

**User Story:** As a Farmer, I want to create and maintain a seller profile, so that Customers can learn about my farm and trust my listings.

#### Acceptance Criteria

1. WHEN a Farmer completes registration, THE Platform SHALL create a default Farmer profile linked to the Farmer's user account, with farm name, farm description, location, profile photo, and contact phone number set to empty values and verification status set to "Pending Verification".
2. THE Platform SHALL allow a Farmer to update the farm name (1–100 characters), farm description (1–1000 characters), location (district and state each 1–100 characters), profile photo, and contact phone number (7–15 digits, digits only) on the Farmer profile.
3. IF a Farmer submits a profile update with any required field exceeding its maximum length or containing invalid characters, THEN THE Platform SHALL reject the update and return an error message indicating which field failed validation, leaving the existing profile unchanged.
4. WHEN a Farmer submits a profile photo, THE Product_Service SHALL upload the image to Cloudinary and store the returned URL on the Farmer profile.
5. IF the uploaded image exceeds 5 MB or is not a JPEG, PNG, or WebP file, THEN THE Product_Service SHALL reject the upload with an HTTP 400 response and return an error message indicating the reason for rejection, leaving the existing profile photo unchanged.
6. IF the Cloudinary upload fails due to a service error, THEN THE Product_Service SHALL return an error message indicating the upload could not be completed, leaving the existing profile photo unchanged.
7. WHILE a Farmer's account has not been verified by an Admin, THE Platform SHALL mark the Farmer's listings as "Pending Verification" and exclude them from Customer-facing search results.
8. WHEN a Farmer's account is verified by an Admin, THE Platform SHALL update the Farmer's verification status to "Verified" and make the Farmer's listings visible in Customer-facing search results within 60 seconds of verification.

---

### Requirement 3: Product Listing Management

**User Story:** As a Farmer, I want to create, edit, and remove product listings, so that I can offer my produce to Customers with accurate details.

#### Acceptance Criteria

1. WHEN a verified Farmer submits a valid product creation request, THE Product_Service SHALL create a Product listing containing a name (1–100 characters), category (one of the values in Criterion 9), description (1–1000 characters), unit (kg, g, litre, piece, bunch, or dozen), price per unit (0.01–999999.99), available quantity (0–99999), harvest date (not in the future), and up to 5 images.
2. WHEN a Farmer submits images for a Product, THE Product_Service SHALL upload each image to Cloudinary and store the returned URLs on the Product document.
3. IF an image upload to Cloudinary fails, THEN THE Product_Service SHALL return an HTTP 502 response and not persist the Product listing.
4. WHEN a verified Farmer submits a valid update request for a Product listing the Farmer owns, THE Product_Service SHALL update the specified fields of that Product listing.
5. IF a Farmer attempts to update or delete a Product listing owned by a different Farmer, THEN THE Product_Service SHALL return an HTTP 403 response and leave the Product listing unchanged.
6. WHEN a verified Farmer marks a Product as inactive, THE Product_Service SHALL set the Product status to "Inactive" and exclude it from Customer-facing search results without deleting the record.
7. WHEN available quantity for a Product reaches zero, THE Product_Service SHALL automatically mark the Product as "Out-of-Stock" and exclude it from default search results.
8. WHEN a verified Farmer requests deletion of a Product listing that has no associated pending or active Orders, THE Product_Service SHALL permanently delete the Product record.
9. IF a Farmer attempts to delete a Product listing that has one or more pending or active Orders, THEN THE Product_Service SHALL reject the deletion with an error response indicating active Orders exist, and the Product SHALL remain unchanged.
10. IF a Customer attempts to add an out-of-stock Product to the Cart, THEN THE Order_Service SHALL return an HTTP 409 response with a descriptive message.
11. THE Product_Service SHALL support the following Product categories: Vegetables, Fruits, Grains & Pulses, Dairy & Eggs, Herbs & Spices, Flowers, and Other.

---

### Requirement 4: Product Discovery and Search

**User Story:** As a Customer, I want to search and filter products, so that I can quickly find fresh local produce that meets my needs.

#### Acceptance Criteria

1. WHEN a search request is received with a non-empty query string, THE Platform SHALL return Products whose name, description, or category contains the query string (case-insensitive).
2. WHEN a search request is received with an empty or absent query string, THE Platform SHALL return all active, in-stock Products in the default sort order (newest harvest date first).
3. WHEN a search request includes a category filter, THE Platform SHALL return only Products belonging to the specified category.
4. WHEN a search request includes a location filter (district or state), THE Platform SHALL return only Products listed by Farmers whose profile location matches the specified district or state.
5. WHEN a search request includes a price range filter, THE Platform SHALL return only Products whose price per unit is greater than or equal to the minimum price and less than or equal to the maximum price.
6. IF a search request includes a price range filter where the minimum price is greater than the maximum price, THEN THE Platform SHALL return an HTTP 400 response with an error message indicating the invalid price range.
7. WHEN a search request includes an availability filter set to "in stock", THE Platform SHALL exclude out-of-stock and inactive Products from results.
8. WHEN multiple filters are provided in a single search request, THE Platform SHALL apply all filters combined with AND logic, returning only Products that satisfy every specified filter.
9. WHEN a search request includes a sort parameter, THE Platform SHALL sort search results by price ascending, price descending, harvest date newest first, or average rating descending as specified.
10. WHEN a search request includes a page number parameter (minimum 1) and an optional page size parameter (default 20, maximum 100), THE Platform SHALL return the corresponding page of results.
11. WHEN a page number parameter exceeds the total number of available pages, THE Platform SHALL return an HTTP 200 response with an empty results array.
12. WHEN a search query returns no results, THE Platform SHALL return an HTTP 200 response with an empty results array and a descriptive message.

---

### Requirement 5: Product Detail and Farmer Profile Pages

**User Story:** As a Customer, I want to view detailed product information and the selling farmer's profile, so that I can make an informed purchase decision.

#### Acceptance Criteria

1. WHEN a Customer navigates to a Product detail page, THE Platform SHALL display the product name, category, description, images (or a placeholder if no images exist), price per unit, unit, available quantity, harvest date, average rating, review count, and the selling Farmer's name and location.
2. WHEN a Customer navigates to a Farmer profile page, THE Platform SHALL display the farm name, description, location, profile photo, verification status ("Verified" or "Unverified"), and all active Products listed by that Farmer.
3. WHEN a Customer views a Product detail page, THE Platform SHALL display up to the 10 most recent approved reviews for that Product sorted by submission date descending; if fewer than 10 reviews exist, all available reviews SHALL be shown.
4. THE Platform SHALL display the average star rating for a Product rounded to one decimal place, computed from all approved reviews; IF no approved reviews exist, THE Platform SHALL display "No ratings yet" with a review count of 0.

---

### Requirement 6: Price Comparison

**User Story:** As a Customer, I want to compare the same product offered by multiple farmers, so that I can choose the best value considering price and delivery.

#### Acceptance Criteria

1. WHEN a price comparison request is received with a product name or category and a requested quantity (integer between 1 and 10,000), THE Compare_Service SHALL return a list of matching Products from different verified Farmers where each Farmer's available stock is greater than or equal to the requested quantity, including unit price, delivery charge, total estimated cost (unit price × requested quantity + delivery charge), available quantity, and harvest date; IF no matching listings meet the stock requirement, THE Compare_Service SHALL return an empty list with a descriptive message.
2. WHEN the Compare_Service returns results, THE Platform SHALL sort the list by total estimated cost ascending; ties SHALL be broken by harvest date descending (most recent first).
3. WHEN a Customer changes the requested quantity on the comparison page, THE Platform SHALL recalculate the total estimated cost for each listing using the new quantity; IF the new quantity exceeds a Farmer's available stock, that Farmer's listing SHALL be excluded from the updated results.
4. THE Platform SHALL display a distinct visual indicator (such as a "Best Value" badge) on the listing with the lowest total estimated cost; IF two or more listings share the lowest total estimated cost, THE Platform SHALL apply the indicator to all tied listings.
5. THE Compare_Service SHALL record a Price_Snapshot for each Product included in a comparison result, storing the product ID, Farmer ID, price per unit, delivery charge, and timestamp.
6. WHEN a Product's price or delivery charge is updated by a Farmer, THE Compare_Service SHALL use the updated values for all subsequent comparisons; existing Price_Snapshots SHALL remain unchanged.

---

### Requirement 7: Shopping Cart

**User Story:** As a Customer, I want to manage a shopping cart, so that I can collect items from multiple farmers before checking out.

#### Acceptance Criteria

1. WHEN an authenticated Customer requests to add a Product to the Cart with a quantity between 1 and 999, THE Order_Service SHALL add the Product to the Cart at the specified quantity.
2. IF a Customer submits an add-to-cart request while unauthenticated, THEN THE Order_Service SHALL reject the request with an error response indicating authentication is required, without modifying the Cart.
3. WHEN a Customer adds a Product already in the Cart, THE Order_Service SHALL increment that item's quantity by the specified amount rather than creating a duplicate entry, provided the resulting quantity does not exceed 999.
4. IF adding to an existing Cart item would result in a quantity exceeding 999, THEN THE Order_Service SHALL reject the request with an error response indicating the maximum quantity limit, and the Cart item SHALL retain its previous quantity.
5. WHEN a Customer requests to update the quantity of a Cart item to a value between 1 and 999, THE Order_Service SHALL update that item's stored quantity to the specified value.
6. WHEN a Cart item's quantity is set to zero, THE Order_Service SHALL remove the item from the Cart.
7. WHEN a Customer requests to remove a Cart item, THE Order_Service SHALL delete that item from the Cart.
8. THE Order_Service SHALL calculate the Cart subtotal server-side by multiplying each item's current unit price by its quantity and summing the results.
9. THE Order_Service SHALL never accept a client-submitted total as the authoritative Cart price.
10. WHEN an authenticated Customer starts a new session, THE Order_Service SHALL restore the Cart to the state it was in at the end of the Customer's previous session, including all items and their quantities.
11. WHEN a Product in the Cart is found to have insufficient available inventory before checkout, THE Order_Service SHALL display a warning message identifying the affected Product names and their available quantities, and prevent checkout until the Customer removes or reduces each affected item to within available inventory.

---

### Requirement 8: Checkout and Order Placement

**User Story:** As a Customer, I want to check out my cart and place an order, so that I can receive fresh produce from local farmers.

#### Acceptance Criteria

1. WHEN a Customer initiates checkout, THE Order_Service SHALL validate that all Cart items are in stock and that each requested quantity does not exceed the Product's available inventory.
2. IF any Cart item fails stock validation at checkout, THEN THE Order_Service SHALL reject the checkout request with an error response identifying each affected Product by name and its current available quantity, without creating an Order or modifying inventory.
3. IF the checkout request does not include a valid delivery address, THEN THE Order_Service SHALL reject the request with an error response indicating the missing or invalid address, without creating an Order.
4. WHEN a valid checkout request is received, THE Order_Service SHALL create an Order record containing all Order Items, the validated delivery address, a Price_Snapshot of each item's unit price at time of purchase, and a server-calculated grand total equal to the sum of all per-item Price_Snapshot values multiplied by their respective quantities.
5. WHEN an Order is created, THE Order_Service SHALL atomically decrement the available inventory quantity of each ordered Product by its ordered quantity; IF any decrement operation fails, THEN THE Order_Service SHALL roll back all inventory changes and return an error response indicating the Order could not be completed.
6. WHEN an Order is created, THE Notification_Service SHALL send an in-app notification to each Farmer whose Products appear in the Order within 30 seconds of Order creation.
7. THE Order_Service SHALL assign the initial Order status of "Placed" upon Order creation.
8. WHERE Cash on Delivery is selected as the payment method, THE Order_Service SHALL accept the Order without requiring pre-payment confirmation.
9. WHERE a payment gateway integration is enabled, THE Order_Service SHALL process payment through the configured gateway before assigning Order status "Placed".

---

### Requirement 9: Order Lifecycle and Tracking

**User Story:** As a Customer, I want to track my orders from placement to delivery, so that I know the status of my purchases.

#### Acceptance Criteria

1. THE Order_Service SHALL support the following Order statuses in sequence: Placed → Confirmed → Packed → Dispatched → Delivered; and the terminal status Cancelled.
2. WHEN a Farmer requests to advance the status of an Order Item involving their Products, THE Platform SHALL allow transitions from Placed to Confirmed, Confirmed to Packed, and Packed to Dispatched only; any other transition request by a Farmer SHALL be rejected with an HTTP 403 response.
3. THE Platform SHALL allow an Admin to advance any Order to any valid status or mark it as Cancelled.
4. WHEN a Customer requests to cancel an Order that has status Placed or Confirmed, THE Platform SHALL update the Order status to Cancelled and restore each Product's inventory quantity by the ordered amount.
5. IF a Customer attempts to cancel an Order with status Packed, Dispatched, or Delivered, THEN THE Platform SHALL reject the cancellation with an error response indicating the Order cannot be cancelled at this stage.
6. WHEN an Order status changes, THE Notification_Service SHALL send an in-app notification to the Customer within 30 seconds, including the new status value and a human-readable description of what the status means.
7. THE Platform SHALL provide a Customer-facing Order tracking page that displays the current status, a chronological history of all status changes with their timestamps, all Order Items with names and quantities, and the estimated delivery date if provided by the Farmer.

---

### Requirement 10: Reviews and Ratings

**User Story:** As a Customer, I want to leave a review and rating for a product after delivery, so that other shoppers can benefit from my experience.

#### Acceptance Criteria

1. WHEN a Customer's Order containing a specific Product has status Delivered, THE Review_Service SHALL allow that Customer to submit a review for that Product containing a star rating (integer 1–5) and an optional text comment of up to 1000 characters.
2. IF a Customer attempts to submit a review for a Product from an Order that does not have status Delivered, THEN THE Review_Service SHALL reject the request with an error response.
3. THE Review_Service SHALL allow each Customer to submit at most one review per Product per completed Order; IF a duplicate review submission is detected, THE Review_Service SHALL reject it with an error response.
4. WHEN a review is submitted, THE Review_Service SHALL record it with a status of "Pending" until approved by an Admin or automatically approved after 24 hours.
5. WHEN a review reaches "Approved" status, THE Review_Service SHALL update the Product's aggregate average rating and review count.
6. WHEN an Admin rejects a review, THE Review_Service SHALL set the review status to "Rejected" and the review SHALL be excluded from the Product detail page.
7. WHEN a Customer edits a review that has status "Pending", THE Review_Service SHALL update the review content and reset the status to "Pending" for re-evaluation.
8. IF a Customer attempts to edit or delete a review that has status "Approved" or "Rejected", THEN THE Review_Service SHALL reject the request with an error response indicating the review cannot be modified after approval.

---

### Requirement 11: Favorites

**User Story:** As a Customer, I want to save products and farmers to a favorites list, so that I can quickly find them on future visits.

#### Acceptance Criteria

1. WHEN an authenticated Customer requests to add a Product or Farmer profile to the favorites list, THE Platform SHALL add the item if it is not already present; IF the item is already in the favorites list, THE Platform SHALL return an error response indicating the item is already saved.
2. WHEN an authenticated Customer requests to remove a Product or Farmer profile from the favorites list, THE Platform SHALL remove the item; IF the item is not found in the favorites list, THE Platform SHALL return an error response indicating the item was not found.
3. IF a Customer submits a favorites request while unauthenticated, THEN THE Platform SHALL reject the request with an error response indicating authentication is required.
4. THE Platform SHALL display the Customer's favorites list on a dedicated page, showing saved Products with current availability and pricing refreshed within the last 5 minutes, and saved Farmer profiles.
5. WHEN a Product in the Customer's favorites list becomes out-of-stock, THE Platform SHALL display an "Out of Stock" indicator on the favorites page for that Product.
6. WHEN a Product or Farmer profile in the Customer's favorites list is deleted or deactivated, THE Platform SHALL display a "No longer available" indicator for that item on the favorites page and retain the item in the list until the Customer removes it.

---

### Requirement 12: Farmer Easy Mode

**User Story:** As a Farmer with limited tech experience, I want a simplified interface with large buttons and voice guidance, so that I can manage my listings without confusion.

#### Acceptance Criteria

1. THE Platform SHALL provide an Easy_Mode toggle accessible from the Farmer dashboard that switches the Farmer-facing UI to Easy_Mode.
2. WHILE Easy_Mode is active, THE Platform SHALL render all interactive controls with a minimum touch target size of 48 × 48 CSS pixels.
3. WHILE Easy_Mode is active, THE Platform SHALL display an icon of at least 32 × 32 CSS pixels alongside every primary action button (Add Product, Edit, Delete, View Orders).
4. WHILE Easy_Mode is active, THE Platform SHALL present product listing creation as a step-by-step form with one field per screen; previously entered data for earlier steps SHALL be preserved when the Farmer navigates back to a prior step.
5. WHEN a Farmer activates voice guidance in Easy_Mode, THE Platform SHALL use the Speech_API to read the current field label and instructions aloud in the Farmer's selected language (English or Telugu).
6. WHEN a Farmer uses voice input in Easy_Mode, THE Platform SHALL use the Speech_API to transcribe spoken text into the active form field.
7. IF the Speech_API is not supported by the browser, THEN THE Platform SHALL display a visible text fallback and SHALL NOT show an error state that blocks form submission.
8. WHEN voice recognition returns a result in Easy_Mode, THE Platform SHALL display a confirmation prompt showing the recognized text before applying it to the form field; the Farmer SHALL be able to accept or reject the recognized text.
9. WHILE Easy_Mode is active, THE Platform SHALL display instructions using vocabulary and sentence structures targeting a Flesch-Kincaid Grade Level of 6 or below.
10. THE Platform SHALL persist the Easy_Mode preference in the Farmer's profile so that Easy_Mode is active on the next login if it was active on the previous session.

---

### Requirement 13: Multilingual Support (English and Telugu)

**User Story:** As a user, I want to use FarmConnect in either English or Telugu, so that the platform is accessible regardless of my preferred language.

#### Acceptance Criteria

1. THE Platform SHALL support English and Telugu as UI languages.
2. WHEN a first-time visitor loads the Platform without a stored language preference, THE Platform SHALL default to English.
3. THE Platform SHALL display a language selector in the navigation bar that allows the user to switch between English and Telugu without reloading the page.
4. WHEN a user selects a language, THE Platform SHALL persist the selection in localStorage and apply it on subsequent visits; IF localStorage is unavailable, THE Platform SHALL apply the selection for the current session only.
5. THE Platform SHALL provide translations for all static UI strings across the Customer, Farmer, and Admin interfaces.
6. IF a translation key is missing for Telugu, THEN THE Platform SHALL fall back to the English string rather than displaying a raw translation key.
7. THE Platform SHALL display user-generated content (product names, descriptions, reviews) as entered by the user without applying automated translation.

---

### Requirement 14: Community Group Buying

**User Story:** As a Customer, I want to join a group buy for a product, so that I can access bulk pricing when enough buyers participate.

#### Acceptance Criteria

1. WHEN a verified Farmer submits a valid Group_Buy creation request, THE Group_Buy_Service SHALL create a Group_Buy event for a Product specifying a discounted price per unit (which must be less than the Product's current regular price per unit), a minimum total quantity threshold (minimum 1), and an expiry date and time that is at least 1 hour in the future.
2. IF a Group_Buy creation request specifies a discounted price greater than or equal to the Product's current regular price, THEN THE Group_Buy_Service SHALL reject the request with an error response indicating the discounted price must be less than the regular price.
3. IF a Group_Buy creation request specifies an expiry date and time that is not at least 1 hour in the future, THEN THE Group_Buy_Service SHALL reject the request with an error response.
4. THE Platform SHALL display open Group_Buy events on a dedicated Community Group Buying page, showing the Product, Farmer, discounted price, minimum quantity threshold, current committed quantity, and time remaining.
5. WHEN an authenticated Customer joins an open Group_Buy with a requested quantity of at least 1, THE Group_Buy_Service SHALL record the Customer's participation with the requested quantity and add it to the committed quantity total.
6. IF a Customer attempts to join a Group_Buy after the expiry date and time, THEN THE Group_Buy_Service SHALL return an error response indicating the Group_Buy has expired.
7. IF a Customer attempts to join the same Group_Buy event more than once, THEN THE Group_Buy_Service SHALL reject the request with an error response indicating the Customer has already joined.
8. WHEN the committed quantity reaches or exceeds the minimum quantity threshold before the expiry date and time, THE Group_Buy_Service SHALL mark the Group_Buy as "Confirmed" and THE Notification_Service SHALL notify all participants.
9. WHEN a Group_Buy expires without reaching the minimum quantity threshold, THE Group_Buy_Service SHALL mark it as "Expired" and THE Notification_Service SHALL notify all participants that the event did not proceed.
10. WHEN a Group_Buy is Confirmed, THE Order_Service SHALL create individual Orders for each participant at the discounted price, using the server-side discounted price rather than the regular price.

---

### Requirement 15: Notifications

**User Story:** As a user, I want to receive in-app notifications for important events, so that I stay informed without leaving the platform.

#### Acceptance Criteria

1. THE Notification_Service SHALL create a notification record for a Customer when: a new Order is created, an Order status changes, a Group_Buy the Customer joined is Confirmed or Expired, or a review the Customer submitted is Approved or Rejected.
2. THE Notification_Service SHALL create a notification record for a Farmer when: a new Order is placed for the Farmer's Products, or a new review is submitted for one of the Farmer's Products.
3. THE Platform SHALL display the unread notification count as a badge on the notification icon in the navigation bar; if the unread count exceeds 99, the badge SHALL display "99+".
4. WHEN a user opens the notifications panel, THE Platform SHALL display the most recent 50 notifications sorted by creation timestamp descending, each showing title, message body, and relative time (e.g. "2 minutes ago", "1 day ago").
5. WHEN a user selects a notification, THE Notification_Service SHALL mark that notification as read and THE Platform SHALL decrement the unread badge count by 1.
6. THE Platform SHALL display at most 50 notifications per user in the default view; notifications beyond the 50 most recent SHALL be marked as archived and excluded from the default notifications panel.

---

### Requirement 16: Admin — User and Farmer Management

**User Story:** As an Admin, I want to manage user accounts and verify farmer profiles, so that I can maintain a trustworthy marketplace.

#### Acceptance Criteria

1. THE Admin_Service SHALL provide a paginated list of all registered users, filterable by role (Customer, Farmer) and account status (Active, Suspended), returning at most 20 records per page.
2. THE Admin_Service SHALL allow an Admin to suspend or reactivate a user account; a suspended user SHALL receive an HTTP 403 response on all authenticated requests.
3. THE Admin_Service SHALL provide a list of Farmer accounts with verification status "Pending Verification" so that an Admin can review and verify or reject them.
4. WHEN an Admin verifies a Farmer account, THE Admin_Service SHALL update the Farmer's verification status to "Verified" and THE Notification_Service SHALL create an in-app notification for that Farmer indicating the account has been verified.
5. WHEN an Admin rejects a Farmer account, THE Admin_Service SHALL update the Farmer's verification status to "Rejected" and THE Notification_Service SHALL create an in-app notification for that Farmer including the rejection reason supplied by the Admin; the rejection reason SHALL be between 1 and 500 characters.
6. THE Admin_Service SHALL allow an Admin to delete a user account that has no active Orders; deletion SHALL cascade to the user's Cart, inactive Product listings, and Farmer profile.
7. IF an Admin attempts to delete a user account that has one or more active Orders, THEN THE Admin_Service SHALL reject the request with an HTTP 409 response and an error message indicating that active Orders must be resolved before deletion.

---

### Requirement 17: Admin — Product Moderation

**User Story:** As an Admin, I want to review and moderate product listings, so that I can remove inappropriate or inaccurate content.

#### Acceptance Criteria

1. THE Admin_Service SHALL provide a paginated list of all Product listings, filterable by status (Active, Inactive, Out-of-Stock) and category, returning at most 20 records per page.
2. THE Admin_Service SHALL allow an Admin to deactivate a Product listing by supplying a reason between 1 and 500 characters; deactivated listings SHALL be excluded from Customer-facing search results.
3. THE Admin_Service SHALL allow an Admin to reactivate a previously deactivated Product listing.
4. WHEN an Admin deactivates a Product, THE Notification_Service SHALL create an in-app notification for the owning Farmer including the deactivation reason supplied by the Admin.
5. IF an Admin attempts to deactivate a Product listing that is already Inactive, THEN THE Admin_Service SHALL reject the request with an HTTP 409 response and an error message indicating the listing is already inactive.

---

### Requirement 18: Admin — Order Monitoring and Reporting

**User Story:** As an Admin, I want to monitor all orders and generate platform reports, so that I can ensure smooth operations and make informed decisions.

#### Acceptance Criteria

1. THE Admin_Service SHALL provide a paginated list of all Orders, filterable by status, date range, and Farmer, returning at most 20 records per page.
2. THE Admin_Service SHALL expose a reporting endpoint that accepts a date range (start date and end date, each in ISO 8601 format) and returns the following aggregate metrics for that range: total order count, total revenue, total unique Customers, total unique Farmers with sales, and top 10 Products by order count.
3. THE Admin_Service SHALL expose a reporting endpoint that accepts a date range (start date and end date, each in ISO 8601 format) and returns new user registration counts grouped by calendar day for that range.
4. THE Platform SHALL render an Admin dashboard that visualises the aggregate metrics from Requirement 18.2 using charts.
5. THE Admin_Service SHALL allow an Admin to export Order data for a specified date range (start date and end date, each in ISO 8601 format) as a JSON response containing all Order records within that range; if no Orders exist for the range, the response SHALL return an empty array.
6. IF a reporting or export request is made with a start date that is after the end date, THEN THE Admin_Service SHALL reject the request with an HTTP 400 response and an error message indicating the invalid date range.

---

### Requirement 19: Security and Input Validation

**User Story:** As a platform operator, I want all inputs validated and all endpoints secured, so that the application is resistant to common web vulnerabilities.

#### Acceptance Criteria

1. THE Platform SHALL apply the Helmet middleware to all API responses to set secure HTTP headers.
2. THE Platform SHALL enforce CORS, allowing requests only from the configured frontend origin.
3. THE Platform SHALL validate and sanitise all request bodies against a schema before processing; requests failing validation SHALL receive an HTTP 400 response with field-level error details.
4. THE Order_Service SHALL calculate all order totals server-side; THE Platform SHALL reject any request that includes a client-supplied price or total with an HTTP 400 response.
5. THE Platform SHALL validate image uploads by checking file extension and MIME type against an allowed list of jpeg, jpg, png, and webp; files that do not match an allowed type SHALL be rejected with an HTTP 415 response.
6. THE Platform SHALL store all secrets (database connection strings, JWT secrets, Cloudinary credentials) exclusively in server-side environment variables and SHALL NOT expose them in frontend code or version control.
7. THE Platform SHALL apply a global request body size limit of 10 MB to all API endpoints; requests exceeding this limit SHALL receive an HTTP 413 response.
8. WHEN an unauthenticated request is made to a protected endpoint, THE Platform SHALL return an HTTP 401 response.

---

### Requirement 20: Responsive and Accessible UI

**User Story:** As a user on any device, I want a consistent, accessible experience, so that I can use FarmConnect comfortably on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE Platform SHALL render all pages correctly at viewport widths from 320 px to 1920 px using a mobile-first responsive layout.
2. THE Platform SHALL achieve a WCAG 2.1 AA contrast ratio of at least 4.5:1 for all normal-sized text and 3:1 for large text (18 pt or 14 pt bold and above).
3. THE Platform SHALL ensure all interactive elements are reachable and operable via keyboard navigation alone, with all actions executable without requiring a pointing device.
4. THE Platform SHALL associate every form field with a visible label element or an aria-label attribute.
5. THE Platform SHALL display visible focus indicators on all focusable elements.
6. THE Platform SHALL provide alt text for all meaningful images and mark decorative images with alt="".
7. THE Platform SHALL use semantic HTML5 elements (nav, main, section, article, header, footer) for page structure.
8. THE Platform SHALL render on a mobile device without horizontal scrolling at viewport widths of 320 px and above.

---

### Requirement 21: Frontend Application Structure

**User Story:** As a developer, I want a well-organised frontend codebase, so that the application is maintainable and extensible.

#### Acceptance Criteria

1. THE Platform SHALL implement all 34 routes described in the feature summary using React Router v6, with route-level code splitting via React.lazy and Suspense.
2. THE Platform SHALL manage global client-side state (authenticated user, cart item count, language, notifications) using Zustand stores.
3. THE Platform SHALL use Axios instances with request interceptors to attach the JWT access token to all authenticated API requests and response interceptors to attempt a single token refresh on HTTP 401 before retrying; if the token refresh fails, THE Platform SHALL clear the stored session and redirect the user to the login page.
4. THE Platform SHALL use i18next with the react-i18next bindings and load language bundles asynchronously.
5. THE Platform SHALL use Tailwind CSS with a custom theme extending the default palette with forest green (#2D6A2D), leaf green (#5DAB24), warm cream (#FAF3E0), and earthy brown (#8B5E3C) design tokens.
6. THE Platform SHALL use Lucide React for all iconography consistently across all pages.

---

### Requirement 22: Backend Application Structure

**User Story:** As a developer, I want a well-organised backend codebase, so that the API is maintainable, testable, and deployable.

#### Acceptance Criteria

1. THE Platform SHALL implement the backend as a Node.js + Express application written in TypeScript with strict mode enabled.
2. THE Platform SHALL organise the backend into feature modules (auth, users, farmers, products, orders, compare, groupbuy, reviews, notifications, admin), each containing its own router, controller, service, and Mongoose model files.
3. THE Platform SHALL connect to MongoDB_Atlas using a connection string supplied via an environment variable, with a fallback to a local MongoDB URI for development.
4. THE Platform SHALL use Mongoose schemas with TypeScript interfaces for all 13 database models listed in the feature summary.
5. THE Platform SHALL expose a health-check endpoint at GET /api/health that returns HTTP 200 and the current UTC timestamp in ISO 8601 format.
6. THE Platform SHALL return all API errors in a consistent JSON shape: { "success": false, "message": string, "errors"?: object }.
7. THE Platform SHALL log all unhandled errors and uncaught exceptions to the console with timestamp, error message, and stack trace.
8. IF the backend fails to establish a connection to MongoDB within 10 seconds of startup, THEN THE Platform SHALL log an error message indicating the connection failure and terminate the process with a non-zero exit code.

---

### Requirement 23: Build, Deployment, and Documentation

**User Story:** As a developer, I want clear setup instructions and a working build pipeline, so that the application can be deployed to production without manual intervention.

#### Acceptance Criteria

1. THE Platform SHALL provide a root-level README.md with step-by-step local setup instructions covering prerequisites, environment variable configuration, database seeding, and commands to start both frontend and backend.
2. THE Platform SHALL provide separate environment variable template files (.env.example) for both the frontend and backend listing every required variable with a description and sample value.
3. WHEN `npm run build` is executed in the frontend directory, THE Platform SHALL produce a production-ready static bundle in a `dist` directory without TypeScript or build errors.
4. WHEN `npm run build` is executed in the backend directory, THE Platform SHALL compile TypeScript to a `dist` directory without TypeScript errors.
5. THE Platform SHALL include a `Procfile` or equivalent configuration for deploying the backend to Render.
6. THE Platform SHALL include a `vercel.json` or `netlify.toml` configuration for deploying the frontend to Vercel or Netlify.
7. THE Platform SHALL include a database seeding script that populates MongoDB with at least 3 sample Farmer accounts, at least 10 sample Product listings, and at least 2 sample Customer accounts for demonstration purposes.
