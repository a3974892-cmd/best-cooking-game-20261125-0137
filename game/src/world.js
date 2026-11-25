// Sizzle & Serve: the kitchen itself. The world holds orders, the grill, the
// fryer, the plate and the score, and advances them in fixed steps. It knows
// nothing about the canvas or the keyboard: input hands it actions, the loop
// hands it time, and it answers with events the sounds and announcements use.
import {
  GRILL_SLOTS,
  INGREDIENTS,
  MAX_HEARTS,
  MAX_ORDERS,
  MENU,
  MENU_WEIGHTS,
  PATTY_BURN_SECONDS,
  PATTY_COOK_SECONDS,
  FRIES_BURN_SECONDS,
  FRIES_COOK_SECONDS,
  SHIFT_SECONDS,
  patienceSeconds,
  spawnGapSeconds,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_ADD = 1 << 0;
export const EVENT_COOKED = 1 << 1;
export const EVENT_SERVED = 1 << 2;
export const EVENT_EXPIRED = 1 << 3;
export const EVENT_BURNT = 1 << 4;
export const EVENT_WRONG = 1 << 5;
export const EVENT_TRASH = 1 << 6;
export const EVENT_OVER = 1 << 7;
export const EVENT_START = 1 << 8;

export const KIND_BUN = 'bun';
export const KIND_PATTY = 'patty';
export const KIND_FRIES = 'fries';

let nextOrderId = 1;

function emptyCooker() {
  return { state: 'empty', t: 0 };
}

function makeOrder(rng, elapsed) {
  const dish = rng.weighted(MENU, MENU_WEIGHTS);
  const patience = patienceSeconds(elapsed);
  return {
    id: nextOrderId,
    dish,
    born: elapsed,
    patience,
    left: patience,
    state: 'waiting',
  };
}

export function createWorld(rng) {
  const state = {
    rng,
    time: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    hearts: MAX_HEARTS,
    orders: [],
    grill: [emptyCooker(), emptyCooker()],
    fryer: emptyCooker(),
    plate: [],
    floats: [],
    particles: [],
    nextOrderIn: 1.2,
    over: false,
    overReason: '',
    started: false,
  };

  function reset() {
    state.time = 0;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.hearts = MAX_HEARTS;
    state.orders = [];
    state.grill = [emptyCooker(), emptyCooker()];
    state.fryer = emptyCooker();
    state.plate = [];
    state.floats = [];
    state.particles = [];
    state.nextOrderIn = 1.2;
    state.over = false;
    state.overReason = '';
    state.started = true;
    nextOrderId = 1;
  }

  function spawnOrder(forceDishId) {
    if (state.orders.length >= MAX_ORDERS) return null;
    let order;
    if (forceDishId) {
      const dish = MENU.find((d) => d.id === forceDishId) ?? MENU[0];
      const patience = patienceSeconds(state.time);
      order = { id: nextOrderId, dish, born: state.time, patience, left: patience, state: 'waiting' };
    } else {
      order = makeOrder(state.rng, state.time);
    }
    nextOrderId += 1;
    state.orders.push(order);
    return order;
  }

  function floatText(x, y, text, color) {
    state.floats.push({ x, y, text, color: color ?? '#fff', life: 1.1 });
  }

  function steam(x, y) {
    state.particles.push({ x, y, vx: (state.rng.next() - 0.5) * 12, vy: -26 - state.rng.next() * 18, life: 0.9, size: 5 + state.rng.next() * 5 });
  }

  /** Does the plate hold exactly the dish's ingredients, as a multiset? */
  function plateMatches(dish) {
    if (state.plate.length !== dish.needs.length) return false;
    const counts = {};
    for (const item of state.plate) counts[item] = (counts[item] ?? 0) + 1;
    for (const item of dish.needs) {
      if (!counts[item]) return false;
      counts[item] -= 1;
    }
    return true;
  }

  function firstMatchingOrder() {
    for (const order of state.orders) {
      if (order.state === 'waiting' && plateMatches(order.dish)) return order;
    }
    return null;
  }

  function serveOrder(order) {
    const tip = 1 + Math.floor((3 * order.left) / order.patience) + (state.combo >= 3 ? 2 : 0);
    const earned = order.dish.price + tip;
    state.score += earned;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    order.state = 'served';
    state.orders = state.orders.filter((o) => o !== order);
    state.plate = [];
    floatText(684, 300, `+$${earned}`, '#ffd94d');
    if (state.combo >= 2) floatText(684, 330, `COMBO x${state.combo}`, '#ff9f43');
    return earned;
  }

  function finishShift(reason) {
    state.over = true;
    state.overReason = reason;
    return EVENT_OVER;
  }

  /**
   * One player action. Returns an event bitmask. Actions are ignored once
   * the shift is over; the loop restarts through reset() instead.
   */
  function act(action) {
    if (state.over || !state.started) return EVENT_NONE;
    switch (action.type) {
      case 'add': {
        const ingredient = INGREDIENTS.find((i) => i.id === action.id);
        if (!ingredient) return EVENT_NONE;
        if (action.id === KIND_PATTY) {
          const slot = state.grill.findIndex((s) => s.state === 'empty');
          if (slot === -1) return EVENT_WRONG;
          state.grill[slot] = { state: 'cooking', t: 0 };
          return EVENT_ADD;
        }
        if (action.id === KIND_FRIES) {
          if (state.fryer.state !== 'empty') return EVENT_WRONG;
          state.fryer = { state: 'cooking', t: 0 };
          return EVENT_ADD;
        }
        if (state.plate.length >= 6) return EVENT_WRONG;
        state.plate.push(action.id);
        return EVENT_ADD;
      }
      case 'takeGrill': {
        const slot = state.grill[action.slot];
        if (!slot || slot.state !== 'done') return EVENT_WRONG;
        if (state.plate.length >= 6) return EVENT_WRONG;
        state.plate.push(KIND_PATTY);
        state.grill[action.slot] = emptyCooker();
        return EVENT_ADD;
      }
      case 'takeFryer': {
        if (state.fryer.state !== 'done') return EVENT_WRONG;
        if (state.plate.length >= 6) return EVENT_WRONG;
        state.plate.push(KIND_FRIES);
        state.fryer = emptyCooker();
        return EVENT_ADD;
      }
      case 'clearGrill': {
        const slot = state.grill[action.slot];
        if (!slot || slot.state !== 'burnt') return EVENT_NONE;
        state.grill[action.slot] = emptyCooker();
        return EVENT_TRASH;
      }
      case 'clearFryer': {
        if (state.fryer.state !== 'burnt') return EVENT_NONE;
        state.fryer = emptyCooker();
        return EVENT_TRASH;
      }
      case 'removePlate': {
        if (action.index < 0 || action.index >= state.plate.length) return EVENT_NONE;
        state.plate.splice(action.index, 1);
        return EVENT_TRASH;
      }
      case 'trash': {
        if (state.plate.length === 0) return EVENT_NONE;
        state.plate = [];
        return EVENT_TRASH;
      }
      case 'serve': {
        const order = state.orders.find((o) => o.id === action.orderId && o.state === 'waiting');
        if (!order) return EVENT_NONE;
        if (!plateMatches(order.dish)) return EVENT_WRONG;
        serveOrder(order);
        return EVENT_SERVED;
      }
      case 'serveFirst': {
        const order = firstMatchingOrder();
        if (!order) return EVENT_WRONG;
        serveOrder(order);
        return EVENT_SERVED;
      }
      default:
        return EVENT_NONE;
    }
  }

  /** Advance the kitchen by `dt` seconds. `attract` keeps the title screen alive. */
  function step(dt, attract) {
    let events = EVENT_NONE;
    if (state.over) return events;
    state.time += dt;

    for (const f of state.floats) f.life -= dt;
    state.floats = state.floats.filter((f) => f.life > 0);
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    if (!state.started) return events;
    if (attract) return events;

    const timeLeft = SHIFT_SECONDS - state.time;
    if (timeLeft <= 0) return finishShift('shift');

    // Fresh orders arrive on a shrinking gap.
    state.nextOrderIn -= dt;
    if (state.nextOrderIn <= 0) {
      spawnOrder();
      state.nextOrderIn = spawnGapSeconds(state.time);
    }

    // Patience drains; a ticket left too long costs a heart.
    for (const order of [...state.orders]) {
      order.left -= dt;
      if (order.left <= 0) {
        order.state = 'expired';
        state.orders = state.orders.filter((o) => o !== order);
        state.combo = 0;
        state.hearts -= 1;
        events |= EVENT_EXPIRED;
        if (state.hearts <= 0) return finishShift('hearts') | events;
      }
    }

    // The grill: raw to cooked, cooked to burnt.
    for (let i = 0; i < GRILL_SLOTS; i += 1) {
      const slot = state.grill[i];
      if (slot.state === 'cooking') {
        slot.t += dt;
        if (state.rng.next() < dt * 6) steam(90 + i * 140, 260);
        if (slot.t >= PATTY_COOK_SECONDS) {
          slot.state = 'done';
          slot.t = 0;
          events |= EVENT_COOKED;
        }
      } else if (slot.state === 'done') {
        slot.t += dt;
        if (slot.t >= PATTY_BURN_SECONDS) {
          slot.state = 'burnt';
          slot.t = 0;
          events |= EVENT_BURNT;
        }
      }
    }

    // The fryer: same story, quicker.
    const fryer = state.fryer;
    if (fryer.state === 'cooking') {
      fryer.t += dt;
      if (state.rng.next() < dt * 8) steam(415, 260);
      if (fryer.t >= FRIES_COOK_SECONDS) {
        fryer.state = 'done';
        fryer.t = 0;
        events |= EVENT_COOKED;
      }
    } else if (fryer.state === 'done') {
      fryer.t += dt;
      if (fryer.t >= FRIES_BURN_SECONDS) {
        fryer.state = 'burnt';
        fryer.t = 0;
        events |= EVENT_BURNT;
      }
    }

    return events;
  }

  return { state, reset, spawnOrder, act, step, plateMatches, firstMatchingOrder };
}
