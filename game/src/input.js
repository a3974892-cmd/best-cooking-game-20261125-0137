// Sizzle & Serve: mouse and keyboard. The input layer turns raw pointer and
// key events into actions the world understands, or UI actions (pause, mute)
// the loop handles itself. It never touches game rules.
import { INGREDIENTS, LAYOUT, binRect, fryerRect, grillSlotRect, ticketRect } from './config.js';
import { MUTE_RECT, PAUSE_RECT, plateLayerRects } from './render.js';

export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/**
 * Map one click in view space to a world action (or a UI action) using the
 * same rects the renderer draws. `world` is the live world object.
 */
export function actionForClick(x, y, world) {
  if (inside(x, y, PAUSE_RECT)) return { type: ACTION_PAUSE };
  if (inside(x, y, MUTE_RECT)) return { type: ACTION_MUTE };
  if (inside(x, y, LAYOUT.bell)) return { type: 'serveFirst' };
  if (inside(x, y, LAYOUT.trash)) return { type: 'trash' };
  for (let i = 0; i < world.state.orders.length; i += 1) {
    if (inside(x, y, ticketRect(i))) return { type: 'serve', orderId: world.state.orders[i].id };
  }
  for (let i = 0; i < world.state.grill.length; i += 1) {
    if (inside(x, y, grillSlotRect(i))) {
      const slot = world.state.grill[i];
      if (slot.state === 'done') return { type: 'takeGrill', slot: i };
      if (slot.state === 'burnt') return { type: 'clearGrill', slot: i };
      return null;
    }
  }
  if (inside(x, y, fryerRect())) {
    const slot = world.state.fryer;
    if (slot.state === 'done') return { type: 'takeFryer' };
    if (slot.state === 'burnt') return { type: 'clearFryer' };
    return null;
  }
  for (const layer of plateLayerRects(world.state.plate)) {
    if (inside(x, y, layer)) return { type: 'removePlate', index: layer.index };
  }
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (inside(x, y, binRect(i))) return { type: 'add', id: INGREDIENTS[i].id };
  }
  return null;
}

export function createInput(canvas) {
  const clicks = [];
  const keys = [];
  let hover = null;

  function toView(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 800,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    clicks.push(toView(event));
  });
  canvas.addEventListener('pointermove', (event) => {
    hover = toView(event);
  });
  canvas.addEventListener('pointerleave', () => {
    hover = null;
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.push(event.key.toLowerCase());
  });

  function takeClicks() {
    return clicks.splice(0, clicks.length);
  }
  function takeKeys() {
    return keys.splice(0, keys.length);
  }
  function getHover() {
    return hover;
  }

  return { takeClicks, takeKeys, getHover };
}
