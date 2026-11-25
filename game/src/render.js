// Sizzle & Serve: everything the player sees, painted on one canvas. The
// renderer only reads the world; it never changes it. Screens: title, play,
// paused and game over. All art is drawn shapes — no image or font files.
import {
  GRILL_SLOTS,
  INGREDIENTS,
  LAYOUT,
  MENU,
  SHIFT_SECONDS,
  binRect,
  fryerRect,
  grillSlotRect,
  starsForScore,
  ticketRect,
} from './config.js';
import { PATTY_BURN_SECONDS, PATTY_COOK_SECONDS, FRIES_BURN_SECONDS, FRIES_COOK_SECONDS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Top-right buttons, shared with input. */
export const PAUSE_RECT = { x: 1160, y: 12, w: 44, h: 40 };
export const MUTE_RECT = { x: 1108, y: 12, w: 44, h: 40 };

const INK = '#2b2118';
const CREAM = '#fff8ec';
const RED = '#d94f3d';
const GREEN = '#5da24a';
const AMBER = '#e8a13c';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight ?? '700'} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function ingredientColor(id) {
  return (INGREDIENTS.find((i) => i.id === id) ?? { color: '#999' }).color;
}

/** A small icon of one ingredient, drawn at (x, y) with size s. */
export function drawIngredientIcon(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 24;
  if (id === 'bun') {
    ctx.fillStyle = '#e8a94e';
    ctx.beginPath();
    ctx.arc(0, 2 * u, 11 * u, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d18f33';
    ctx.fillRect(-11 * u, 2 * u, 22 * u, 3 * u);
    ctx.fillStyle = '#fff2cf';
    for (const sx of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.ellipse(sx * u, -4 * u, 1.6 * u, 1 * u, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = '#7a4a2b';
    rr(ctx, -11 * u, -5 * u, 22 * u, 10 * u, 4 * u);
    ctx.fill();
    ctx.fillStyle = '#5d3620';
    ctx.fillRect(-8 * u, -2 * u, 16 * u, 2 * u);
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(-11 * u, -6 * u);
    ctx.lineTo(11 * u, -6 * u);
    ctx.lineTo(4 * u, 6 * u);
    ctx.lineTo(-4 * u, 6 * u);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#5da24a';
    ctx.beginPath();
    ctx.moveTo(-11 * u, 0);
    for (let i = 0; i <= 4; i += 1) ctx.quadraticCurveTo((-11 + i * 5.5 + 2.75) * u, (i % 2 === 0 ? -7 : 3) * u, (-11 + (i + 1) * 5.5) * u, 0);
    ctx.lineTo(11 * u, 5 * u);
    ctx.lineTo(-11 * u, 5 * u);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#d94f3d';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * u, 7 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e87a6b';
    ctx.beginPath();
    ctx.ellipse(-3 * u, -2 * u, 5 * u, 3 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'fries') {
    ctx.fillStyle = '#f2c14e';
    for (const sx of [-7, -2, 3, 8]) ctx.fillRect((sx - 1.5) * u, -9 * u, 3 * u, 14 * u);
    ctx.fillStyle = '#c9402e';
    ctx.beginPath();
    ctx.moveTo(-11 * u, -2 * u);
    ctx.lineTo(11 * u, -2 * u);
    ctx.lineTo(8 * u, 10 * u);
    ctx.lineTo(-8 * u, 10 * u);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'drink') {
    ctx.fillStyle = '#b678d8';
    ctx.beginPath();
    ctx.moveTo(-8 * u, -8 * u);
    ctx.lineTo(8 * u, -8 * u);
    ctx.lineTo(6 * u, 10 * u);
    ctx.lineTo(-6 * u, 10 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-8 * u, -8 * u, 16 * u, 3 * u);
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.moveTo(4 * u, -8 * u);
    ctx.lineTo(8 * u, -14 * u);
    ctx.stroke();
  }
  ctx.restore();
}

/** The stacked burger on the plate, drawn bottom-up from `plate` items. */
function drawBurger(ctx, cx, baseY, plate, scale) {
  const w = 150 * scale;
  const x = cx - w / 2;
  let y = baseY;
  // Bottom bun.
  ctx.fillStyle = '#d18f33';
  rr(ctx, x, y - 14 * scale, w, 14 * scale, 6 * scale);
  ctx.fill();
  y -= 14 * scale;
  for (const item of plate) {
    if (item === 'bun') continue;
    if (item === 'patty') {
      ctx.fillStyle = '#7a4a2b';
      rr(ctx, x - 4 * scale, y - 13 * scale, w + 8 * scale, 13 * scale, 6 * scale);
      ctx.fill();
      y -= 13 * scale;
    } else if (item === 'cheese') {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(x - 4 * scale, y - 12 * scale);
      ctx.lineTo(x + w + 4 * scale, y - 12 * scale);
      ctx.lineTo(x + w - 8 * scale, y);
      ctx.lineTo(x + 8 * scale, y);
      ctx.closePath();
      ctx.fill();
      y -= 12 * scale;
    } else if (item === 'lettuce') {
      ctx.fillStyle = '#5da24a';
      ctx.beginPath();
      ctx.moveTo(x - 6 * scale, y - 4 * scale);
      for (let i = 0; i <= 4; i += 1) {
        ctx.quadraticCurveTo((x + (i * 0.25 + 0.125) * w) , y - (i % 2 === 0 ? 12 : 4) * scale, x + ((i + 1) * 0.25) * w, y - 4 * scale);
      }
      ctx.lineTo(x + w + 6 * scale, y + 2 * scale);
      ctx.lineTo(x - 6 * scale, y + 2 * scale);
      ctx.closePath();
      ctx.fill();
      y -= 10 * scale;
    } else if (item === 'tomato') {
      ctx.fillStyle = '#d94f3d';
      rr(ctx, x - 2 * scale, y - 11 * scale, w + 4 * scale, 11 * scale, 5 * scale);
      ctx.fill();
      y -= 11 * scale;
    } else if (item === 'fries') {
      drawIngredientIcon(ctx, 'fries', cx + w / 2 + 34 * scale, baseY - 16 * scale, 30 * scale);
    } else if (item === 'drink') {
      drawIngredientIcon(ctx, 'drink', cx - w / 2 - 34 * scale, baseY - 16 * scale, 30 * scale);
    }
  }
  // Top bun dome, only when the plate has a bun.
  if (plate.includes('bun')) {
    ctx.fillStyle = '#e8a94e';
    ctx.beginPath();
    ctx.arc(cx, y, (w / 2) * 0.98, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const sx of [-0.28, 0, 0.28]) {
      ctx.beginPath();
      ctx.ellipse(cx + sx * w, y - w * 0.22, 3.4 * scale, 2.2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Layer hit-rects for the plate, matching drawBurger's geometry exactly. */
export function plateLayerRects(plate) {
  const rects = [];
  const cx = LAYOUT.plate.x + LAYOUT.plate.w / 2;
  const w = 150;
  const baseY = LAYOUT.plate.y + 168;
  let y = baseY - 14; // Above the bottom bun slab.
  for (let index = 0; index < plate.length; index += 1) {
    const item = plate[index];
    if (item === 'bun' || item === 'fries' || item === 'drink') continue;
    const h = item === 'patty' ? 13 : item === 'cheese' ? 12 : item === 'lettuce' ? 10 : 11;
    rects.push({ index, x: cx - w / 2 - 6, y: y - h, w: w + 12, h });
    y -= h;
  }
  return rects;
}

function drawHeart(ctx, x, y, s, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 20, s / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -5);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
  ctx.closePath();
  ctx.fillStyle = filled ? '#e8452c' : '#d8cfc4';
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx, x, y, r, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffc93c' : '#d8cfc4';
  ctx.fill();
  ctx.strokeStyle = '#c89b1e';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawTicket(ctx, order, index, world) {
  const r = ticketRect(index);
  const dish = order.dish;
  const frac = Math.max(0, order.left / order.patience);
  const match = world.plateMatches(dish);
  ctx.save();
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fillStyle = match ? '#fff3c4' : CREAM;
  ctx.fill();
  ctx.strokeStyle = match ? '#e8a13c' : '#e0d5c1';
  ctx.lineWidth = match ? 3 : 2;
  ctx.stroke();
  // Header: dish name + price.
  ctx.fillStyle = RED;
  rr(ctx, r.x, r.y, r.w, 34, 12);
  ctx.fill();
  ctx.fillRect(r.x, r.y + 22, r.w, 12);
  text(ctx, dish.name, r.x + 12, r.y + 24, 17, '#fff', 'left');
  text(ctx, `$${dish.price}`, r.x + r.w - 12, r.y + 24, 17, '#ffe9a8', 'right');
  // Ingredient chips.
  let cx = r.x + 22;
  const cy = r.y + 62;
  for (const need of dish.needs) {
    ctx.fillStyle = '#f4ecdc';
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.fill();
    drawIngredientIcon(ctx, need, cx, cy, 22);
    cx += 38;
  }
  if (match) {
    ctx.fillStyle = GREEN;
    rr(ctx, r.x + r.w - 92, r.y + 44, 80, 24, 12);
    ctx.fill();
    text(ctx, 'READY!', r.x + r.w - 52, r.y + 62, 14, '#fff', 'center');
  }
  // Patience bar.
  const barY = r.y + r.h - 18;
  ctx.fillStyle = '#e8ded0';
  rr(ctx, r.x + 12, barY, r.w - 24, 10, 5);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? GREEN : frac > 0.25 ? AMBER : RED;
  if (frac > 0.01) {
    rr(ctx, r.x + 12, barY, (r.w - 24) * frac, 10, 5);
    ctx.fill();
  }
  ctx.restore();
}

function drawGrill(ctx, world, t) {
  const g = LAYOUT.grill;
  ctx.save();
  text(ctx, 'GRILL', g.x + 6, g.y + 26, 17, '#7a5c3e', 'left');
  rr(ctx, g.x, g.y + 34, g.w, g.h - 34, 12);
  ctx.fillStyle = '#3a3330';
  ctx.fill();
  ctx.strokeStyle = '#241f1d';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < GRILL_SLOTS; i += 1) {
    const s = grillSlotRect(i);
    const slot = world.state.grill[i];
    ctx.fillStyle = '#241f1d';
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#565049';
    ctx.lineWidth = 1;
    for (let gy = s.y + 18; gy < s.y + s.h - 8; gy += 14) {
      ctx.beginPath();
      ctx.moveTo(s.x + 8, gy);
      ctx.lineTo(s.x + s.w - 8, gy);
      ctx.stroke();
    }
    if (slot.state === 'cooking' || slot.state === 'done') {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      // Flames while cooking.
      if (slot.state === 'cooking') {
        const flick = Math.sin(t * 9 + i * 2) * 4;
        ctx.fillStyle = 'rgba(255, 140, 40, 0.85)';
        ctx.beginPath();
        ctx.ellipse(cx, s.y + s.h - 8, 26 + flick, 10, 0, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = slot.state === 'done' ? '#8a5a34' : '#6b3f22';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 34, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = slot.state === 'done' ? '#a06a3e' : '#54301a';
      ctx.beginPath();
      ctx.ellipse(cx - 6, cy - 4, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      if (slot.state === 'cooking') {
        const frac = slot.t / PATTY_COOK_SECONDS;
        ctx.strokeStyle = '#ffd94d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
        ctx.stroke();
      } else {
        text(ctx, 'READY', cx, cy + 38, 13, '#ffd94d', 'center');
      }
    } else if (slot.state === 'burnt') {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      ctx.fillStyle = '#161211';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 34, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'BURNT!', cx, cy + 38, 13, '#ff6b5e', 'center');
      text(ctx, 'click to toss', cx, s.y + s.h - 8, 11, '#9a8f82', 'center');
    } else {
      text(ctx, 'empty', s.x + s.w / 2, s.y + s.h / 2 + 5, 13, '#8a8178', 'center');
    }
  }
  ctx.restore();
}

function drawFryer(ctx, world) {
  const f = LAYOUT.fryer;
  const r = fryerRect();
  ctx.save();
  text(ctx, 'FRYER', f.x + 6, f.y + 26, 17, '#7a5c3e', 'left');
  rr(ctx, f.x, f.y + 34, f.w, f.h - 34, 12);
  ctx.fillStyle = '#4a4f55';
  ctx.fill();
  ctx.strokeStyle = '#33373c';
  ctx.lineWidth = 2;
  ctx.stroke();
  const slot = world.state.fryer;
  ctx.fillStyle = '#2c2f33';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  if (slot.state === 'cooking' || slot.state === 'done') {
    ctx.fillStyle = '#e8b93c';
    rr(ctx, r.x + 8, r.y + 30, r.w - 16, r.h - 42, 8);
    ctx.fill();
    ctx.fillStyle = '#f2c14e';
    for (const sx of [-28, -12, 4, 20]) {
      ctx.fillRect(r.x + r.w / 2 + sx, r.y + 18, 8, 34);
    }
    if (slot.state === 'cooking') {
      const frac = slot.t / FRIES_COOK_SECONDS;
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2 + 6, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
    } else {
      text(ctx, 'READY', r.x + r.w / 2, r.y + r.h - 6, 13, '#ffd94d', 'center');
    }
  } else if (slot.state === 'burnt') {
    text(ctx, 'BURNT!', r.x + r.w / 2, r.y + r.h / 2, 14, '#ff6b5e', 'center');
    text(ctx, 'click to toss', r.x + r.w / 2, r.y + r.h - 8, 11, '#9a8f82', 'center');
  } else {
    text(ctx, 'empty', r.x + r.w / 2, r.y + r.h / 2 + 5, 13, '#8a8178', 'center');
  }
  ctx.restore();
}

function drawPlate(ctx, world) {
  const p = LAYOUT.plate;
  ctx.save();
  text(ctx, 'PLATE', p.x + 6, p.y + 26, 17, '#7a5c3e', 'left');
  rr(ctx, p.x, p.y + 34, p.w, p.h - 34, 12);
  ctx.fillStyle = '#fbf3e2';
  ctx.fill();
  ctx.strokeStyle = '#e0d5c1';
  ctx.lineWidth = 2;
  ctx.stroke();
  const cx = p.x + p.w / 2;
  // The plate itself.
  ctx.fillStyle = '#e9e2d2';
  ctx.beginPath();
  ctx.ellipse(cx, p.y + 168, 118, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(cx, p.y + 164, 104, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  if (world.state.plate.length === 0) {
    text(ctx, 'Click ingredients below', cx, p.y + 110, 15, '#a89a86', 'center');
    text(ctx, 'to build a dish', cx, p.y + 132, 15, '#a89a86', 'center');
  } else {
    drawBurger(ctx, cx, p.y + 158, world.state.plate, 1);
  }
  ctx.restore();
}

function drawBell(ctx, world, hover) {
  const b = LAYOUT.bell;
  const ready = world.firstMatchingOrder() !== null;
  ctx.save();
  text(ctx, 'SERVE', b.x + 6, b.y + 26, 17, '#7a5c3e', 'left');
  rr(ctx, b.x, b.y + 34, b.w, b.h - 34, 12);
  ctx.fillStyle = ready ? '#fff3c4' : '#fbf3e2';
  ctx.fill();
  ctx.strokeStyle = ready ? '#e8a13c' : '#e0d5c1';
  ctx.lineWidth = ready ? 3 : 2;
  ctx.stroke();
  const cx = b.x + b.w / 2;
  const cy = b.y + 118;
  // Bell dome.
  ctx.fillStyle = '#e8b93c';
  ctx.beginPath();
  ctx.arc(cx, cy, 52, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 52, cy - 4, 104, 8);
  ctx.fillStyle = '#c89b1e';
  ctx.beginPath();
  ctx.arc(cx, cy - 54, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6d1f';
  rr(ctx, cx - 58, cy + 4, 116, 10, 5);
  ctx.fill();
  if (ready) {
    text(ctx, 'DING! Serve it!', cx, b.y + 196, 15, '#b07818', 'center');
  } else {
    text(ctx, 'Ring when a plate', cx, b.y + 190, 13, '#a89a86', 'center');
    text(ctx, 'matches a ticket', cx, b.y + 208, 13, '#a89a86', 'center');
  }
  if (hover) {
    ctx.strokeStyle = 'rgba(232, 161, 60, 0.7)';
    ctx.lineWidth = 3;
    rr(ctx, b.x + 2, b.y + 36, b.w - 4, b.h - 38, 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrash(ctx, world) {
  const t = LAYOUT.trash;
  ctx.save();
  text(ctx, 'TRASH', t.x + 6, t.y + 26, 17, '#7a5c3e', 'left');
  rr(ctx, t.x, t.y + 34, t.w, t.h - 34, 12);
  ctx.fillStyle = '#fbf3e2';
  ctx.fill();
  ctx.strokeStyle = '#e0d5c1';
  ctx.lineWidth = 2;
  ctx.stroke();
  const cx = t.x + t.w / 2;
  const cy = t.y + 118;
  ctx.fillStyle = '#8a8178';
  ctx.beginPath();
  ctx.moveTo(cx - 42, cy - 34);
  ctx.lineTo(cx + 42, cy - 34);
  ctx.lineTo(cx + 34, cy + 42);
  ctx.lineTo(cx - 34, cy + 42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6e665c';
  ctx.fillRect(cx - 48, cy - 44, 96, 10);
  ctx.fillRect(cx - 12, cy - 54, 24, 10);
  text(ctx, 'Clear the plate', cx, t.y + 196, 14, '#a89a86', 'center');
  ctx.restore();
}

function drawBins(ctx, world, hover) {
  const c = LAYOUT.counter;
  ctx.save();
  rr(ctx, c.x, c.y, c.w, c.h, 14);
  ctx.fillStyle = '#a9713f';
  ctx.fill();
  ctx.fillStyle = '#96622f';
  ctx.fillRect(c.x, c.y, c.w, 10);
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    const ing = INGREDIENTS[i];
    const r = binRect(i);
    const isHover = hover && hover.x >= r.x && hover.x <= r.x + r.w && hover.y >= r.y && hover.y <= r.y + r.h;
    let disabled = false;
    if (ing.id === 'patty' && !world.state.grill.some((s) => s.state === 'empty')) disabled = true;
    if (ing.id === 'fries' && world.state.fryer.state !== 'empty') disabled = true;
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fillStyle = disabled ? '#d8cfc0' : '#fff8ec';
    ctx.fill();
    ctx.strokeStyle = isHover ? '#e8a13c' : '#e0d5c1';
    ctx.lineWidth = isHover ? 3 : 2;
    ctx.stroke();
    drawIngredientIcon(ctx, ing.id, r.x + r.w / 2, r.y + 52, 54);
    text(ctx, ing.name, r.x + r.w / 2, r.y + 108, 16, disabled ? '#a89a86' : INK, 'center');
    text(ctx, ing.hint, r.x + r.w / 2, r.y + 130, 12, '#a89a86', 'center');
    // Keyboard key badge.
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.arc(r.x + r.w - 20, r.y + 20, 12, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, ing.key, r.x + r.w - 20, r.y + 25, 13, '#fff', 'center');
    if (disabled) text(ctx, 'FULL', r.x + r.w / 2, r.y + 152, 12, RED, 'center');
  }
  ctx.restore();
}

function drawTopBar(ctx, world, best, muted) {
  const bar = LAYOUT.topBar;
  ctx.save();
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  text(ctx, 'SIZZLE & SERVE', 16, 42, 26, '#ffd94d', 'left');
  const timeLeft = Math.max(0, SHIFT_SECONDS - world.state.time);
  const mm = Math.floor(timeLeft / 60);
  const ss = Math.floor(timeLeft % 60).toString().padStart(2, '0');
  const urgent = timeLeft <= 30 && world.state.started && !world.state.over;
  text(ctx, `⏱ ${mm}:${ss}`, 330, 42, 24, urgent ? '#ff6b5e' : '#fff', 'left');
  text(ctx, `$${world.state.score}`, 480, 42, 24, '#fff', 'left');
  if (world.state.combo >= 2) {
    ctx.fillStyle = '#ff9f43';
    rr(ctx, 580, 16, 118, 34, 17);
    ctx.fill();
    text(ctx, `COMBO x${world.state.combo}`, 639, 39, 16, '#fff', 'center');
  }
  for (let i = 0; i < 3; i += 1) drawHeart(ctx, 740 + i * 30, 34, 22, i < world.state.hearts);
  text(ctx, `BEST $${best}`, 850, 42, 18, '#cbb98f', 'left');
  // Mute + pause buttons.
  for (const [rect, label] of [[MUTE_RECT, muted ? '✕' : '♪'], [PAUSE_RECT, 'II']]) {
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fillStyle = '#4a3f30';
    ctx.fill();
    text(ctx, label, rect.x + rect.w / 2, rect.y + 27, 17, '#ffe9a8', 'center');
  }
  ctx.restore();
}

function drawBottomBar(ctx, world) {
  const bar = LAYOUT.bottomBar;
  ctx.save();
  ctx.fillStyle = '#f4ecdc';
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  text(ctx, 'Click a bin (or keys 1–7) to add • Patties grill, fries fry — grab them when READY • Click a ticket (or the bell) to serve a matching plate • T clears the plate • P pauses', 16, bar.y + 32, 15, '#7a6a55', 'left');
  text(ctx, `Served: ${world.state.served} dishes   Best combo: x${world.state.bestCombo}   Score targets: $40 ★  $70 ★★  $100 ★★★`, 16, bar.y + 64, 15, '#7a6a55', 'left');
  ctx.restore();
}

function drawKitchenBackground(ctx) {
  ctx.save();
  // Tiled wall.
  ctx.fillStyle = '#f7ead2';
  ctx.fillRect(0, 64, 1280, 140);
  ctx.strokeStyle = '#e8d9bd';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1280; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x, 204);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 134);
  ctx.lineTo(1280, 134);
  ctx.stroke();
  // Counter band behind the stations.
  ctx.fillStyle = '#c98d4e';
  ctx.fillRect(0, 204, 1280, 238);
  ctx.fillStyle = '#b57a3e';
  ctx.fillRect(0, 204, 1280, 8);
  // Floor strip under the counter.
  ctx.fillStyle = '#8a6a44';
  ctx.fillRect(0, 682, 1280, 18);
  ctx.restore();
}

function drawParticles(ctx, world) {
  ctx.save();
  for (const p of world.state.particles) {
    ctx.globalAlpha = Math.max(0, p.life) * 0.55;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1.6 - p.life * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.textAlign = 'center';
  for (const f of world.state.floats) {
    ctx.globalAlpha = Math.min(1, f.life);
    ctx.font = '800 26px Trebuchet MS, Verdana, sans-serif';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(43, 33, 24, 0.75)';
    ctx.strokeText(f.text, f.x, f.y + (1.1 - f.life) * -46);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y + (1.1 - f.life) * -46);
  }
  ctx.restore();
}

function drawTitleOverlay(ctx, best) {
  ctx.save();
  ctx.fillStyle = 'rgba(43, 33, 24, 0.55)';
  ctx.fillRect(0, 0, 1280, 800);
  const cx = 640;
  rr(ctx, cx - 360, 150, 720, 460, 20);
  ctx.fillStyle = '#fff8ec';
  ctx.fill();
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', cx, 232, 52, RED, 'center');
  text(ctx, 'The lunch-rush cooking game', cx, 272, 20, '#7a6a55', 'center');
  text(ctx, 'Tickets come in — grill patties, fry the fries,', cx, 330, 18, INK, 'center');
  text(ctx, 'stack the plate and ring the bell before patience runs out.', cx, 358, 18, INK, 'center');
  text(ctx, 'Mouse or keys 1–7 to cook • Click a ticket to serve • 3 hearts • 150 seconds', cx, 396, 16, '#7a6a55', 'center');
  if (best > 0) text(ctx, `Best score: $${best}`, cx, 440, 18, '#b07818', 'center');
  ctx.fillStyle = RED;
  rr(ctx, cx - 170, 470, 340, 56, 28);
  ctx.fill();
  text(ctx, 'CLICK OR PRESS SPACE', cx, 506, 20, '#fff', 'center');
  text(ctx, 'to start your shift', cx, 566, 15, '#a89a86', 'center');
  ctx.restore();
}

function drawPausedOverlay(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(43, 33, 24, 0.55)';
  ctx.fillRect(0, 0, 1280, 800);
  text(ctx, 'PAUSED', 640, 380, 56, '#fff', 'center');
  text(ctx, 'Press P or click II to keep cooking', 640, 430, 18, '#ffe9a8', 'center');
  ctx.restore();
}

function drawOverOverlay(ctx, world, best) {
  const stars = starsForScore(world.state.score);
  ctx.save();
  ctx.fillStyle = 'rgba(43, 33, 24, 0.6)';
  ctx.fillRect(0, 0, 1280, 800);
  const cx = 640;
  rr(ctx, cx - 330, 140, 660, 480, 20);
  ctx.fillStyle = '#fff8ec';
  ctx.fill();
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, world.state.overReason === 'hearts' ? 'OUT OF HEARTS!' : 'SHIFT COMPLETE!', cx, 220, 44, RED, 'center');
  for (let i = 0; i < 3; i += 1) drawStar(ctx, cx - 90 + i * 90, 290, 34, i < stars);
  text(ctx, `Score: $${world.state.score}`, cx, 360, 30, INK, 'center');
  text(ctx, `Dishes served: ${world.state.served}     Best combo: x${world.state.bestCombo}`, cx, 404, 18, '#7a6a55', 'center');
  text(ctx, `Best score: $${Math.max(best, world.state.score)}`, cx, 436, 18, '#b07818', 'center');
  ctx.fillStyle = RED;
  rr(ctx, cx - 170, 480, 340, 56, 28);
  ctx.fill();
  text(ctx, 'PRESS SPACE TO PLAY AGAIN', cx, 516, 19, '#fff', 'center');
  text(ctx, 'Targets: $40 ★   $70 ★★   $100 ★★★', cx, 576, 15, '#a89a86', 'center');
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = 1280 * dpr;
  canvas.height = 800 * dpr;
  ctx.scale(dpr, dpr);

  function draw(world, screen, best, hover, muted, t) {
    ctx.clearRect(0, 0, 1280, 800);
    drawKitchenBackground(ctx);
    for (let i = 0; i < world.state.orders.length; i += 1) drawTicket(ctx, world.state.orders[i], i, world);
    drawGrill(ctx, world, t);
    drawFryer(ctx, world);
    drawPlate(ctx, world);
    drawBell(ctx, world, hover);
    drawTrash(ctx, world);
    drawBins(ctx, world, hover);
    drawParticles(ctx, world);
    drawBottomBar(ctx, world);
    drawTopBar(ctx, world, best, muted);
    if (screen === SCREEN_TITLE) drawTitleOverlay(ctx, best);
    else if (screen === SCREEN_PAUSED) drawPausedOverlay(ctx);
    else if (screen === SCREEN_OVER) drawOverOverlay(ctx, world, best);
  }

  return { draw };
}
