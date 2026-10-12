// Confirmation Screen & Live Multi-Tab Tracker (Without Floating Pill)
window.App = window.App || {};

App.register("tracker", {
  init() {
    this.activeOrder = null;

    // Clean up any old floating pill if present in DOM
    const oldPill = document.getElementById("active-order-chip");
    if (oldPill) oldPill.remove();

    if (App.on) {
      App.on("order:created", (order) => this.show(order));
      App.on("order:updated", (order) => {
        if (this.activeOrder && this.activeOrder.id === order.id) {
          this.activeOrder = order;
          this.renderTrackerContent();
        }
      });
      App.on("sheet:open", (target) => {
        if (target === "tracker" && this.activeOrder) {
          this.openTrackerSheet();
        }
      });
    }

    if (App.orders && App.orders.subscribe) {
      App.orders.subscribe((event) => {
        if (!this.activeOrder) return;
        if (event.type === "updated" && event.order?.id === this.activeOrder.id) {
          this.activeOrder = event.order;
          this.renderTrackerContent();
        } else if (event.type === "sync") {
          const matched = (event.orders || []).find((o) => o.id === this.activeOrder.id);
          if (matched) {
            this.activeOrder = matched;
            this.renderTrackerContent();
          }
        }
      });
    }

    this.restoreActiveOrder();
  },

  restoreActiveOrder() {
    const activeId = App.storage.get("bf_active_order");
    if (!activeId) return;

    const orders = App.orders.list();
    const order = orders.find((o) => o.id === activeId);
    if (order) {
      this.activeOrder = order;
    }
  },

  show(order) {
    this.activeOrder = order;
    App.storage.set("bf_active_order", order.id);
    this.openTrackerSheet();
  },

  openTrackerSheet() {
    const root = App.qs("#tracker-root");
    if (!root || !this.activeOrder) return;

    root.classList.add("is-active");
    document.body.classList.add("is-locked");
    this.renderTrackerContent();
  },

  getStatusIndex(status) {
    switch (status) {
      case "new": return 0;
      case "preparing": return 1;
      case "ready": return 2;
      case "completed": return 3;
      default: return 0;
    }
  },

  renderTrackerContent() {
    const root = App.qs("#tracker-root");
    if (!root || !this.activeOrder) return;

    const order = this.activeOrder;
    const isDelivery = order.mode === "delivery";
    const currentStepIdx = this.getStatusIndex(order.status);

    const steps = [
      { id: "new", label: "Received", icon: "📋" },
      { id: "preparing", label: "Preparing", icon: "🔥" },
      { id: "ready", label: isDelivery ? "On the way" : "Ready", icon: isDelivery ? "🛵" : "🛍️" },
      { id: "completed", label: "Completed", icon: "✨" }
    ];

    const progressPercent = Math.min(100, Math.round((currentStepIdx / 3) * 100));

    root.innerHTML = `
      <div class="sheet-backdrop" id="tracker-backdrop"></div>
      <div class="sheet sheet--tracker" id="tracker-sheet-container" role="dialog" aria-label="Order Tracker">
        <div class="sheet__handle"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <h2 class="sheet__title">Order Status</h2>
            <button type="button" class="sheet__close-btn" id="tracker-close-btn" aria-label="Close">✕</button>
          </div>
        </div>

        <div class="sheet__scroll-content tracker-content">
          <div class="tracker-header">
            <div class="check-animation-wrap">
              <svg class="check-svg" viewBox="0 0 52 52" aria-hidden="true">
                <circle class="check-circle" cx="26" cy="26" r="24" fill="none"/>
                <path class="check-path" fill="none" d="M14 27l8 8 16-16"/>
              </svg>
            </div>
            <h3 class="tracker-order-id">${order.id}</h3>
            <p class="tracker-eta-line">
              Estimated: <strong>${order.timeLabel || (isDelivery ? window.CONFIG.etaDelivery : window.CONFIG.etaPickup)}</strong>
            </p>
          </div>

          <div class="tracker-steps-card">
            <div class="tracker-progress-track">
              <div class="tracker-progress-fill" style="width: ${progressPercent}%;"></div>
            </div>

            <div class="tracker-steps-grid">
              ${steps.map((st, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return `
                  <div class="tracker-step ${isPassed ? "is-passed" : ""} ${isCurrent ? "is-current" : ""}">
                    <div class="step-dot">
                      ${isCurrent ? `<span class="step-pulse-ring"></span>` : ""}
                      <span class="step-icon">${st.icon}</span>
                    </div>
                    <span class="step-title">${st.label}</span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="tracker-items-box">
            <h4 class="tracker-items-head">Order Details (${order.mode.toUpperCase()})</h4>
            <div class="tracker-items-list">
              ${order.lines.map((l) => {
                const optText = l.options ? Object.values(l.options).flat().filter(Boolean).join(", ") : "";
                return `
                  <div class="tracker-item-row">
                    <div>
                      <strong>${l.qty}x ${l.name}</strong>
                      ${optText ? `<div class="tracker-item-opts">${optText}</div>` : ""}
                      ${l.notes ? `<div class="tracker-item-notes">"${App.escape ? App.escape(l.notes) : l.notes}"</div>` : ""}
                    </div>
                    <span>${App.money.format((l.unitPriceCents || l.priceCents) * l.qty)}</span>
                  </div>
                `;
              }).join("")}
            </div>

            <div class="tracker-totals-block">
              <div class="tracker-total-line"><span>Subtotal:</span> <span>${App.money.format(order.subtotal)}</span></div>
              ${order.discount > 0 ? `<div class="tracker-total-line tracker-total-line--disc"><span>Discount:</span> <span>-${App.money.format(order.discount)}</span></div>` : ""}
              <div class="tracker-total-line"><span>Fulfillment:</span> <span>${order.deliveryFee === 0 ? "FREE" : App.money.format(order.deliveryFee)}</span></div>
              <div class="tracker-total-line"><span>Tax (8%):</span> <span>${App.money.format(order.tax)}</span></div>
              <div class="tracker-total-line tracker-total-line--grand"><span>Total:</span> <span>${App.money.format(order.total)}</span></div>
            </div>
          </div>

          <div class="tracker-actions">
            <button type="button" class="btn btn--primary" id="btn-order-again">
              🔁 Order Again
            </button>
            <button type="button" class="btn btn--ghost" id="btn-back-menu">
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    `;

    App.qs("#tracker-close-btn", root)?.addEventListener("click", () => this.closeTrackerSheet());
    App.qs("#tracker-backdrop", root)?.addEventListener("click", () => this.closeTrackerSheet());
    App.qs("#btn-back-menu", root)?.addEventListener("click", () => this.closeTrackerSheet());

    App.qs("#btn-order-again", root)?.addEventListener("click", () => {
      if (!order.lines || !order.lines.length) return;
      App.cart.clear();
      order.lines.forEach((line) => App.cart.add(line));
      this.closeTrackerSheet();
      if (App.emit) App.emit("sheet:open", "cart");
      App.haptic(15);
    });
  },

  closeTrackerSheet() {
    const root = App.qs("#tracker-root");
    if (!root) return;
    root.classList.remove("is-active");
    root.innerHTML = "";
    document.body.classList.remove("is-locked");
  }
});
