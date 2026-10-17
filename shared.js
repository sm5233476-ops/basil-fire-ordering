// Universal Dine-In Engine, Unified 24px SVG Icon System & Reusable Photo Renderer
window.App = window.App || {};
window.App.register = window.App.register || function (name, api) {
  (window.App._modules = window.App._modules || {})[name] = api;
};

// 1. Unified 24px SVG Icon Set (Stroke 1.75, Round Caps/Joins, No Emojis)
App.icons = {
  cart: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  plus: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  minus: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>`,
  trash: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>`,
  check: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`,
  close: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  menu: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  arrowRight: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
  arrowDown: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>`,
  flame: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2C8 7 5 11 5 15a7 7 0 0 0 14 0c0-4-3-8-7-13z"/><path d="M12 8c-2 2.5-3.5 4.5-3.5 7a3.5 3.5 0 0 0 7 0c0-2.5-1.5-4.5-3.5-7z"/></svg>`,
  leaf: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  pepper: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  clock: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  mapPin: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  phone: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  chevron: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`,
  info: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  alert: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`,
  utensils: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2v20M14 2v6a4 4 0 0 0 4 4v10M6 2v8a4 4 0 0 0 4 4v8M6 2v6M10 2v6"/></svg>`,
  lock: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  refresh: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  qrCode: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  settings: (cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

// 2. Reusable Photo Component Helper (Aspect Ratio, Fade-in, Fraunces Gradient Fallback)
App.renderPhoto = function (src, alt, fallbackName, options = {}) {
  const aspect = options.aspect || "4/5";
  const isEager = options.eager || false;
  const escapedName = App.escape ? App.escape(fallbackName) : fallbackName;
  const idAttr = options.id ? `id="${options.id}"` : "";

  return `
    <div class="photo-frame" style="aspect-ratio: ${aspect};" ${idAttr}>
      ${src ? `
        <div class="media-skeleton skeleton"></div>
        <img 
          src="${src}" 
          alt="${alt}" 
          class="photo-img photo-grade" 
          width="${options.width || 400}" 
          height="${options.height || 500}"
          loading="${isEager ? "eager" : "lazy"}" 
          decoding="async"
          ${isEager ? 'fetchpriority="high"' : ""}
          onload="this.classList.add('is-loaded'); const s=this.previousElementSibling; if(s) s.remove();"
          onerror="if(!this.dataset.retry){ this.dataset.retry='1'; this.src='${src.includes('/') ? src.split('/').pop() : src}'; } else { this.style.display='none'; const s=this.previousElementSibling; if(s) s.remove(); this.nextElementSibling.style.display='flex'; }"
        >
      ` : ""}
      <div class="photo-fallback-disc" style="${src ? "display:none;" : "display:flex;"}" aria-hidden="true">
        <span class="photo-fallback-brand font-display">${escapedName}</span>
      </div>
      <div class="photo-warm-overlay" aria-hidden="true"></div>
    </div>
  `;
};

// 3. Safe LocalStorage Wrapper
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

// 4. Pure Dine-In Financial Rules (Zero delivery fee, 8% tax)
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

// 5. Cart Store
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

// 6. Multi-Device Real-Time Cloud Relay
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
