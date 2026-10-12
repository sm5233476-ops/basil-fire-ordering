// Checkout Flow, Inline Fulfillment Mode Selection & Table QR Integration
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
      const isPast = slotMin <= curMin + 15;
      return { slot, isPast };
    });
  },

  openCheckout() {
    const root = App.qs("#checkout-sheet-root");
    if (!root) return;

    this.orderMode = App.storage.get("bf_order_mode", "delivery");
    const tableNumber = App.storage.get("bf_table_num", null);
    const isTable = this.orderMode === "table" && Boolean(tableNumber);

    const promoCode = App.storage.get("bf_promo_code", "");
    const totals = App.money.calcTotals({
      lines: App.cart.getLines(),
      mode: this.orderMode,
      promoCode
    });

    if (totals.deliveryBlocked && !isTable) {
      alert(totals.deliveryMessage);
      return;
    }

    root.classList.add("is-active");
    document.body.classList.add("is-locked");

    const slots = this.getAvailableSlots();
    const firstActiveSlot = slots.find((s) => !s.isPast)?.slot || "Tomorrow 11:30";
    if (!this.selectedSlot) this.selectedSlot = firstActiveSlot;

    const etaText = isTable 
      ? "Served Directly to Your Table"
      : (this.orderMode === "delivery" ? window.CONFIG.etaDelivery : window.CONFIG.etaPickup);

    root.innerHTML = `
      <div class="sheet-backdrop" id="checkout-backdrop"></div>
      <div class="sheet sheet--checkout" id="checkout-sheet-container" role="dialog" aria-label="Checkout">
        <div class="sheet__handle"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <h2 class="sheet__title">Review & Place Order</h2>
            <button type="button" class="sheet__close-btn" id="checkout-close-btn" aria-label="Close checkout">✕</button>
          </div>
        </div>

        <form class="sheet__scroll-content checkout-form" id="checkout-form" novalidate>
          
          <!-- 1. Fulfillment Mode Selection -->
          <div class="checkout-section">
            <label class="checkout-label">Fulfillment Option</label>
            ${isTable ? `
              <div class="table-checkout-notice">
                <span class="table-icon">🍽️</span>
                <div>
                  <strong>Dine-In Service · Table #${tableNumber}</strong>
                  <p>Food will be brought directly to your table.</p>
                </div>
              </div>
            ` : `
              <div class="segmented-control segmented-control--full">
                <button type="button" class="seg-btn ${this.orderMode === "delivery" ? "is-active" : ""}" data-co-mode="delivery">
                  🛵 Delivery (${window.CONFIG.etaDelivery})
                </button>
                <button type="button" class="seg-btn ${this.orderMode === "pickup" ? "is-active" : ""}" data-co-mode="pickup">
                  🛍️ Pickup (${window.CONFIG.etaPickup})
                </button>
              </div>
            `}
          </div>

          <!-- 2. Contact Details -->
          <div class="checkout-section">
            <label class="checkout-label">${isTable ? "Your Name (For Server)" : "Contact Details"}</label>
            <div class="form-group">
              <input type="text" id="cust-name" class="form-input" placeholder="Your Name *" required>
              <span class="field-error" id="err-name"></span>
            </div>
            ${!isTable ? `
              <div class="form-group">
                <input type="tel" id="cust-phone" class="form-input" placeholder="Phone Number (e.g. 9876543210) *" required>
                <span class="field-error" id="err-phone"></span>
              </div>
            ` : ""}
          </div>

          <!-- 3. Delivery Address (ONLY shown if online Delivery mode) -->
          <div class="checkout-section ${this.orderMode !== "delivery" ? "is-hidden" : ""}" id="address-section">
            <label class="checkout-label">Delivery Destination</label>
            <div class="form-group">
              <input type="text" id="cust-street" class="form-input" placeholder="Street Address *" ${this.orderMode === "delivery" ? "required" : ""}>
              <span class="field-error" id="err-street"></span>
            </div>
            <div class="form-group">
              <input type="text" id="cust-apt" class="form-input" placeholder="Apt, Suite, Floor (Optional)">
            </div>
          </div>

          <!-- Special Request / Table Instructions -->
          <div class="checkout-section">
            <label class="checkout-label">${isTable ? "Kitchen Notes" : "Instructions"}</label>
            <div class="form-group">
              <textarea id="cust-notes" class="form-input form-textarea" rows="2" placeholder="${isTable ? 'e.g. Extra napkins, cutlery, less spicy...' : 'e.g. Leave at front door, ring doorbell...'}"></textarea>
            </div>
          </div>

          <!-- 4. Timing Selector (For Online Orders) -->
          ${!isTable ? `
            <div class="checkout-section">
              <label class="checkout-label">Preparation Timing</label>
              <div class="time-chips-grid">
                <button type="button" class="time-chip ${this.timeType === "asap" ? "is-active" : ""}" data-time-type="asap">
                  ⚡ ASAP (${etaText})
                </button>
                <button type="button" class="time-chip ${this.timeType === "scheduled" ? "is-active" : ""}" data-time-type="scheduled">
                  🕒 Schedule Later
                </button>
              </div>

              <div class="slots-container ${this.timeType !== "scheduled" ? "is-hidden" : ""}" id="slots-picker">
                <p class="slots-hint">Select a convenient slot today:</p>
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
          ` : ""}

          <!-- 5. Payment Notice -->
          <div class="checkout-section">
            <label class="checkout-label">Payment Method</label>
            <div class="payment-badge">
              <span class="payment-icon">💵</span>
              <div class="payment-info">
                <strong>${isTable ? "Pay at Table or Counter" : "Pay on Delivery or Pickup"}</strong>
                <p>${isTable ? "Pay cash or card to your server when meal arrives." : "Card machine or cash upon handover. No online advance needed."}</p>
              </div>
            </div>
          </div>

          <!-- 6. Review Summary -->
          <div class="checkout-section checkout-review-box">
            <div class="review-row"><span>Items:</span> <span>${App.cart.getCount()}</span></div>
            <div class="review-row"><span>Subtotal:</span> <span>${App.money.format(totals.subtotal)}</span></div>
            ${totals.discount > 0 ? `<div class="review-row review-row--disc"><span>Discount:</span> <span>-${App.money.format(totals.discount)}</span></div>` : ""}
            <div class="review-row"><span>Fulfillment:</span> <span>${this.orderMode === "delivery" ? (totals.deliveryFee === 0 ? "FREE" : App.money.format(totals.deliveryFee)) : "Free"}</span></div>
            <div class="review-row"><span>Tax (8%):</span> <span>${App.money.format(totals.tax)}</span></div>
            <div class="review-row review-row--total"><span>Total:</span> <span>${App.money.format(totals.total)}</span></div>
          </div>

          <!-- 7. Action Buttons -->
          <div class="checkout-actions">
            <button type="button" class="btn btn--primary btn--order-place" id="btn-place-order">
              Place order · ${App.money.format(totals.total)}
            </button>
            ${!isTable ? `
              <button type="button" class="btn btn--whatsapp" id="btn-order-whatsapp">
                <span class="wa-icon">💬</span> Send order on WhatsApp
              </button>
            ` : ""}
          </div>
        </form>
      </div>
    `;

    this.bindCheckoutEvents(root, isTable, tableNumber);
  },

  bindCheckoutEvents(root, isTable, tableNumber) {
    const closeBtn = App.qs("#checkout-close-btn", root);
    const backdrop = App.qs("#checkout-backdrop", root);

    closeBtn?.addEventListener("click", () => this.closeCheckout());
    backdrop?.addEventListener("click", () => this.closeCheckout());

    // Switch Delivery vs Pickup inside Checkout Sheet
    root.querySelectorAll("[data-co-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.coMode;
        if (mode === this.orderMode) return;
        this.orderMode = mode;
        App.storage.set("bf_order_mode", mode);
        if (App.emit) App.emit("mode:changed", mode);
        this.openCheckout(); // Re-render checkout with new mode
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

    // Slot click
    root.querySelectorAll(".slot-btn:not(.is-disabled)").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedSlot = btn.dataset.slot;
        root.querySelectorAll(".slot-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      });
    });

    // Place Order Button
    App.qs("#btn-place-order", root)?.addEventListener("click", () => {
      this.handleOrderSubmission(false, isTable, tableNumber);
    });

    // WhatsApp Button
    App.qs("#btn-order-whatsapp", root)?.addEventListener("click", () => {
      this.handleOrderSubmission(true, isTable, tableNumber);
    });
  },

  validateForm(isTable) {
    let isValid = true;
    let firstInvalid = null;

    const nameInput = App.qs("#cust-name");
    const phoneInput = App.qs("#cust-phone");
    const streetInput = App.qs("#cust-street");

    const errName = App.qs("#err-name");
    const errPhone = App.qs("#err-phone");
    const errStreet = App.qs("#err-street");

    [nameInput, phoneInput, streetInput].forEach((el) => el?.classList.remove("is-invalid"));
    [errName, errPhone, errStreet].forEach((el) => { if (el) el.textContent = ""; });

    // Validate Name
    if (!nameInput?.value.trim() || nameInput.value.trim().length < 2) {
      isValid = false;
      nameInput.classList.add("is-invalid");
      errName.textContent = "Please enter your name";
      if (!firstInvalid) firstInvalid = nameInput;
    }

    // If online order, validate phone
    if (!isTable && phoneInput) {
      const digits = (phoneInput.value || "").replace(/\D/g, "");
      if (digits.length < 8) {
        isValid = false;
        phoneInput.classList.add("is-invalid");
        errPhone.textContent = "Please enter a valid phone number";
        if (!firstInvalid) firstInvalid = phoneInput;
      }
    }

    // If online delivery, validate street
    if (this.orderMode === "delivery" && !isTable && streetInput) {
      if (!streetInput.value.trim() || streetInput.value.trim().length < 4) {
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

  handleOrderSubmission(isWhatsApp = false, isTable = false, tableNumber = null) {
    if (!this.validateForm(isTable) || this.isSubmitting) return;

    this.isSubmitting = true;
    const btnPlace = App.qs("#btn-place-order");
    if (btnPlace) btnPlace.textContent = "Processing order...";

    const promoCode = App.storage.get("bf_promo_code", "");
    const totals = App.money.calcTotals({
      lines: App.cart.getLines(),
      mode: this.orderMode,
      promoCode
    });

    const nameVal = App.qs("#cust-name")?.value.trim();
    const phoneVal = isTable ? "Dine-In Guest" : (App.qs("#cust-phone")?.value.trim() || "");
    const streetVal = App.qs("#cust-street")?.value.trim() || "";
    const aptVal = App.qs("#cust-apt")?.value.trim() || "";
    const notesVal = App.qs("#cust-notes")?.value.trim() || "";

    let fullAddress = "";
    let timeLabel = "";

    if (isTable) {
      fullAddress = `Table #${tableNumber}`;
      timeLabel = `Dine-In (Table #${tableNumber})`;
    } else if (this.orderMode === "delivery") {
      fullAddress = `${streetVal}${aptVal ? ", " + aptVal : ""}`;
      timeLabel = this.timeType === "asap" ? `ASAP (${window.CONFIG.etaDelivery})` : `Scheduled: ${this.selectedSlot}`;
    } else {
      fullAddress = "Counter Pickup";
      timeLabel = this.timeType === "asap" ? `ASAP (${window.CONFIG.etaPickup})` : `Scheduled: ${this.selectedSlot}`;
    }

    const orderData = {
      mode: isTable ? "table" : this.orderMode,
      tableNumber: isTable ? tableNumber : null,
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
      deliveryFee: isTable ? 0 : totals.deliveryFee,
      tax: totals.tax,
      total: totals.total,
      notes: notesVal
    };

    const newOrder = App.orders.create(orderData);
    App.cart.clear();

    if (isWhatsApp && !isTable) {
      this.openWhatsAppLink(newOrder);
    }

    this.isSubmitting = false;
    this.closeCheckout();

    // Trigger Live Tracker modal
    if (App.emit) App.emit("order:created", newOrder);
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

    const waNum = encodeURIComponent(window.CONFIG.whatsapp || "919899452192");
    const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  },

  closeCheckout() {
    const root = App.qs("#checkout-sheet-root");
    if (!root) return;
    root.classList.remove("is-active");
    root.innerHTML = "";
    document.body.classList.remove("is-locked");
  }
});
