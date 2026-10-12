// Storage, Currency, Calculations, Cart Store & Orders Sync
window.App = window.App || {};
window.App.register = window.App.register || function (name, api) {
  (window.App._modules = window.App._modules || {})[name] = api;
};

// 1. Safe LocalStorage Wrapper
App.storage = {
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.warn(`[Storage] Read error for "${key}":`, e);
      return fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.warn(`[Storage] Write error for "${key}":`, e);
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[Storage] Remove error for "${key}":`, e);
      return false;
    }
  }
};

// 2. Money Formatting and Calculation Rules
App.money = {
  format(cents) {
    const val = typeof cents === "number" ? cents / 100 : 0;
    return new Intl.NumberFormat(window.CONFIG.locale || "en-US", {
      style: "currency",
      currency: window.CONFIG.currency || "USD"
    }).format(val);
  },

  calcTotals({ lines = [], mode = "delivery", promoCode = "" }) {
    const subtotal = lines.reduce((acc, line) => {
      let unit = line.priceCents || 0;
      if (typeof line.unitPriceCents === "number") {
        unit = line.unitPriceCents;
      } else if (line.options) {
        if (typeof line.options.sizeDelta === "number") unit += line.options.sizeDelta;
        if (typeof line.options.crustDelta === "number") unit += line.options.crustDelta;
        if (Array.isArray(line.options.extrasDeltas)) {
          unit += line.options.extrasDeltas.reduce((a, b) => a + b, 0);
        }
      }
      const qty = Math.max(1, Math.min(20, line.qty || 1));
      return acc + (unit * qty);
    }, 0);

    const isPromoValid = Boolean(
      promoCode &&
      promoCode.trim().toUpperCase() === (window.CONFIG.promo?.code || "WELCOME10").toUpperCase()
    );

    const discount = isPromoValid
      ? Math.round(subtotal * ((window.CONFIG.promo?.percent || 10) / 100))
      : 0;

    const netSubtotal = Math.max(0, subtotal - discount);

    let deliveryFee = 0;
    let deliveryBlocked = false;
    let deliveryShortfall = 0;
    let deliveryMessage = "";

    if (mode === "delivery") {
      if (netSubtotal < window.CONFIG.minDeliveryCents) {
        deliveryBlocked = true;
        deliveryShortfall = window.CONFIG.minDeliveryCents - netSubtotal;
        deliveryMessage = `Add ${App.money.format(deliveryShortfall)} more for delivery`;
      }
      if (netSubtotal >= window.CONFIG.freeDeliveryOverCents) {
        deliveryFee = 0;
      } else {
        deliveryFee = window.CONFIG.deliveryFeeCents;
      }
    } else {
      deliveryFee = 0;
    }

    const tax = Math.round(netSubtotal * window.CONFIG.taxRate);
    const total = netSubtotal + (deliveryBlocked ? 0 : deliveryFee) + tax;

    return {
      subtotal,
      discount,
      netSubtotal,
      deliveryFee,
      deliveryBlocked,
      deliveryShortfall,
      deliveryMessage,
      tax,
      total,
      isPromoValid
    };
  }
};

// 3. Persistent Cart Store
const CART_STORAGE_KEY = "bf_cart_v1";
const cartSubscribers = new Set();

function notifyCartSubscribers() {
  const lines = App.cart.getLines();
  cartSubscribers.forEach((cb) => {
    try { cb(lines); } catch (e) { console.error("[Cart] Subscriber error:", e); }
  });
  if (App.emit) App.emit("cart:updated", lines);
}

App.cart = {
  getLines() {
    const raw = App.storage.get(CART_STORAGE_KEY, []) || [];
    const validItems = new Map((window.MENU?.items || []).map((i) => [i.id, i]));
    return raw.filter((line) => {
      if (!line || !line.itemId || !validItems.has(line.itemId)) return false;
      line.qty = Math.max(1, Math.min(20, parseInt(line.qty, 10) || 1));
      return true;
    });
  },

  setLines(lines) {
    App.storage.set(CART_STORAGE_KEY, lines);
    notifyCartSubscribers();
  },

  add(item) {
    const lines = this.getLines();
    const optKey = item.optionsKey || "default";
    const key = `${item.itemId}__${optKey}__${(item.notes || "").trim()}`;

    const existingIdx = lines.findIndex((l) => l.key === key);
    if (existingIdx > -1) {
      lines[existingIdx].qty = Math.min(20, lines[existingIdx].qty + (item.qty || 1));
    } else {
      lines.push({
        ...item,
        key,
        qty: Math.max(1, Math.min(20, item.qty || 1))
      });
    }

    this.setLines(lines);
    return lines;
  },

  update(key, newQty) {
    let lines = this.getLines();
    if (newQty <= 0) {
      lines = lines.filter((l) => l.key !== key);
    } else {
      const target = lines.find((l) => l.key === key);
      if (target) {
        target.qty = Math.max(1, Math.min(20, newQty));
      }
    }
    this.setLines(lines);
    return lines;
  },

  remove(key) {
    return this.update(key, 0);
  },

  clear() {
    this.setLines([]);
  },

  subscribe(callback) {
    cartSubscribers.add(callback);
    return () => cartSubscribers.delete(callback);
  },

  getCount() {
    return this.getLines().reduce((sum, item) => sum + (item.qty || 0), 0);
  },

  getItemQty(itemId) {
    return this.getLines()
      .filter((l) => l.itemId === itemId)
      .reduce((sum, l) => sum + l.qty, 0);
  }
};

// 4. Orders Sync with BroadcastChannel and Fallback
const CHANNEL_NAME = "bf-orders";
let channel = null;
try {
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  channel = null;
}

const orderSubscribers = new Set();
function notifyOrderSubscribers(eventData) {
  orderSubscribers.forEach((cb) => {
    try { cb(eventData); } catch (err) { console.error("[Orders Sync] Subscriber error:", err); }
  });
}

if (channel) {
  channel.onmessage = (event) => notifyOrderSubscribers(event.data);
}

window.addEventListener("storage", (event) => {
  if (event.key === "bf_orders_v1") {
    notifyOrderSubscribers({ type: "sync", orders: App.storage.get("bf_orders_v1", []) });
  }
});

App.orders = {
  list() {
    return App.storage.get("bf_orders_v1", []) || [];
  },

  create(orderData) {
    const orders = this.list();
    const id = `BF-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      ...orderData,
      id,
      createdAt: Date.now(),
      status: "new"
    };

    orders.unshift(newOrder);
    App.storage.set("bf_orders_v1", orders);
    App.storage.set("bf_active_order", id);

    const message = { type: "created", order: newOrder };
    if (channel) channel.postMessage(message);
    notifyOrderSubscribers(message);
    if (App.emit) App.emit("order:created", newOrder);

    return newOrder;
  },

  updateStatus(id, newStatus) {
    const orders = this.list();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;

    orders[idx].status = newStatus;
    orders[idx].updatedAt = Date.now();
    App.storage.set("bf_orders_v1", orders);

    const message = { type: "updated", order: orders[idx] };
    if (channel) channel.postMessage(message);
    notifyOrderSubscribers(message);
    if (App.emit) App.emit("order:updated", orders[idx]);

    return orders[idx];
  },

  subscribe(callback) {
    orderSubscribers.add(callback);
    return () => orderSubscribers.delete(callback);
  }
};

