const W = 1100;
const H = 620;

const GROUND_Y = 468;

const game = {
  state: "play", // play | boss | levelClear | gameOver
  level: 1,
  levelDistance: 0,
  levelTarget: 2400,
  score: 0,
  combo: 0,
  speed: 7,
  lives: 3,
  messageTimer: 0,
};

const turtle = {
  x: 210,
  y: GROUND_Y,
  vy: 0,
  w: 98,
  h: 78,
  grounded: true,
  spinTimer: 0,
  spinAngle: 0,
  flipTimer: 0,
  flipAngle: 0,
  grabTimer: 0,
  grabName: "",
  hurtTimer: 0,
};

const boss = {
  active: false,
  x: W + 240,
  y: GROUND_Y - 16,
  vx: -2,
  hp: 3,
  hitFlash: 0,
};

const world = {
  obstacles: [],
  ramps: [],
  tacos: [],
  particles: [],
  bgShift: 0,
  roadStripeOffset: 0,
  nextObstacleAt: 320,
  nextRampAt: 740,
  tacoCooldown: 0,
};

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("p5-container");
  angleMode(RADIANS);
  textFont("Verdana");
}

function draw() {
  updateGame();
  renderScene();
}

function updateGame() {
  if (game.state === "gameOver") return;

  world.bgShift += game.speed * 0.35;
  world.roadStripeOffset = (world.roadStripeOffset + game.speed) % 120;

  if (world.tacoCooldown > 0) world.tacoCooldown--;
  if (game.messageTimer > 0) game.messageTimer--;
  if (turtle.hurtTimer > 0) turtle.hurtTimer--;

  applyPlayerPhysics();
  updateTricks();

  if (game.state === "play") {
    game.levelDistance += game.speed;
    spawnLevelObjects();

    updateObstacles();
    updateRamps();
    updateParticles();
    updateTacos();

    if (game.levelDistance >= game.levelTarget) startBossPhase();
  } else if (game.state === "boss") {
    updateBoss();
    updateObstacles();
    updateRamps();
    updateParticles();
    updateTacos();
  } else if (game.state === "levelClear") {
    updateParticles();
    updateTacos();
    if (game.messageTimer <= 0) startNextLevel();
  }
}

function applyPlayerPhysics() {
  turtle.vy += 0.72;
  turtle.y += turtle.vy;

  if (turtle.y >= GROUND_Y) {
    if (!turtle.grounded && (turtle.spinTimer > 0 || turtle.flipTimer > 0)) {
      game.score += 90;
      game.combo = 0;
      spawnSpark(turtle.x + 20, turtle.y + 8, color(255, 226, 120), 14);
    }
    turtle.y = GROUND_Y;
    turtle.vy = 0;
    turtle.grounded = true;
    turtle.spinTimer = 0;
    turtle.flipTimer = 0;
    turtle.grabTimer = 0;
    turtle.grabName = "";
  } else {
    turtle.grounded = false;
  }
}

function updateTricks() {
  if (turtle.spinTimer > 0) {
    turtle.spinTimer--;
    turtle.spinAngle += 0.4;
  }
  if (turtle.flipTimer > 0) {
    turtle.flipTimer--;
    turtle.flipAngle += 0.35;
  }
  if (turtle.grabTimer > 0) turtle.grabTimer--;
}

function spawnLevelObjects() {
  if (game.levelDistance >= world.nextObstacleAt) {
    const h = random([44, 58, 70]);
    world.obstacles.push({
      x: W + random(80, 240),
      y: GROUND_Y + 2,
      w: random([38, 44, 52]),
      h,
      type: random() < 0.5 ? "cone" : "barrier",
      passed: false,
    });
    world.nextObstacleAt += random(260, 420) - game.level * 10;
  }

  if (game.level >= 1 && game.levelDistance >= world.nextRampAt) {
    world.ramps.push({
      x: W + random(120, 240),
      y: GROUND_Y + 6,
      w: random([90, 110]),
      h: random([36, 44]),
    });
    world.nextRampAt += random(620, 900) - game.level * 10;
  }
}

