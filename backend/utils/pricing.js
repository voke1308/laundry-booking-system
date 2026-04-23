export const ITEM_PRICES = {
  WASH_FOLD: {
    shirt: 40,
    pant: 50,
    tshirt: 35,
    jeans: 60,
    bedsheet: 80,
    towel: 25,
    dress: 70,
    sweater: 90,
  },
  WASH_IRON: {
    shirt: 60,
    pant: 70,
    tshirt: 50,
    jeans: 80,
    bedsheet: 120,
    towel: 35,
    dress: 100,
    sweater: 130,
  },
  DRY_CLEAN: {
    suit: 250,
    blazer: 200,
    coat: 300,
    dress: 220,
    curtain: 180,
    blanket: 350,
  },
};

export const SERVICE_RATES = {
  WASH_FOLD: ITEM_PRICES.WASH_FOLD,
  WASH_IRON: ITEM_PRICES.WASH_IRON,
  DRY_CLEAN: ITEM_PRICES.DRY_CLEAN,
};

export function calculatePrice(serviceType, items = {}) {
  const prices = ITEM_PRICES[serviceType];
  if (!prices) return 0;
  
  let total = 0;
  for (const [itemType, quantity] of Object.entries(items)) {
    const qty = Number(quantity) || 0;
    const price = prices[itemType] || 0;
    total += qty * price;
  }
  return Math.max(0, Math.round(total * 100) / 100);
}
