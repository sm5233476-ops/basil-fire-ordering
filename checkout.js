// Phase G: Luxury 2-Col Checkout, 52px Inputs with Shake Feedback & Loading Spinner
window.App = window.App || {};

App.register("checkout", {
  init() {
    this.isSubmitting = false;

    if (App.on) {
      App.on("sheet:open", (target) => {
        if (target === "checkout") this.openCheckout();
      });
    }
  },

  openCheckout() {
    const root = App.qs("#checkout-sheet-root");
    if (!root) return;

    const tableNumber = App.storage.get("bf_table_num", "1");
    const promoCode = App.storage.get("bf_promo_code", "");
    const totals = App.money.calcTotals({
      lines: App.cart.getLines(),
      promoCode
    });

    root.classList.add("is-active");
    document.body.classList.add("is-locked");

    root.innerHTML = `
      <div class="sheet-backdrop" id="checkout-backdrop"></div>
      <div class="sheet sheet--checkout" id="checkout-sheet-container" data-theme="oven" role="dialog" aria-label="Confirm Table Order">
        <div class="sheet__handle" aria-hidden="true"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <h2 class="sheet__title">Confirm Table Order</h2>
            <button type="button" class="sheet__close-btn" id="checkout-close-btn" aria-label="Close checkout">✕</button>
          </div>
        </div>

        <form class="sheet__scroll-content checkout-form" id="checkout-form" novalidate>
          <div class="checkout-layout-grid">
            
            <!-- LEFT COLUMN: Form Fields & Details -->
            <div class="checkout-form-col">
              
              <!-- 1. Table Confirmation Notice -->
              <div class="table-checkout-notice">
                <span class="table-icon" aria-hidden="true">🍽️</span>
                <div>
                  <strong>Serving to Table #${String(tableNumber).padStart(2, "0")}</strong>
                  <p>Freshly baked and delivered right to your seat.</p>
                </div>
              </div>

              <!-- 2. Guest Name (52px Input with Validation Icon) -->
              <div class="checkout-section">
                <label for="cust-name" class="checkout-label label">Your Name (For Server) *</label>
                <div class="form-group-relative">
                  <input 
                    type="text" 
                    id="cust-name" 
                    class="form-input" 
                    placeholder="e.g. Alex, Rahul..." 
                    required 
                    autocomplete="name"
                    autofocus
                  >
                  <span class="input-validation-tick" id="name-valid-tick" aria-hidden="true">✓</span>
                </div>
                <div class="field-error-wrap" id="err-name" aria-live="polite"></div>
              </div>

              <!-- 3. Kitchen Special Requests -->
              <div class="checkout-section">
                <label for="cust-notes" class="checkout-label label">Special Requests (Optional)</label>
                <div class="form-group">
                  <textarea 
                    id="cust-notes" 
                    class="form-input form-textarea" 
                    rows="2" 
                    placeholder="e.g. Extra napkins, cutlery, well-done crust..."
                  ></textarea>
                </div>
              </div>

              <!-- 4. Payment Method (Card-Themed Visual Demo Mockup) -->
              <div class="checkout-section">
                <label class="checkout-label label">Payment Method</label>
                <div class="demo-card-payment-box">
                  <div class="demo-card-header">
                    <div class="demo-card-chip" aria-hidden="true"></div>
                    <span class="demo-card-brand label">Basil &amp; Fire Pay</span>
                  </div>
                  <div class="demo-card-info">
                    <strong>Pay at Your Table</strong>
                    <p>Pay cash or card to your server when your meal arrives. No upfront payment required.</p>
                  </div>
                  <div class="demo-card-footer">
                    <span class="demo-card-badge label">Demo Concept · Zero Processing</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- RIGHT COLUMN: Order Review & Actions -->
            <div class="checkout-summary-col">
              
              <!-- Order Summary Breakdown -->
              <div class="checkout-section checkout-review-box">
                <h3 class="review-box-title label">Order Summary</h3>
                <div class="review-row"><span>Items:</span> <span class="price">${App.cart.getCount()}</span></div>
                <div class="review-row"><span>Subtotal:</span> <span class="price">${App.money.format(totals.subtotal)}</span></div>
                ${totals.discount > 0 ? `<div class="review-row review-row--disc"><span>Discount (WELCOME10):</span> <span class="price">-${App.money.format(totals.discount)}</span></div>` : ""}
                <div class="review-row"><span>Service:</span> <span>Dine-In (Table #${tableNumber})</span></div>
                <div class="review-row"><span>Estimated Tax (8%):</span> <span class="price">${App.money.format(totals.tax)}</span></div>
                <div class="review-row review-row--total"><span>Total Due:</span> <span class="price" id="checkout-total-due">${App.money.format(totals.total)}</span></div>
              </div>

              <!-- Fire Order Action with Subtle Loading Spinner -->
              <div class="checkout-actions">
                <button type="button" class="btn btn--primary btn--order-place" id="btn-place-order">
                  <span class="btn-spinner" id="btn-order-spinner" style="display:none;" aria-hidden="true"></span>
                  <span id="btn-place-order-text">🔥 Fire Order to Kitchen · ${App.money.format(totals.total)}</span>
                </button>
              </div>

            </div>

          </div>
        </form>
      </div>
    `;

    this.bindCheckoutEvents(root, tableNumber);
  },

  bindCheckoutEvents(root, tableNumber) {
    const closeBtn = App.qs("#checkout-close-btn", root);
    const backdrop = App.qs("#checkout-backdrop", root);
    const nameInput = App.qs("#cust-name", root);
    const nameTick = App.qs("#name-valid-tick", root);
    const btnPlace = App.qs("#btn-place-order", root);

    closeBtn?.addEventListener("click", () => this.closeCheckout());
    backdrop?.addEventListener("click", () => this.closeCheckout());

    // Live validation tick on name input
    nameInput?.addEventListener("input", () => {
      const isValid = (nameInput.value || "").trim().length >= 2;
      if (nameTick) nameTick.classList.toggle("is-visible", isValid);
      nameInput.classList.remove("is-invalid", "shake-field");
      const errWrap = App.qs("#err-name", root);
      if (errWrap) errWrap.innerHTML = "";
    });

    btnPlace?.addEventListener("click", () => {
      this.handleOrderSubmission(tableNumber);
    });
  },

  handleOrderSubmission(tableNumber) {
    if (this.isSubmitting) return;

    const nameInput = App.qs("#cust-name");
    const errWrap = App.qs("#err-name");
    const nameVal = nameInput?.value.trim() || "";

    // 250ms Input Shake on Submit Failure
    if (!nameVal || nameVal.length < 2) {
      if (nameInput) {
        nameInput.classList.add("is-invalid");
        if (!App.prefersReducedMotion()) {
          nameInput.classList.add("shake-field");
          setTimeout(() => nameInput.classList.remove("shake-field"), 280);
        }
        nameInput.focus();
      }
      if (errWrap) {
        errWrap.innerHTML = `
          <span class="field-error-icon" aria-hidden="true">⚠️</span>
          <span class="field-error-text">Please enter your name (min 2 characters)</span>
        `;
      }
      App.haptic(25);
      return;
    }

    this.isSubmitting = true;
    const btnPlace = App.qs("#btn-place-order");
    const spinner = App.qs("#btn-order-spinner");
    const btnText = App.qs("#btn-place-order-text");

    if (btnPlace) btnPlace.disabled = true;
    if (spinner) spinner.style.display = "inline-block";
    if (btnText) btnText.textContent = "Firing order to kitchen...";

    const promoCode = App.storage.get("bf_promo_code", "");
    const totals = App.money.calcTotals({
      lines: App.cart.getLines(),
      promoCode
    });

    const notesVal = App.qs("#cust-notes")?.value.trim() || "";

    const orderData = {
      mode: "table",
      tableNumber,
      timeLabel: `Dine-In (Table #${tableNumber})`,
      customer: {
        name: nameVal,
        phone: "Dine-In Guest",
        address: `Table #${tableNumber}`
      },
      lines: App.cart.getLines(),
      subtotal: totals.subtotal,
      discount: totals.discount,
      promoCode,
      deliveryFee: 0,
      tax: totals.tax,
      total: totals.total,
      notes: notesVal
    };

    // Keep submit behavior and order creation exact
    const newOrder = App.orders.create(orderData);
    App.cart.clear();

    setTimeout(() => {
      this.isSubmitting = false;
      this.closeCheckout();

      // Trigger Signature Order Success / Confirmation screen
      if (App.emit) App.emit("order:created", newOrder);
    }, 400);
  },

  closeCheckout() {
    const root = App.qs("#checkout-sheet-root");
    if (!root) return;

    const sheetEl = App.qs("#checkout-sheet-container", root);
    const backdropEl = App.qs("#checkout-backdrop", root);

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
