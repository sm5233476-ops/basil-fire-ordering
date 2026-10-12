// Kitchen Board Display, WebAudio Chime, Simulation & Scroll-Snap Columns
window.App = window.App || {};

App.register("kitchen", {
  init() {
    this.soundEnabled = false;
    this.audioCtx = null;
    this.collapsedCompleted = true;

    this.bindHeaderControls();
    this.renderBoard();
    this.initTimers();

    // Subscribe to live orders across tabs
    if (App.orders && App.orders.subscribe) {
      App.orders.subscribe((event) => {
        if (event.type === "created") {
          this.playChime();
        }
        this.renderBoard(event.order?.id);
      });
    }
  },

  // 1. WebAudio Two-Tone Pleasant Chime
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      console.warn("[WebAudio] Not supported", e);
    }
  },

  playChime() {
    if (!this.soundEnabled || !this.audioCtx) return;

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    // First tone (587.33 Hz - D5) then ramp to (880 Hz - A5)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  },

  // 2. Sound Toggle & Simulate Order
  bindHeaderControls() {
    const audioBtn = App.qs("#audio-toggle-btn");
    const simBtn = App.qs("#simulate-order-btn");

    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        if (!this.audioCtx) this.initAudio();
        this.soundEnabled = !this.soundEnabled;
        if (this.soundEnabled && this.audioCtx.state === "suspended") {
          this.audioCtx.resume();
        }

        audioBtn.textContent = this.soundEnabled ? "🔔 Sound ON" : "Enable Sound";
        audioBtn.classList.toggle("btn--primary", this.soundEnabled);
        audioBtn.classList.toggle("btn--ghost", !this.soundEnabled);

        if (this.soundEnabled) this.playChime();
      });
    }

    if (simBtn) {
      simBtn.addEventListener("click", () => {
        this.simulateRealisticOrder();
      });
    }
  },

  simulateRealisticOrder() {
    const names = ["Jordan M.", "Priya S.", "Lucas R.", "Elena D.", "Liam K."];
    const streets = ["42 Oakway Lane", "18 Maple Crescent", "88 Pine Street", "7 Harbor View"];
    const name = names[Math.floor(Math.random() * names.length)];
    const mode = Math.random() > 0.5 ? "delivery" : "pickup";
    const address = mode === "delivery" ? streets[Math.floor(Math.random() * streets.length)] : "Pickup at Counter";

    // Random items from MENU
    const allItems = window.MENU?.items || [];
    const item1 = allItems[Math.floor(Math.random() * 5)] || allItems[0]; // Pizza
    const item2 = allItems[5 + Math.floor(Math.random() * (allItems.length - 5))]; // Side or Drink

    const lines = [
      {
        itemId: item1.id,
        name: item1.name,
        priceCents: item1.priceCents,
        unitPriceCents: item1.priceCents + 300,
        options: { size: "Medium 12\"", crust: "Classic", extras: ["Extra cheese"] },
        notes: "Crispy crust please",
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
      timeLabel: `ASAP (${mode === "delivery" ? window.CONFIG.etaDelivery : window.CONFIG.etaPickup})`,
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
      notes: ""
    });
  },

  // 3. Render Columns and Counters
  renderBoard(highlightId = null) {
    const orders = App.orders.list();

    const cols = {
      new: App.qs("#col-new"),
      preparing: App.qs("#col-preparing"),
      ready: App.qs("#col-ready"),
      completed: App.qs("#col-completed")
    };

    if (!cols.new || !cols.preparing || !cols.ready || !cols.completed) return;

    // Filter buckets
    const buckets = {
      new: orders.filter((o) => o.status === "new"),
      preparing: orders.filter((o) => o.status === "preparing"),
      ready: orders.filter((o) => o.status === "ready"),
      completed: orders.filter((o) => o.status === "completed")
    };

    // Update counters
    App.qs("#count-new").textContent = buckets.new.length;
    App.qs("#count-preparing").textContent = buckets.preparing.length;
    App.qs("#count-ready").textContent = buckets.ready.length;
    App.qs("#count-completed").textContent = buckets.completed.length;

    // Render cards
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
    const isDelivery = order.mode === "delivery";

    let nextActionHtml = "";
    if (order.status === "new") {
      nextActionHtml = `<button type="button" class="btn btn--primary k-action-btn" data-action="preparing" data-id="${order.id}">Accept & Prepare →</button>`;
    } else if (order.status === "preparing") {
      nextActionHtml = `<button type="button" class="btn btn--ready k-action-btn" data-action="ready" data-id="${order.id}">Mark Ready (${isDelivery ? "Deliver" : "Pickup"}) →</button>`;
    } else if (order.status === "ready") {
      nextActionHtml = `<button type="button" class="btn btn--complete k-action-btn" data-action="completed" data-id="${order.id}">Complete Order ✓</button>`;
    } else {
      nextActionHtml = `<span class="k-archived-tag">Fulfillment Done</span>`;
    }

    return `
      <article class="k-card ${isNewFlash ? "card-flash" : ""}" data-order-id="${order.id}">
        <div class="k-card__head">
          <div>
            <span class="k-card__id">${order.id}</span>
            <span class="k-card__name">${order.customer?.name || "Customer"}</span>
          </div>
          <span class="k-timer" data-created="${order.createdAt}">${elapsed}</span>
        </div>

        <div class="k-card__meta">
          <span class="badge ${isDelivery ? "badge--del" : "badge--pic"}">${order.mode.toUpperCase()}</span>
          <span class="k-card__phone">${order.customer?.phone || ""}</span>
        </div>

        ${isDelivery ? `<p class="k-card__addr">📍 ${order.customer?.address || ""}</p>` : ""}

        <div class="k-card__items">
          ${order.lines.map((l) => {
            const opts = l.options ? Object.values(l.options).flat().filter(Boolean).join(", ") : "";
            return `
              <div class="k-card__item-line">
                <span class="k-item-qty">${l.qty}x</span>
                <span class="k-item-name">${l.name}</span>
                ${opts ? `<span class="k-item-opts">(${opts})</span>` : ""}
                ${l.notes ? `<div class="k-item-note">Note: "${l.notes}"</div>` : ""}
              </div>
            `;
          }).join("")}
        </div>

        <div class="k-card__foot">
          <span class="k-card__total">${App.money.format(order.total)}</span>
          ${nextActionHtml}
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
      document.querySelectorAll(".k-timer").forEach((el) => {
        const timestamp = parseInt(el.dataset.created, 10);
        if (timestamp) el.textContent = this.getElapsedTime(timestamp);
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
