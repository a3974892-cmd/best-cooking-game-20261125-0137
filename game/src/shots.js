// The screenshot scenes behind ?shot=start|play|serve|end. Each one builds its
// frame from the real world and the real renderer: orders are spawned through
// the world's own spawnOrder, patties and fries are placed with the world's
// own actions, and a few steps run so steam, timers and progress rings settle.
// The same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function settle(world, seconds) {
  for (let i = 0; i < seconds / STEP; i += 1) world.step(STEP, false);
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Unknown names stage the title scene.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    world.reset();
    world.state.time = 55;
    world.spawnOrder('cheese');
    world.spawnOrder('classic');
    world.spawnOrder('fries');
    world.act({ type: 'add', id: 'patty' });
    world.state.grill[0] = { state: 'done', t: 0 };
    world.act({ type: 'add', id: 'fries' });
    world.state.fryer = { state: 'done', t: 0 };
    world.act({ type: 'add', id: 'bun' });
    world.act({ type: 'takeGrill', slot: 0 });
    world.act({ type: 'add', id: 'cheese' });
    world.state.grill[0] = { state: 'cooking', t: 3.5 };
    world.state.score = 34;
    world.state.combo = 3;
    world.state.bestCombo = 4;
    world.state.served = 4;
    settle(world, 0.5);
    return { screen: SCREEN_PLAY, best: 42 };
  }
  if (name === 'serve') {
    world.reset();
    world.state.time = 70;
    world.spawnOrder('cheese');
    world.spawnOrder('double');
    world.act({ type: 'add', id: 'bun' });
    world.act({ type: 'add', id: 'patty' });
    world.state.grill[0] = { state: 'done', t: 0 };
    world.act({ type: 'takeGrill', slot: 0 });
    world.act({ type: 'add', id: 'cheese' });
    world.act({ type: 'add', id: 'tomato' });
    world.act({ type: 'add', id: 'patty' });
    world.state.grill[1] = { state: 'cooking', t: 2 };
    world.state.score = 46;
    world.state.combo = 4;
    world.state.bestCombo = 5;
    world.state.served = 5;
    world.state.floats.push({ x: 684, y: 300, text: '+$12', color: '#ffd94d', life: 1.0 });
    world.state.floats.push({ x: 684, y: 330, text: 'COMBO x4', color: '#ff9f43', life: 1.0 });
    settle(world, 0.3);
    return { screen: SCREEN_PLAY, best: 42 };
  }
  if (name === 'end') {
    world.reset();
    world.state.time = 150;
    world.state.score = 86;
    world.state.served = 9;
    world.state.bestCombo = 4;
    world.state.hearts = 1;
    world.state.over = true;
    world.state.overReason = 'shift';
    return { screen: SCREEN_OVER, best: 86 };
  }
  world.reset();
  world.state.started = true;
  world.spawnOrder('cheese');
  world.spawnOrder('classic');
  settle(world, 0);
  return { screen: SCREEN_TITLE, best: 42 };
}
