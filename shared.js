// Universal Multi-Device Cloud Sync Engine (Status Updates, Orders, PIN & Timing Sync)
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

// 2. Pure Dine-In Financial Rules (Zero delivery fee, 8% tax)
App.money = {
  format(cents) {
    const val = typeof cents === "number" ? cents / 100 : 0;
    return new Intl.NumberFormat(window.CONFIG.locale || "en-US", {
      style: "currency",
      currency: window.CONFIG.currency || "USD"
    }).format(val);
  },

  calcTotals({ lines = [], promoCode = "" }) {
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
    const tax = Math.round(netSubtotal * (window.CONFIG.taxRate || 0.08));
    const total = netSubtotal + tax;

    return {
      subtotal,
      discount,
      netSubtotal,
      deliveryFee: 0,
      deliveryBlocked: false,
      deliveryMessage: "",
      tax,
      total,
      isPromoValid
    };
  }
};

// 3. Cart Store
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

// 4. Multi-Device Real-Time Cloud Relay with Full State Convergence
const CLOUD_SYNC_TOPIC = "https://ntfy.sh/bf_kitchen_live_sync_shivam";
const orderSubscribers = new Set();

function notifyOrderSubscribers(eventData) {
  orderSubscribers.forEach((cb) => {
    try { cb(eventData); } catch (err) { console.error("[Orders Sync] Subscriber error:", err); }
  });
}

let channel = null;
try {
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel("bf-orders");
    channel.onmessage = (event) => notifyOrderSubscribers(event.data);
  }
} catch (e) {}

window.addEventListener("storage", (event) => {
  if (event.key === "bf_orders_v1") {
    notifyOrderSubscribers({ type: "sync", orders: App.storage.get("bf_orders_v1", []) });
  }
});

