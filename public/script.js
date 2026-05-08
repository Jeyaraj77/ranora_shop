const WHATSAPP_NUMBER = "8637606850";
const currency = new Intl.NumberFormat("en-IN");
const API_BASE = window.API_BASE_URL ? String(window.API_BASE_URL).replace(/\/$/, "") : "";
const apiUrl = (path) => `${API_BASE}${path}`;

let savedCart = [];
try {
  const raw = localStorage.getItem("ranorah_cart");
  if (raw) savedCart = JSON.parse(raw);
  if (!Array.isArray(savedCart)) savedCart = [];
} catch (e) {
  savedCart = [];
}

const state = {
  products: [],
  cart: savedCart,
  activeCategory: "ALL"
};

const productGrid = document.getElementById("productGrid");
const filterTabs = document.getElementById("filterTabs");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutTotal = document.getElementById("checkoutTotal");
const cartItems = document.getElementById("cartItems");
const cartDialog = document.getElementById("cartDialog");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
const checkoutForm = document.getElementById("checkoutForm");
const productDialog = document.getElementById("productDialog");
const productDialogTitle = document.getElementById("productDialogTitle");
const productMainImage = document.getElementById("productMainImage");
const productThumbs = document.getElementById("productThumbs");
const productDialogDescription = document.getElementById("productDialogDescription");
const productDialogPrice = document.getElementById("productDialogPrice");
const closeProductBtn = document.getElementById("closeProductBtn");
const addFromProductBtn = document.getElementById("addFromProductBtn");
const waPreviewDialog = document.getElementById("waPreviewDialog");
const waPreviewText = document.getElementById("waPreviewText");
const cancelWaBtn = document.getElementById("cancelWaBtn");
const confirmWaBtn = document.getElementById("confirmWaBtn");
const chatWhatsappBtn = document.getElementById("chatWhatsappBtn");
const footerWhatsapp = document.getElementById("footerWhatsapp");

let pendingWhatsappUrl = "";
let selectedProductId = "";

function animateCartFeedback(buttonEl) {
  if (buttonEl) {
    buttonEl.classList.remove("added");
    void buttonEl.offsetWidth;
    buttonEl.classList.add("added");
  }
  cartCount.classList.remove("bump");
  void cartCount.offsetWidth;
  cartCount.classList.add("bump");
}

function saveCart() {
  localStorage.setItem("ranorah_cart", JSON.stringify(state.cart));
}