function updateObstacles() {
  for (let i = world.obstacles.length - 1; i >= 0; i--) {
    const o = world.obstacles[i];
    o.x -= game.speed;

    if (!o.passed && o.x + o.w < turtle.x - turtle.w * 0.2) {
      o.passed = true;
      game.score += 20;
    }

    const hit =
      turtle.hurtTimer <= 0 &&
      rectOverlap(
        turtle.x - 34,
        turtle.y - 56,
        64,
        56,
        o.x,
        o.y - o.h,
        o.w,
        o.h
      );

    if (hit && turtle.vy >= -1) {
      damagePlayer();
      o.x -= 70;
      spawnSpark(turtle.x - 12, turtle.y - 24, color(255, 110, 90), 18);
    }

    if (o.x < -120) world.obstacles.splice(i, 1);
  }
}

function updateRamps() {
  for (let i = world.ramps.length - 1; i >= 0; i--) {
    const r = world.ramps[i];
    r.x -= game.speed;

    const onRamp =
      turtle.grounded &&
      turtle.vy === 0 &&
      turtle.x + 26 > r.x &&
      turtle.x - 26 < r.x + r.w;

    if (onRamp) {
      turtle.vy = -14 - game.level * 0.25;
      turtle.grounded = false;
      game.score += 25;
      spawnSpark(turtle.x + 30, turtle.y - 8, color(124, 233, 255), 14);
    }

    if (r.x + r.w < -120) world.ramps.splice(i, 1);
  }
}

function updateBoss() {
  if (!boss.active) return;

  const targetX = turtle.x + 260;
  if (boss.x > targetX) {
    boss.x += max(-game.speed * 0.95, -6.5);
  } else {
    boss.x += sin(frameCount * 0.08) * 0.8;
  }

  if (boss.hitFlash > 0) boss.hitFlash--;

  const touch =
    turtle.hurtTimer <= 0 &&
    rectOverlap(
      turtle.x - 36,
      turtle.y - 58,
      68,
      58,
      boss.x - 74,
      boss.y - 126,
      148,
      126
    );

  if (touch) {
    damagePlayer();
    boss.x += 60;
  }
}

function updateTacos() {
  for (let i = world.tacos.length - 1; i >= 0; i--) {
    const t = world.tacos[i];
    t.x += t.vx;
    t.y += t.vy;
    t.vy += 0.08;
    t.rot += 0.25;

    if (
      boss.active &&
      rectOverlap(t.x - 10, t.y - 8, 20, 16, boss.x - 78, boss.y - 124, 156, 124)
    ) {
      world.tacos.splice(i, 1);
      boss.hp--;
      boss.hitFlash = 10;
      spawnSpark(boss.x - 12, boss.y - 40, color(255, 220, 90), 24);

      if (boss.hp <= 0) {
        boss.active = false;
        game.state = "levelClear";
        game.messageTimer = 140;
        game.score += 500;
        spawnSpark(boss.x, boss.y - 40, color(255, 140, 110), 48);
      }
      continue;
    }

    if (t.x > W + 120 || t.y > H + 80) world.tacos.splice(i, 1);
  }
}

function updateParticles() {
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.06;
    p.life--;
    if (p.life <= 0) world.particles.splice(i, 1);
  }
}

function damagePlayer() {
  turtle.hurtTimer = 45;
  game.lives--;
  game.combo = 0;
  if (game.lives <= 0) game.state = "gameOver";
}

function startBossPhase() {
  game.state = "boss";
  boss.active = true;
  boss.hp = 3;
  boss.x = W + 240;
  boss.y = GROUND_Y - 14;
  world.obstacles = world.obstacles.slice(-2);
  world.ramps = world.ramps.slice(-1);
}

function startNextLevel() {
  game.level++;
  game.state = "play";
  game.levelDistance = 0;
  game.levelTarget += 900;
  game.speed += 0.8;
  world.nextObstacleAt = 320;
  world.nextRampAt = 700;
  world.obstacles = [];
  world.ramps = [];
  world.tacos = [];
}

