// input.js — keyboard and mouse. WASD/arrows move and drive, E enters and
// exits cars, F punches, mouse aims, click shoots, T starts a taxi fare,
// N restarts the current mission, P or Esc pauses, M mutes, C saves.
import { W } from './state.js';
import { ensureAudio } from './audio.js';

export function bindInput(canvas, handlers) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    W.keys[e.code] = true;
    ensureAudio();
    handlers.onKey(e.code);
  });
  window.addEventListener('keyup', (e) => { W.keys[e.code] = false; });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    W.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    W.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    W.mouse.down = true;
    ensureAudio();
    handlers.onMouseDown(e.button);
  });
  window.addEventListener('mouseup', () => { W.mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('blur', () => { W.keys = {}; W.mouse.down = false; });
  // Keep the canvas focused so keyboard input never goes to the page.
  canvas.setAttribute('tabindex', '0');
  canvas.addEventListener('click', () => canvas.focus());
}
