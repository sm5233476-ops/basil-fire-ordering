// GSAP Motion Orchestration, Scroll Reveals, Press Micro-Interactions & Toast System
window.App = window.App || {};

App.register("fx", {
  init() {
    this.initToastSystem();
    this.initPressFeedback();

    // Orchestrate after initial DOM layout is stable
    setTimeout(() => {
      this.initPageLoadOrchestration();
      this.initScrollReveals();
    }, 60);

    // Provide global toast helper
    App.toast = (msg, icon) => this.showToast(msg, icon);
  },

  // 1. Page Load Orchestration Timeline
  initPageLoadOrchestration() {
    if (App.prefersReducedMotion() || !window.gsap) return;

    const header = App.qs(".app-header");
    const heroImg = App.qs(".hero-img");
    const heroTitle = App.qs(".hero-title");
    const heroTag = App.qs(".hero-tagline");
    const heroChips = App.qs(".hero-chips");
    const tabs = App.qs(".category-tabs");
    const cards = App.qsa(".item-card").slice(0, 4);

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (header) {
      tl.fromTo(header, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
    }

    if (heroImg) {
      tl.fromTo(heroImg, { scale: 1.1 }, { scale: 1, duration: 0.9, ease: "expo.out" }, "-=0.3");
    }

    if (heroTitle) {
      tl.fromTo(
        [heroTitle, heroTag, heroChips].filter(Boolean),
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
        "-=0.6"
      );
    }

    if (tabs) {
      tl.fromTo(tabs, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.3");
    }

    if (cards.length) {
      tl.fromTo(
        cards,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" },
        "-=0.2"
      );
    }
  },

  // 2. Scroll Reveals for Menu Cards
  initScrollReveals() {
    const cards = App.qsa(".item-card");
    if (!cards.length || !("IntersectionObserver" in window)) return;

    // First 4 cards handled by page load; reveal remaining as they enter viewport
    const remainingCards = cards.slice(4);

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (!App.prefersReducedMotion() && window.gsap) {
            gsap.fromTo(el, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
          } else {
            el.style.opacity = "1";
            el.style.transform = "none";
          }
          obs.unobserve(el);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: "0px 0px -40px 0px"
    });

    remainingCards.forEach((c) => {
      if (!App.prefersReducedMotion()) {
        c.style.opacity = "0";
      }
      observer.observe(c);
    });
  },

  // 3. Pointer Press Feedback (.97 Scale)
  initPressFeedback() {
    document.addEventListener("pointerdown", (e) => {
      const target = e.target.closest(".btn, .item-card, .choice-card, .time-chip, .tab-btn");
      if (!target) return;
      target.classList.add("is-pressed");
    }, { passive: true });

    const release = () => {
      document.querySelectorAll(".is-pressed").forEach((el) => el.classList.remove("is-pressed"));
    };

    document.addEventListener("pointerup", release, { passive: true });
    document.addEventListener("pointercancel", release, { passive: true });
  },

  // 4. Toast Notification System
  initToastSystem() {
    this.toastContainer = App.qs("#toast-root");
  },

  showToast(message, icon = "🍕") {
    if (!this.toastContainer) this.toastContainer = App.qs("#toast-root");
    if (!this.toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast-item";
    toast.innerHTML = `
      <span class="toast-item__icon">${icon}</span>
      <span class="toast-item__text">${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    if (window.gsap && !App.prefersReducedMotion()) {
      gsap.fromTo(
        toast,
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.5)" }
      );

      setTimeout(() => {
        gsap.to(toast, {
          y: -15,
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => toast.remove()
        });
      }, 2200);
    } else {
      setTimeout(() => toast.remove(), 2200);
    }
  }
});
