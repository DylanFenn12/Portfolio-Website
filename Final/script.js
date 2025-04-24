//Imports elements from the Matter.js library
const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

//Grabs the elements from the HTML document so they can be manipulated
// without having to use querySelector or getElementById every time
const boardEl = document.getElementById('board');
const displayEl = document.getElementById('phone-display');
const inputEl = document.getElementById('digit-input');


let engine, world, render, runner; // Creates variables for the physics engine, world, rendering engine, and runner
const COLS = 12, ROWS = 12; // Sets the number of columns and rows for the pegboard
let digits = Array(10).fill(null); // Creates an array to hold the digits so we can see the final result
let bins = [], balls = []; // Creates arrays to hold the values of bins and balls

const PEG_SIZE = 10; // Sets the size of the pegs
const SPACING = 1.3; // This create an offset to easily fix the spacing between the pegs

// This function updates the display of the phone with the digits
function updateDisplay() {
let phonenumbers = '';
for (let i = 0; i < digits.length; i++) { // For every space in the 10 digit array...
if (i === 3 || i === 6) { // see if the index is 3 or 6
    phonenumbers += '-' + (digits[i] ?? '_'); // if so, add a dash and move on
    }
else {
    phonenumbers += (digits[i] ?? '_');  // if not, add the digit or an underscore
    }
  }
    displayEl.textContent = phonenumbers; // update the display with the new string
}

function initPhysics() { // Use the physics engine from matter to create collisions and gravity
    const W = boardEl.clientWidth;
  const H = boardEl.clientHeight;
  
engine = Engine.create(); // Create a new physics engine
  world = engine.world; // Create a new world for the engine

  render = Render.create({ // Create a new render object to display the world
    element: boardEl, // Set the element to render to as the board space declared in the HTML
    engine, // Set the engine to the one I created
    options: { // Set the options for the render
      width: W, // Uses the width of the board set in my CSS
      height: H,
      wireframes: false, // Set wireframes to false so you can see the pegs and balls with colors
      background: 'navy' // Set the background color
    }
  });

  Render.run(render);
  runner = Runner.create();
  Runner.run(runner, engine); // Create a new runner to run the engine

  // walls
  Composite.add(world, [ // Add the walls to the world
    Bodies.rectangle(W / 2, // Marks center of rect for positioning top wall
    -10, // X position
     W, // sets the width of the rectangle
     20, // sets height which is 20 for consistency and assuring that the ball doesnt clip
     { isStatic: true }), // Set the rectangle to be static so it doesn't move
     // same thing bellow
    Bodies.rectangle(-10, H / 2, 20, H, { isStatic: true }), // left wall
    Bodies.rectangle(W + 10, H / 2, 20, H, { isStatic: true }) // right wall
  ]);

  // pegs
  const pegSpacingX = (W / COLS) * SPACING; // This creates the spacing between the pegs with the spacing variable
  const pegSpacingY = (H - 60) / (ROWS + 1); // Same for y
  const offsetX = -33; // Movement of grid so that balls dont get stuck

  for (let row = 0; row < ROWS; row++) { // For every row in the grid
    for (let col = 0; col < COLS; col++) { // For every column in the grid
      const x = offsetX + (col + (row % 2 ? 0.5 : 0)) * pegSpacingX + pegSpacingX / 2; // Stagger, mover over, and add spacing
      const y = (row + 1) * pegSpacingY;

      Composite.add(world,
        Bodies.circle(x, y, PEG_SIZE, { // Create a circle for the peg
          isStatic: true, // dont move
          restitution: 1, // bouncy factor
          render: { fillStyle: '#FFFFFF' } // color of the peg
        })
      );
    }
  }

  // bottom bins
  const slotW = W / 10; // makes bins evenly spaced
  const floorH = 40; // height of the bins
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
    bins.push(bin); // push the bin to the bins array to pop and remove later
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