// 5. Console Tests for Pricing Scenarios
window.__testMoney = function () {
  console.group("%c[Basil & Fire] Money Verification Tests", "color:#8BD18F; font-weight:bold; font-size:12px;");

  const s1 = App.money.calcTotals({
    lines: [{ unitPriceCents: 1700, qty: 2 }, { unitPriceCents: 700, qty: 1 }],
    mode: "delivery",
    promoCode: ""
  });
  const p1 = s1.subtotal === 4100 && s1.deliveryFee === 0 && s1.tax === 328 && s1.total === 4428;
  console.log(`Test 1 (Delivery over $35, no promo): ${p1 ? "PASS" : "FAIL"}`, s1);

  const s2 = App.money.calcTotals({
    lines: [{ unitPriceCents: 1700, qty: 2 }, { unitPriceCents: 700, qty: 1 }],
    mode: "delivery",
    promoCode: "WELCOME10"
  });
  const p2 = s2.discount === 410 && s2.deliveryFee === 0 && s2.tax === 295 && s2.total === 3985;
  console.log(`Test 2 (Delivery with WELCOME10): ${p2 ? "PASS" : "FAIL"}`, s2);

  const s3 = App.money.calcTotals({
    lines: [{ unitPriceCents: 400, qty: 1 }],
    mode: "delivery"
  });
  const p3 = s3.deliveryBlocked === true && s3.deliveryMessage === "Add $6.00 more for delivery";
  console.log(`Test 3 (Delivery under minimum): ${p3 ? "PASS" : "FAIL"}`, s3);

  const s4 = App.money.calcTotals({
    lines: [{ unitPriceCents: 400, qty: 1 }],
    mode: "pickup"
  });
  const p4 = s4.subtotal === 400 && s4.deliveryFee === 0 && s4.tax === 32 && s4.total === 432;
  console.log(`Test 4 (Pickup 1 Lemonade): ${p4 ? "PASS" : "FAIL"}`, s4);

  const s5 = App.money.calcTotals({
    lines: [{ unitPriceCents: 600, qty: 1 }, { unitPriceCents: 400, qty: 1 }],
    mode: "delivery"
  });
  const p5 = s5.subtotal === 1000 && s5.deliveryFee === 350 && s5.tax === 80 && s5.total === 1430;
  console.log(`Test 5 (Delivery exact min $10): ${p5 ? "PASS" : "FAIL"}`, s5);

  const allPass = p1 && p2 && p3 && p4 && p5;
  console.log(`%cFinal Result: ${allPass ? "ALL 5 TESTS PASSED" : "TESTS FAILED"}`, `color:${allPass ? "#8BD18F" : "#FF5A36"}; font-weight:bold; font-size:13px;`);
  console.groupEnd();
  return allPass;
};

App.register("shared", {
  init() {
    window.__testMoney();
  }
});
