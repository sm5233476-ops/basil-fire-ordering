// Menu Catalogue, Category ScrollSpy, Item Modal Sheet & Quick-Add
window.App = window.App || {};

App.register("menu", {
  init() {
    this.orderMode = App.storage.get("bf_order_mode", "delivery");
    this.activeCategory = window.MENU?.categories[0]?.id || "pizza";
    this.activeSheetItem = null;

    this.renderHeader();
    this.renderHero();
    this.renderTabs();
    this.renderCatalog();
    this.renderCartBar();
    this.initScrollSpy();
    this.bindEvents();

    // Re-render steppers and cart bar on cart updates
    if (App.cart && App.cart.subscribe) {
      App.cart.subscribe(() => {
        this.updateCatalogSteppers();
        this.updateCartBar();
      });
    }

    this.updateCatalogSteppers();
    this.updateCartBar();
  },

  // 1. Header with Delivery | Pickup Segmented Control
  renderHeader() {
    const root = App.qs("#header-root");
    if (!root) return;

    root.innerHTML = `
      <div class="nav-container">
        <div class="nav-brand">
          <a href="#" class="brand-link" aria-label="Basil and Fire Home">
            <span class="brand-dot"></span>
            <span class="brand-text">${window.CONFIG.name}</span>
          </a>
        </div>
        <div class="segmented-control" role="group" aria-label="Order mode toggle">
          <div class="seg-thumb" id="seg-thumb"></div>
          <button type="button" class="seg-btn ${this.orderMode === "delivery" ? "is-active" : ""}" data-mode="delivery">
            Delivery
          </button>
          <button type="button" class="seg-btn ${this.orderMode === "pickup" ? "is-active" : ""}" data-mode="pickup">
            Pickup
          </button>
        </div>
      </div>
    `;

    this.updateSegmentedThumb();

    root.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        if (mode === this.orderMode) return;
        this.orderMode = mode;
        App.storage.set("bf_order_mode", mode);
        root.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
        this.updateSegmentedThumb();
        this.renderHero();
        if (App.emit) App.emit("mode:changed", mode);
        App.haptic(10);
      });
    });
  },

  updateSegmentedThumb() {
    const thumb = App.qs("#seg-thumb");
    const activeBtn = App.qs(`.seg-btn[data-mode="${this.orderMode}"]`);
    if (!thumb || !activeBtn) return;
    thumb.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    thumb.style.width = `${activeBtn.offsetWidth}px`;
  },

  // 2. Compact Hero Section
  renderHero() {
    const root = App.qs("#hero-root");
    if (!root) return;

    const isDelivery = this.orderMode === "delivery";
    const eta = isDelivery ? window.CONFIG.etaDelivery : window.CONFIG.etaPickup;

    root.innerHTML = `
      <div class="hero-card">
        <div class="hero-media">
          <img src="${window.MENU.heroImage}" alt="Wood-fired oven" class="hero-img" loading="eager" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="img-fallback" style="display:none;" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z"/></svg>
          </div>
          <div class="hero-overlay"></div>
        </div>
        <div class="hero-content">
          <h1 class="hero-title">${window.CONFIG.name}</h1>
          <p class="hero-tagline">${window.CONFIG.tagline}</p>
          <div class="hero-chips">
            <span class="chip chip--accent">
              <svg class="chip-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
              ${isDelivery ? "Delivery" : "Pickup"} ${eta}
            </span>
            <span class="chip">
              <span class="live-dot" style="margin:0 4px 0 0;"></span>
              ${window.CONFIG.hoursText}
            </span>
          </div>
        </div>
      </div>
    `;
  },

  // 3. Sticky Category Tabs with Smooth Underline
  renderTabs() {
    const root = App.qs("#tabs-root");
    if (!root) return;

    const tabsHtml = window.MENU.categories.map((cat, idx) => `
      <button type="button" class="tab-btn ${idx === 0 ? "is-active" : ""}" data-category="${cat.id}">
        ${cat.name}
      </button>
    `).join("");

    root.innerHTML = `
      <div class="tabs-scroller">
        <div class="tabs-track">
          ${tabsHtml}
          <div class="tab-underline" id="tab-underline"></div>
        </div>
      </div>
    `;

    setTimeout(() => this.updateTabUnderline(), 50);

    root.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const catId = btn.dataset.category;
        const targetSection = App.qs(`#cat-sec-${catId}`);
        if (!targetSection) return;

        const tabsHeight = root.offsetHeight || 50;
        const targetTop = targetSection.getBoundingClientRect().top + window.pageYOffset - tabsHeight - 12;

        window.scrollTo({ top: targetTop, behavior: "smooth" });
        this.setActiveTab(catId);
        App.haptic(8);
      });
    });
  },

  setActiveTab(catId) {
    if (this.activeCategory === catId) return;
    this.activeCategory = catId;
    const root = App.qs("#tabs-root");
    if (!root) return;

    root.querySelectorAll(".tab-btn").forEach((btn) => {
      const match = btn.dataset.category === catId;
      btn.classList.toggle("is-active", match);
      if (match) {
        btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
    this.updateTabUnderline();
  },

  updateTabUnderline() {
    const underline = App.qs("#tab-underline");
    const activeTab = App.qs(".tab-btn.is-active");
    if (!underline || !activeTab) return;
    underline.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    underline.style.width = `${activeTab.offsetWidth}px`;
  },

  // 4. Scroll-Spy with IntersectionObserver
  initScrollSpy() {
    const sections = App.qsa(".category-section");
    if (!sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const catId = entry.target.dataset.catId;
          this.setActiveTab(catId);
        }
      });
    }, {
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0
    });

    sections.forEach((sec) => observer.observe(sec));
  },

  // 5. Render Menu Items Catalog
  renderCatalog() {
    const root = App.qs("#menu-root");
    if (!root) return;

    let html = "";
    window.MENU.categories.forEach((cat) => {
      const items = window.MENU.items.filter((item) => item.category === cat.id);
      if (!items.length) return;

      html += `
        <section class="category-section" id="cat-sec-${cat.id}" data-cat-id="${cat.id}">
          <div class="category-header">
            <h2 class="category-title">${cat.name}</h2>
            <span class="category-count">${items.length} items</span>
          </div>
          <div class="menu-grid">
            ${items.map((item) => this.renderItemCard(item)).join("")}
          </div>
        </section>
      `;
    });

    root.innerHTML = html;
    this.bindCardInteractions();
  },

  renderItemCard(item) {
    const hasOptions = item.options && item.options.length > 0;
    const isVeg = item.tags && item.tags.includes("veg");
    const isSpicy = item.tags && item.tags.includes("spicy");

    return `
      <article class="item-card" data-id="${item.id}" tabindex="0">
        <div class="item-card__media">
          ${item.image ? `
            <div class="media-skeleton skeleton" id="skel-${item.id}"></div>
            <img 
              src="${item.image}" 
              alt="${item.name}" 
              class="item-img" 
              loading="lazy"
              onload="const s=document.getElementById('skel-${item.id}'); if(s) s.remove();"
              onerror="this.style.display='none'; const s=document.getElementById('skel-${item.id}'); if(s) s.remove(); this.nextElementSibling.style.display='flex';"
            >
          ` : ""}
          <div class="img-fallback" style="${item.image ? "display:none;" : "display:flex;"}" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z"/></svg>
          </div>
          <div class="item-badges">
            ${isVeg ? `<span class="badge badge--veg" title="Vegetarian"><span class="badge-dot"></span>Veg</span>` : ""}
            ${isSpicy ? `<span class="badge badge--spicy" title="Spicy">🌶️ Spicy</span>` : ""}
          </div>
        </div>

        <div class="item-card__body">
          <div class="item-card__info">
            <h3 class="item-name">${item.name}</h3>
            <p class="item-desc">${item.desc}</p>
          </div>
          <div class="item-card__footer">
            <span class="item-price">${App.money.format(item.priceCents)}</span>
            <div class="item-action" data-item-id="${item.id}">
              ${hasOptions ? `
                <button type="button" class="btn-action btn-action--custom" aria-label="Customize ${item.name}">
                  Add +
                </button>
              ` : `
                <div class="stepper-morph" data-stepper-for="${item.id}">
                  <button type="button" class="btn-action btn-action--add" aria-label="Add ${item.name} to order">
                    +
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      </article>
    `;
  },

  // 6. Stepper State Sync for Option-less items
  updateCatalogSteppers() {
    if (!App.cart) return;
    const lines = App.cart.getLines();

    window.MENU.items.forEach((item) => {
      const hasOptions = item.options && item.options.length > 0;
      if (hasOptions) return;

      const container = App.qs(`[data-stepper-for="${item.id}"]`);
      if (!container) return;

      const line = lines.find((l) => l.itemId === item.id && (!l.optionsKey || l.optionsKey === "default"));
      const qty = line ? line.qty : 0;

      if (qty > 0) {
        container.innerHTML = `
          <div class="stepper">
            <button type="button" class="stepper-btn stepper-btn--minus" data-action="minus" aria-label="Decrease quantity">−</button>
            <span class="stepper-val">${qty}</span>
            <button type="button" class="stepper-btn stepper-btn--plus" data-action="plus" aria-label="Increase quantity">+</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <button type="button" class="btn-action btn-action--add" aria-label="Add ${item.name} to order">+</button>
        `;
      }
    });
  },

  bindCardInteractions() {
    const root = App.qs("#menu-root");
    if (!root) return;

    root.addEventListener("click", (e) => {
      const card = e.target.closest(".item-card");
      if (!card) return;

      const itemId = card.dataset.id;
      const item = window.MENU.items.find((i) => i.id === itemId);
      if (!item) return;

      const hasOptions = item.options && item.options.length > 0;

      // Click on Quick-Add "+"
      const addBtn = e.target.closest(".btn-action--add");
      if (addBtn) {
        e.stopPropagation();
        this.addQuickItem(item, addBtn);
        return;
      }

      // Click on Stepper Plus
      const plusBtn = e.target.closest('.stepper-btn[data-action="plus"]');
      if (plusBtn) {
        e.stopPropagation();
        const currentQty = App.cart.getItemQty(item.id);
        const line = App.cart.getLines().find((l) => l.itemId === item.id);
        if (line) App.cart.update(line.key, currentQty + 1);
        this.flyToCart(plusBtn, item);
        App.haptic(10);
        return;
      }

      // Click on Stepper Minus
      const minusBtn = e.target.closest('.stepper-btn[data-action="minus"]');
      if (minusBtn) {
        e.stopPropagation();
        const currentQty = App.cart.getItemQty(item.id);
        const line = App.cart.getLines().find((l) => l.itemId === item.id);
        if (line) App.cart.update(line.key, currentQty - 1);
        App.haptic(10);
        return;
      }

      // Click on Card or "Customize +" opens Item Sheet
      if (hasOptions || e.target.closest(".btn-action--custom")) {
        this.openItemSheet(item);
      }
    });
  },

  addQuickItem(item, originEl) {
    App.cart.add({
      itemId: item.id,
      name: item.name,
      priceCents: item.priceCents,
      unitPriceCents: item.priceCents,
      optionsKey: "default",
      options: null,
      notes: "",
      qty: 1
    });

    this.flyToCart(originEl, item);
    App.haptic(10);
  },

  // 7. Item Bottom Sheet (Customizer Modal)
  openItemSheet(item) {
    this.activeSheetItem = item;
    const root = App.qs("#item-sheet-root");
    if (!root) return;

    // Default options selection
    const state = {
      qty: 1,
      size: (item.options?.find((o) => o.id === "size")?.choices || []).find((c) => c.default) || item.options?.find((o) => o.id === "size")?.choices[0],
      crust: (item.options?.find((o) => o.id === "crust")?.choices || []).find((c) => c.default) || item.options?.find((o) => o.id === "crust")?.choices[0],
      extras: new Set(),
      notes: ""
    };

    const calcCurrentUnit = () => {
      let unit = item.priceCents;
      if (state.size) unit += state.size.priceCents;
      if (state.crust) unit += state.crust.priceCents;
      state.extras.forEach((extra) => { unit += extra.priceCents; });
      return unit;
    };

    root.classList.add("is-active");
    document.body.classList.add("is-locked");

    root.innerHTML = `
      <div class="sheet-backdrop" id="sheet-backdrop"></div>
      <div class="sheet" id="sheet-container" role="document">
        <div class="sheet__handle"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <h2 class="sheet__title">${item.name}</h2>
            <button type="button" class="sheet__close-btn" id="sheet-close" aria-label="Close sheet">✕</button>
          </div>
          <p class="sheet__desc">${item.desc}</p>
        </div>

        <div class="sheet__scroll-content">
          ${(item.options || []).map((grp) => `
            <fieldset class="sheet-group">
              <legend class="sheet-group__legend">
                <span>${grp.name}</span>
                <span class="sheet-group__hint">${grp.required ? "Required" : "Optional"}</span>
              </legend>
              <div class="sheet-options ${grp.type === "single" ? "sheet-options--grid" : "sheet-options--list"}">
                ${grp.choices.map((choice) => {
                  const isRadio = grp.type === "single";
                  const inputName = `opt_${grp.id}`;
                  const isChecked = (grp.id === "size" && state.size?.id === choice.id) ||
                                    (grp.id === "crust" && state.crust?.id === choice.id);
                  return `
                    <label class="choice-card ${isChecked ? "is-selected" : ""}" data-group="${grp.id}" data-choice-id="${choice.id}">
                      <input 
                        type="${isRadio ? "radio" : "checkbox"}" 
                        name="${inputName}" 
                        value="${choice.id}" 
                        ${isChecked ? "checked" : ""}
                        class="choice-input"
                      >
                      <div class="choice-info">
                        <span class="choice-name">${choice.name}</span>
                        ${choice.priceCents > 0 ? `<span class="choice-delta">+${App.money.format(choice.priceCents)}</span>` : `<span class="choice-delta choice-delta--free">+0</span>`}
                      </div>
                    </label>
                  `;
                }).join("")}
              </div>
            </fieldset>
          `).join("")}

          <!-- Special Notes -->
          <div class="sheet-group">
            <label for="item-notes" class="sheet-group__legend">Special Instructions</label>
            <div class="notes-wrap">
              <textarea id="item-notes" maxlength="140" rows="2" placeholder="e.g. Well done, extra crispy, sauce on the side..."></textarea>
              <span class="notes-count" id="notes-count">0 / 140</span>
            </div>
          </div>
        </div>

        <!-- Sticky Sheet Footer -->
        <div class="sheet__footer">
          <div class="sheet__qty-stepper">
            <button type="button" class="sheet-qty-btn" id="sheet-qty-minus" aria-label="Decrease quantity">−</button>
            <span class="sheet-qty-val" id="sheet-qty-val">1</span>
            <button type="button" class="sheet-qty-btn" id="sheet-qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="btn btn--primary sheet__add-btn" id="sheet-submit-btn">
            Add to order · <span id="sheet-btn-price">${App.money.format(calcCurrentUnit())}</span>
          </button>
        </div>
      </div>
    `;

    const sheetEl = App.qs("#sheet-container", root);
    const backdropEl = App.qs("#sheet-backdrop", root);
    const submitPriceEl = App.qs("#sheet-btn-price", root);
    let previousTotal = calcCurrentUnit();

    // GSAP Spring Open Animation
    if (window.gsap && !App.prefersReducedMotion()) {
      gsap.fromTo(backdropEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(sheetEl, { y: "100%" }, { y: "0%", duration: 0.45, ease: "power3.out" });
    } else {
      backdropEl.style.opacity = "1";
      sheetEl.style.transform = "translateY(0)";
    }

    const updatePriceDisplay = () => {
      const unit = calcCurrentUnit();
      const total = unit * state.qty;

      if (window.gsap && !App.prefersReducedMotion()) {
        const obj = { val: previousTotal };
        gsap.to(obj, {
          val: total,
          duration: 0.25,
          ease: "power1.out",
          onUpdate: () => {
            submitPriceEl.textContent = App.money.format(Math.round(obj.val));
          }
        });
      } else {
        submitPriceEl.textContent = App.money.format(total);
      }
      previousTotal = total;
    };

    // Option Toggle Listener
    sheetEl.addEventListener("change", (e) => {
      const choiceCard = e.target.closest(".choice-card");
      if (!choiceCard) return;

      const group = choiceCard.dataset.group;
      const choiceId = choiceCard.dataset.choiceId;
      const grpConfig = item.options.find((o) => o.id === group);
      const choiceConfig = grpConfig.choices.find((c) => c.id === choiceId);

      if (grpConfig.type === "single") {
        if (group === "size") state.size = choiceConfig;
        if (group === "crust") state.crust = choiceConfig;
        sheetEl.querySelectorAll(`[data-group="${group}"]`).forEach((c) => c.classList.remove("is-selected"));
        choiceCard.classList.add("is-selected");
      } else {
        if (e.target.checked) {
          state.extras.add(choiceConfig);
          choiceCard.classList.add("is-selected");
        } else {
          state.extras.delete(choiceConfig);
          choiceCard.classList.remove("is-selected");
        }
      }

      updatePriceDisplay();
      App.haptic(5);
    });

    // Notes Listener
    const notesInput = App.qs("#item-notes", root);
    const notesCount = App.qs("#notes-count", root);
    notesInput.addEventListener("input", () => {
      state.notes = notesInput.value;
      notesCount.textContent = `${notesInput.value.length} / 140`;
    });

    // Qty Stepper Listeners
    App.qs("#sheet-qty-plus", root).addEventListener("click", () => {
      if (state.qty < 20) {
        state.qty += 1;
        App.qs("#sheet-qty-val", root).textContent = state.qty;
        updatePriceDisplay();
        App.haptic(8);
      }
    });

    App.qs("#sheet-qty-minus", root).addEventListener("click", () => {
      if (state.qty > 1) {
        state.qty -= 1;
        App.qs("#sheet-qty-val", root).textContent = state.qty;
        updatePriceDisplay();
        App.haptic(8);
      }
    });

    // Close logic
    const closeSheet = () => {
      if (window.gsap && !App.prefersReducedMotion()) {
        gsap.to(backdropEl, { opacity: 0, duration: 0.2 });
        gsap.to(sheetEl, {
          y: "100%",
          duration: 0.3,
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
    };

    App.qs("#sheet-close", root).addEventListener("click", closeSheet);
    backdropEl.addEventListener("click", closeSheet);

    // Escape Key Support
    const escHandler = (e) => {
      if (e.key === "Escape") {
        closeSheet();
        window.removeEventListener("keydown", escHandler);
      }
    };
    window.addEventListener("keydown", escHandler);

    // Touch Drag-to-Dismiss Handler
    let touchStartY = 0;
    let touchDiff = 0;
    sheetEl.addEventListener("touchstart", (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    sheetEl.addEventListener("touchmove", (e) => {
      touchDiff = e.touches[0].clientY - touchStartY;
      if (touchDiff > 0 && sheetEl.scrollTop <= 0) {
        sheetEl.style.transform = `translateY(${touchDiff}px)`;
      }
    }, { passive: true });

    sheetEl.addEventListener("touchend", () => {
      if (touchDiff > 120) {
        closeSheet();
      } else {
        sheetEl.style.transform = "translateY(0)";
      }
      touchDiff = 0;
    });

    // Add to Cart Submission
    App.qs("#sheet-submit-btn", root).addEventListener("click", (e) => {
      const extrasArray = Array.from(state.extras);
      const optionsKey = `${state.size?.id || "na"}_${state.crust?.id || "na"}_${extrasArray.map((x) => x.id).sort().join("+")}`;

      const cartItem = {
        itemId: item.id,
        name: item.name,
        priceCents: item.priceCents,
        unitPriceCents: calcCurrentUnit(),
        optionsKey,
        options: {
          size: state.size?.name,
          crust: state.crust?.name,
          extras: extrasArray.map((x) => x.name)
        },
        notes: state.notes.trim(),
        qty: state.qty
      };

      App.cart.add(cartItem);
      this.flyToCart(e.currentTarget, item);
      App.haptic(15);
      closeSheet();
    });
  },

  // 8. Floating Cart Bar
  renderCartBar() {
    const root = App.qs("#cart-bar-root");
    if (!root) return;

    root.innerHTML = `
      <aside class="cart-bar" id="cart-bar" role="button" tabindex="0" aria-label="Open Cart Sheet">
        <div class="cart-bar__left">
          <span class="cart-bar__badge" id="cart-bar-badge">0</span>
          <span class="cart-bar__title">View Order</span>
        </div>
        <div class="cart-bar__right">
          <span class="cart-bar__total" id="cart-bar-total">$0.00</span>
          <span class="cart-bar__arrow">→</span>
        </div>
      </aside>
    `;

    const barEl = App.qs("#cart-bar", root);
    barEl.addEventListener("click", () => {
      if (App.emit) App.emit("sheet:open", "cart");
      App.haptic(10);
    });

    barEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (App.emit) App.emit("sheet:open", "cart");
      }
    });
  },

  updateCartBar() {
    const barEl = App.qs("#cart-bar");
    const badgeEl = App.qs("#cart-bar-badge");
    const totalEl = App.qs("#cart-bar-total");
    if (!barEl || !badgeEl || !totalEl || !App.cart) return;

    const count = App.cart.getCount();
    const totals = App.money.calcTotals({
      lines: App.cart.getLines(),
      mode: this.orderMode
    });

    if (count > 0) {
      barEl.classList.add("is-visible");
      badgeEl.textContent = count;
      totalEl.textContent = App.money.format(totals.total);
    } else {
      barEl.classList.remove("is-visible");
    }
  },

  // 9. Motion: Fly-to-Cart Animation and Bar Bounce
  flyToCart(originEl, item) {
    const target = App.qs("#cart-bar");
    if (!originEl || !target) return;

    // Cart Bar Bounce
    if (window.gsap && !App.prefersReducedMotion()) {
      gsap.fromTo(target, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
    }

    if (App.prefersReducedMotion() || !window.gsap) return;

    const startRect = originEl.getBoundingClientRect();
    const endRect = target.getBoundingClientRect();

    const flyer = document.createElement("div");
    flyer.className = "fly-particle";
    flyer.innerHTML = `<span class="fly-icon">🍕</span>`;
    document.body.appendChild(flyer);

    const startX = startRect.left + startRect.width / 2 - 16;
    const startY = startRect.top + startRect.height / 2 - 16;
    const endX = endRect.left + 40;
    const endY = endRect.top + endRect.height / 2;

    gsap.set(flyer, { x: startX, y: startY, scale: 1, opacity: 1 });

    gsap.to(flyer, {
      x: endX,
      y: endY,
      scale: 0.35,
      opacity: 0.2,
      duration: 0.65,
      ease: "power2.inOut",
      onComplete: () => {
        flyer.remove();
      }
    });
  },

  bindEvents() {
    window.addEventListener("resize", () => {
      this.updateSegmentedThumb();
      this.updateTabUnderline();
    });
  }
});