function totalAmount() {
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getProductById(productId) {
  return state.products.find((p) => String(p.id) === String(productId));
}

function categoryList() {
  const categories = [...new Set(state.products.map((p) => (p.category || "Jewellery").toUpperCase()))];
  return ["ALL", ...categories];
}

function filteredProducts() {
  if (state.activeCategory === "ALL") return state.products;
  return state.products.filter((p) => String(p.category || "").toUpperCase() === state.activeCategory);
}

function renderFilterTabs() {
  const tabs = categoryList();
  filterTabs.innerHTML = tabs
    .map(
      (tab) =>
        `<button class="filter-tab ${tab === state.activeCategory ? "active" : ""}" data-category="${tab}">${tab}</button>`
    )
    .join("");
}

function productCardHtml(p) {
  const cartItem = state.cart.find((item) => String(item.id) === String(p.id));
  const stock = Number(p.inStock || 0);
  const inCartQty = Number(cartItem?.qty || 0);
  const canIncrement = inCartQty < stock;
  const outOfStock = stock <= 0;
  let actionHtml = "";
  if (outOfStock) {
    actionHtml = `<p class="stock-line out">Out of stock</p>`;
  } else if (cartItem) {
    actionHtml = `<div class="qty-controls inline-qty">
        <button class="btn" data-cart-action="dec" data-product-id="${String(p.id)}">-</button>
        <span>${cartItem.qty}</span>
        <button class="btn" ${canIncrement ? "" : "disabled"} data-cart-action="inc" data-product-id="${String(p.id)}">+</button>
      </div>`;
  } else {
    actionHtml = `<button class="btn add-cart-btn" data-product-id="${String(p.id)}">Add to Cart</button>`;
  }
  return `
    <article class="product-card">
      <img src="${p.image}" alt="${p.name}" class="product-click" data-open-product="${String(p.id)}" />
      <div class="content">
        <h3 class="product-click" data-open-product="${String(p.id)}">${p.name}</h3>
        <p class="muted small">${(p.category || "Jewellery").toUpperCase()}</p>
        <p><strong>₹${currency.format(p.price)}</strong></p>
        <p class="stock-line ${stock <= 0 ? "out" : ""}">${stock <= 0 ? "Out of stock" : `${stock} in stock`}</p>
        ${actionHtml}
      </div>
    </article>`;
}

function renderProducts() {
  productGrid.innerHTML = filteredProducts().map(productCardHtml).join("");
}

function renderCart() {
  cartCount.textContent = state.cart.reduce((a, b) => a + b.qty, 0);
  const total = totalAmount();
  cartTotal.textContent = currency.format(total);
  checkoutTotal.textContent = currency.format(total);
  cartItems.innerHTML = state.cart.length
    ? state.cart
      .map(
        (item) => `
          <li class="cart-line">
            <div>
              <strong>${item.name}</strong><br />
              <small>₹${currency.format(item.price)} each</small><br />
              <small><strong>Subtotal: ₹${currency.format(item.qty * item.price)}</strong></small>
            </div>
            <div class="qty-controls">
              <button class="btn" data-cart-action="dec" data-product-id="${String(item.id)}">-</button>
              <span>${item.qty}</span>
              <button class="btn" data-cart-action="inc" data-product-id="${String(item.id)}">+</button>
              <button class="btn" data-cart-action="remove" data-product-id="${String(item.id)}">Remove</button>
            </div>
          </li>`
      )
      .join("")
    : "<li class='muted'>Cart is empty.</li>";
}

function addToCart(productId, sourceButton = null) {
  const normalizedId = String(productId);
  const product = getProductById(normalizedId);
  if (!product) return;
  const stock = Number(product.inStock || 0);
  if (stock <= 0) {
    alert("This product is out of stock.");
    return;
  }
  const existing = state.cart.find((item) => String(item.id) === normalizedId);
  if (existing) {
    if (existing.qty >= stock) {
      alert("Cannot add more than available stock.");
      return;
    }
    existing.qty += 1;
  }
  else state.cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  saveCart();
  renderCart();
  renderProducts();
  animateCartFeedback(sourceButton);
}

function updateCartItem(productId, action) {
  const normalizedId = String(productId);
  const idx = state.cart.findIndex((item) => String(item.id) === normalizedId);
  if (idx === -1) return;
  if (action === "inc") {
    const product = getProductById(normalizedId);
    const stock = Number(product?.inStock || 0);
    if (state.cart[idx].qty >= stock) {
      alert("Cannot add more than available stock.");
      return;
    }
    state.cart[idx].qty += 1;
  }
  if (action === "dec") state.cart[idx].qty -= 1;
  if (action === "remove" || state.cart[idx].qty <= 0) {
    state.cart.splice(idx, 1);
  }
  saveCart();
  renderCart();
  renderProducts();
}

function openProductDialog(productId) {
  const product = state.products.find((p) => String(p.id) === String(productId));
  if (!product) return;
  selectedProductId = String(product.id);
  const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image];
  productDialogTitle.textContent = product.name;
  productDialogDescription.textContent = product.description || "";
  productDialogPrice.textContent = currency.format(product.price);
  addFromProductBtn.disabled = Number(product.inStock || 0) <= 0;
  addFromProductBtn.textContent = Number(product.inStock || 0) <= 0 ? "Out of Stock" : "Add to Cart";
  productMainImage.src = images[0];
  productThumbs.innerHTML = images
    .map(
      (img, index) =>
        `<img src="${img}" alt="${product.name} photo ${index + 1}" class="${index === 0 ? "active" : ""}" data-thumb="${img}" />`
    )
    .join("");
  productDialog.showModal();
}

async function loadProducts() {
  try {
    const res = await fetch(apiUrl("/api/products"));
    if (!res.ok) throw new Error("Failed to load products");
    state.products = await res.json();
    if (!Array.isArray(state.products)) state.products = [];
  } catch (_error) {
    try {
      const fallback = await fetch("data/products.json");
      const fallbackProducts = await fallback.json();
      state.products = Array.isArray(fallbackProducts) ? fallbackProducts : [];
    } catch (_fallbackError) {
      state.products = [];
    }
  }
  state.cart = state.cart
    .map((item) => {
      const product = getProductById(item.id);
      if (!product) return null;
      const stock = Number(product.inStock || 0);
      if (stock <= 0) return null;
      return { ...item, qty: Math.min(Number(item.qty || 0), stock) };
    })
    .filter((item) => item && item.qty > 0);
  saveCart();
  renderFilterTabs();
  renderProducts();
}

let pendingOrderPayload = null;
let pendingOrderMsg = "";

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.cart.length) {
    alert("Cart is empty. Add products first.");
    return;
  }

  const formData = new FormData(checkoutForm);
  pendingOrderPayload = {
    customer: {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email")
    },
    address: {
      line1: formData.get("line1"),
      line2: formData.get("line2"),
      city: formData.get("city"),
      pincode: formData.get("pincode")
    },
    items: state.cart,
    total: totalAmount()
  };

  const itemsText = pendingOrderPayload.items
    .map((i) => {
      return `• ${i.name} (ID: ${i.id})\n   Qty: ${i.qty} | Subtotal: ₹${currency.format(i.price * i.qty)}`;
    })
    .join("\n\n");

  pendingOrderMsg = [
    `Hello Ranorah, I want to place an order.`,
    ``,
    `Customer Name: ${pendingOrderPayload.customer.name}`,
    `Phone: ${pendingOrderPayload.customer.phone}`,
    `Email: ${pendingOrderPayload.customer.email || "-"}`,
    ``,
    `Delivery Address:`,
    `${pendingOrderPayload.address.line1}`,
    `${pendingOrderPayload.address.line2 || ""}`,
    `${pendingOrderPayload.address.city} - ${pendingOrderPayload.address.pincode}`,
    ``,
    `Items:`,
    `${itemsText}`,
    ``,
    `Total: ₹${currency.format(pendingOrderPayload.total)}`
  ].join("\n");

  waPreviewText.value = pendingOrderMsg;
  waPreviewDialog.showModal();
});

