# Ranorah Jewellery Web App

Simple professional storefront with:

- Product listing with prices
- Add to cart (multiple products)
- Checkout form (customer + delivery address)
- GPay QR section
- WhatsApp order message to `9876543210`
- SQLite-backed product API
- Admin panel to add/edit/delete products
- Product image via URL or direct image upload

## Run

1. Install Node.js 18+ from [https://nodejs.org](https://nodejs.org)
2. In this folder run:
   - `npm install`
   - `npm start`
3. Open `http://localhost:3000`

## Admin Usage

- Open `http://localhost:3000/admin.html` (or `http://127.0.0.1:5500/admin.html` in Live Server)
- Admin password: `ranorah@123`
- Add product details from the form:
  - name, category, price, stock, description
  - image URL OR upload image from your computer
- Supports drag-and-drop image upload
- Edit/delete existing products
- Click **Save All Changes**
- This updates both:
  - `data/products.json`
  - SQLite table in `data/ranorah.db`

## Important Paths

- Frontend: `public/index.html`, `public/styles.css`, `public/script.js`
- Backend: `server.js`
- Products JSON: `data/products.json`
- Saved orders JSON: `data/orders.json`
- Assets: `public/assets/`

## WhatsApp Flow

- On **Buy on WhatsApp**, app saves order and opens:
  - `https://wa.me/9876543210?text=...`
- Message includes:
  - user details
  - delivery address
  - all cart items
  - combined total
  - payment reference/UTR
- Includes WhatsApp preview dialog before sending

## Orders Management

- Open `http://localhost:3000/orders.html`
- View all customer orders in one place
