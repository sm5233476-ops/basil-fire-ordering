// Kitchen KDS Engine with Staff PIN Security (1234), Table Support & Audio Chime
window.App = window.App || {};

App.register("kitchen", {
  init() {
    this.audioCtx = null;
    this.currentPin = "";
    this.masterPin = "1234";

    this.initSecurityGate();
    this.initAudioContext();
    this.initQRModal();
    this.initTimers();

    // Cross-Tab Orders Synchronizer
    if (App.orders && App.orders.subscribe) {
      App.orders.subscribe((event) => {
        if (event.type === "created") {
          this.playChime();
        }
        if (this.isAuthenticated()) {
          this.renderBoard(event.order?.id);
        }
      });
    }
  },

  // 1. PIN Gate: Protects KDS from random public visitors
  isAuthenticated() {
    return sessionStorage.getItem("bf_kds_auth") === "true";
  },

  initSecurityGate() {
    const lockScreen = App.qs("#pin-lock-screen");
    const kdsWrapper = App.qs("#kds-wrapper");
    const dots = App.qs("#pin-dots");

    const updateDots = () => {
      if (!dots) return;
      const dotEls = dots.querySelectorAll(".dot");
      dotEls.forEach((d, idx) => {
        d.classList.toggle("is-filled", idx < this.currentPin.length);
      });
    };

    const unlock = () => {
      sessionStorage.setItem("bf_kds_auth", "true");
      if (window.gsap && !App.prefersReducedMotion()) {
        gsap.to(lockScreen, {
          opacity: 0,
          scale: 0.98,
          duration: 0.35,
          onComplete: () => {
            lockScreen.style.display = "none";
            kdsWrapper.style.display = "block";
            this.renderBoard();
          }
        });
      } else {
        lockScreen.style.display = "none";
        kdsWrapper.style.display = "block";
        this.renderBoard();
      }
    };

    if (this.isAuthenticated()) {
      lockScreen.style.display = "none";
      kdsWrapper.style.display = "block";
      this.renderBoard();
    }

    // Keypad Click Listeners
    document.querySelectorAll(".pin-key[data-num]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.currentPin.length < 4) {
          this.currentPin += btn.dataset.num;
          updateDots();
          App.haptic(10);

          if (this.currentPin.length === 4) {
            setTimeout(() => {
              if (this.currentPin === this.masterPin) {
                unlock();
              } else {
                this.shakePin();
                this.currentPin = "";
                updateDots();
                App.haptic(40);
              }
            }, 120);
          }
        }
      });
    });

    // Clear and Backspace
    App.qs("#pin-clear")?.addEventListener("click", () => {
      this.currentPin = "";
      updateDots();
    });

    App.qs("#pin-back")?.addEventListener("click", () => {
      this.currentPin = this.currentPin.slice(0, -1);
      updateDots();
    });

    // Keyboard support for typing PIN directly
    window.addEventListener("keydown", (e) => {
      if (this.isAuthenticated()) return;
      if (e.key >= "0" && e.key <= "9" && this.currentPin.length < 4) {
        this.currentPin += e.key;
        updateDots();
        if (this.currentPin.length === 4) {
          if (this.currentPin === this.masterPin) unlock();
          else {
            this.shakePin();
            this.currentPin = "";
            updateDots();
          }
        }
      } else if (e.key === "Backspace") {
        this.currentPin = this.currentPin.slice(0, -1);
        updateDots();
      }
    });

    // Lock KDS Button
    App.qs("#lock-kds-btn")?.addEventListener("click", () => {
      sessionStorage.removeItem("bf_kds_auth");
      this.currentPin = "";
      updateDots();
      kdsWrapper.style.display = "none";
      lockScreen.style.display = "flex";
      lockScreen.style.opacity = "1";
    });

    // Simulate Order Button
    App.qs("#simulate-order-btn")?.addEventListener("click", () => {
      this.simulateRealisticOrder();
      App.haptic(15);
    });

    // Mobile Column Switcher Pills
    document.querySelectorAll(".kds-tab-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".kds-tab-pill").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const col = btn.dataset.col;
        document.querySelectorAll(".kds-column").forEach((c) => {
          c.classList.toggle("is-mob-visible", c.dataset.status === col);
        });
      });
    });
  },

  shakePin() {
    const dots = App.qs("#pin-dots");
    if (!dots) return;
    dots.classList.add("is-error");
    setTimeout(() => dots.classList.remove("is-error"), 400);
  },

  // 2. Synthesized WebAudio Chime (No ugly button, plays automatically on new order)
  initAudioContext() {
    const unlockAudio = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        if (this.audioCtx.state === "suspended") this.audioCtx.resume();
      } catch (e) {
        console.warn("[WebAudio] Init note:", e);
      }
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio, { once: true });
  },

  playChime() {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === "suspended") this.audioCtx.resume();

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn("[Audio Error]:", e);
    }
  },

  // 3. Dine-In Table QR Generator
  initQRModal() {
    const openBtn = App.qs("#qr-modal-open-btn");
    const backdrop = App.qs("#qr-backdrop");
    const closeBtn = App.qs("#qr-close-btn");
    const select = App.qs("#table-select-input");
    const imgWrap = App.qs("#qr-code-img-wrap");
    const headline = App.qs("#qr-table-headline");
    const testBtn = App.qs("#qr-test-open-btn");

    if (!openBtn || !backdrop) return;

    const updateQR = (tableNum) => {
      const origin = window.location.origin + window.location.pathname.replace("kitchen.html", "index.html");
      const targetUrl = `${origin}?table=${tableNum}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=12-10-0E&bgcolor=F7-F0-E6&data=${encodeURIComponent(targetUrl)}`;

      imgWrap.innerHTML = `<img src="${qrApiUrl}" alt="Table ${tableNum} QR Code" class="qr-img">`;
      headline.textContent = `TABLE #${tableNum.padStart(2, "0")}`;
      testBtn.textContent = `Test Open Table #${tableNum} in New Tab ↗`;
      testBtn.onclick = () => window.open(targetUrl, "_blank");
    };

    openBtn.addEventListener("click", () => {
      backdrop.style.display = "flex";
      updateQR(select.value);
    });

    closeBtn?.addEventListener("click", () => {
      backdrop.style.display = "none";
    });

    select?.addEventListener("change", (e) => {
      updateQR(e.target.value);
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.style.display = "none";
    });
  },

  // 4. Order Simulation
  simulateRealisticOrder() {
    const isTableOrder = Math.random() > 0.45;
    const tableNum = Math.floor(1 + Math.random() * 8);
    const names = ["Jordan M.", "Priya S.", "Lucas R.", "Elena D.", "Liam K."];
    const name = names[Math.floor(Math.random() * names.length)];
    const mode = isTableOrder ? "table" : (Math.random() > 0.5 ? "delivery" : "pickup");
    const address = isTableOrder ? `Table #${tableNum}` : (mode === "delivery" ? "42 Oakway Lane" : "Counter Pickup");

    const allItems = window.MENU?.items || [];
    const item1 = allItems[Math.floor(Math.random() * 5)] || allItems[0];
    const item2 = allItems[5 + Math.floor(Math.random() * (allItems.length - 5))];

    const lines = [
      {
        itemId: item1.id,
        name: item1.name,
        priceCents: item1.priceCents,
        unitPriceCents: item1.priceCents + 300,
        options: { size: "Medium 12\"", crust: "Classic", extras: ["Extra cheese"] },
        notes: isTableOrder ? `Table #${tableNum}` : "Well done crust",
        qty: 1
      }
    ];

    if (item2) {
      lines.push({
        itemId: item2.id,
        name: item2.name,
        priceCents: item2.priceCents,
        unitPriceCents: item2.priceCents,
        options: null,
        notes: "",
        qty: 1
      });
    }

    const totals = App.money.calcTotals({ lines, mode });

    App.orders.create({
      mode,
      tableNumber: isTableOrder ? tableNum : null,
      timeLabel: isTableOrder ? `Dine-In (Table #${tableNum})` : `ASAP (${mode === "delivery" ? window.CONFIG.etaDelivery : window.CONFIG.etaPickup})`,
      customer: {
        name,
        phone: "+1 555-0182",
        address
      },
      lines,
      subtotal: totals.subtotal,
      discount: 0,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      total: totals.total,
      notes: isTableOrder ? `Table #${tableNum}` : ""
    });
  },

  // 5. Render Board
  renderBoard(highlightId = null) {
    if (!this.isAuthenticated()) return;
    const orders = App.orders.list();

    const cols = {
      new: App.qs("#col-new"),
      preparing: App.qs("#col-preparing"),
      ready: App.qs("#col-ready"),
      completed: App.qs("#col-completed")
    };

    if (!cols.new || !cols.preparing || !cols.ready || !cols.completed) return;

    const buckets = {
      new: orders.filter((o) => o.status === "new"),
      preparing: orders.filter((o) => o.status === "preparing"),
      ready: orders.filter((o) => o.status === "ready"),
      completed: orders.filter((o) => o.status === "completed")
    };

    // Update Counter Badges
    ["new", "preparing", "ready", "completed"].forEach((status) => {
      const count = buckets[status].length;
      const elDesk = App.qs(`#count-${status}`);
      const elMob = App.qs(`#mob-count-${status}`);
      if (elDesk) elDesk.textContent = count;
      if (elMob) elMob.textContent = count;
    });

    // Render Cards in Each Column
    Object.keys(buckets).forEach((status) => {
      let list = buckets[status];
      if (status === "completed" && list.length > 10) {
        list = list.slice(0, 10);
      }
      cols[status].innerHTML = list.map((order) => this.renderOrderCard(order, highlightId)).join("");
    });

    this.bindCardActions();
  },

  renderOrderCard(order, highlightId) {
    const isNewFlash = order.id === highlightId;
    const elapsed = this.getElapsedTime(order.createdAt);
    const isTable = order.mode === "table";
    const isDelivery = order.mode === "delivery";

    let badgeHtml = "";
    if (isTable) {
      badgeHtml = `<span class="k-badge k-badge--table">🍽️ DINE-IN ${order.customer?.address || ""}</span>`;
    } else if (isDelivery) {
      badgeHtml = `<span class="k-badge k-badge--del">🛵 DELIVERY</span>`;
    } else {
      badgeHtml = `<span class="k-badge k-badge--pic">🛍️ PICKUP</span>`;
    }

    let nextBtnHtml = "";
    if (order.status === "new") {
      nextBtnHtml = `<button type="button" class="btn btn--primary k-action-btn" data-action="preparing" data-id="${order.id}">Accept & Fire →</button>`;
    } else if (order.status === "preparing") {
      nextBtnHtml = `<button type="button" class="btn btn--ready k-action-btn" data-action="ready" data-id="${order.id}">Mark Ready →</button>`;
    } else if (order.status === "ready") {
      nextBtnHtml = `<button type="button" class="btn btn--complete k-action-btn" data-action="completed" data-id="${order.id}">Served / Done ✓</button>`;
    } else {
      nextBtnHtml = `<span class="k-done-tag">Order Fulfilled</span>`;
    }

    return `
      <article class="k-card ${isNewFlash ? "card-flash" : ""}" data-order-id="${order.id}">
        <div class="k-card__top">
          <div class="k-order-identity">
            <span class="k-order-id">${order.id}</span>
            <span class="k-customer-name">${order.customer?.name || "Guest"}</span>
          </div>
          <span class="k-timer-pill" data-created="${order.createdAt}">⏱️ ${elapsed}</span>
        </div>

        <div class="k-card__meta">
          ${badgeHtml}
          ${!isTable && order.customer?.phone ? `<span class="k-phone-tag">${order.customer.phone}</span>` : ""}
        </div>

        ${isDelivery ? `<p class="k-addr-tag">📍 ${order.customer?.address || ""}</p>` : ""}

        <div class="k-card__items-box">
          ${order.lines.map((l) => {
            const opts = l.options ? Object.values(l.options).flat().filter(Boolean).join(", ") : "";
            return `
              <div class="k-item-line">
                <span class="k-qty-num">${l.qty}x</span>
                <span class="k-food-name">${l.name}</span>
                ${opts ? `<span class="k-opts-text">(${opts})</span>` : ""}
                ${l.notes ? `<div class="k-note-highlight">“${l.notes}”</div>` : ""}
              </div>
            `;
          }).join("")}
        </div>

        <div class="k-card__bottom">
          <span class="k-order-price">${App.money.format(order.total)}</span>
          ${nextBtnHtml}
        </div>
      </article>
    `;
  },

  getElapsedTime(created) {
    if (!created) return "Just now";
    const mins = Math.floor((Date.now() - created) / 60000);
    if (mins <= 0) return "Just now";
    return `${mins}m ago`;
  },

  initTimers() {
    setInterval(() => {
      document.querySelectorAll(".k-timer-pill").forEach((el) => {
        const timestamp = parseInt(el.dataset.created, 10);
        if (timestamp) el.textContent = `⏱️ ${this.getElapsedTime(timestamp)}`;
      });
    }, 30000);
  },

  bindCardActions() {
    document.querySelectorAll(".k-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const nextStatus = btn.dataset.action;
        App.orders.updateStatus(id, nextStatus);
        App.haptic(10);
      });
    });
  }
});
