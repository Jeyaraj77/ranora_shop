const fs = require("fs");
const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "ranorah.db");
const productsJsonPath = path.join(dataDir, "products.json");
const ordersJsonPath = path.join(dataDir, "orders.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(ordersJsonPath)) fs.writeFileSync(ordersJsonPath, "[]", "utf-8");

const defaultProducts = [
  {
    id: "RN001",
    name: "Royal Gold Necklace",
    category: "Necklace",
    price: 14999,
    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Traditional handcrafted necklace for festive occasions.",
    inStock: 12
  },
  {
    id: "RN002",
    name: "Pearl Drop Earrings",
    category: "Earrings",
    price: 3999,
    image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Elegant pearl earrings with lightweight comfort.",
    inStock: 20
  },
  {
    id: "RN003",
    name: "Classic Bridal Bangles",
    category: "Bangles",
    price: 6999,
    image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Premium polished bangles with timeless detailing.",
    inStock: 15
  },
  {
    id: "RN004",
    name: "Temple Coin Pendant",
    category: "Pendant",
    price: 5299,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Heritage-inspired pendant for daily and festive wear.",
    inStock: 10
  },
  {
    id: "RN005",
    name: "Floral Diamond Ring",
    category: "Rings",
    price: 8999,
    image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Modern floral ring design with subtle sparkle.",
    inStock: 8
  }
];

if (!fs.existsSync(productsJsonPath)) {
  fs.writeFileSync(productsJsonPath, JSON.stringify(defaultProducts, null, 2), "utf-8");
}

const db = new sqlite3.Database(dbPath);

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

async function initDb() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT NOT NULL,
      images TEXT,
      description TEXT,
      inStock INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Backward-compatible migration for older DBs created without images column.
  const columns = await dbAll("PRAGMA table_info(products)");
  const hasImagesColumn = columns.some((col) => col.name === "images");
  if (!hasImagesColumn) {
    await dbRun("ALTER TABLE products ADD COLUMN images TEXT");
  }
}

function loadProductsFromJson() {
  const raw = fs.readFileSync(productsJsonPath, "utf-8");
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    // Recover gracefully from accidentally wrapped PowerShell array format: [{ value: [...] }]
    if (parsed.length === 1 && parsed[0] && Array.isArray(parsed[0].value)) {
      return parsed[0].value;
    }
    return parsed;
  }

  if (parsed && Array.isArray(parsed.value)) {
    return parsed.value;
  }

  throw new Error("products.json must be an array");
}

function persistProductsToJson(products) {
  fs.writeFileSync(productsJsonPath, JSON.stringify(products, null, 2), "utf-8");
}

async function readProductsFromDb() {
  const rows = await dbAll("SELECT * FROM products ORDER BY name ASC");
  return rows.map((row) => {
    let images = [];
    try {
      if (row.images) images = JSON.parse(row.images);
    } catch (_error) {
      images = [];
    }
    if (!Array.isArray(images) || !images.length) {
      images = row.image ? [row.image] : [];
    }
    return {
      ...row,
      images,
      image: images[0] || row.image || ""
    };
  });
}

async function syncDbToProductsJson() {
  const products = await readProductsFromDb();
  persistProductsToJson(products);
}

async function syncProductsToDb() {
  const products = loadProductsFromJson();
  await dbRun("DELETE FROM products");
  for (const p of products) {
    const images = Array.isArray(p.images)
      ? p.images.filter(Boolean)
      : p.image
        ? [p.image]
        : [];
    await dbRun(
      `INSERT INTO products (id, name, category, price, image, images, description, inStock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(p.id),
        String(p.name),
        String(p.category || "Jewellery"),
        Number(p.price || 0),
        String(images[0] || p.image || ""),
        JSON.stringify(images),
        String(p.description || ""),
        Number(p.inStock || 0)
      ]
    );
  }
}

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/products", async (_req, res) => {
  try {
    const normalized = await readProductsFromDb();
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { customer, address, items, total, paymentRef } = req.body;
    if (!customer?.name || !customer?.phone || !address?.line1 || !items?.length) {
      return res.status(400).json({ error: "Missing required checkout fields" });
    }
    const normalizedItems = items.map((item) => ({
      id: String(item.id),
      qty: Number(item.qty || 0),
      name: String(item.name || ""),
      price: Number(item.price || 0)
    }));

    if (normalizedItems.some((item) => !item.id || item.qty <= 0)) {
      return res.status(400).json({ error: "Invalid item payload" });
    }

    await dbRun("BEGIN TRANSACTION");
    try {
      for (const item of normalizedItems) {
        const productRows = await dbAll("SELECT inStock, name FROM products WHERE id = ?", [item.id]);
        if (!productRows.length) {
          throw new Error(`Product not found: ${item.id}`);
        }
        const currentStock = Number(productRows[0].inStock || 0);
        if (currentStock < item.qty) {
          throw new Error(`Insufficient stock for ${productRows[0].name}`);
        }
      }

      for (const item of normalizedItems) {
        await dbRun(
          "UPDATE products SET inStock = CASE WHEN inStock - ? < 0 THEN 0 ELSE inStock - ? END WHERE id = ?",
          [item.qty, item.qty, item.id]
        );
      }
      await dbRun("COMMIT");
    } catch (stockError) {
      await dbRun("ROLLBACK");
      return res.status(400).json({ error: stockError.message || "Stock validation failed" });
    }

    const order = {
      id: `RNR-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer,
      address,
      items: normalizedItems,
      total,
      paymentRef: paymentRef || ""
    };

    const rawOrders = fs.readFileSync(ordersJsonPath, "utf-8");
    const orders = JSON.parse(rawOrders);
    orders.push(order);
    fs.writeFileSync(ordersJsonPath, JSON.stringify(orders, null, 2), "utf-8");
    await syncDbToProductsJson();

    res.json({ success: true, orderId: order.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to save order" });
  }
});

app.get("/api/orders", (_req, res) => {
  try {
    const rawOrders = fs.readFileSync(ordersJsonPath, "utf-8");
    const orders = JSON.parse(rawOrders);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to load orders" });
  }
});

app.post("/api/admin/products", async (req, res) => {
  try {
    let products = req.body?.products;
    if (!Array.isArray(products) && products && Array.isArray(products.value)) {
      products = products.value;
    }
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "products should be an array" });
    }
    persistProductsToJson(products);
    await syncProductsToDb();
    res.json({ success: true, message: "Products updated successfully" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to update products:", error);
    res.status(500).json({ error: "Failed to update products" });
  }
});

app.get("/admin/products-json", (_req, res) => {
  try {
    const raw = fs.readFileSync(productsJsonPath, "utf-8");
    res.type("application/json").send(raw);
  } catch (error) {
    res.status(500).json({ error: "Failed to load products JSON" });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initDb()
  .then(syncProductsToDb)
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Ranorah app running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Startup failed:", err);
    process.exit(1);
  });