function keyPressed() {
  if (key === " " && turtle.grounded && game.state !== "gameOver") {
    turtle.vy = -13.2;
    turtle.grounded = false;
    return;
  }

  if (game.state === "gameOver" && (key === "r" || key === "R")) {
    resetGame();
    return;
  }

  if (!turtle.grounded && game.state !== "gameOver") {
    if (key === "q" || key === "Q") doSpin();
    if (key === "w" || key === "W") doFlip();
    if (key === "a" || key === "A") doGrab("Nosegrab", 65);
    if (key === "s" || key === "S") doGrab("Melon", 75);
    if (key === "d" || key === "D") doGrab("Japan", 85);
  }

  if ((key === "f" || key === "F") && game.state === "boss") {
    throwTaco();
  }
}

function doSpin() {
  if (turtle.spinTimer <= 0) {
    turtle.spinTimer = 18;
    game.score += 60;
    game.combo++;
  }
}

function doFlip() {
  if (turtle.flipTimer <= 0) {
    turtle.flipTimer = 22;
    game.score += 80;
    game.combo++;
  }
}

function doGrab(name, points) {
  turtle.grabTimer = 20;
  turtle.grabName = name;
  game.score += points;
  game.combo++;
  spawnSpark(turtle.x + 14, turtle.y - 58, color(188, 246, 204), 8);
}

function throwTaco() {
  if (world.tacoCooldown > 0) return;
  world.tacoCooldown = 18;
  world.tacos.push({
    x: turtle.x + 56,
    y: turtle.y - 40,
    vx: 11,
    vy: -2.6,
    rot: 0,
  });
}

function spawnSpark(x, y, c, amount) {
  for (let i = 0; i < amount; i++) {
    world.particles.push({
      x,
      y,
      vx: random(-2.4, 2.4),
      vy: random(-3.4, 0.3),
      life: floor(random(18, 38)),
      col: c,
      size: random(2, 5),
    });
  }
}

function resetGame() {
  game.state = "play";
  game.level = 1;
  game.levelDistance = 0;
  game.levelTarget = 2400;
  game.score = 0;
  game.combo = 0;
  game.speed = 7;
  game.lives = 3;
  boss.active = false;
  boss.hp = 3;
  boss.x = W + 240;
  turtle.y = GROUND_Y;
  turtle.vy = 0;
  turtle.grounded = true;
  turtle.hurtTimer = 0;
  world.obstacles = [];
  world.ramps = [];
  world.tacos = [];
  world.particles = [];
  world.nextObstacleAt = 320;
  world.nextRampAt = 740;
}

function renderScene() {
  drawSkyline();
  drawRoad();
  drawRamps();
  drawObstacles();
  drawBoss();
  drawTacos();
  drawPlayer();
  drawParticles();
  drawHud();
  drawPrompts();
}

function drawSkyline() {
  const gradTop = color(124, 170, 255);
  const gradBot = color(255, 203, 188);

  for (let y = 0; y < H; y++) {
    const t = map(y, 0, H, 0, 1);
    stroke(lerpColor(gradTop, gradBot, t));
    line(0, y, W, y);
  }
  noStroke();

  const layer1Shift = (world.bgShift * 0.15) % 320;
  const layer2Shift = (world.bgShift * 0.28) % 260;

  drawBuildingLayer(H - 300, 320, layer1Shift, color(66, 86, 146), color(240, 248, 255, 110));
  drawBuildingLayer(H - 252, 260, layer2Shift, color(49, 66, 118), color(255, 210, 182, 130));

  fill(255, 235, 196, 220);
  ellipse(920, 110, 130, 130);
}

function drawBuildingLayer(baseY, widthStep, shift, bodyCol, winCol) {
  for (let i = -1; i < 6; i++) {
    const x = i * widthStep - shift;
    const bw = widthStep - 42;
    const bh = 120 + (i % 3) * 44;

    fill(bodyCol);
    rect(x, baseY - bh, bw, bh, 8, 8, 0, 0);

    fill(winCol);
    for (let wy = baseY - bh + 16; wy < baseY - 16; wy += 22) {
      for (let wx = x + 14; wx < x + bw - 14; wx += 24) {
        rect(wx, wy, 12, 9, 2);
      }
    }
  }
}

