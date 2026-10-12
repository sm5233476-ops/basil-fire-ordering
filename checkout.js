// Checkout Flow, Field Validation, Slot Selector, Order Submission & WhatsApp Link
window.App = window.App || {};

App.register("checkout", {
  init() {
    this.orderMode = App.storage.get("bf_order_mode", "delivery");
    this.timeType = "asap";
    this.selectedSlot = "";
    this.isSubmitting = false;

    if (App.on) {
      App.on("sheet:open", (target) => {
        if (target === "checkout") this.openCheckout();
      });
      App.on("mode:changed", (mode) => {
        this.orderMode = mode;
      });
    }
  },

  getAvailableSlots() {
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();

    return window.CONFIG.scheduleSlots.map((slot) => {
      const [h, m] = slot.split(":").map(Number);
      const slotMin = h * 60 + m;
      // Disabled if past today + 15 min buffer
      const isPast = slotMin <= curMin + 15;
      return { slot, isPast };
    });
  },

  openCheckout() {
    const root = App.qs("#checkout-sheet-root");
    if (!root) return;

    this.orderMode = App.storage.get("bf_order_mode", "delivery");
    const promoCode = App.storage.get("bf_promo_code", "");
    const totals = App.money.calcTotals({
      lines: App.cart.getLines(),
      mode: this.orderMode,
      promoCode
    });

    if (totals.deliveryBlocked) {
      alert(totals.deliveryMessage);
      return;
    }

    root.classList.add("is-active");
    document.body.classList.add("is-locked");

    const slots = this.getAvailableSlots();
    const firstActiveSlot = slots.find((s) => !s.isPast)?.slot || "Tomorrow 11:30";
    if (!this.selectedSlot) this.selectedSlot = firstActiveSlot;

    const etaText = this.orderMode === "delivery" ? window.CONFIG.etaDelivery : window.CONFIG.etaPickup;

    root.innerHTML = `
      <div class="sheet-backdrop" id="checkout-backdrop"></div>
      <div class="sheet sheet--checkout" id="checkout-sheet-container" role="dialog" aria-label="Checkout">
        <div class="sheet__handle"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <h2 class="sheet__title">Checkout</h2>
            <button type="button" class="sheet__close-btn" id="checkout-close-btn" aria-label="Close checkout">✕</button>
          </div>
        </div>

        <form class="sheet__scroll-content checkout-form" id="checkout-form" novalidate>
          <!-- 1. Order Type Sync -->
          <div class="checkout-section">
            <label class="checkout-label">Order Type</label>
            <div class="segmented-control segmented-control--full">
              <button type="button" class="seg-btn ${this.orderMode === "delivery" ? "is-active" : ""}" data-co-mode="delivery">
                Delivery (${window.CONFIG.etaDelivery})
              </button>
              <button type="button" class="seg-btn ${this.orderMode === "pickup" ? "is-active" : ""}" data-co-mode="pickup">
                Pickup (${window.CONFIG.etaPickup})
              </button>
            </div>
          </div>

          <!-- 2. Contact Info -->
          <div class="checkout-section">
            <label class="checkout-label">Contact Details</label>
            <div class="form-group">
              <input type="text" id="cust-name" class="form-input" placeholder="Your Full Name *" required>
              <span class="field-error" id="err-name"></span>
            </div>
            <div class="form-group">
              <input type="tel" id="cust-phone" class="form-input" placeholder="Phone Number (e.g. 9876543210) *" required>
              <span class="field-error" id="err-phone"></span>
            </div>
          </div>

          <!-- 3. Delivery Address (Delivery Mode Only) -->
          <div class="checkout-section ${this.orderMode === "pickup" ? "is-hidden" : ""}" id="address-section">
            <label class="checkout-label">Delivery Address</label>
            <div class="form-group">
              <input type="text" id="cust-street" class="form-input" placeholder="Street Address *" ${this.orderMode === "delivery" ? "required" : ""}>
              <span class="field-error" id="err-street"></span>
            </div>
            <div class="form-group">
              <input type="text" id="cust-apt" class="form-input" placeholder="Apt, Suite, Floor (Optional)">
            </div>
            <div class="form-group">
              <textarea id="cust-notes" class="form-input form-textarea" rows="2" placeholder="Delivery instructions (e.g. Leave at front door)"></textarea>
            </div>
          </div>

          <!-- 4. Timing Selector -->
          <div class="checkout-section">
            <label class="checkout-label">Fulfillment Time</label>
            <div class="time-chips-grid">
              <button type="button" class="time-chip ${this.timeType === "asap" ? "is-active" : ""}" data-time-type="asap">
                ⚡ ASAP (${etaText})
              </button>
              <button type="button" class="time-chip ${this.timeType === "scheduled" ? "is-active" : ""}" data-time-type="scheduled">
                🕒 Schedule for Later
              </button>
            </div>

            <div class="slots-container ${this.timeType !== "scheduled" ? "is-hidden" : ""}" id="slots-picker">
              <p class="slots-hint">Select a pickup/delivery time today:</p>
              <div class="slots-grid">
                ${slots.map((s) => `
                  <button 
                    type="button" 
                    class="slot-btn ${s.isPast ? "is-disabled" : ""} ${this.selectedSlot === s.slot ? "is-active" : ""}"
                    data-slot="${s.slot}"
                    ${s.isPast ? "disabled" : ""}
                  >
                    ${s.slot}
                  </button>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- 5. Payment Notice -->
          <div class="checkout-section">
            <label class="checkout-label">Payment Method</label>
            <div class="payment-badge">
              <span class="payment-icon">💵</span>
              <div class="payment-info">
                <strong>Pay on Delivery or Pickup</strong>
                <p>Card machine or cash upon handover. No online card required.</p>
              </div>
            </div>
          </div>

          <!-- 6. Review Summary -->
          <div class="checkout-section checkout-review-box">
            <div class="review-row"><span>Items:</span> <span>${App.cart.getCount()}</span></div>
            <div class="review-row"><span>Subtotal:</span> <span>${App.money.format(totals.subtotal)}</span></div>
            ${totals.discount > 0 ? `<div class="review-row review-row--disc"><span>Discount:</span> <span>-${App.money.format(totals.discount)}</span></div>` : ""}
            <div class="review-row"><span>Delivery:</span> <span>${this.orderMode === "pickup" ? "Free" : totals.deliveryFee === 0 ? "FREE" : App.money.format(totals.deliveryFee)}</span></div>
            <div class="review-row"><span>Tax (8%):</span> <span>${App.money.format(totals.tax)}</span></div>
            <div class="review-row review-row--total"><span>Total to Pay:</span> <span>${App.money.format(totals.total)}</span></div>
          </div>

          <!-- 7. Action Buttons -->
          <div class="checkout-actions">
            <button type="button" class="btn btn--primary btn--order-place" id="btn-place-order">
              Place order · ${App.money.format(totals.total)}
            </button>
            <button type="button" class="btn btn--whatsapp" id="btn-order-whatsapp">
              <span class="wa-icon">💬</span> Send order on WhatsApp
            </button>
          </div>
        </form>
      </div>
    `;

    this.bindCheckoutEvents(root);
  },

  bindCheckoutEvents(root) {
    const form = App.qs("#checkout-form", root);
    const closeBtn = App.qs("#checkout-close-btn", root);
    const backdrop = App.qs("#checkout-backdrop", root);

    closeBtn?.addEventListener("click", () => this.closeCheckout());
    backdrop?.addEventListener("click", () => this.closeCheckout());

    // Toggle Order Mode inside Checkout
    root.querySelectorAll("[data-co-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.coMode;
        if (mode === this.orderMode) return;
        this.orderMode = mode;
        App.storage.set("bf_order_mode", mode);
        if (App.emit) App.emit("mode:changed", mode);
        this.openCheckout();
      });
    });

    // Time Selection
    root.querySelectorAll("[data-time-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.timeType = btn.dataset.timeType;
        root.querySelectorAll("[data-time-type]").forEach((b) => b.classList.toggle("is-active", b === btn));
        App.qs("#slots-picker", root)?.classList.toggle("is-hidden", this.timeType !== "scheduled");
      });
    });

    // Slots click
    root.querySelectorAll(".slot-btn:not(.is-disabled)").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedSlot = btn.dataset.slot;
        root.querySelectorAll(".slot-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      });
    });

    // Place Order Button
    App.qs("#btn-place-order", root)?.addEventListener("click", () => {
      this.handleOrderSubmission(false);
    });

    // WhatsApp Button
    App.qs("#btn-order-whatsapp", root)?.addEventListener("click", () => {
      this.handleOrderSubmission(true);
    });
  },

  validateForm() {
    let isValid = true;
    let firstInvalid = null;

    const nameInput = App.qs("#cust-name");
    const phoneInput = App.qs("#cust-phone");
    const streetInput = App.qs("#cust-street");

    const errName = App.qs("#err-name");
    const errPhone = App.qs("#err-phone");
    const errStreet = App.qs("#err-street");

    // Reset errors
    [nameInput, phoneInput, streetInput].forEach((el) => el?.classList.remove("is-invalid"));
    [errName, errPhone, errStreet].forEach((el) => { if (el) el.textContent = ""; });

    // Validate Name
    if (!nameInput?.value.trim() || nameInput.value.trim().length < 2) {
      isValid = false;
      nameInput.classList.add("is-invalid");
      errName.textContent = "Please enter your full name";
      if (!firstInvalid) firstInvalid = nameInput;
    }

    // Validate Phone (at least 8-10 digits)
    const digits = (phoneInput?.value || "").replace(/\D/g, "");
    if (digits.length < 8) {
      isValid = false;
      phoneInput.classList.add("is-invalid");
      errPhone.textContent = "Please enter a valid phone number";
      if (!firstInvalid) firstInvalid = phoneInput;
    }

    // Validate Street if delivery
    if (this.orderMode === "delivery") {
      if (!streetInput?.value.trim() || streetInput.value.trim().length < 4) {
        isValid = false;
        streetInput.classList.add("is-invalid");
        errStreet.textContent = "Please enter your delivery street address";
        if (!firstInvalid) firstInvalid = streetInput;
      }
    }

    if (!isValid && firstInvalid) {
      firstInvalid.focus();
      App.haptic(25);
    }

    return isValid;
  },

  handleOrderSubmission(isWhatsApp = false) {
    if (!this.validateForm() || this.isSubmitting) return;

    this.isSubmitting = true;
    const btnPlace = App.qs("#btn-place-order");
    const origText = btnPlace ? btnPlace.textContent : "";
    if (btnPlace) btnPlace.textContent = "Processing order...";

    const promoCode = App.storage.get("bf_promo_code", "");
    const totals = App.money.calcTotals({
      lines: App.cart.getLines(),
      mode: this.orderMode,
      promoCode
    });

    const nameVal = App.qs("#cust-name")?.value.trim();
    const phoneVal = App.qs("#cust-phone")?.value.trim();
    const streetVal = App.qs("#cust-street")?.value.trim() || "";
    const aptVal = App.qs("#cust-apt")?.value.trim() || "";
    const notesVal = App.qs("#cust-notes")?.value.trim() || "";

    const fullAddress = this.orderMode === "delivery"
      ? `${streetVal}${aptVal ? ", " + aptVal : ""}`
      : "Pickup at Kitchen";

    const timeLabel = this.timeType === "asap"
      ? `ASAP (${this.orderMode === "delivery" ? window.CONFIG.etaDelivery : window.CONFIG.etaPickup})`
      : `Scheduled: ${this.selectedSlot}`;

    const orderData = {
      mode: this.orderMode,
      timeLabel,
      customer: {
        name: nameVal,
        phone: phoneVal,
        address: fullAddress
      },
      lines: App.cart.getLines(),
      subtotal: totals.subtotal,
      discount: totals.discount,
      promoCode,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      total: totals.total,
      notes: notesVal
    };

    // Create Order through Orders API
    const newOrder = App.orders.create(orderData);
    App.cart.clear();

    if (isWhatsApp) {
      this.openWhatsAppLink(newOrder);
    }

    this.isSubmitting = false;
    this.closeCheckout();
    this.showConfirmation(newOrder);
  },

  openWhatsAppLink(order) {
    let msg = `New order from ${window.CONFIG.name} (demo) - ${order.id}\n`;
    msg += `Mode: ${order.mode.toUpperCase()}\n`;
    msg += `Time: ${order.timeLabel}\n`;
    msg += `Name: ${order.customer.name}\n`;
    msg += `Phone: ${order.customer.phone}\n`;
    if (order.mode === "delivery") msg += `Address: ${order.customer.address}\n`;

    msg += `\nItems:\n`;
    order.lines.forEach((l) => {
      const opts = [];
      if (l.options?.size) opts.push(l.options.size);
      if (l.options?.crust) opts.push(l.options.crust);
      if (l.options?.extras?.length) opts.push(l.options.extras.join(", "));
      const optStr = opts.length ? ` (${opts.join(", ")})` : "";
      msg += `- ${l.qty}x ${l.name}${optStr} - ${App.money.format((l.unitPriceCents || l.priceCents) * l.qty)}\n`;
    });

    msg += `\nSubtotal: ${App.money.format(order.subtotal)}\n`;
    if (order.discount > 0) msg += `Discount: -${App.money.format(order.discount)} (${order.promoCode})\n`;
    msg += `Delivery: ${App.money.format(order.deliveryFee)}\n`;
    msg += `Tax: ${App.money.format(order.tax)}\n`;
    msg += `Total: ${App.money.format(order.total)}\n`;
    if (order.notes) msg += `Notes: ${order.notes}\n`;

    const waNum = encodeURIComponent(window.CONFIG.whatsapp || "");
    const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  },

  showConfirmation(order) {
    const root = App.qs("#tracker-root");
    if (!root) return;

    root.classList.add("is-active");
    document.body.classList.add("is-locked");

    root.innerHTML = `
      <div class="sheet-backdrop"></div>
      <div class="sheet sheet--confirm">
        <div class="confirm-content">
          <div class="confirm-check-badge">✓</div>
          <h2 class="confirm-title">Order Placed!</h2>
          <p class="confirm-id">Order ID: <strong>${order.id}</strong></p>
          <p class="confirm-eta">Estimated Fulfillment: <span>${order.timeLabel}</span></p>

          <div class="confirm-summary">
            <div class="confirm-items-list">
              ${order.lines.map((l) => `
                <div class="confirm-item-row">
                  <span>${l.qty}x ${l.name}</span>
                  <span>${App.money.format((l.unitPriceCents || l.priceCents) * l.qty)}</span>
                </div>
              `).join("")}
            </div>
            <div class="confirm-total-row">
              <strong>Total Paid / Due:</strong>
              <strong>${App.money.format(order.total)}</strong>
            </div>
          </div>

          <div class="confirm-actions">
            <button type="button" class="btn btn--primary" id="confirm-back-btn" style="width:100%;">
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    `;

    App.qs("#confirm-back-btn", root)?.addEventListener("click", () => {
      root.classList.remove("is-active");
      root.innerHTML = "";
      document.body.classList.remove("is-locked");
    });
  },

  closeCheckout() {
    const root = App.qs("#checkout-sheet-root");
    if (!root) return;
    root.classList.remove("is-active");
    root.innerHTML = "";
    document.body.classList.remove("is-locked");
  }
});
