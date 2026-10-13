// Kitchen KDS Engine with Payment Status (Paid/Unpaid) & Archive Done List
window.App = window.App || {};

App.register("kitchen", {
  init() {
    this.audioCtx = null;
    this.currentPin = "";

    this.initSecurityGate();
    this.initAudioContext();
    this.initSettingsModal();
    this.initQRModal();
    this.initTimers();

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

  getMasterPin() {
    return App.storage.get("bf_custom_pin", "1234");
  },

  isAuthenticated() {
    return sessionStorage.getItem("bf_kds_auth") === "true";
  },

  initSecurityGate() {
    const lockScreen = App.qs("#pin-lock-screen");
    const kdsWrapper = App.qs("#kds-wrapper");
    const dots = App.qs("#pin-dots");
    const hintText = App.qs("#kds-pin-hint-text");

    if (hintText) {
      hintText.innerHTML = `Passcode: <strong>${this.getMasterPin()}</strong>`;
    }

    const updateDots = () => {
      if (!dots) return;
      const dotEls = dots.querySelectorAll(".dot");
      dotEls.forEach((d, idx) => {
        d.style.backgroundColor = idx < this.currentPin.length ? "#FF5A36" : "transparent";
        d.style.borderColor = idx < this.currentPin.length ? "#FF5A36" : "rgba(255,255,255,0.2)";
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

    document.querySelectorAll(".pin-key[data-num]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.currentPin.length < 4) {
          this.currentPin += btn.dataset.num;
          updateDots();
          App.haptic(10);

          if (this.currentPin.length === 4) {
            setTimeout(() => {
              if (this.currentPin === this.getMasterPin()) {
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

    App.qs("#pin-clear")?.addEventListener("click", () => {
      this.currentPin = "";
      updateDots();
    });

    App.qs("#pin-back")?.addEventListener("click", () => {
      this.currentPin = this.currentPin.slice(0, -1);
      updateDots();
    });

    window.addEventListener("keydown", (e) => {
      if (this.isAuthenticated()) return;
      if (e.key >= "0" && e.key <= "9" && this.currentPin.length < 4) {
        this.currentPin += e.key;
        updateDots();
        if (this.currentPin.length === 4) {
          if (this.currentPin === this.getMasterPin()) unlock();
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

    // Clear Done / Archive Completed Orders
    App.qs("#btn-clear-done")?.addEventListener("click", () => {
      const orders = App.orders.list();
      const activeOnly = orders.filter((o) => o.status !== "completed");
      App.storage.set("bf_orders_v1", activeOnly);
      this.renderBoard();
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

  initSettingsModal() {
    const openBtn = App.qs("#kds-settings-open-btn");
    const backdrop = App.qs("#kds-settings-backdrop");
    const closeBtn = App.qs("#settings-close-btn");

    const pinInput = App.qs("#input-new-pin");
    const btnSavePin = App.qs("#btn-save-new-pin");
    const pinMsg = App.qs("#pin-change-status");

    const delInput = App.qs("#input-eta-delivery");
    const picInput = App.qs("#input-eta-pickup");
    const hoursInput = App.qs("#input-hours-text");
    const btnSaveTimings = App.qs("#btn-save-timings");
    const timingMsg = App.qs("#timing-change-status");

    if (!openBtn || !backdrop) return;

    openBtn.addEventListener("click", () => {
      backdrop.style.display = "flex";
      const customTiming = App.storage.get("bf_custom_timing", null);
      if (delInput) delInput.value = customTiming?.etaDelivery || window.CONFIG.etaDelivery;
      if (picInput) picInput.value = customTiming?.etaPickup || window.CONFIG.etaPickup;
      if (hoursInput) hoursInput.value = customTiming?.hoursText || window.CONFIG.hoursText;
      if (pinMsg) pinMsg.textContent = "";
      if (timingMsg) timingMsg.textContent = "";
    });

    closeBtn?.addEventListener("click", () => {
      backdrop.style.display = "none";
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.style.display = "none";
    });

    btnSavePin?.addEventListener("click", () => {
      const newPin = (pinInput?.value || "").trim();
      if (/^\d{4}$/.test(newPin)) {
        App.storage.set("bf_custom_pin", newPin);
        pinMsg.textContent = `✓ Passcode updated to ${newPin}!`;
        pinMsg.style.color = "#8BD18F";
        pinInput.value = "";
        App.haptic(15);
      } else {
        pinMsg.textContent = "Enter exactly 4 digits";
        pinMsg.style.color = "#FF5A36";
        App.haptic(25);
      }
    });

    btnSaveTimings?.addEventListener("click", () => {
      const newTiming = {
        etaDelivery: delInput?.value.trim() || window.CONFIG.etaDelivery,
        etaPickup: picInput?.value.trim() || window.CONFIG.etaPickup,
        hoursText: hoursInput?.value.trim() || window.CONFIG.hoursText
      };
      App.storage.set("bf_custom_timing", newTiming);
      timingMsg.textContent = "✓ Kitchen Timings saved!";
      timingMsg.style.color = "#8BD18F";
      App.haptic(15);
    });
  },

  initAudioContext() {
    const unlockAudio = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        if (this.audioCtx.state === "suspended") this.audioCtx.resume();
      } catch (e) {}
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
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {}
  },

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
      headline.textContent = `TABLE #${String(tableNum).padStart(2, "0")}`;
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

    ["new", "preparing", "ready", "completed"].forEach((status) => {
      const count = buckets[status].length;
      const elDesk = App.qs(`#count-${status}`);
      const elMob = App.qs(`#mob-count-${status}`);
      if (elDesk) elDesk.textContent = count;
      if (elMob) elMob.textContent = count;
    });

    Object.keys(buckets).forEach((status) => {
      let list = buckets[status];
      if (list.length === 0) {
        cols[status].innerHTML = `
          <div class="kds-empty-col">
            <span class="empty-col-icon">✨</span>
            <p>Station clear</p>
          </div>
        `;
      } else {
        cols[status].innerHTML = list.map((order) => this.renderOrderCard(order, highlightId)).join("");
      }
    });

    this.bindCardActions();
  },

  renderOrderCard(order, highlightId) {
    const isNewFlash = order.id === highlightId;
    const elapsed = this.getElapsedTime(order.createdAt);
    const isTable = order.mode === "table";
    const isDelivery = order.mode === "delivery";
    const isPaid = order.paymentSettled === true;

    let badgeHtml = "";
    if (isTable) {
      badgeHtml = `<span class="k-badge k-badge--table">🍽️ DINE-IN ${order.customer?.address || ""}</span>`;
    } else if (isDelivery) {
      badgeHtml = `<span class="k-badge k-badge--del">🛵 DELIVERY</span>`;
    } else {
      badgeHtml = `<span class="k-badge k-badge--pic">🛍️ PICKUP</span>`;
    }

    const payStatusHtml = isPaid
      ? `<span class="k-pay-badge k-pay-badge--paid">PAID ✓</span>`
      : `<button type="button" class="btn-mark-paid" data-id="${order.id}">Mark Paid 💵</button>`;

    let nextBtnHtml = "";
    if (order.status === "new") {
      nextBtnHtml = `<button type="button" class="btn btn--primary k-action-btn" data-action="preparing" data-id="${order.id}">Accept & Fire →</button>`;
    } else if (order.status === "preparing") {
      nextBtnHtml = `<button type="button" class="btn btn--ready k-action-btn" data-action="ready" data-id="${order.id}">Mark Ready →</button>`;
    } else if (order.status === "ready") {
      nextBtnHtml = `<button type="button" class="btn btn--complete k-action-btn" data-action="completed" data-id="${order.id}">Done ✓</button>`;
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
          ${payStatusHtml}
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
    // Advance Order Status
    document.querySelectorAll(".k-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const nextStatus = btn.dataset.action;
        App.orders.updateStatus(id, nextStatus);
        App.haptic(10);
      });
    });

    // Mark Paid Toggle
    document.querySelectorAll(".btn-mark-paid").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const orders = App.orders.list();
        const target = orders.find((o) => o.id === id);
        if (target) {
          target.paymentSettled = true;
          App.storage.set("bf_orders_v1", orders);
          this.renderBoard();
          App.haptic(15);
        }
      });
    });
  }
});
