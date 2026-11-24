# Security Specification - DSLink

## Data Invariants
1. Orders must have a unique `orderId` following the DSL-YYYY-XXXXXX pattern.
2. Orders created by authenticated users must have the `uid` matching the user.
3. Coupons can only be applied if `active` is true and `expiryDate` is in the future.
4. Admin fields (like `orderStatus`) can only be modified by admins.
5. Products and Packages are publicly readable but only admin-writable.

## The "Dirty Dozen" Payloads
1. **Unauthorized Product Edit**: A non-admin user trying to change the price of a Starlink Kit.
2. **Order ID Forgery**: A user trying to set their own `orderId` format to bypass system increments.
3. **Status Jump**: A customer trying to set their order status to "Delivered" manually.
4. **Coupon Value Modification**: A customer trying to set a 100% discount via a coupon payload.
5. **Customer Spoofing**: A user trying to read another user's customer profile.
6. **Admin Promotion**: A user trying to add themselves to the `admins` collection.
7. **Negative Price**: Creating a product with a negative price.
8. **Invalid Order District**: Submitting an order with a 1MB string as the district name.
9. **Order Deletion**: A customer trying to delete their confirmed order.
10. **Settings Hijack**: A non-admin user trying to change the hero title.
11. **Expired Coupon Use**: Trying to create an order with a coupon that expired 10 days ago.
12. **Unverified Order**: A guest user creating an order without providing a mobile number.

## Test Runner (firestore.rules.test.ts)
*(Note: I will implement the rules to block these payloads)*

- `Product update` by non-admin -> PERMISSION_DENIED
- `Order create` with `orderStatus` != 'Received' -> PERMISSION_DENIED
- `Order update` of `totalAmount` by customer -> PERMISSION_DENIED
- `Customer read` where `uid` != `auth.uid` -> PERMISSION_DENIED
- `Admin write` by non-admin -> PERMISSION_DENIED
