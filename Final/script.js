const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;
const boardEl = document.getElementById('board');
let engine, world, render, runner;
const ROWS = 12, COLS = 12;
let phoneDigits = Array(10).fill(null), containerBodies = [], droppedBalls = [];

// Adjust this to change horizontal peg spacing
const SPACING = 1.3; // 1.0 = default, >1 wider, <1 tighter
const PEG_RADIUS = 10; // change this to resize pegs

function updateDisplay(){
  let s = '';
  phoneDigits.forEach((d,i) => {
    if(i === 3 || i === 6) s += '-';
    s += (d === null ? '_' : d);
  });
  document.getElementById('phone-display').textContent = s;
}

function initMatter(){
  containerBodies = [];
  droppedBalls = [];
  engine = Engine.create(); world = engine.world;
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
  runner = Runner.create(); Runner.run(runner, engine);

  const W = boardEl.clientWidth, H = boardEl.clientHeight;
  // walls
  Composite.add(world, [
    Bodies.rectangle(W/2, -10, W, 20, { isStatic: true }),
    Bodies.rectangle(-10, H/2, 20, H, { isStatic: true }),
    Bodies.rectangle(W+10, H/2, 20, H, { isStatic: true })
  ]);

  // pegs
  const pegX = (W / COLS) * SPACING;
  const pegY = (H - 60) / (ROWS + 1);
  const pegOffset = -33;
  for(let r=0; r<ROWS; r++){
    for(let c=0; c<COLS; c++){
      const x = pegOffset + (c + (r%2?0.5:0)) * pegX + pegX/2;
      const y = (r+1) * pegY;
      Composite.add(world,
        Bodies.circle(x, y, PEG_RADIUS, {
          isStatic: true,
          restitution: 0.8,
          render: { fillStyle: '#2c3e50' }
        })
      );
    }
  }

  // containers
  const slotW = W / 10, gap = 4, floorH = 20;
  for(let i=0; i<10; i++){
    const cx = i * slotW + slotW/2;
    const cont = Bodies.rectangle(
      cx, H - floorH/2, slotW - gap, floorH,
      { isStatic: true, label: 'container_' + i,
        render: { fillStyle: '#bdc3c7', strokeStyle: '#7f8c8d', lineWidth: 1 }
      }
    );
    containerBodies.push(cont);
    Composite.add(world, cont);
  }

  // collisions
  Events.on(engine, 'collisionStart', ev => {
    ev.pairs.forEach(pair => {
      let ball, cont;
      if(pair.bodyA.label==='ball' && pair.bodyB.label.startsWith('container_')){
        ball = pair.bodyA; cont = pair.bodyB;
      } else if(pair.bodyB.label==='ball' && pair.bodyA.label.startsWith('container_')){
        ball = pair.bodyB; cont = pair.bodyA;
      }
      if(ball && cont && !ball.recorded){
        const idx = +cont.label.split('_')[1];
        if(phoneDigits[idx]===null){
          phoneDigits[idx] = ball.digit;
          updateDisplay();
          cont.render.fillStyle = '#2ecc71';
          Body.setStatic(ball, true);
          ball.binIndex = idx;
        } else {
          Composite.remove(world, ball);
        }
        ball.recorded = true;
      }
    });
  });

  // draw digits
  Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    world.bodies.forEach(b => {
      if(b.label==='ball') ctx.fillText(b.digit, b.position.x, b.position.y);
    });
  });
}

function dropBall(d){
  const W = boardEl.clientWidth;
  const startX = Math.random() * W;
  const ball = Bodies.circle(startX, 20, 12, {
    restitution: 0.5, frictionAir: 0.02, label: 'ball',
    render: { fillStyle: '#e74c3c' }
  });
  ball.digit = d; ball.recorded = false; ball.binIndex = null;
  Composite.add(world, ball); droppedBalls.push(ball);
}

document.getElementById('drop-btn').addEventListener('click', ()=>{
  const v = parseInt(document.getElementById('digit-input').value);
  if(isNaN(v)||v<0||v>9) return alert('Pick 0–9');
  dropBall(v);
});
document.getElementById('undo-btn').addEventListener('click', ()=>{
  if(!droppedBalls.length) return;
  const last = droppedBalls.pop();
  if(last.binIndex!=null){
    phoneDigits[last.binIndex]=null;
    updateDisplay();
    containerBodies[last.binIndex].render.fillStyle = '#bdc3c7';
  }
  Composite.remove(world,last);
});
document.getElementById('restart-btn').addEventListener('click', ()=>location.reload());
document.getElementById('enter-btn').addEventListener('click', ()=>{
  alert(`Your entered number is: ${document.getElementById('phone-display').textContent}`);
});

window.addEventListener('load', ()=>{ initMatter(); updateDisplay(); });
