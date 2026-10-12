// Cart Sheet, Persistent Desktop Cart Panel, Promo Validation & Number Tweens
window.App = window.App || {};

App.register("cart", {
  init() {
    this.promoCode = App.storage.get("bf_promo_code", "");
    this.promoStatus = this.promoCode ? "applied" : "none"; // 'none' | 'applied' | 'invalid'
    this.orderMode = App.storage.get("bf_order_mode", "delivery");

    // Event hooks
    if (App.cart && App.cart.subscribe) {
      App.cart.subscribe(() => {
        this.renderDesktopCart();
        this.renderMobileSheetIfOpen();
      });
    }

    if (App.on) {
      App.on("sheet:open", (target) => {
        if (target === "cart") this.openCartSheet();
      });

      App.on("mode:changed", (mode) => {
        this.orderMode = mode;
        this.renderDesktopCart();
        this.renderMobileSheetIfOpen();
      });
    }

    this.renderDesktopCart();
  },

  getTotals() {
    return App.money.calcTotals({
      lines: App.cart.getLines(),
      mode: this.orderMode,
      promoCode: this.promoStatus === "applied" ? this.promoCode : ""
    });
  },

  // 1. Desktop Persistent Cart Panel (Right Column)
  renderDesktopCart() {
    const root = App.qs("#desktop-cart-root");
    if (!root) return;

    const lines = App.cart.getLines();
    const totals = this.getTotals();

    if (lines.length === 0) {
      root.innerHTML = `
        <div class="cart-panel cart-panel--empty">
          <div class="empty-cart-graphic">🛒</div>
          <h2 class="empty-cart-title">Your cart is empty</h2>
          <p class="empty-cart-desc">Add delicious handcrafted pizzas and sides from the menu to get started.</p>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      <div class="cart-panel">
        <div class="cart-panel__head">
          <h2 class="cart-panel__title">Your Order</h2>
          <span class="cart-panel__count">${App.cart.getCount()} items</span>
        </div>

        <div class="cart-lines-scroller">
          ${this.renderLinesHtml(lines, "desktop")}
        </div>

        ${this.renderPromoBlockHtml("desktop")}
        ${this.renderSummaryBlockHtml(totals)}

        <div class="cart-panel__cta">
          ${totals.deliveryBlocked ? `
            <div class="delivery-min-banner">
              ⚠️ ${totals.deliveryMessage}
            </div>
          ` : ""}
          <button 
            type="button" 
            class="btn btn--primary btn--checkout" 
            id="desktop-checkout-btn"
            ${totals.deliveryBlocked ? "disabled" : ""}
          >
            Checkout · <span id="desktop-checkout-price">${App.money.format(totals.total)}</span>
          </button>
        </div>
      </div>
    `;

    this.bindCartInteractions(root, "desktop");
  },

  // 2. Mobile Cart Bottom Sheet
  openCartSheet() {
    const root = App.qs("#cart-sheet-root");
    if (!root) return;

    root.classList.add("is-active");
    document.body.classList.add("is-locked");
    this.renderMobileSheetContent(root);
  },

  renderMobileSheetIfOpen() {
    const root = App.qs("#cart-sheet-root");
    if (!root || !root.classList.contains("is-active")) return;
    this.renderMobileSheetContent(root);
  },

  renderMobileSheetContent(root) {
    const lines = App.cart.getLines();
    const totals = this.getTotals();

    if (lines.length === 0) {
      root.innerHTML = `
        <div class="sheet-backdrop" id="cart-backdrop"></div>
        <div class="sheet" id="cart-sheet-container">
          <div class="sheet__handle"></div>
          <div class="sheet__head">
            <div class="sheet__title-row">
              <h2 class="sheet__title">Your Cart</h2>
              <button type="button" class="sheet__close-btn" id="cart-close-btn" aria-label="Close cart">✕</button>
            </div>
          </div>
          <div class="empty-cart-view">
            <div class="empty-cart-graphic">🍕</div>
            <h3 class="empty-cart-title">Your cart is empty</h3>
            <p class="empty-cart-desc">Looks like you haven't added anything yet.</p>
            <button type="button" class="btn btn--primary" id="empty-browse-btn" style="margin-top:16px;">
              Browse Menu
            </button>
          </div>
        </div>
      `;

      App.qs("#cart-close-btn", root)?.addEventListener("click", () => this.closeCartSheet());
      App.qs("#cart-backdrop", root)?.addEventListener("click", () => this.closeCartSheet());
      App.qs("#empty-browse-btn", root)?.addEventListener("click", () => {
        this.closeCartSheet();
        window.scrollTo({ top: 300, behavior: "smooth" });
      });
      return;
    }

    root.innerHTML = `
      <div class="sheet-backdrop" id="cart-backdrop"></div>
      <div class="sheet" id="cart-sheet-container" role="dialog" aria-label="Cart sheet">
        <div class="sheet__handle"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <h2 class="sheet__title">Your Order (${App.cart.getCount()})</h2>
            <button type="button" class="sheet__close-btn" id="cart-close-btn" aria-label="Close cart">✕</button>
          </div>
        </div>

        <div class="sheet__scroll-content">
          <div class="cart-lines-list">
            ${this.renderLinesHtml(lines, "mobile")}
          </div>

          ${this.renderPromoBlockHtml("mobile")}
          ${this.renderSummaryBlockHtml(totals)}
        </div>

        <div class="sheet__footer sheet__footer--cart">
          ${totals.deliveryBlocked ? `
            <div class="delivery-min-banner">
              ⚠️ ${totals.deliveryMessage}
            </div>
          ` : ""}
          <button 
            type="button" 
            class="btn btn--primary btn--checkout" 
            id="mobile-checkout-btn"
            ${totals.deliveryBlocked ? "disabled" : ""}
          >
            Checkout · <span id="mobile-checkout-price">${App.money.format(totals.total)}</span>
          </button>
        </div>
      </div>
    `;

    const sheetEl = App.qs("#cart-sheet-container", root);
    const backdropEl = App.qs("#cart-backdrop", root);

    if (window.gsap && !App.prefersReducedMotion()) {
      gsap.fromTo(backdropEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(sheetEl, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" });
    }

    App.qs("#cart-close-btn", root)?.addEventListener("click", () => this.closeCartSheet());
    backdropEl?.addEventListener("click", () => this.closeCartSheet());

    this.bindCartInteractions(root, "mobile");
  },

  closeCartSheet() {
    const root = App.qs("#cart-sheet-root");
    if (!root) return;
    root.classList.remove("is-active");
    root.innerHTML = "";
    document.body.classList.remove("is-locked");
  },

  // 3. Shared HTML Generators
  renderLinesHtml(lines, scope) {
    return lines.map((line) => {
      const opts = [];
      if (line.options?.size) opts.push(line.options.size);
      if (line.options?.crust) opts.push(line.options.crust);
      if (line.options?.extras?.length) opts.push(...line.options.extras);

      const optText = opts.join(", ");
      const lineTotal = (line.unitPriceCents || line.priceCents) * line.qty;

      return `
        <div class="cart-line-card" data-key="${line.key}">
          <div class="cart-line-main">
            <div class="cart-line-info">
              <h4 class="cart-line-title">${line.name}</h4>
              ${optText ? `<p class="cart-line-options">${optText}</p>` : ""}
              ${line.notes ? `<p class="cart-line-notes">"${line.notes}"</p>` : ""}
              <div class="cart-line-price">${App.money.format(lineTotal)}</div>
            </div>
            <button type="button" class="cart-line-del" data-action="remove" data-key="${line.key}" aria-label="Remove item">
              🗑️
            </button>
          </div>
          <div class="cart-line-footer">
            <div class="stepper stepper--sm">
              <button type="button" class="stepper-btn" data-action="dec" data-key="${line.key}" aria-label="Decrease">−</button>
              <span class="stepper-val">${line.qty}</span>
              <button type="button" class="stepper-btn" data-action="inc" data-key="${line.key}" aria-label="Increase">+</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  renderPromoBlockHtml(scope) {
    const isApplied = this.promoStatus === "applied";
    const isInvalid = this.promoStatus === "invalid";

    return `
      <div class="promo-box">
        <label for="promo-input-${scope}" class="promo-label">Promo Code</label>
        ${isApplied ? `
          <div class="promo-applied-badge">
            <span class="promo-code-name">🎉 ${this.promoCode} (-10%)</span>
            <button type="button" class="promo-remove-btn" id="promo-remove-${scope}" aria-label="Remove promo">✕</button>
          </div>
        ` : `
          <div class="promo-input-row">
            <input 
              type="text" 
              id="promo-input-${scope}" 
              class="promo-input ${isInvalid ? "is-invalid" : ""}" 
              placeholder="e.g. WELCOME10"
              value="${this.promoCode}"
            >
            <button type="button" class="btn btn--ghost promo-apply-btn" id="promo-apply-${scope}">Apply</button>
          </div>
          ${isInvalid ? `<p class="promo-error-msg">Invalid promo code. Try WELCOME10</p>` : ""}
        `}
      </div>
    `;
  },

  renderSummaryBlockHtml(totals) {
    return `
      <div class="order-summary-box">
        <div class="summary-row">
          <span>Subtotal</span>
          <span class="summary-num" data-type="subtotal">${App.money.format(totals.subtotal)}</span>
        </div>
        ${totals.discount > 0 ? `
          <div class="summary-row summary-row--discount">
            <span>Discount (WELCOME10)</span>
            <span class="summary-num" data-type="discount">-${App.money.format(totals.discount)}</span>
          </div>
        ` : ""}
        <div class="summary-row">
          <span>Delivery Fee</span>
          <span class="summary-num" data-type="delivery">
            ${this.orderMode === "pickup" ? "Free" : totals.deliveryFee === 0 ? "FREE" : App.money.format(totals.deliveryFee)}
          </span>
        </div>
        <div class="summary-row">
          <span>Estimated Tax (8%)</span>
          <span class="summary-num" data-type="tax">${App.money.format(totals.tax)}</span>
        </div>
        <div class="summary-row summary-row--total">
          <span>Total</span>
          <span class="summary-num summary-total-val" data-type="total">${App.money.format(totals.total)}</span>
        </div>
      </div>
    `;
  },

  // 4. Interaction Bindings
  bindCartInteractions(container, scope) {
    // Steppers and Removals
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const key = btn.dataset.key;
      const line = App.cart.getLines().find((l) => l.key === key);
      if (!line) return;

      if (action === "inc") {
        App.cart.update(key, line.qty + 1);
        App.haptic(8);
      } else if (action === "dec") {
        App.cart.update(key, line.qty - 1);
        App.haptic(8);
      } else if (action === "remove") {
        App.cart.remove(key);
        App.haptic(12);
      }
    });

    // Promo Application
    const applyBtn = App.qs(`#promo-apply-${scope}`, container);
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        const input = App.qs(`#promo-input-${scope}`, container);
        const code = (input?.value || "").trim().toUpperCase();
        if (code === (window.CONFIG.promo?.code || "WELCOME10")) {
          this.promoCode = code;
          this.promoStatus = "applied";
          App.storage.set("bf_promo_code", code);
          App.haptic(15);
        } else {
          this.promoStatus = "invalid";
          App.haptic(25);
        }
        this.renderDesktopCart();
        this.renderMobileSheetIfOpen();
      });
    }

    const removePromoBtn = App.qs(`#promo-remove-${scope}`, container);
    if (removePromoBtn) {
      removePromoBtn.addEventListener("click", () => {
        this.promoCode = "";
        this.promoStatus = "none";
        App.storage.remove("bf_promo_code");
        this.renderDesktopCart();
        this.renderMobileSheetIfOpen();
        App.haptic(8);
      });
    }

    // Checkout Click
    const checkoutBtn = App.qs(`#${scope}-checkout-btn`, container);
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        const totals = this.getTotals();
        if (totals.deliveryBlocked) return;
        this.closeCartSheet();
        if (App.emit) App.emit("sheet:open", "checkout");
        App.haptic(10);
      });
    }
  }
});
