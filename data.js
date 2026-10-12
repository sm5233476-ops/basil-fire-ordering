// CONFIG and MENU definition for Basil & Fire
window.CONFIG = {
  name: "Basil & Fire",
  tagline: "Wood-fired pizza, made to order",
  whatsapp: "919899452192",
  currency: "USD",
  locale: "en-US",
  deliveryFeeCents: 350,
  freeDeliveryOverCents: 3500,
  minDeliveryCents: 1000,
  taxRate: 0.08,
  promo: { code: "WELCOME10", percent: 10 },
  etaPickup: "20-25 min",
  etaDelivery: "35-45 min",
  hoursText: "Open daily 11am to 10pm",
  scheduleSlots: [
    "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
    "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
  ]
};

const PIZZA_OPTIONS = [
  {
    id: "size",
    name: "Size",
    required: true,
    type: "single",
    choices: [
      { id: "sm", name: 'Small 10"', priceCents: 0, default: true },
      { id: "md", name: 'Medium 12"', priceCents: 300 },
      { id: "lg", name: 'Large 14"', priceCents: 600 }
    ]
  },
  {
    id: "crust",
    name: "Crust",
    required: true,
    type: "single",
    choices: [
      { id: "classic", name: "Classic", priceCents: 0, default: true },
      { id: "thin", name: "Thin", priceCents: 0 }
    ]
  },
  {
    id: "extras",
    name: "Add Extras",
    required: false,
    type: "multiple",
    choices: [
      { id: "extra_cheese", name: "Extra cheese", priceCents: 200 },
      { id: "mushrooms", name: "Mushrooms", priceCents: 150 },
      { id: "olives", name: "Olives", priceCents: 100 },
      { id: "jalapenos", name: "Jalapenos", priceCents: 100 },
      { id: "chili_oil", name: "Chili oil", priceCents: 50 }
    ]
  }
];

const PASTA_OPTIONS = [
  {
    id: "extras",
    name: "Add Extras",
    required: false,
    type: "multiple",
    choices: [
      { id: "extra_parmesan", name: "Extra parmesan", priceCents: 100 }
    ]
  }
];

window.MENU = {
  heroImage: "hero.jpg",
  categories: [
    { id: "pizza", name: "Pizzas" },
    { id: "starters", name: "Starters" },
    { id: "pasta", name: "Pasta" },
    { id: "desserts", name: "Desserts" },
    { id: "drinks", name: "Drinks" }
  ],
  items: [
    // Pizzas
    {
      id: "margherita",
      category: "pizza",
      name: "Margherita",
      desc: "San Marzano tomato, fior di latte, basil and olive oil.",
      priceCents: 1200,
      tags: ["veg"],
      image: "margherita.jpg",
      options: PIZZA_OPTIONS
    },
    {
      id: "pepperoni",
      category: "pizza",
      name: "Pepperoni",
      desc: "Spicy pepperoni, mozzarella, tomato and oregano.",
      priceCents: 1400,
      tags: ["spicy"],
      image: "pepperoni.jpg",
      options: PIZZA_OPTIONS
    },
    {
      id: "four-cheese",
      category: "pizza",
      name: "Four Cheese",
      desc: "Mozzarella, gorgonzola, parmesan and fontina on a white base.",
      priceCents: 1500,
      tags: ["veg"],
      image: "four-cheese.jpg",
      options: PIZZA_OPTIONS
    },
    {
      id: "mushroom",
      category: "pizza",
      name: "Mushroom & Truffle",
      desc: "Roasted mushrooms, mozzarella, thyme and truffle oil.",
      priceCents: 1600,
      tags: ["veg"],
      image: "mushroom.jpg",
      options: PIZZA_OPTIONS
    },
    {
      id: "veggie",
      category: "pizza",
      name: "Veggie Garden",
      desc: "Peppers, red onion, olives, zucchini, tomato and basil.",
      priceCents: 1400,
      tags: ["veg"],
      image: "veggie.jpg",
      options: PIZZA_OPTIONS
    },

    // Starters
    {
      id: "garlic-knots",
      category: "starters",
      name: "Garlic Knots",
      desc: "Six warm knots with garlic butter and parsley.",
      priceCents: 600,
      tags: ["veg"],
      image: "garlic-knots.jpg",
      options: null
    },
    {
      id: "burrata",
      category: "starters",
      name: "Burrata & Tomato",
      desc: "Creamy burrata, heirloom tomato, basil and balsamic.",
      priceCents: 1100,
      tags: ["veg"],
      image: "burrata.jpg",
      options: null
    },

    // Pasta
    {
      id: "spaghetti",
      category: "pasta",
      name: "Spaghetti Pomodoro",
      desc: "Slow-cooked tomato sauce, garlic and basil.",
      priceCents: 1300,
      tags: ["veg"],
      image: "spaghetti.jpg",
      options: PASTA_OPTIONS
    },
    {
      id: "penne",
      category: "pasta",
      name: "Baked Penne",
      desc: "Penne baked with tomato sauce, mozzarella and parmesan.",
      priceCents: 1400,
      tags: ["veg"],
      image: "penne.jpg",
      options: PASTA_OPTIONS
    },

    // Desserts
    {
      id: "tiramisu",
      category: "desserts",
      name: "Tiramisu",
      desc: "Espresso-soaked ladyfingers with mascarpone cream and cocoa.",
      priceCents: 700,
      tags: ["veg"],
      image: "tiramisu.jpg",
      options: null
    },
    {
      id: "cannoli",
      category: "desserts",
      name: "Cannoli",
      desc: "Crisp shells filled with sweet ricotta and pistachio.",
      priceCents: 600,
      tags: ["veg"],
      image: "cannoli.jpg",
      options: null
    },

    // Drinks
    {
      id: "lemonade",
      category: "drinks",
      name: "House Lemonade",
      desc: "Fresh lemon, a little sugar, lots of ice.",
      priceCents: 400,
      tags: ["veg"],
      image: "lemonade.jpg",
      options: null
    },
    {
      id: "sparkling",
      category: "drinks",
      name: "Sparkling Water",
      desc: "Chilled, 500 ml.",
      priceCents: 300,
      tags: ["veg"],
      image: "og.jpg",
      options: null
    }
  ]
};
