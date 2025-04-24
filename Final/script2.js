// script.js

// ---- CONFIG ----
const COLS = 12, ROWS = 12;
const PEG_RADIUS = 9;
const BALL_RADIUS = 12;
const GRAVITY = 800;     // pixels/sec²
const RESTITUTION = 0.8; // bouncy factor
const AIR_FRICTION = 0.02;

// ---- SETUP ----
const boardEl = document.getElementById('board');
const canvas = document.createElement('canvas');
canvas.width  = boardEl.clientWidth;
canvas.height = boardEl.clientHeight;
boardEl.appendChild(canvas);
const ctx = canvas.getContext('2d');

const displayEl = document.getElementById('phone-display');
const inputEl   = document.getElementById('digit-input');

let lastTime = null;
let pegs = [], balls = [], bins = [], digits = Array(10).fill(null), stack = [];

// layout pegs
(function buildPegs() {
  const W = canvas.width, H = canvas.height;
  const pegX = W / (COLS + 1) + 20;
  const pegY = (H - 60) / (ROWS + 1);
  let offsetX = -70;
  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      const x = offsetX + (c+1)*pegX + (r%2? pegX/2 : 0);
      const y = (r+1)*pegY;
      pegs.push({ x, y, r: PEG_RADIUS });
    }
  }
})();

// layout bins
(function buildBins() {
  const W = canvas.width, H = canvas.height;
  const slotW = W / 10;
  for (let i=0; i<10; i++) {
    bins.push({
      x: i*slotW + slotW/2,
      y: H - 10,
      w: slotW - 4,
      h: 20,
      filled: false
    });
  }
})();

// ---- BALL CLASS ----
class Ball {
  constructor(digit) {
    this.digit = digit;
    this.x = Math.random() * canvas.width;
    this.y = 20;
    this.vx = 0;
    this.vy = 0;
    this.stuck = false;
    this.binIndex = null;
  }
  update(dt) {
    if (this.stuck) return;
    this.vy += GRAVITY*dt;
    this.x += this.vx*dt;
    this.y += this.vy*dt;
    // air friction
    this.vx *= (1 - AIR_FRICTION);
    // wall bounce
    if (this.x - BALL_RADIUS < 0 || this.x + BALL_RADIUS > canvas.width) {
      this.vx *= -RESTITUTION;
      this.x = Math.max(BALL_RADIUS, Math.min(this.x, canvas.width - BALL_RADIUS));
    }
    // peg collisions
    for (const p of pegs) {
        const dx = this.x - p.x,
              dy = this.y - p.y,
              dist = Math.hypot(dx, dy),
              minDist = BALL_RADIUS + p.r;
      
        if (dist < minDist) {
          // normal vector from peg -> ball
          const nx = dx / dist,
                ny = dy / dist;
          // relative velocity along that normal
          const vDotN = this.vx * nx + this.vy * ny;
          // only if moving into the peg
          if (vDotN < 0) {
            // separate by overlap + tiny epsilon
            const overlap = minDist - dist + 0.1;
            this.x += nx * overlap;
            this.y += ny * overlap;
            // reflect velocity
            this.vx -= 2 * vDotN * nx;
            this.vy -= 2 * vDotN * ny;
            // apply bounce factor
            this.vx *= RESTITUTION;
            this.vy *= RESTITUTION;
          }
        }
      }
    // floor / bin collision
    for (let i=0; i<bins.length; i++) {
      const b = bins[i];
      if (!b.filled &&
          this.y + BALL_RADIUS > b.y - b.h/2 &&
          this.x > b.x - b.w/2 &&
          this.x < b.x + b.w/2) {
        // land in bin
        this.stuck = true;
        this.vx = this.vy = 0;
        this.y = b.y - b.h/2 - BALL_RADIUS;
        digits[i] = this.digit;
        updateDisplay();
        b.filled = true;
        this.binIndex = i;
        break;
      }
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, BALL_RADIUS, 0, 2*Math.PI);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    // digit
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.digit, this.x, this.y);
  }
}

// ---- RENDER LOOP ----
function loop(ts) {
  if (lastTime === null) lastTime = ts;
  const dt = (ts - lastTime) / 1000;
  lastTime = ts;

  // update
  balls.forEach(b => b.update(dt));

  // draw
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // pegs
  for (const p of pegs) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, 2*Math.PI);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
  }
  // bins
  for (const b of bins) {
    ctx.fillStyle = b.filled ? '#2ecc71' : '#bdc3c7';
    ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
  }
  // balls
  balls.forEach(b => b.draw());

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---- UI & Events ----
function updateDisplay() {
  displayEl.textContent = digits
    .map((d,i) => (i===3||i===6? '-' : '') + (d===null? '_' : d))
    .join('');
}

document.getElementById('drop-btn').addEventListener('click', ()=>{
  const v = parseInt(inputEl.value);
  if (isNaN(v)||v<0||v>9) return alert('Pick 0–9');
  const ball = new Ball(v);
  balls.push(ball);
  stack.push(ball);
});

document.getElementById('undo-btn').addEventListener('click', ()=>{
  const last = stack.pop();
  if (!last) return;
  // clear bin
  if (last.binIndex != null) {
    digits[last.binIndex] = null;
    bins[last.binIndex].filled = false;
    updateDisplay();
  }
  balls = balls.filter(b => b !== last);
});

document.getElementById('restart-btn').addEventListener('click', ()=>{
  window.location.reload();
});

document.getElementById('enter-btn').addEventListener('click', ()=>{
  alert(`Your entered number is: ${displayEl.textContent}`);
});
