// Phase F: Luxury Oven-Scoped Cart Drawer, 64px Thumbnails & 400ms Count-Tween
window.App = window.App || {};

App.register("cart", {
  init() {
    this.promoCode = App.storage.get("bf_promo_code", "");
    this.promoStatus = this.promoCode ? "applied" : "none";
    this.prevTotal = 0;
    this.prevSubtotal = 0;

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
    }

    this.renderDesktopCart();
  },

  getTotals() {
    return App.money.calcTotals({
      lines: App.cart.getLines(),
      promoCode: this.promoStatus === "applied" ? this.promoCode : ""
    });
  },

  // 1. Desktop Persistent Cart Panel (Right Column, Oven Scope)
  renderDesktopCart() {
    const root = App.qs("#desktop-cart-root");
    if (!root) return;

    const lines = App.cart.getLines();
    const totals = this.getTotals();
    const tableNumber = App.storage.get("bf_table_num", "1");

    if (lines.length === 0) {
      root.innerHTML = `
        <div class="cart-panel cart-panel--empty" data-theme="oven">
          <div class="empty-cart-artwork" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 24h40l-4 28H16L12 24z"/>
              <path d="M8 24h48"/>
              <path d="M26 24V14a6 6 0 0 1 12 0v10"/>
              <circle cx="32" cy="38" r="6" stroke-dasharray="2 2"/>
            </svg>
          </div>
          <h2 class="empty-cart-title">Your cart is empty</h2>
          <p class="empty-cart-desc">Add delicious handcrafted pizzas and sides from the menu to get started.</p>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      <div class="cart-panel" data-theme="oven">
        <div class="cart-panel__head">
          <div>
            <h2 class="cart-panel__title">Your Order</h2>
            <span class="cart-panel__table-tag label">Table #${String(tableNumber).padStart(2, "0")}</span>
          </div>
          <span class="cart-panel__count label">${App.cart.getCount()} items</span>
        </div>

        <div class="cart-lines-scroller">
          ${this.renderLinesHtml(lines, "desktop")}
        </div>

        ${this.renderPromoBlockHtml("desktop")}
        ${this.renderSummaryBlockHtml(totals, "desktop")}

        <div class="cart-panel__cta">
          <button 
            type="button" 
            class="btn btn--primary btn--checkout" 
            id="desktop-checkout-btn"
          >
            <span>Proceed to Checkout</span>
            <span class="btn-divider" aria-hidden="true">·</span>
            <span class="price" id="desktop-checkout-price">${App.money.format(totals.total)}</span>
          </button>
        </div>
      </div>
    `;

    this.bindCartInteractions(root, "desktop");
    this.tweenTotals(totals, "desktop");
  },

  // 2. Mobile Cart Bottom Sheet (Up to 88svh, Dimmed Backdrop, Oven Scope)
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
    const tableNumber = App.storage.get("bf_table_num", "1");

    if (lines.length === 0) {
      root.innerHTML = `
        <div class="sheet-backdrop" id="cart-backdrop"></div>
        <div class="sheet sheet--cart" id="cart-sheet-container" data-theme="oven" role="dialog" aria-label="Cart">
          <div class="sheet__handle" aria-hidden="true"></div>
          <div class="sheet__head">
            <div class="sheet__title-row">
              <h2 class="sheet__title">Your Cart</h2>
              <button type="button" class="sheet__close-btn" id="cart-close-btn" aria-label="Close cart">✕</button>
            </div>
          </div>
          <div class="empty-cart-view">
            <div class="empty-cart-artwork" aria-hidden="true">
              <svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 24h40l-4 28H16L12 24z"/>
                <path d="M8 24h48"/>
                <path d="M26 24V14a6 6 0 0 1 12 0v10"/>
                <circle cx="32" cy="38" r="6" stroke-dasharray="2 2"/>
              </svg>
            </div>
            <h3 class="empty-cart-title">Your cart is empty</h3>
            <p class="empty-cart-desc">Add delicious handcrafted pizzas and sides from the menu to get started.</p>
            <button type="button" class="btn btn--primary" id="empty-browse-btn" style="margin-top:20px;">
              Browse Menu
            </button>
          </div>
        </div>
      `;

      App.qs("#cart-close-btn", root)?.addEventListener("click", () => this.closeCartSheet());
      App.qs("#cart-backdrop", root)?.addEventListener("click", () => this.closeCartSheet());
      App.qs("#empty-browse-btn", root)?.addEventListener("click", () => {
        this.closeCartSheet();
        const tabs = App.qs("#tabs-root");
        if (tabs) tabs.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }

    root.innerHTML = `
      <div class="sheet-backdrop" id="cart-backdrop"></div>
      <div class="sheet sheet--cart" id="cart-sheet-container" data-theme="oven" role="dialog" aria-label="Cart">
        <div class="sheet__handle" aria-hidden="true"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <div>
              <h2 class="sheet__title">Table #${String(tableNumber).padStart(2, "0")} Order</h2>
              <span class="label" style="color:var(--text-muted);">${App.cart.getCount()} items</span>
            </div>
            <button type="button" class="sheet__close-btn" id="cart-close-btn" aria-label="Close cart">✕</button>
          </div>
        </div>

        <div class="sheet__scroll-content">
          <div class="cart-lines-list">
            ${this.renderLinesHtml(lines, "mobile")}
          </div>

          ${this.renderPromoBlockHtml("mobile")}
          ${this.renderSummaryBlockHtml(totals, "mobile")}
        </div>

        <div class="sheet__footer sheet__footer--cart">
          <button 
            type="button" 
            class="btn btn--primary btn--checkout" 
            id="mobile-checkout-btn"
          >
            <span>Proceed to Checkout</span>
            <span class="btn-divider" aria-hidden="true">·</span>
            <span class="price" id="mobile-checkout-price">${App.money.format(totals.total)}</span>
          </button>
        </div>
      </div>
    `;

    const sheetEl = App.qs("#cart-sheet-container", root);
    const backdropEl = App.qs("#cart-backdrop", root);

    // Spring Entrance (450ms cubic-bezier(.22,1,.36,1))
    if (window.gsap && !App.prefersReducedMotion()) {
      gsap.fromTo(backdropEl, { opacity: 0 }, { opacity: 0.6, duration: 0.3 });
      gsap.fromTo(sheetEl, { y: "100%" }, { y: "0%", duration: 0.45, ease: "power3.out" });
    }

    App.qs("#cart-close-btn", root)?.addEventListener("click", () => this.closeCartSheet());
    backdropEl?.addEventListener("click", () => this.closeCartSheet());

    this.bindCartInteractions(root, "mobile");
    this.tweenTotals(totals, "mobile");
  },

  closeCartSheet() {
    const root = App.qs("#cart-sheet-root");
    if (!root) return;

    const sheetEl = App.qs("#cart-sheet-container", root);
    const backdropEl = App.qs("#cart-backdrop", root);

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
  },

  // 3. Render Line Items with 64px Thumbnail & SVG Trash Icon
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
            <!-- 64px Item Thumbnail -->
            <div class="cart-line-thumb-wrap">
              <img 
                src="${line.image || 'margherita.jpg'}" 
                alt="${line.name}" 
                class="cart-line-thumb" 
                loading="lazy"
                onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src='margherita.jpg';}"
              >
            </div>

            <div class="cart-line-info">
              <h4 class="cart-line-title">${line.name}</h4>
              ${optText ? `<p class="cart-line-options">${optText}</p>` : ""}
              ${line.notes ? `<p class="cart-line-notes">"${App.escape ? App.escape(line.notes) : line.notes}"</p>` : ""}
              <div class="cart-line-price price">${App.money.format(lineTotal)}</div>
            </div>

            <!-- SVG Trash Remove Button -->
            <button type="button" class="cart-line-del" data-action="remove" data-key="${line.key}" aria-label="Remove ${line.name}">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>

          <div class="cart-line-footer">
            <div class="stepper stepper--sm">
              <button type="button" class="stepper-btn" data-action="dec" data-key="${line.key}" aria-label="Decrease quantity">−</button>
              <span class="stepper-val price">${line.qty}</span>
              <button type="button" class="stepper-btn" data-action="inc" data-key="${line.key}" aria-label="Increase quantity">+</button>
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
        <label for="promo-input-${scope}" class="promo-label label">Promo Code</label>
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

  renderSummaryBlockHtml(totals, scope) {
    return `
      <div class="order-summary-box">
        <div class="summary-row">
          <span>Subtotal</span>
          <span class="summary-num price" id="${scope}-summary-subtotal">${App.money.format(totals.subtotal)}</span>
        </div>
        ${totals.discount > 0 ? `
          <div class="summary-row summary-row--discount">
            <span>Discount (WELCOME10)</span>
            <span class="summary-num price">-${App.money.format(totals.discount)}</span>
          </div>
        ` : ""}
        <div class="summary-row">
          <span>Service</span>
          <span class="summary-num">Dine-In (Free)</span>
        </div>
        <div class="summary-row">
          <span>Estimated Tax (8%)</span>
          <span class="summary-num price">${App.money.format(totals.tax)}</span>
        </div>
        <div class="summary-row summary-row--total">
          <span>Total Due</span>
          <span class="summary-num summary-total-val price" id="${scope}-summary-total">${App.money.format(totals.total)}</span>
        </div>
      </div>
    `;
  },

  // 4. 400ms Visual Count-Tween for Totals (Real state guaranteed on completion)
  tweenTotals(totals, scope) {
    const totalEl = App.qs(`#${scope}-summary-total`);
    const btnPriceEl = App.qs(`#${scope}-checkout-price`);
    const subtotalEl = App.qs(`#${scope}-summary-subtotal`);

    if (App.prefersReducedMotion() || !window.gsap) {
      if (totalEl) totalEl.textContent = App.money.format(totals.total);
      if (btnPriceEl) btnPriceEl.textContent = App.money.format(totals.total);
      if (subtotalEl) subtotalEl.textContent = App.money.format(totals.subtotal);
      this.prevTotal = totals.total;
      this.prevSubtotal = totals.subtotal;
      return;
    }

    const startTotal = this.prevTotal || totals.total;
    const startSubtotal = this.prevSubtotal || totals.subtotal;

    const tweenObj = { t: startTotal, s: startSubtotal };

    gsap.to(tweenObj, {
      t: totals.total,
      s: totals.subtotal,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: () => {
        const currentT = App.money.format(Math.round(tweenObj.t));
        const currentS = App.money.format(Math.round(tweenObj.s));
        if (totalEl) totalEl.textContent = currentT;
        if (btnPriceEl) btnPriceEl.textContent = currentT;
        if (subtotalEl) subtotalEl.textContent = currentS;
      },
      onComplete: () => {
        // Enforce 100% precision match with underlying state
        if (totalEl) totalEl.textContent = App.money.format(totals.total);
        if (btnPriceEl) btnPriceEl.textContent = App.money.format(totals.total);
        if (subtotalEl) subtotalEl.textContent = App.money.format(totals.subtotal);
      }
    });

    this.prevTotal = totals.total;
    this.prevSubtotal = totals.subtotal;
  },

  // 5. Interaction Bindings
  bindCartInteractions(container, scope) {
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

    const checkoutBtn = App.qs(`#${scope}-checkout-btn`, container);
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        this.closeCartSheet();
        if (App.emit) App.emit("sheet:open", "checkout");
        App.haptic(10);
      });
    }
  }
});