function drawRoad() {
  fill(33, 37, 56);
  rect(0, GROUND_Y + 12, W, H - (GROUND_Y + 12));

  fill(50, 56, 80);
  rect(0, GROUND_Y - 4, W, 24);

  fill(255, 214, 121);
  for (let x = -120; x < W + 120; x += 120) {
    rect(x + world.roadStripeOffset, GROUND_Y + 40, 66, 8, 4);
  }

  fill(255, 255, 255, 18);
  rect(0, GROUND_Y + 12, W, 2);
}

function drawObstacles() {
  for (const o of world.obstacles) {
    if (o.type === "cone") {
      fill(255, 122, 80);
      triangle(o.x + o.w * 0.5, o.y - o.h, o.x, o.y, o.x + o.w, o.y);
      fill(255, 230, 214);
      rect(o.x + 8, o.y - o.h * 0.45, o.w - 16, 6, 2);
    } else {
      fill(208, 102, 94);
      rect(o.x, o.y - o.h, o.w, o.h, 5);
      fill(255, 196, 185);
      rect(o.x + 6, o.y - o.h + 10, o.w - 12, 8, 2);
      rect(o.x + 6, o.y - o.h + 24, o.w - 12, 8, 2);
    }

    stroke(30, 28, 40, 130);
    strokeWeight(2);
    line(o.x, o.y, o.x + o.w, o.y);
    noStroke();
  }
}

function drawRamps() {
  for (const r of world.ramps) {
    fill(104, 94, 132);
    quad(r.x, r.y, r.x + r.w, r.y, r.x + r.w - 8, r.y - r.h, r.x + 14, r.y - 6);
    fill(154, 145, 191);
    quad(r.x + 16, r.y - 8, r.x + r.w - 8, r.y - r.h, r.x + r.w - 8, r.y - r.h + 8, r.x + 24, r.y - 2);
  }
}

function drawPlayer() {
  const blink = frameCount % 80 < 6;

  push();
  translate(turtle.x, turtle.y);

  if (turtle.spinTimer > 0) rotate(turtle.spinAngle);
  if (turtle.flipTimer > 0) scale(1, cos(turtle.flipAngle));

  drawBoard(0, 0, turtle.hurtTimer > 0);

  translate(0, -42);

  stroke(38, 66, 52);
  strokeWeight(3);

  fill(97, 205, 124);
  ellipse(0, 0, 102, 78);

  fill(127, 231, 150);
  ellipse(0, -3, 72, 50);

  fill(97, 205, 124);
  ellipse(-26, -40, 30, 30);
  ellipse(26, -40, 30, 30);

  fill(255);
  ellipse(-26, -40, 14, 14);
  ellipse(26, -40, 14, 14);

  fill(34, 42, 37);
  ellipse(-26, -40, blink ? 11 : 6, blink ? 2 : 6);
  ellipse(26, -40, blink ? 11 : 6, blink ? 2 : 6);

  noFill();
  arc(0, -10, 30, 16, 0.2, PI - 0.2);

  noStroke();
  fill(85, 182, 110);
  ellipse(-36, 8, 24, 18);
  ellipse(36, 8, 24, 18);

  if (turtle.grabTimer > 0) {
    fill(255, 247, 166, 215);
    rect(-44, -88, 88, 22, 10);
    fill(48, 55, 81);
    textAlign(CENTER, CENTER);
    textSize(13);
    text(turtle.grabName, 0, -77);
  }

  pop();
}

function drawBoard(x, y, isHurt) {
  push();
  translate(x, y);

  fill(28, 31, 44);
  ellipse(-40, 28, 30, 30);
  ellipse(40, 28, 30, 30);

  fill(isHurt ? color(255, 146, 138) : color(90, 196, 255));
  rect(-64, 10, 128, 16, 10);

  fill(255, 238, 152);
  ellipse(-40, 28, 10, 10);
  ellipse(40, 28, 10, 10);

  pop();
}

