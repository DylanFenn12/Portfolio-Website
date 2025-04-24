const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

const boardEl = document.getElementById('board');
const displayEl = document.getElementById('phone-display');
const inputEl = document.getElementById('digit-input');

let engine, world, render, runner;
const COLS = 12, ROWS = 12;
let digits = Array(10).fill(null);
let bins = [], balls = [];

const PEG_SIZE = 10;
const SPACING = 1.3;

function updateDisplay() {
  displayEl.textContent = digits.map((d, i) => {
    if (i === 3 || i === 6) return '-' + (d ?? '_');
    return d ?? '_';
  }).join('');
}

function initPhysics() {
  engine = Engine.create();
  world = engine.world;

  render = Render.create({
    element: boardEl,
    engine,
    options: {
      width: boardEl.clientWidth,
      height: boardEl.clientHeight,
      wireframes: false,
      background: '#ecf0f1'
    }
  });

  Render.run(render);
  runner = Runner.create();
  Runner.run(runner, engine);

  const W = boardEl.clientWidth;
  const H = boardEl.clientHeight;

  // walls
  Composite.add(world, [
    Bodies.rectangle(W / 2, -10, W, 20, { isStatic: true }),
    Bodies.rectangle(-10, H / 2, 20, H, { isStatic: true }),
    Bodies.rectangle(W + 10, H / 2, 20, H, { isStatic: true })
  ]);

  // pegs
  const pegSpacingX = (W / COLS) * SPACING;
  const pegSpacingY = (H - 60) / (ROWS + 1);
  const offsetX = -33;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = offsetX + (col + (row % 2 ? 0.5 : 0)) * pegSpacingX + pegSpacingX / 2;
      const y = (row + 1) * pegSpacingY;

      Composite.add(world,
        Bodies.circle(x, y, PEG_SIZE, {
          isStatic: true,
          restitution: 0.8,
          render: { fillStyle: '#2c3e50' }
        })
      );
    }
  }

  // bottom bins
  const slotW = W / 10;
  const floorH = 20;
  for (let i = 0; i < 10; i++) {
    const x = i * slotW + slotW / 2;
    const bin = Bodies.rectangle(x, H - floorH / 2, slotW - 4, floorH, {
      isStatic: true,
      label: `bin_${i}`,
      render: {
        fillStyle: '#bdc3c7',
        strokeStyle: '#7f8c8d',
        lineWidth: 1
      }
    });
    bins.push(bin);
    Composite.add(world, bin);
  }

  // collisions
  Events.on(engine, 'collisionStart', e => {
    e.pairs.forEach(({ bodyA, bodyB }) => {
      const [ball, bin] = [bodyA, bodyB].sort((a, b) => (a.label === 'ball') ? -1 : 1);

      if (ball.label === 'ball' && bin.label.startsWith('bin_')) {
        const index = +bin.label.split('_')[1];
        if (digits[index] == null) {
          digits[index] = ball.digit;
          updateDisplay();
          bin.render.fillStyle = '#2ecc71';
          Body.setStatic(ball, true);
          ball._binIndex = index;
        } else {
          Composite.remove(world, ball);
        }
      }
    });
  });

  // draw digits
  Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    world.bodies.forEach(b => {
      if (b.label === 'ball') {
        ctx.fillText(b.digit, b.position.x, b.position.y);
      }
    });
  });
}

function dropBall(n) {
  const W = boardEl.clientWidth;
  const ball = Bodies.circle(Math.random() * W, 20, 12, {
    label: 'ball',
    restitution: 0.5,
    frictionAir: 0.02,
    render: { fillStyle: '#e74c3c' }
  });
  ball.digit = n;
  Composite.add(world, ball);
  balls.push(ball);
}

// Event Listeners
document.getElementById('drop-btn').addEventListener('click', () => {
  const val = parseInt(inputEl.value);
  if (isNaN(val) || val < 0 || val > 9) {
    alert('Pick a digit between 0 and 9');
    return;
  }
  dropBall(val);
});

document.getElementById('undo-btn').addEventListener('click', () => {
  const last = balls.pop();
  if (!last) return;

  if (last._binIndex != null) {
    digits[last._binIndex] = null;
    bins[last._binIndex].render.fillStyle = '#bdc3c7';
    updateDisplay();
  }
  Composite.remove(world, last);
});

document.getElementById('restart-btn').addEventListener('click', () => {
  location.reload();
});

document.getElementById('enter-btn').addEventListener('click', () => {
  alert(`You entered: ${displayEl.textContent}`);
});

// Init
window.addEventListener('load', () => {
  initPhysics();
  updateDisplay();
});