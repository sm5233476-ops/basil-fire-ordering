// Application Registry, Bootstrapper, Event Bus & Failsafe
(function () {
  // 1. Immediately indicate JS availability
  document.documentElement.classList.add("has-js");

  // 8-second Failsafe: ensure nothing remains invisibly locked if scripts halt
  setTimeout(() => {
    document.documentElement.classList.add("app-loaded");
  }, 8000);

  window.App = window.App || {};
  const modules = window.App._modules || {};
  const events = {};

  // Event Bus
  App.on = function (evt, handler) {
    if (!events[evt]) events[evt] = [];
    events[evt].push(handler);
  };

  App.off = function (evt, handler) {
    if (!events[evt]) return;
    events[evt] = events[evt].filter((h) => h !== handler);
  };

  App.emit = function (evt, data) {
    if (!events[evt]) return;
    events[evt].forEach((handler) => {
      try { handler(data); } catch (e) { console.error(`[Event Error] ${evt}:`, e); }
    });
  };

  // Module Registry
  App.register = function (name, api) {
    modules[name] = api;
  };

  // Utilities
  App.qs = (selector, parent = document) => parent.querySelector(selector);
  App.qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  
  App.el = function (tag, attrs = {}, html = "") {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === "className" || key === "class") element.className = val;
      else if (key.startsWith("data-")) element.setAttribute(key, val);
      else if (key === "aria-label") element.setAttribute(key, val);
      else element[key] = val;
    });
    if (html) element.innerHTML = html;
    return element;
  };

  App.prefersReducedMotion = function () {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  App.haptic = function (ms = 10) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  };

  // Fixed Boot Pipeline
  const BOOT_ORDER = ["fx", "shared", "menu", "cart", "checkout", "tracker", "kitchen"];

  App.boot = function () {
    BOOT_ORDER.forEach((name) => {
      if (modules[name] && typeof modules[name].init === "function") {
        try {
          modules[name].init();
        } catch (err) {
          console.error(`[Boot Error] Failed to initialize module "${name}":`, err);
        }
      }
    });

    document.documentElement.classList.add("app-loaded");
    document.body.classList.add("app-ready");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", App.boot);
  } else {
    App.boot();
  }
})();
