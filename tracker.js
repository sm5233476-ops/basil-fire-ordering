// Phase G: Signature Order Success (Rubber Stamp Seal 1.6->1, Check Draw & Ember Timer Ring)
window.App = window.App || {};

App.register("tracker", {
  init() {
    this.activeOrder = null;

    // Clean up any lingering floating chip
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
    this.renderTrackerContent(true);
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

  renderTrackerContent(isEntrance = false) {
    const root = App.qs("#tracker-root");
    if (!root || !this.activeOrder) return;

    const order = this.activeOrder;
    const currentStepIdx = this.getStatusIndex(order.status);

    const steps = [
      { id: "new", label: "Received", icon: "📋" },
      { id: "preparing", label: "Preparing", icon: "🔥" },
      { id: "ready", label: "Ready", icon: "🍽️" },
      { id: "completed", label: "Served", icon: "✨" }
    ];

    const progressPercent = Math.min(100, Math.round((currentStepIdx / 3) * 100));

    root.innerHTML = `
      <div class="sheet-backdrop" id="tracker-backdrop"></div>
      <div class="sheet sheet--tracker" id="tracker-sheet-container" data-theme="oven" role="dialog" aria-label="Order Status">
        <div class="sheet__handle" aria-hidden="true"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <div>
              <h2 class="sheet__title">Order Confirmed</h2>
              <span class="label" style="color:var(--gold-400);">${order.timeLabel || "Dine-In"}</span>
            </div>
            <button type="button" class="sheet__close-btn" id="tracker-close-btn" aria-label="Close">✕</button>
          </div>
        </div>

        <div class="sheet__scroll-content tracker-content">
          
          <!-- Signature Moment 5: Rubber Stamp Seal & Check Draw -->
          <div class="tracker-header">
            <div class="success-seal-stage">
              <div class="success-stamp-seal" id="success-stamp-seal">
                <svg class="stamp-svg" viewBox="0 0 64 64" width="76" height="76" aria-hidden="true">
                  <circle class="stamp-ring-circle" cx="32" cy="32" r="28" fill="none" stroke="var(--ember-500)" stroke-width="3"/>
                  <path class="stamp-check-path" fill="none" d="M19 33l9 9 18-18" stroke="var(--flour-50)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="tracker-info-stagger" id="tracker-info-stagger">
              <span class="label tracker-confirmed-tag">Sent to Wood-Fired Oven</span>
              <h3 class="tracker-order-id display">${order.id}</h3>
              
              <!-- Looping Ember Timer Ring around ETA -->
              <div class="tracker-eta-badge-wrap">
                <svg class="eta-timer-ring-svg" viewBox="0 0 120 40" aria-hidden="true">
                  <rect x="2" y="2" width="116" height="36" rx="18" fill="none" stroke="var(--ember-500)" stroke-width="1.5" stroke-dasharray="12 6" class="timer-ring-rect"/>
                </svg>
                <div class="tracker-eta-line">
                  <span>Status: <strong>${order.timeLabel || "Dine-In Table Order"}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Live 4-Step Progress Track -->
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
                      ${isCurrent ? `<span class="step-pulse-ring" aria-hidden="true"></span>` : ""}
                      <span class="step-icon" aria-hidden="true">${st.icon}</span>
                    </div>
                    <span class="step-title label">${st.label}</span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Order Summary Card -->
          <div class="tracker-items-box">
            <h4 class="tracker-items-head label">Order Details (${order.customer?.address || "Table Order"})</h4>
            <div class="tracker-items-list">
              ${order.lines.map((l) => {
                const optText = l.options ? Object.values(l.options).flat().filter(Boolean).join(", ") : "";
                return `
                  <div class="tracker-item-row">
                    <div>
                      <strong>${l.qty}x ${l.name}</strong>
                      ${optText ? `<div class="tracker-item-opts">${optText}</div>` : ""}
                      ${l.notes ? `<div class="tracker-item-notes">“${App.escape ? App.escape(l.notes) : l.notes}”</div>` : ""}
                    </div>
                    <span class="price">${App.money.format((l.unitPriceCents || l.priceCents) * l.qty)}</span>
                  </div>
                `;
              }).join("")}
            </div>

            <div class="tracker-totals-block">
              <div class="tracker-total-line"><span>Subtotal:</span> <span class="price">${App.money.format(order.subtotal)}</span></div>
              ${order.discount > 0 ? `<div class="tracker-total-line tracker-total-line--disc"><span>Discount (WELCOME10):</span> <span class="price">-${App.money.format(order.discount)}</span></div>` : ""}
              <div class="tracker-total-line"><span>Service:</span> <span>Dine-In (Table)</span></div>
              <div class="tracker-total-line"><span>Tax (8%):</span> <span class="price">${App.money.format(order.tax)}</span></div>
              <div class="tracker-total-line tracker-total-line--grand"><span>Total Due:</span> <span class="price">${App.money.format(order.total)}</span></div>
            </div>
          </div>

          <!-- Actions -->
          <div class="tracker-actions">
            <button type="button" class="btn btn--primary" id="btn-back-menu" style="width:100%;">
              Back to Menu
            </button>
            <button type="button" class="btn btn--ghost" id="btn-order-again" style="width:100%;">
              🔁 Order Again
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

    if (isEntrance) {
      this.playSuccessAnimation();
    }
  },

  // Signature Moment 5 Animation Sequence (≈ 2s, then stable)
  playSuccessAnimation() {
    if (App.prefersReducedMotion() || !window.gsap) return;

    const seal = App.qs("#success-stamp-seal");
    const ring = App.qs(".stamp-ring-circle");
    const check = App.qs(".stamp-check-path");
    const infoStagger = App.qs("#tracker-info-stagger");

    const tl = gsap.timeline();

    // 1. Rubber stamp drop: scales 1.6 -> 1, rotate -14° -> 0 (600ms, back.out(2))
    if (seal) {
      tl.fromTo(
        seal,
        { scale: 1.6, rotate: -14, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" },
        0
      );
    }

    // 2. Stroke check inside draws (500ms) & ring fills (700ms)
    if (check && check.getTotalLength) {
      const checkLen = check.getTotalLength();
      gsap.set(check, { strokeDasharray: checkLen, strokeDashoffset: checkLen });
      tl.to(check, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, 0.4);
    }

    if (ring && ring.getTotalLength) {
      const ringLen = ring.getTotalLength();
      gsap.set(ring, { strokeDasharray: ringLen, strokeDashoffset: ringLen });
      tl.to(ring, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, 0.2);
    }

    // 3. Staggered fade-rise of order details
    if (infoStagger) {
      tl.fromTo(
        infoStagger.children,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power2.out" },
        0.6
      );
    }
  },

  closeTrackerSheet() {
    const root = App.qs("#tracker-root");
    if (!root) return;

    const sheetEl = App.qs("#tracker-sheet-container", root);
    const backdropEl = App.qs("#tracker-backdrop", root);

    if (window.gsap && !App.prefersReducedMotion() && sheetEl) {
      gsap.to(backdropEl, { opacity: 0, duration: 0.25 });
      gsap.to(sheetEl, {
        y: "100%",
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          root.classList.remove("is-active");
          root.innerHTML = "";
          document.body.classList.remove("is-locked");
        }
      });
    } else {
      root.classList.remove("is-active");
      root.innerHTML = "";
      document.body.classList.remove("is-locked");
    }
  }
});
