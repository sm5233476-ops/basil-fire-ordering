// GSAP Motion Engine: Preloader, Canvas Embers, Hero Signature Motion, Scroll & Toast
window.App = window.App || {};

App.register("fx", {
  init() {
    this.initToastSystem();
    this.initPressFeedback();

    // Start preloader with hero entrance triggered at 60% wipe-up
    this.initPreloader(() => {
      this.initHeroEntrance();
      this.initEmbersCanvas();
      this.initHeroScrollAndTilt();
      this.initScrollReveals();
    });

    App.toast = (msg, icon) => this.showToast(msg, icon);
  },

  // 1. Signature Preloader (≤ 1.2s, Once per session, Never hangs)
  initPreloader(onComplete) {
    let seen = false;
    try {
      seen = sessionStorage.getItem("bf_preloader_seen") === "true";
    } catch (e) {
      seen = false;
    }

    if (seen || App.prefersReducedMotion() || !window.gsap) {
      if (onComplete) onComplete();
      return;
    }

    try {
      sessionStorage.setItem("bf_preloader_seen", "true");
    } catch (e) {}

    // Inject Preloader Markup
    const overlay = document.createElement("div");
    overlay.className = "preloader-overlay";
    overlay.id = "preloader-overlay";
    overlay.setAttribute("data-theme", "oven");
    overlay.innerHTML = `
      <div class="preloader-content">
        <svg class="preloader-flame-svg" viewBox="0 0 48 48" aria-hidden="true">
          <path class="flame-stroke-path" d="M24 4C16 14 10 22 10 30a14 14 0 0028 0c0-8-6-16-14-26z" fill="none" stroke="var(--ember-500)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="preloader-line-track">
          <div class="preloader-line-fill" id="preloader-line-fill"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    let hasCompleted = false;
    const triggerComplete = () => {
      if (!hasCompleted) {
        hasCompleted = true;
        if (onComplete) onComplete();
      }
    };

    // Hard Safety Timeout (Max 1.5s guaranteed)
    const safetyTimer = setTimeout(() => {
      triggerComplete();
      if (overlay.parentNode) overlay.remove();
    }, 1500);

    const tl = gsap.timeline({
      onComplete: () => {
        clearTimeout(safetyTimer);
        triggerComplete();
        overlay.remove();
      }
    });

    const flamePath = overlay.querySelector(".flame-stroke-path");
    const lineFill = overlay.querySelector("#preloader-line-fill");

    if (flamePath) {
      const length = flamePath.getTotalLength ? flamePath.getTotalLength() : 120;
      gsap.set(flamePath, { strokeDasharray: length, strokeDashoffset: length });
      tl.to(flamePath, { strokeDashoffset: 0, duration: 0.65, ease: "power2.out" }, 0);
    }

    if (lineFill) {
      tl.to(lineFill, { scaleX: 1, duration: 0.65, ease: "power2.inOut" }, 0.05);
    }

    // Wipe-up layer with hero entrance starting at 60% of the wipe
    tl.to(overlay, {
      yPercent: -100,
      duration: 0.55,
      ease: "power4.inOut",
      onStart: () => {
        setTimeout(() => triggerComplete(), 200);
      }
    }, 0.7);
  },

  // 2. Hero Signature Entrance Motion
  initHeroEntrance() {
    if (App.prefersReducedMotion() || !window.gsap) return;

    const headline = App.qs(".hero-headline");
    const eyebrow = App.qs(".hero-eyebrow");
    const subtext = App.qs(".hero-subtext");
    const ctas = App.qs(".hero-cta-group");
    const meta = App.qs(".hero-meta-strip");
    const pizza = App.qs("#pizza-disc-wrapper");
    const leaves = App.qsa(".basil-leaf");

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    if (headline) {
      tl.fromTo(
        headline,
        { yPercent: 105 },
        { yPercent: 0, duration: 1.1, ease: "expo.out" },
        0
      );
    }

    if (eyebrow) {
      tl.fromTo(eyebrow, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.1);
    }

    if (subtext) {
      tl.fromTo(subtext, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.2);
    }

    if (ctas) {
      tl.fromTo(ctas, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.3);
    }

    if (meta) {
      tl.fromTo(meta, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.4);
    }

    if (pizza) {
      tl.fromTo(
        pizza,
        { scale: 0.9, rotate: -12, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, duration: 1.4, ease: "power3.out" },
        0.1
      );
    }

    if (leaves.length) {
      tl.fromTo(
        leaves,
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, stagger: 0.08, ease: "back.out(1.7)" },
        0.4
      );
    }
  },

  // 3. Scroll-Linked Pizza Rotation & Desktop Tilt Interaction
  initHeroScrollAndTilt() {
    const heroSection = App.qs("#hero-root");
    const pizza = App.qs("#hero-pizza-interactive");
    const glow = App.qs(".hero-ember-backdrop");
    const zone = App.qs("#hero-interactive-zone");

    if (!pizza || App.prefersReducedMotion()) return;

    let ticking = false;

    // Scroll-Linked Rotation (Up to 40deg, scale to 1.08, transform only)
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const heroHeight = heroSection ? heroSection.offsetHeight : 600;

          if (scrollY <= heroHeight) {
            const ratio = scrollY / heroHeight;
            const rotateDeg = ratio * 40;
            const scaleVal = 1 + ratio * 0.08;
            pizza.style.transform = `rotate(${rotateDeg}deg) scale(${scaleVal})`;

            if (glow) {
              glow.style.opacity = String(Math.max(0, 1 - ratio * 1.2));
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Desktop Pointer Hover Tilt (±5deg quickTo spring)
    if (zone && window.matchMedia("(min-width: 1024px)").matches && window.gsap) {
      const tiltX = gsap.quickTo(pizza, "rotationY", { duration: 0.4, ease: "power2.out" });
      const tiltY = gsap.quickTo(pizza, "rotationX", { duration: 0.4, ease: "power2.out" });

      zone.addEventListener("pointermove", (e) => {
        const rect = zone.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        tiltX(x * 10);
        tiltY(-y * 10);
      });

      zone.addEventListener("pointerleave", () => {
        tiltX(0);
        tiltY(0);
      });
    }
  },

  // 4. Rising Canvas Embers (36 Desktop / 14 Mobile, Auto-Pause Offscreen & Tab Hidden)
  initEmbersCanvas() {
    const canvas = App.qs("#hero-embers-canvas");
    if (!canvas || App.prefersReducedMotion()) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;
    let animId = null;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 14 : 36;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const colors = ["#FF8A55", "#FF6A2B", "#E2B24A"];
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Embers Particles Generator
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * 80,
      radius: 1.5 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: 0.8 + Math.random() * 1.4,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
      alpha: 0.2 + Math.random() * 0.7
    }));

    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * 0.5;

        // Fade near the top
        const fadeRatio = Math.min(1, p.y / (height * 0.4));
        const currentAlpha = p.alpha * fadeRatio;

        if (p.y < -10) {
          p.y = height + Math.random() * 20;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    // Auto-Pause when Hero is Off-Screen
    const heroRoot = App.qs("#hero-root");
    if (heroRoot && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isRunning) {
              isRunning = true;
              render();
            }
          } else {
            isRunning = false;
            if (animId) cancelAnimationFrame(animId);
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroRoot);
    }

    // Auto-Pause when Tab is Hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
      } else {
        if (!isRunning) {
          isRunning = true;
          render();
        }
      }
    });

    render();
  },

  // 5. Scroll Reveals for Catalog Cards
  initScrollReveals() {
    const cards = App.qsa(".item-card");
    if (!cards.length || !("IntersectionObserver" in window)) return;

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

  // 6. Global Press Feedback (.97 Scale)
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

  // 7. Toast Alerts
  initToastSystem() {
    this.toastContainer = App.qs("#toast-root");
  },

  showToast(message, icon = "🍕") {
    if (!this.toastContainer) this.toastContainer = App.qs("#toast-root");
    if (!this.toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast-item";
    toast.innerHTML = `
      <span class="toast-item__icon" aria-hidden="true">${icon}</span>
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
