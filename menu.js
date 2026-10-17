// Phase H: Unified 24px SVG Icons, 4/5 Aspect-Ratio Food Cards & Zero Emojis
window.App = window.App || {};

App.register("menu", {
  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get("table");

    if (tableParam) {
      this.tableNumber = String(tableParam);
      this.isLockedByQR = true;
      App.storage.set("bf_table_num", this.tableNumber);
    } else {
      this.tableNumber = App.storage.get("bf_table_num", "1");
      this.isLockedByQR = false;
    }

    this.orderMode = "table";
    this.activeCategory = window.MENU?.categories[0]?.id || "pizza";
    this.isProgrammaticScroll = false;
    this.lastScrollY = window.scrollY;
    this.prevCartCount = 0;

    this.renderHeader();
    this.renderHero();
    this.renderTabs();
    this.renderCatalog();
    this.renderCartBar();
    this.initScrollSpy();
    this.initScrollRhythm();
    this.bindEvents();

    if (App.cart && App.cart.subscribe) {
      App.cart.subscribe(() => {
        this.updateCatalogSteppers();
        this.updateCartBar();
        this.updateNavCart();
      });
    }

    this.updateCatalogSteppers();
    this.updateCartBar();
    this.updateNavCart();
  },

  // 1. Luxury Fixed Navbar with SVG Icons (No Emojis)
  renderHeader() {
    const root = App.qs("#header-root");
    if (!root) return;

    let tableControlHtml = "";
    if (this.isLockedByQR) {
      tableControlHtml = `
        <div class="table-compact-badge table-compact-badge--locked" title="Locked via QR">
          <span class="table-badge-num">Table #${String(this.tableNumber).padStart(2, "0")}</span>
          <span class="table-lock-mini" aria-hidden="true">${App.icons ? App.icons.lock() : ""}</span>
        </div>
      `;
    } else {
      tableControlHtml = `
        <div class="table-compact-badge">
          <span class="table-badge-icon" aria-hidden="true">${App.icons ? App.icons.utensils() : ""}</span>
          <select id="header-table-select" class="header-table-dropdown" aria-label="Select Table">
            ${Array.from({ length: 12 }, (_, i) => i + 1).map((n) => `
              <option value="${n}" ${String(this.tableNumber) === String(n) ? "selected" : ""}>
                T-${String(n).padStart(2, "0")}
              </option>
            `).join("")}
          </select>
        </div>
      `;
    }

    root.innerHTML = `
      <div class="nav-container nav-container--clean">
        <a href="index.html" class="brand-link" aria-label="Basil and Fire Home">
          <span class="brand-mark-svg" aria-hidden="true">
            ${App.icons ? App.icons.flame() : `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 2C8 7 5 11 5 15a7 7 0 0014 0c0-4-3-8-7-13z" fill="var(--ember-500)"/></svg>`}
          </span>
          <span class="brand-text">${window.CONFIG.name}</span>
        </a>

        <div class="nav-controls-cluster">
          ${tableControlHtml}

          <button type="button" class="nav-cart-btn" id="nav-cart-btn" aria-label="Open Cart Drawer">
            <span class="nav-cart-icon" aria-hidden="true">${App.icons ? App.icons.cart() : ""}</span>
            <span class="nav-cart-badge price" id="nav-cart-badge">0</span>
          </button>

          <a href="kitchen.html" class="staff-portal-btn" title="Staff KDS Login">
            <span aria-hidden="true">${App.icons ? App.icons.lock() : ""}</span>
            <span>Staff</span>
          </a>
        </div>
      </div>
    `;

    const tableSelect = App.qs("#header-table-select", root);
    if (tableSelect) {
      tableSelect.addEventListener("change", (e) => {
        this.tableNumber = e.target.value;
        App.storage.set("bf_table_num", this.tableNumber);
        this.renderHero();
        if (App.toast) App.toast(`Switched to Table #${this.tableNumber}`);
        App.haptic(10);
      });
    }

    const navCartBtn = App.qs("#nav-cart-btn", root);
    if (navCartBtn) {
      navCartBtn.addEventListener("click", () => {
        if (App.emit) App.emit("sheet:open", "cart");
        App.haptic(10);
      });
    }
  },

  updateNavCart() {
    if (!App.cart) return;
    const count = App.cart.getCount();
    const badge = App.qs("#nav-cart-badge");
    const cartBtn = App.qs("#nav-cart-btn");

    if (badge) badge.textContent = count;

    if (cartBtn && count !== this.prevCartCount && count > 0) {
      this.triggerCartBump();
    }
    this.prevCartCount = count;
  },

  triggerCartBump() {
    const cartBtn = App.qs("#nav-cart-btn");
    const barEl = App.qs("#cart-bar");

    if (cartBtn) {
      cartBtn.classList.remove("cart-bump");
      void cartBtn.offsetWidth;
      cartBtn.classList.add("cart-bump");
      setTimeout(() => cartBtn.classList.remove("cart-bump"), 360);
    }

    if (barEl && window.gsap && !App.prefersReducedMotion()) {
      gsap.fromTo(barEl, { scale: 0.95 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
    }
  },

  initScrollRhythm() {
    const header = App.qs(".app-header");
    const progressBar = App.qs("#scroll-progress-bar");

    window.addEventListener("scroll", () => {
      const currentScrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (progressBar && docHeight > 0) {
        const progress = Math.min(1, Math.max(0, currentScrollY / docHeight));
        progressBar.style.transform = `scaleX(${progress})`;
      }

      if (!header) return;

      if (currentScrollY > 24) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }

      const isSheetOpen = document.body.classList.contains("is-locked");
      const isInputFocused = document.activeElement && document.activeElement.matches("input, textarea, select");

      if (isSheetOpen || isInputFocused) {
        header.classList.remove("is-hidden");
        this.lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY > 120 && currentScrollY > this.lastScrollY) {
        header.classList.add("is-hidden");
      } else {
        header.classList.remove("is-hidden");
      }

      this.lastScrollY = currentScrollY;
    }, { passive: true });
  },

  // 2. Editorial 12-Column Hero Layout
  renderHero() {
    const root = App.qs("#hero-root");
    if (!root) return;

    const customTiming = App.storage.get("bf_custom_timing", null);
    const hoursText = customTiming?.hoursText || window.CONFIG.hoursText;

    root.innerHTML = `
      <div class="hero-container container" id="hero-interactive-zone">
        <canvas id="hero-embers-canvas" class="hero-embers-canvas" aria-hidden="true"></canvas>

        <div class="hero-grid">
          <div class="hero-content-col">
            <div class="hero-eyebrow">
              <span class="pulsing-ember-dot" aria-hidden="true"></span>
              <span class="eyebrow-text label">Wood-Fired Pizza Kitchen</span>
            </div>

            <div class="hero-headline-mask">
              <h1 class="hero-headline display">
                Basil &amp; <em class="headline-emphasis">Fire</em>
              </h1>
            </div>

            <p class="hero-subtext">
              ${window.CONFIG.tagline}. Hand-stretched slow-fermented dough, San Marzano tomatoes, and artisanal fior di latte baked at 900°F.
            </p>

            <div class="hero-cta-group">
              <button type="button" class="btn btn--primary hero-cta-btn" id="hero-explore-btn">
                <span>Explore Menu</span>
                <span class="btn-arrow-icon" aria-hidden="true">${App.icons ? App.icons.arrowDown() : "↓"}</span>
              </button>

              <button type="button" class="btn btn--ghost hero-cta-btn" id="hero-table-cta">
                <span aria-hidden="true">${App.icons ? App.icons.utensils() : ""}</span>
                <span>Table #${String(this.tableNumber).padStart(2, "0")} Order</span>
              </button>
            </div>

            <div class="hero-meta-strip">
              <span class="hero-meta-pill">
                <span class="live-pulse-dot" aria-hidden="true"></span>
                <span>${hoursText}</span>
              </span>
              <span class="hero-meta-pill hero-meta-pill--table">
                <span>Contactless Dine-In</span>
              </span>
            </div>
          </div>

          <div class="hero-visual-col">
            <div class="hero-ember-backdrop" aria-hidden="true"></div>

            <div class="hero-pizza-stage" id="hero-pizza-stage">
              <span class="basil-leaf leaf-1" aria-hidden="true">
                <svg viewBox="0 0 32 32" width="38" height="38" fill="none">
                  <path d="M16 2 C24 8 28 18 20 26 C12 34 4 24 6 16 C8 8 12 4 16 2 Z" fill="var(--basil-500)"/>
                  <path d="M16 2 C16 12 18 20 20 26" stroke="var(--basil-300)" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="basil-leaf leaf-2" aria-hidden="true">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                  <path d="M16 2 C24 8 28 18 20 26 C12 34 4 24 6 16 C8 8 12 4 16 2 Z" fill="var(--basil-700)"/>
                  <path d="M16 2 C16 12 18 20 20 26" stroke="var(--basil-500)" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="basil-leaf leaf-3" aria-hidden="true">
                <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
                  <path d="M16 2 C24 8 28 18 20 26 C12 34 4 24 6 16 C8 8 12 4 16 2 Z" fill="var(--basil-300)"/>
                </svg>
              </span>

              <div class="pizza-disc-wrapper" id="pizza-disc-wrapper">
                <img 
                  src="margherita.jpg" 
                  alt="Wood-Fired Margherita Pizza" 
                  class="pizza-disc-img photo-grade" 
                  id="hero-pizza-interactive"
                  width="420"
                  height="420"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  onerror="if(!this.dataset.retry){ this.dataset.retry='1'; this.src='hero.jpg'; } else { this.style.display='none'; this.nextElementSibling.style.display='flex'; }"
                >
                <div class="pizza-fallback-art" style="display:none;" aria-hidden="true">
                  <div class="pizza-disc-crust"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    App.qs("#hero-explore-btn")?.addEventListener("click", () => {
      const tabs = App.qs("#tabs-root");
      if (tabs) {
        tabs.scrollIntoView({ behavior: "smooth", block: "start" });
        App.haptic(10);
      }
    });

    App.qs("#hero-table-cta")?.addEventListener("click", () => {
      const select = App.qs("#header-table-select");
      if (select) select.focus();
      else App.toast(`Dine-In locked at Table #${this.tableNumber}`);
      App.haptic(10);
    });
  },

  // 3. Category Tabs
  renderTabs() {
    const root = App.qs("#tabs-root");
    if (!root) return;

    const tabsHtml = window.MENU.categories.map((cat, idx) => `
      <button type="button" class="tab-btn ${idx === 0 ? "is-active" : ""}" data-category="${cat.id}">
        ${cat.name}
      </button>
    `).join("");

    root.innerHTML = `
      <div class="tabs-scroller-wrap">
        <div class="tabs-edge-fade tabs-edge-fade--left" aria-hidden="true"></div>
        <div class="tabs-scroller">
          <div class="tabs-track">
            ${tabsHtml}
            <div class="tab-underline" id="tab-underline"></div>
          </div>
        </div>
        <div class="tabs-edge-fade tabs-edge-fade--right" aria-hidden="true"></div>
      </div>
    `;

    setTimeout(() => this.updateTabUnderline(), 50);

    root.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const catId = btn.dataset.category;
        const targetSection = App.qs(`#cat-sec-${catId}`);
        if (!targetSection) return;

        this.isProgrammaticScroll = true;
        const offset = 130;
        const targetTop = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({ top: targetTop, behavior: "smooth" });
        this.setActiveTab(catId);
        App.haptic(8);

        setTimeout(() => {
          this.isProgrammaticScroll = false;
        }, 700);
      });
    });
  },

  setActiveTab(catId) {
    if (this.activeCategory === catId) return;
    this.activeCategory = catId;
    const root = App.qs("#tabs-root");
    if (!root) return;

    root.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.category === catId);
    });

    const activeBtn = App.qs(`.tab-btn[data-category="${catId}"]`, root);
    const scroller = App.qs(".tabs-scroller", root);
    if (activeBtn && scroller) {
      const targetScroll = activeBtn.offsetLeft - (scroller.clientWidth / 2) + (activeBtn.clientWidth / 2);
      scroller.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
    }

    this.updateTabUnderline();
  },

  updateTabUnderline() {
    const underline = App.qs("#tab-underline");
    const activeTab = App.qs(".tab-btn.is-active");
    if (!underline || !activeTab) return;
    underline.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    underline.style.width = `${activeTab.offsetWidth}px`;
  },

  initScrollSpy() {
    const sections = App.qsa(".category-section");
    if (!sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      if (this.isProgrammaticScroll) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const catId = entry.target.dataset.catId;
          this.setActiveTab(catId);
        }
      });
    }, {
      rootMargin: "-20% 0px -65% 0px",
      threshold: 0
    });

    sections.forEach((sec) => observer.observe(sec));
  },

  // 4. Menu Catalog: 4/5 Aspect Ratio Food Cards, Zero Emojis & Fraunces Fallback
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
            <h2 class="category-title">
              <em>${cat.name}</em>
            </h2>
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
      <article class="item-card card" data-id="${item.id}" tabindex="0">
        <!-- 4/5 Fixed Aspect Ratio Media Container -->
        <div class="item-card__media">
          ${item.image ? `
            <div class="media-skeleton skeleton"></div>
            <img 
              src="${item.image}" 
              alt="${item.name}" 
              class="item-img photo-grade" 
              width="400"
              height="500"
              loading="lazy"
              decoding="async"
              onload="this.classList.add('is-loaded'); const s=this.previousElementSibling; if(s) s.remove();"
              onerror="if(!this.dataset.retry){ this.dataset.retry='1'; this.src='${item.id}.jpg'; } else { this.style.display='none'; const s=this.previousElementSibling; if(s) s.remove(); this.nextElementSibling.style.display='flex'; }"
            >
          ` : ""}
          <div class="photo-fallback-disc" style="${item.image ? "display:none;" : "display:flex;"}" aria-hidden="true">
            <span class="photo-fallback-brand">${item.name}</span>
          </div>
          <div class="photo-warm-overlay" aria-hidden="true"></div>

          <!-- Pure SVG Badges (No Emojis) -->
          <div class="item-badges">
            ${isVeg ? `
              <span class="badge badge--veg" title="Vegetarian">
                <span class="badge-icon-svg" aria-hidden="true">${App.icons ? App.icons.leaf() : ""}</span>
                <span>Veg</span>
              </span>
            ` : ""}
            ${isSpicy ? `
              <span class="badge badge--spicy" title="Spicy">
                <span class="badge-icon-svg" aria-hidden="true">${App.icons ? App.icons.pepper() : ""}</span>
                <span>Spicy</span>
              </span>
            ` : ""}
          </div>
        </div>

        <div class="item-card__body">
          <div class="item-card__info">
            <h3 class="item-name">${item.name}</h3>
            <p class="item-desc">${item.desc}</p>
          </div>
          <div class="item-card__footer">
            <span class="item-price price">${App.money.format(item.priceCents)}</span>
            <div class="item-action" data-item-id="${item.id}">
              ${hasOptions ? `
                <button type="button" class="btn btn-action btn-action--custom" aria-label="Customize ${item.name}">
                  <span>Add</span>
                  <span class="btn-action-icon" aria-hidden="true">${App.icons ? App.icons.plus() : "+"}</span>
                </button>
              ` : `
                <div class="stepper-morph" data-stepper-for="${item.id}">
                  <button type="button" class="btn btn-action btn-action--add" aria-label="Add ${item.name}">
                    ${App.icons ? App.icons.plus() : "+"}
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      </article>
    `;
  },

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
            <button type="button" class="stepper-btn stepper-btn--minus" data-action="minus" aria-label="Decrease quantity">
              ${App.icons ? App.icons.minus() : "−"}
            </button>
            <span class="stepper-val price">${qty}</span>
            <button type="button" class="stepper-btn stepper-btn--plus" data-action="plus" aria-label="Increase quantity">
              ${App.icons ? App.icons.plus() : "+"}
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <button type="button" class="btn btn-action btn-action--add" aria-label="Add ${item.name}">
            ${App.icons ? App.icons.plus() : "+"}
          </button>
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

      const addBtn = e.target.closest(".btn-action--add");
      if (addBtn) {
        e.stopPropagation();
        this.addQuickItem(item, addBtn);
        return;
      }

      const plusBtn = e.target.closest('.stepper-btn[data-action="plus"]');
      if (plusBtn) {
        e.stopPropagation();
        const line = App.cart.getLines().find((l) => l.itemId === item.id);
        if (line) App.cart.update(line.key, line.qty + 1);
        if (App.toast) App.toast(`Added another ${item.name}`);
        this.flyToCart(plusBtn, item.image || "margherita.jpg");
        App.haptic(10);
        return;
      }

      const minusBtn = e.target.closest('.stepper-btn[data-action="minus"]');
      if (minusBtn) {
        e.stopPropagation();
        const line = App.cart.getLines().find((l) => l.itemId === item.id);
        if (line) App.cart.update(line.key, line.qty - 1);
        App.haptic(10);
        return;
      }

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

    if (App.toast) App.toast(`Added ${item.name} for Table #${this.tableNumber}`);
    this.flyToCart(originEl, item.image || "margherita.jpg");
    App.haptic(10);
  },

  // 5. Item Detail Customizer Modal (Oven Scope, Ember Selection Rings & SVG Check)
  openItemSheet(item) {
    const root = App.qs("#item-sheet-root");
    if (!root) return;

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
      <div class="sheet" id="sheet-container" data-theme="oven" role="document">
        <div class="sheet__handle" aria-hidden="true"></div>
        <div class="sheet__head">
          <div class="sheet__title-row">
            <h2 class="sheet__title">${item.name}</h2>
            <button type="button" class="sheet__close-btn" id="sheet-close" aria-label="Close sheet">
              ${App.icons ? App.icons.close() : "✕"}
            </button>
          </div>
          <p class="sheet__desc">${item.desc}</p>
        </div>

        <div class="sheet__scroll-content">
          ${(item.options || []).map((grp) => `
            <fieldset class="sheet-group">
              <legend class="sheet-group__legend">
                <span>${grp.name}</span>
                <span class="sheet-group__hint label">${grp.required ? "Required" : "Optional"}</span>
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
                        <div class="choice-name-row">
                          <span class="choice-check-mark" aria-hidden="true">${App.icons ? App.icons.check() : "✓"}</span>
                          <span class="choice-name">${choice.name}</span>
                        </div>
                        ${choice.priceCents > 0 ? `<span class="choice-delta price">+${App.money.format(choice.priceCents)}</span>` : `<span class="choice-delta choice-delta--free">+0</span>`}
                      </div>
                    </label>
                  `;
                }).join("")}
              </div>
            </fieldset>
          `).join("")}

          <div class="sheet-group">
            <label for="item-notes" class="sheet-group__legend">Kitchen Instructions</label>
            <div class="notes-wrap">
              <textarea id="item-notes" maxlength="140" rows="2" placeholder="e.g. Extra crispy, sauce on side..."></textarea>
              <span class="notes-count label" id="notes-count">0 / 140</span>
            </div>
          </div>
        </div>

        <div class="sheet__footer">
          <div class="sheet__qty-stepper">
            <button type="button" class="sheet-qty-btn" id="sheet-qty-minus" aria-label="Decrease quantity">
              ${App.icons ? App.icons.minus() : "−"}
            </button>
            <span class="sheet-qty-val price" id="sheet-qty-val">1</span>
            <button type="button" class="sheet-qty-btn" id="sheet-qty-plus" aria-label="Increase quantity">
              ${App.icons ? App.icons.plus() : "+"}
            </button>
          </div>
          <button type="button" class="btn btn--primary sheet__add-btn" id="sheet-submit-btn">
            <span>Add to order</span>
            <span class="btn-divider" aria-hidden="true">·</span>
            <span class="price" id="sheet-btn-price">${App.money.format(calcCurrentUnit())}</span>
          </button>
        </div>
      </div>
    `;

    const sheetEl = App.qs("#sheet-container", root);
    const backdropEl = App.qs("#sheet-backdrop", root);
    const submitPriceEl = App.qs("#sheet-btn-price", root);
    let previousTotal = calcCurrentUnit();

    if (window.gsap && !App.prefersReducedMotion()) {
      gsap.fromTo(backdropEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(sheetEl, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" });
    } else {
      backdropEl.style.opacity = "1";
      sheetEl.style.transform = "none";
    }

    const updatePriceDisplay = () => {
      const unit = calcCurrentUnit();
      const total = unit * state.qty;

      if (window.gsap && !App.prefersReducedMotion()) {
        const obj = { val: previousTotal };
        gsap.to(obj, {
          val: total,
          duration: 0.2,
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

    const notesInput = App.qs("#item-notes", root);
    const notesCount = App.qs("#notes-count", root);
    notesInput.addEventListener("input", () => {
      state.notes = notesInput.value;
      notesCount.textContent = `${notesInput.value.length} / 140`;
    });

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

    const closeSheet = () => {
      root.classList.remove("is-active");
      root.innerHTML = "";
      document.body.classList.remove("is-locked");
    };

    App.qs("#sheet-close", root).addEventListener("click", closeSheet);
    backdropEl.addEventListener("click", closeSheet);

    App.qs("#sheet-submit-btn", root).addEventListener("click", (e) => {
      const extrasArray = Array.from(state.extras);
      const optionsKey = `${state.size?.id || "na"}_${state.crust?.id || "na"}_${extrasArray.map((x) => x.id).sort().join("+")}`;

      App.cart.add({
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
      });

      if (App.toast) App.toast(`Added ${item.name} for Table #${this.tableNumber}`);
      this.flyToCart(e.currentTarget, item.image || "margherita.jpg");
      App.haptic(15);
      closeSheet();
    });
  },

  // 6. Fly-to-Cart Arc Motion: 56px Circular Thumbnail along Parabolic Curve
  flyToCart(srcEl, imgSrc) {
    if (App.prefersReducedMotion() || !window.gsap || !srcEl) return;

    const cartEl = App.qs("#nav-cart-btn") || App.qs("#cart-bar");
    if (!cartEl) return;

    const s = srcEl.getBoundingClientRect();
    const t = cartEl.getBoundingClientRect();

    if (t.width === 0 && t.height === 0) return;

    const dot = document.createElement("img");
    dot.src = imgSrc || "margherita.jpg";
    dot.alt = "";
    Object.assign(dot.style, {
      position: "fixed",
      left: s.left + "px",
      top: s.top + "px",
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      objectFit: "cover",
      zIndex: "9999",
      pointerEvents: "none",
      boxShadow: "0 8px 24px rgba(255, 106, 43, 0.45)"
    });
    document.body.appendChild(dot);

    const dx = t.left + t.width / 2 - 28 - s.left;
    const dy = t.top + t.height / 2 - 28 - s.top;

    gsap.to(dot, {
      x: dx,
      duration: 0.8,
      ease: "power1.in"
    });

    gsap.to(dot, {
      y: dy,
      scale: 0.3,
      opacity: 0.6,
      duration: 0.8,
      ease: "power1.out",
      onComplete: () => {
        dot.remove();
        this.triggerCartBump();
      }
    });
  },

  renderCartBar() {
    const root = App.qs("#cart-bar-root");
    if (!root) return;

    root.innerHTML = `
      <aside class="cart-bar" id="cart-bar" role="button" tabindex="0" aria-label="Open Cart Sheet">
        <div class="cart-bar__left">
          <span class="cart-bar__badge price" id="cart-bar-badge">0</span>
          <span class="cart-bar__title">Table #${this.tableNumber} Order</span>
        </div>
        <div class="cart-bar__right">
          <span class="cart-bar__total price" id="cart-bar-total">$0.00</span>
          <span class="cart-bar__arrow" aria-hidden="true">${App.icons ? App.icons.arrowRight() : "→"}</span>
        </div>
      </aside>
    `;

    const barEl = App.qs("#cart-bar", root);
    barEl.addEventListener("click", () => {
      if (App.emit) App.emit("sheet:open", "cart");
      App.haptic(10);
    });
  },

  updateCartBar() {
    const barEl = App.qs("#cart-bar");
    const badgeEl = App.qs("#cart-bar-badge");
    const totalEl = App.qs("#cart-bar-total");
    if (!barEl || !badgeEl || !totalEl || !App.cart) return;

    const count = App.cart.getCount();
    const totals = App.money.calcTotals({
      lines: App.cart.getLines()
    });

    if (count > 0) {
      barEl.classList.add("is-visible");
      badgeEl.textContent = count;
      totalEl.textContent = App.money.format(totals.total);
    } else {
      barEl.classList.remove("is-visible");
    }
  },

  bindEvents() {
    window.addEventListener("resize", () => {
      this.updateTabUnderline();
    });
  }
});
