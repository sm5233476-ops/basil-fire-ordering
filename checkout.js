// Pure Dine-In Checkout: Direct Fire to Kitchen & Pay at Table Notice
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
      <div class="sheet sheet--checkout" id="checkout-sheet-container" role="dialog" aria-label="Confirm Table Order">
        <div class="sheet__handle"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <h2 class="sheet__title">Confirm Table Order</h2>
            <button type="button" class="sheet__close-btn" id="checkout-close-btn" aria-label="Close">✕</button>
          </div>
        </div>

        <form class="sheet__scroll-content checkout-form" id="checkout-form" novalidate>
          
          <!-- 1. Table Confirmation Notice -->
          <div class="table-checkout-notice">
            <span class="table-icon">🍽️</span>
            <div>
              <strong>Serving to Table #${String(tableNumber).padStart(2, "0")}</strong>
              <p>Freshly baked and delivered right to your seat.</p>
            </div>
          </div>

          <!-- 2. Guest Name -->
          <div class="checkout-section">
            <label class="checkout-label">Your Name (For Server)</label>
            <div class="form-group">
              <input type="text" id="cust-name" class="form-input" placeholder="e.g. Alex, Rahul..." required autofocus>
              <span class="field-error" id="err-name"></span>
            </div>
          </div>

          <!-- 3. Kitchen Notes -->
          <div class="checkout-section">
            <label class="checkout-label">Special Requests (Optional)</label>
            <div class="form-group">
              <textarea id="cust-notes" class="form-input form-textarea" rows="2" placeholder="e.g. Extra napkins, cutlery, well-done crust..."></textarea>
            </div>
          </div>

          <!-- 4. Pay at Table Notice -->
          <div class="payment-badge">
            <span class="payment-icon">💵</span>
            <div class="payment-info">
              <strong>Pay at Your Table</strong>
              <p>Pay cash or card to your server when your meal arrives. No upfront payment required.</p>
            </div>
          </div>

          <!-- 5. Order Total Summary -->
          <div class="checkout-section checkout-review-box">
            <div class="review-row"><span>Items:</span> <span>${App.cart.getCount()}</span></div>
            <div class="review-row"><span>Subtotal:</span> <span>${App.money.format(totals.subtotal)}</span></div>
            ${totals.discount > 0 ? `<div class="review-row review-row--disc"><span>Discount:</span> <span>-${App.money.format(totals.discount)}</span></div>` : ""}
            <div class="review-row"><span>Service:</span> <span>Dine-In (Table #${tableNumber})</span></div>
            <div class="review-row"><span>Tax (8%):</span> <span>${App.money.format(totals.tax)}</span></div>
            <div class="review-row review-row--total"><span>Total Due:</span> <span>${App.money.format(totals.total)}</span></div>
          </div>

          <!-- 6. Fire Order Button -->
          <div class="checkout-actions">
            <button type="button" class="btn btn--primary btn--order-place" id="btn-place-order">
              🔥 Fire Order to Kitchen · ${App.money.format(totals.total)}
            </button>
          </div>
        </form>
      </div>
    `;

    this.bindCheckoutEvents(root, tableNumber);
  },

  bindCheckoutEvents(root, tableNumber) {
    const closeBtn = App.qs("#checkout-close-btn", root);
    const backdrop = App.qs("#checkout-backdrop", root);

    closeBtn?.addEventListener("click", () => this.closeCheckout());
    backdrop?.addEventListener("click", () => this.closeCheckout());

    App.qs("#btn-place-order", root)?.addEventListener("click", () => {
      this.handleOrderSubmission(tableNumber);
    });
  },

  handleOrderSubmission(tableNumber) {
    if (this.isSubmitting) return;

    const nameInput = App.qs("#cust-name");
    const errName = App.qs("#err-name");
    const nameVal = nameInput?.value.trim() || "";

    if (!nameVal || nameVal.length < 2) {
      if (nameInput) nameInput.classList.add("is-invalid");
      if (errName) errName.textContent = "Please enter your name";
      nameInput?.focus();
      App.haptic(25);
      return;
    }

    this.isSubmitting = true;
    const btnPlace = App.qs("#btn-place-order");
    if (btnPlace) btnPlace.textContent = "Firing order to kitchen...";

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

    const newOrder = App.orders.create(orderData);
    App.cart.clear();

    this.isSubmitting = false;
    this.closeCheckout();

    if (App.emit) App.emit("order:created", newOrder);
  },

  closeCheckout() {
    const root = App.qs("#checkout-sheet-root");
    if (!root) return;
    root.classList.remove("is-active");
    root.innerHTML = "";
    document.body.classList.remove("is-locked");
  }
});