// Real-Time Cloud SSE Listener (Listens to orders, status, PIN & Timing changes)
try {
  if (typeof EventSource !== "undefined") {
    const sse = new EventSource(`${CLOUD_SYNC_TOPIC}/sse`);
    sse.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const payload = typeof raw.message === "string" ? JSON.parse(raw.message) : raw;

        if (payload.action === "create" && payload.order) {
          const orders = App.orders.list();
          if (!orders.some((o) => o.id === payload.order.id)) {
            orders.unshift(payload.order);
            App.storage.set("bf_orders_v1", orders);
            notifyOrderSubscribers({ type: "created", order: payload.order });
            if (App.emit) App.emit("order:created", payload.order);
          }
        } else if (payload.action === "update") {
          const orders = App.orders.list();
          const target = orders.find((o) => o.id === payload.id);
          if (target) {
            target.status = payload.status;
            if (payload.paymentSettled !== undefined) target.paymentSettled = payload.paymentSettled;
            App.storage.set("bf_orders_v1", orders);
            notifyOrderSubscribers({ type: "updated", order: target });
            if (App.emit) App.emit("order:updated", target);
          }
        } else if (payload.action === "archive") {
          const orders = App.orders.list().filter((o) => o.status !== "completed");
          App.storage.set("bf_orders_v1", orders);
          notifyOrderSubscribers({ type: "sync", orders });
        } else if (payload.action === "pin_change" && payload.pin) {
          App.storage.set("bf_custom_pin", payload.pin);
          if (App.emit) App.emit("pin:updated", payload.pin);
        } else if (payload.action === "timing_change" && payload.timing) {
          App.storage.set("bf_custom_timing", payload.timing);
          if (App.emit) App.emit("timing:updated", payload.timing);
        }
      } catch (err) {}
    };
  }
} catch (e) {}

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

    try {
      fetch(CLOUD_SYNC_TOPIC, {
        method: "POST",
        body: JSON.stringify({ action: "create", order: newOrder }),
        headers: { "Content-Type": "text/plain" }
      }).catch(() => {});
    } catch (e) {}

    return newOrder;
  },

  updateStatus(id, newStatus, paymentSettled) {
    const orders = this.list();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;

    orders[idx].status = newStatus;
    orders[idx].updatedAt = Date.now();
    if (paymentSettled !== undefined) orders[idx].paymentSettled = paymentSettled;

    App.storage.set("bf_orders_v1", orders);

    const message = { type: "updated", order: orders[idx] };
    if (channel) channel.postMessage(message);
    notifyOrderSubscribers(message);
    if (App.emit) App.emit("order:updated", orders[idx]);

    try {
      fetch(CLOUD_SYNC_TOPIC, {
        method: "POST",
        body: JSON.stringify({ action: "update", id, status: newStatus, paymentSettled: orders[idx].paymentSettled }),
        headers: { "Content-Type": "text/plain" }
      }).catch(() => {});
    } catch (e) {}

    return orders[idx];
  },

  archiveCompleted() {
    const orders = this.list().filter((o) => o.status !== "completed");
    App.storage.set("bf_orders_v1", orders);
    notifyOrderSubscribers({ type: "sync", orders });

    try {
      fetch(CLOUD_SYNC_TOPIC, {
        method: "POST",
        body: JSON.stringify({ action: "archive" }),
        headers: { "Content-Type": "text/plain" }
      }).catch(() => {});
    } catch (e) {}
  },

  broadcastPinChange(newPin) {
    App.storage.set("bf_custom_pin", newPin);
    try {
      fetch(CLOUD_SYNC_TOPIC, {
        method: "POST",
        body: JSON.stringify({ action: "pin_change", pin: newPin }),
        headers: { "Content-Type": "text/plain" }
      }).catch(() => {});
    } catch (e) {}
  },

  broadcastTimingChange(newTiming) {
    App.storage.set("bf_custom_timing", newTiming);
    try {
      fetch(CLOUD_SYNC_TOPIC, {
        method: "POST",
        body: JSON.stringify({ action: "timing_change", timing: newTiming }),
        headers: { "Content-Type": "text/plain" }
      }).catch(() => {});
    } catch (e) {}
  },

  async syncFromCloud() {
    try {
      const res = await fetch(`${CLOUD_SYNC_TOPIC}/json?poll=1&since=24h`);
      const text = (await res.text()).trim();
      if (!text) return;

      const lines = text.split("\n");
      let orders = this.list();
      let hasChanges = false;

      lines.forEach((line) => {
        try {
          const raw = JSON.parse(line);
          const payload = typeof raw.message === "string" ? JSON.parse(raw.message) : raw;

          if (payload.action === "create" && payload.order) {
            const idx = orders.findIndex((o) => o.id === payload.order.id);
            if (idx === -1) {
              orders.unshift(payload.order);
              hasChanges = true;
            }
          } else if (payload.action === "update" && payload.id) {
            const target = orders.find((o) => o.id === payload.id);
            if (target) {
              if (target.status !== payload.status || target.paymentSettled !== payload.paymentSettled) {
                target.status = payload.status;
                if (payload.paymentSettled !== undefined) target.paymentSettled = payload.paymentSettled;
                hasChanges = true;
              }
            }
          } else if (payload.action === "archive") {
            orders = orders.filter((o) => o.status !== "completed");
            hasChanges = true;
          } else if (payload.action === "pin_change" && payload.pin) {
            App.storage.set("bf_custom_pin", payload.pin);
          } else if (payload.action === "timing_change" && payload.timing) {
            App.storage.set("bf_custom_timing", payload.timing);
            if (App.emit) App.emit("timing:updated", payload.timing);
          }
        } catch (e) {}
      });

      if (hasChanges) {
        App.storage.set("bf_orders_v1", orders);
        notifyOrderSubscribers({ type: "sync", orders });
      }
    } catch (e) {}
  },

  subscribe(callback) {
    orderSubscribers.add(callback);
    return () => orderSubscribers.delete(callback);
  }
};

App.register("shared", {
  init() {
    if (App.orders && App.orders.syncFromCloud) {
      App.orders.syncFromCloud();
    }
  }
});
