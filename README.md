# 🍕 Basil & Fire — Wood-Fired Pizza Kitchen

> A high-performance, native-feel online ordering web app built for small restaurants to eliminate marketplace commissions.

**Live Customer App:** [basil-fire-ordering.vercel.app](https://basil-fire-ordering.vercel.app/)  
**Live Kitchen Display Board:** [basil-fire-ordering.vercel.app/kitchen.html](https://basil-fire-ordering.vercel.app/kitchen.html)

---

## 🌟 Overview & Concept
**Basil & Fire** is a concept portfolio project created by **Shivam Mishra**. It demonstrates that independent restaurants can provide a frictionless, native app-like ordering experience on the web without relying on commission-heavy third-party aggregators.

Built with pure **HTML5, CSS3, and Vanilla JavaScript**—zero bundlers, zero build steps, and zero external runtime frameworks beyond GSAP and Google Fonts.

---

## ✨ Key Features

### 1. Customer Ordering App (`index.html`)
- **Native-Like Mobile Experience:** Designed mobile-first at 390px with safe-area insets, fluid typography (`clamp()`), and smooth touch interactions.
- **Desktop Two-Column Layout:** Menus on the left, sticky order summary panel anchored on the right.
- **Menu Catalogue & Sticky Tabs:** Scroll-spy navigation with isolated sliding underline indicators.
- **Customizable Bottom Sheet:** Spring open animation, drag-to-dismiss, size/crust radio cards, extras, and live price tweens.
- **Motion & Micro-Interactions:** GSAP-driven page-load timeline, fly-to-cart curved path animation, press scale feedback (`.97`), and animated toast alerts.
- **Smart Money Engine:** Real-time integer-cents financial rules, automated tax calculation, promo code verification (`WELCOME10`), and minimum delivery checks.
- **Direct WhatsApp Dispatch:** Generates formatted, URL-encoded order receipts dispatched directly to WhatsApp.
- **Live Multi-Tab Tracker:** 4-step real-time fulfillment tracker with animated SVG stroke checkmark and persistent active order restoration.

### 2. Kitchen Fulfillment Display (`kitchen.html`)
- **Real-Time Kanban Board:** Four fulfillment columns (`New`, `Preparing`, `Ready`, `Completed`) with horizontal scroll-snap on mobile.
- **Cross-Tab Synchronization:** Synchronizes orders live across customer and kitchen tabs using the browser `BroadcastChannel` API and storage event fallbacks.
- **WebAudio Acoustic Chime:** Pleasant two-tone synthesizer chime triggered whenever new orders arrive.
- **Order Simulator:** Single-click simulation creating randomized, realistic orders from the menu.
- **Dynamic Elapsed Timers:** Real-time counter refreshed every 30 seconds.

---

## 🛠️ Architecture & Tech Stack
- **Languages:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Global Architecture:** Strict modular namespace (`window.App.register`) with deterministic boot pipeline.
- **Animation Engine:** [GSAP 3](https://greensock.com/gsap/) for timelines, spring sheets, particle flight, and number tweens.
- **Audio:** WebAudio API synthesized oscillators (no external MP3 assets needed).
- **Typography:** *Bricolage Grotesque* (headings) & *Inter* (body).
- **Zero Backend Sync:** Powered by `localStorage` persistence and `BroadcastChannel("bf-orders")`.

---

## 🧪 Testing the Dual-Screen Demo
To experience the real-time fulfillment flow:
1. Open the **Customer App** in one browser window.
2. Open the **Kitchen Board** (`/kitchen.html`) in a second window side-by-side.
3. Enable sound in the kitchen, then place an order from the customer app (or click **Simulate Order**).
4. Watch the kitchen board slide the card in with a sound alert, and advance the order status—the customer tracker updates live instantly without refreshing!

---

## 📄 Legal & Concept Notice
> Concept project by **Shivam Mishra**. Basil & Fire is a fictional restaurant. No payments are processed.
