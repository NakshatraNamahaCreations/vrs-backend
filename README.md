# VRS Backend

Node.js + Express + MongoDB backend for VRS Water Purifiers.

## Quick start

```bash
cd vrs-backend
cp .env.example .env      # edit values
npm install
npm run dev               # http://localhost:5000
```

## Stack

- **Express 4** — HTTP framework
- **Mongoose 8** — MongoDB ODM
- **JWT** — stateless auth after OTP verification
- **Helmet + CORS + rate-limit** — sensible defaults
- **Morgan** — request logging in dev

## API surface

| Method | Path                          | Auth | Purpose                          |
| ------ | ----------------------------- | ---- | -------------------------------- |
| POST   | `/api/auth/send-otp`          | —    | Generate + send OTP to phone     |
| POST   | `/api/auth/verify-otp`        | —    | Verify OTP, issue JWT            |
| GET    | `/api/auth/me`                | ✓    | Current user                     |
| POST   | `/api/auth/logout`            | ✓    | Client-side JWT drop (no server state) |
| GET    | `/api/products`               | —    | List products (query filters)    |
| GET    | `/api/products/:id`           | —    | Product detail                   |
| GET    | `/api/cart`                   | ✓    | User's cart                      |
| POST   | `/api/cart/items`             | ✓    | Add / increment item             |
| PATCH  | `/api/cart/items/:productId`  | ✓    | Set quantity                     |
| DELETE | `/api/cart/items/:productId`  | ✓    | Remove item                      |
| DELETE | `/api/cart`                   | ✓    | Clear cart                       |
| POST   | `/api/orders`                 | ✓    | Place order                      |
| GET    | `/api/orders`                 | ✓    | Order history                    |
| GET    | `/api/orders/:id`             | ✓    | Order detail                     |
| GET    | `/api/user/profile`           | ✓    | Profile + addresses              |
| PATCH  | `/api/user/profile`           | ✓    | Update name / email              |
| POST   | `/api/user/addresses`         | ✓    | Add address                      |
| POST   | `/api/contact`                | —    | Submit contact-form message      |

Auth header: `Authorization: Bearer <token>`.

## OTP behaviour

When `SMS_PROVIDER` is blank, generated OTPs are logged to the server console
(great for local dev). Wire up your SMS gateway inside `src/utils/sms.js`.

## Folder layout

```
vrs-backend/
├── server.js
└── src/
    ├── config/db.js
    ├── models/
    ├── routes/
    ├── controllers/
    ├── middleware/
    └── utils/
```
