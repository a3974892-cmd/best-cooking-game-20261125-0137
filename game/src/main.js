// Sizzle & Serve: boot and the one loop. Input is read every frame, the world
// advances in fixed 1/60 s steps, and the renderer paints what is there. The
// game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, INGREDIENTS, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  EVENT_BURNT,
  EVENT_COOKED,
  EVENT_EXPIRED,
  EVENT_OVER,
  EVENT_SERVED,
  EVENT_WRONG,
  createWorld,
} from './world.js';
import { ACTION_MUTE, ACTION_PAUSE, actionForClick, createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best, null, audio.isMuted(), performance.now() / 1000);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // The title screen shows a live kitchen behind its panel.
  world.reset();
  world.spawnOrder('cheese');
  world.spawnOrder('classic');

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Playing. Serve tickets before patience runs out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift over. Score ${world.state.score}. Best ${best}.`);
  }

  function playEvents(events) {
    if (events & EVENT_SERVED) audio.play('served');
    if (events & EVENT_EXPIRED) audio.play('expired');
    if (events & EVENT_BURNT) audio.play('burnt');
    if (events & EVENT_COOKED) audio.play('cooked');
    if (events & EVENT_WRONG) audio.play('wrong');
    if (events & EVENT_OVER) endGame();
  }

  function handleKeys() {
    for (const key of input.takeKeys()) {
      if (key === 'm') {
        audio.setMuted(!audio.isMuted());
        continue;
      }
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        if (key === ' ' || key === 'enter') startGame();
        continue;
      }
      if (key === 'p') {
        screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
        announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
        continue;
      }
      if (screen !== SCREEN_PLAY) continue;
      if (key === ' ') {
        const events = world.act({ type: 'serveFirst' });
        if (events & EVENT_SERVED) audio.play('served');
        else if (events) audio.play('wrong');
        continue;
      }
      if (key === 't') {
        world.act({ type: 'trash' });
        continue;
      }
      const ingredient = INGREDIENTS.find((i) => i.key === key);
      if (ingredient) {
        const events = world.act({ type: 'add', id: ingredient.id });
        if (events & EVENT_WRONG) audio.play('wrong');
        else audio.play('add');
      }
    }
  }

  function handleClicks() {
    for (const click of input.takeClicks()) {
      audio.unlock();
      const action = actionForClick(click.x, click.y, world);
      if (!action) continue;
      if (action.type === ACTION_PAUSE) {
        if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
          screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
          announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
        }
        continue;
      }
      if (action.type === ACTION_MUTE) {
        audio.setMuted(!audio.isMuted());
        continue;
      }
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
        continue;
      }
      if (screen !== SCREEN_PLAY) continue;
      const events = world.act(action);
      if (events & EVENT_SERVED) audio.play('served');
      else if (events & EVENT_WRONG) audio.play('wrong');
      else if (events) audio.play('add');
      playEvents(events & ~EVENT_SERVED & ~EVENT_WRONG);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleKeys();
    handleClicks();
    if (screen === SCREEN_TITLE) {
      while (accumulator >= STEP) {
        world.step(STEP, true);
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        const events = world.step(STEP, false);
        playEvents(events);
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) break;
      }
    } else {
      accumulator = 0;
    }
    const cooking =
      world.state.grill.filter((s) => s.state === 'cooking').length +
      (world.state.fryer.state === 'cooking' ? 1 : 0);
    audio.setSizzle(screen === SCREEN_PLAY ? cooking : 0);
    renderer.draw(world, screen, best, input.getHover(), audio.isMuted(), now / 1000);
  }

  // Leaving the tab pauses a running game rather than letting tickets expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