function drawBoss() {
  if (!boss.active && game.state !== "levelClear") return;

  push();
  translate(boss.x, boss.y);

  if (boss.hitFlash > 0) {
    fill(255, 180, 168);
  } else {
    fill(124, 72, 92);
  }
  rect(-68, -110, 136, 108, 18);

  fill(158, 98, 120);
  rect(-50, -124, 100, 30, 14);

  fill(255);
  ellipse(-22, -76, 20, 20);
  ellipse(22, -76, 20, 20);

  fill(26);
  ellipse(-22, -76, 8, 8);
  ellipse(22, -76, 8, 8);

  fill(255, 123, 125);
  triangle(-16, -52, 0, -28, 16, -52);

  fill(69, 40, 56);
  rect(-74, -2, 148, 12, 6);

  noFill();
  stroke(255, 160, 156, 170);
  strokeWeight(3);
  arc(0, -60, 96, 44, PI + 0.2, TWO_PI - 0.2);
  noStroke();

  pop();

  if (game.state === "boss") {
    fill(36, 40, 58, 210);
    rect(W - 300, 24, 268, 30, 8);
    fill(255, 108, 111);
    const hpW = map(boss.hp, 0, 3, 0, 248);
    rect(W - 290, 34, hpW, 10, 5);
    fill(255);
    textSize(13);
    textAlign(LEFT, BASELINE);
    text("Boss HP", W - 290, 22);
  }
}

function drawTacos() {
  for (const t of world.tacos) {
    push();
    translate(t.x, t.y);
    rotate(t.rot);
    fill(255, 206, 112);
    arc(0, 0, 22, 18, PI, TWO_PI);
    fill(122, 191, 94);
    ellipse(0, -2, 12, 4);
    fill(204, 84, 73);
    ellipse(-4, -3, 4, 4);
    ellipse(4, -3, 4, 4);
    pop();
  }
}

function drawParticles() {
  noStroke();
  for (const p of world.particles) {
    fill(red(p.col), green(p.col), blue(p.col), map(p.life, 0, 38, 0, 230));
    circle(p.x, p.y, p.size);
  }
}

function drawHud() {
  fill(23, 28, 46, 196);
  rect(18, 18, 350, 106, 12);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(15);
  text(`Level: ${game.level}`, 32, 32);
  text(`Score: ${game.score}`, 32, 54);
  text(`Lives: ${game.lives}`, 32, 76);

  fill(255, 226, 153);
  text(`Combo: x${max(1, game.combo)}`, 180, 76);

  fill(255, 255, 255, 60);
  rect(184, 34, 170, 14, 7);

  const progress = constrain(game.levelDistance / game.levelTarget, 0, 1);
  fill(118, 232, 255);
  rect(184, 34, 170 * progress, 14, 7);

  fill(255);
  textSize(12);
  text(game.state === "boss" ? "Boss Zone" : "Distance", 184, 18);
}

function drawPrompts() {
  fill(255, 255, 255, 235);
  rect(18, H - 72, W - 36, 50, 10);

  fill(36, 42, 66);
  textSize(13);
  textAlign(LEFT, CENTER);
  const controls = "Space Jump | Q Spin | W Flip | A Nosegrab | S Melon | D Japan | F Throw Taco (Boss)";
  text(controls, 34, H - 46);

  if (game.state === "boss") {
    fill(255, 135, 124, 230);
    rect(W * 0.5 - 210, 90, 420, 42, 10);
    fill(45, 24, 36);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Boss chase! Hit with 3 tacos.", W * 0.5, 111);
  }

  if (game.state === "levelClear") {
    fill(120, 255, 187, 220);
    rect(W * 0.5 - 220, 88, 440, 48, 10);
    fill(31, 58, 48);
    textAlign(CENTER, CENTER);
    textSize(22);
    text("Boss defeated. Next city block loading...", W * 0.5, 112);
  }

  if (game.state === "gameOver") {
    fill(10, 12, 18, 190);
    rect(0, 0, W, H);

    fill(255, 185, 190);
    textAlign(CENTER, CENTER);
    textSize(52);
    text("GAME OVER", W * 0.5, H * 0.42);

    fill(255);
    textSize(22);
    text("Press R to restart", W * 0.5, H * 0.52);
  }
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
