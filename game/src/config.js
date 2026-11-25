// Sizzle & Serve: constants, menu, layout and tuning for the cooking game.
// Everything the world, renderer and input agree on lives here so a number
// only ever changes in one place.
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;
export const BEST_KEY = 'sizzle-and-serve-best';

/** One ingredient bin on the counter. `key` is its keyboard shortcut. */
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', color: '#e8a94e', hint: 'Bottom & top' },
  { id: 'patty', name: 'Patty', key: '2', color: '#7a4a2b', hint: 'Grill it first' },
  { id: 'cheese', name: 'Cheese', key: '3', color: '#f7c948', hint: 'Melts on' },
  { id: 'lettuce', name: 'Lettuce', key: '4', color: '#5da24a', hint: 'Fresh crunch' },
  { id: 'tomato', name: 'Tomato', key: '5', color: '#d94f3d', hint: 'Ripe slice' },
  { id: 'fries', name: 'Fries', key: '6', color: '#f2c14e', hint: 'Fryer first' },
  { id: 'drink', name: 'Soda', key: '7', color: '#b678d8', hint: 'Pour & go' },
];

/** The menu: what each ticket asks for, in plate multiset terms. */
export const MENU = [
  { id: 'classic', name: 'Classic Burger', price: 8, needs: ['bun', 'patty', 'lettuce'] },
  { id: 'cheese', name: 'Cheese Burger', price: 10, needs: ['bun', 'patty', 'cheese', 'tomato'] },
  { id: 'double', name: 'Double Stack', price: 13, needs: ['bun', 'patty', 'patty', 'cheese'] },
  { id: 'garden', name: 'Garden Burger', price: 9, needs: ['bun', 'lettuce', 'tomato', 'cheese'] },
  { id: 'fries', name: 'Crispy Fries', price: 4, needs: ['fries'] },
  { id: 'soda', name: 'Berry Soda', price: 3, needs: ['drink'] },
];

/** How a dish is picked: burgers most of the time, quick snacks as filler. */
export const MENU_WEIGHTS = [26, 24, 16, 14, 11, 9];

export const GRILL_SLOTS = 2;
export const PATTY_COOK_SECONDS = 5;
export const PATTY_BURN_SECONDS = 5;
export const FRIES_COOK_SECONDS = 4;
export const FRIES_BURN_SECONDS = 6;

/** Order pacing: spawn gap and patience shrink as the shift goes on. */
export function spawnGapSeconds(elapsed) {
  return Math.max(5, 9 - elapsed * 0.028);
}
export function patienceSeconds(elapsed) {
  return Math.max(28, 45 - elapsed * 0.09);
}

/** Stars for the end-of-shift score. */
export function starsForScore(score) {
  if (score >= 100) return 3;
  if (score >= 70) return 2;
  if (score >= 40) return 1;
  return 0;
}

// ---- Layout: every rect the renderer draws and the input tests, in view space.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: VIEW_W, h: 64 },
  board: { x: 8, y: 72, w: VIEW_W - 16, h: 124 },
  grill: { x: 24, y: 212, w: 300, h: 210 },
  fryer: { x: 344, y: 212, w: 170, h: 210 },
  plate: { x: 534, y: 212, w: 300, h: 210 },
  bell: { x: 854, y: 212, w: 180, h: 210 },
  trash: { x: 1054, y: 212, w: 202, h: 210 },
  counter: { x: 8, y: 442, w: VIEW_W - 16, h: 240 },
  bottomBar: { x: 0, y: 700, w: VIEW_W, h: 100 },
};

/** Ticket cards across the order board. */
export function ticketRect(index) {
  const gap = 10;
  const w = (LAYOUT.board.w - gap * (MAX_ORDERS - 1)) / MAX_ORDERS;
  return { x: LAYOUT.board.x + index * (w + gap), y: LAYOUT.board.y, w, h: LAYOUT.board.h };
}

/** Ingredient bins across the counter. */
export function binRect(index) {
  const gap = 10;
  const w = (LAYOUT.counter.w - gap * (INGREDIENTS.length - 1)) / INGREDIENTS.length;
  return { x: LAYOUT.counter.x + index * (w + gap), y: LAYOUT.counter.y + 8, w, h: 168 };
}

/** The two grill slots, side by side inside the grill station. */
export function grillSlotRect(slot) {
  const g = LAYOUT.grill;
  const w = (g.w - 36) / GRILL_SLOTS;
  return { x: g.x + 12 + slot * (w + 12), y: g.y + 74, w, h: 108 };
}

/** The single fryer basket. */
export function fryerRect() {
  const f = LAYOUT.fryer;
  return { x: f.x + 14, y: f.y + 74, w: f.w - 28, h: 108 };
}