openCartBtn.addEventListener("click", () => cartDialog.showModal());
closeCartBtn.addEventListener("click", () => cartDialog.close());
cartCheckoutBtn.addEventListener("click", () => {
  if (!state.cart.length) {
    alert("Cart is empty. Add products first.");
    return;
  }
  cartDialog.close();
  document.querySelector(".checkout-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const firstField = checkoutForm.querySelector("input[name='name']");
  if (firstField) firstField.focus({ preventScroll: true });
});
closeProductBtn.addEventListener("click", () => productDialog.close());
addFromProductBtn.addEventListener("click", () => {
  if (!selectedProductId) return;
  addToCart(selectedProductId, addFromProductBtn);
  productDialog.close();
});
cancelWaBtn.addEventListener("click", () => {
  waPreviewDialog.close();
  pendingOrderPayload = null;
});
productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-cart-btn");
  if (button) {
    const productId = button.dataset.productId;
    if (!productId) return;
    addToCart(productId, button);
    return;
  }
  const actionBtn = event.target.closest("[data-cart-action]");
  if (actionBtn) {
    updateCartItem(actionBtn.dataset.productId, actionBtn.dataset.cartAction);
    return;
  }
  const openEl = event.target.closest("[data-open-product]");
  if (openEl) {
    openProductDialog(openEl.dataset.openProduct);
  }
});

cartItems.addEventListener("click", (event) => {
  const actionBtn = event.target.closest("[data-cart-action]");
  if (!actionBtn) return;
  updateCartItem(actionBtn.dataset.productId, actionBtn.dataset.cartAction);
});

productThumbs.addEventListener("click", (event) => {
  const thumb = event.target.closest("[data-thumb]");
  if (!thumb) return;
  productMainImage.src = thumb.dataset.thumb;
  productThumbs.querySelectorAll("img").forEach((img) => img.classList.remove("active"));
  thumb.classList.add("active");
});

const paymentForm = document.getElementById("paymentForm");
paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!pendingOrderPayload) return;

  const confirmWaBtn = document.getElementById("confirmWaBtn");
  confirmWaBtn.disabled = true;
  confirmWaBtn.textContent = "Processing...";

  const formData = new FormData(paymentForm);
  pendingOrderPayload.paymentRef = formData.get("paymentRef");

  const screenshotFile = formData.get("paymentScreenshot");
  if (screenshotFile && screenshotFile.size > 0) {
    const reader = new FileReader();
    pendingOrderPayload.paymentScreenshot = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(screenshotFile);
    });
  }

  let orderId = `RNR-${Date.now()}`;
  try {
    const res = await fetch(apiUrl("/api/orders"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingOrderPayload)
    });
    if (!res.ok) {
      const errorPayload = await res.json().catch(() => ({}));
      throw new Error(errorPayload.error || "Failed to place order.");
    }
    const responseBody = await res.json();
    orderId = responseBody.orderId || orderId;
    await loadProducts();
  } catch (error) {
    alert(error.message || "Order failed.");
    confirmWaBtn.disabled = false;
    confirmWaBtn.textContent = "Confirm & Send to WhatsApp";
    return;
  }

  const finalMsg = pendingOrderMsg.replace(`Hello Ranorah, I want to place an order.`, `Hello Ranorah, I want to place an order.\n\nOrder ID: ${orderId}`) + `\n\nPayment Ref: ${pendingOrderPayload.paymentRef}`;
  
  if (screenshotFile && screenshotFile.size > 0 && navigator.clipboard && navigator.clipboard.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [screenshotFile.type]: screenshotFile
        })
      ]);
      alert("Payment screenshot copied to clipboard! Once WhatsApp opens, simply 'Paste' to attach the photo.");
    } catch (e) {
      console.warn("Clipboard write failed", e);
    }
  }

  pendingWhatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMsg)}`;
  window.location.href = pendingWhatsappUrl;

  confirmWaBtn.disabled = false;
  confirmWaBtn.textContent = "Confirm & Send to WhatsApp";
  waPreviewDialog.close();
  pendingOrderPayload = null;
  state.cart = [];
  saveCart();
  renderCart();
  renderProducts();
  checkoutForm.reset();
  paymentForm.reset();
});

filterTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-category]");
  if (!tab) return;
  state.activeCategory = tab.dataset.category;
  renderFilterTabs();
  renderProducts();
});

function setupWhatsappLinks() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}`;
  chatWhatsappBtn.href = url;
  footerWhatsapp.href = url;
}

setupWhatsappLinks();
loadProducts().then(renderCart);
