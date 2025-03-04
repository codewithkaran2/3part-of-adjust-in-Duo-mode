/* ======================================================
   Chaos Keyboard Battle Game - duoMode.js (Duo Mode Only)
   ====================================================== */

/* --------------------------
   MODE SELECTION & SETTINGS
----------------------------- */
const duoBtn = document.getElementById("duoButton");

duoBtn.addEventListener("click", () => {
  duoBtn.style.border = "3px solid white";
  const p2NameInput = document.getElementById("p2Name");
  p2NameInput.disabled = false;
  p2NameInput.placeholder = "Enter 🟥 Player 2 Name";
  p2NameInput.value = "";
});

/* --------------------------
   HELPER FUNCTIONS
----------------------------- */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

/* --------------------------
   CANVAS, CONTEXT, & GAME STATE
----------------------------- */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const defaultP1Name = "Player 1";
const defaultP2Name = "Player 2";
let p1Name = defaultP1Name;
let p2Name = defaultP2Name;
let p1Score = 0, p2Score = 0;
const speed = 5;
let gameRunning = false;
let gamePaused = false;

/* --------------------------
   AUDIO SETUP & VOLUME CONTROL
----------------------------- */
const bgMusic = document.getElementById("bgMusic");
const shootSound = document.getElementById("shootSound");
const hitSound = document.getElementById("hitSound");
const shieldBreakSound = document.getElementById("shieldBreakSound");
const volumeSlider = document.getElementById("volumeSlider");
volumeSlider.addEventListener("input", function() {
  const vol = parseFloat(this.value);
  bgMusic.volume = vol;
  shootSound.volume = vol;
  hitSound.volume = vol;
  shieldBreakSound.volume = vol;
});

function startBackgroundMusic() {
  bgMusic.play();
}

/* --------------------------
   PLAYER DEFINITIONS (DUO MODE)
----------------------------- */
// Increased size from 40 to 60 for better visibility.
const player1 = {
  x: 100,
  y: 0, // Set during drop animation
  width: 60,
  height: 60,
  color: "blue",
  health: 100,
  shield: 100,
  shieldActive: false,
  shieldBroken: false,
  canShoot: true,
  lastDir: "right"
};
const player2 = {
  x: 600,
  y: 0, // Set during drop animation
  width: 60,
  height: 60,
  color: "red",
  health: 100,
  shield: 100,
  shieldActive: false,
  shieldBroken: false,
  canShoot: true,
  lastDir: "left"
};

let bullets = [];

/* --------------------------
   CONTROLS & KEY EVENTS
----------------------------- */
const keys = {
  w: false, a: false, s: false, d: false,
  ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
  q: false, m: false, p: false
};

function updateDirection() {
  if (keys.w) { player1.lastDir = "up"; }
  else if (keys.s) { player1.lastDir = "down"; }
  else if (keys.a) { player1.lastDir = "left"; }
  else if (keys.d) { player1.lastDir = "right"; }
  
  // Player2 uses arrow keys
  if (keys.ArrowUp) { player2.lastDir = "up"; }
  else if (keys.ArrowDown) { player2.lastDir = "down"; }
  else if (keys.ArrowLeft) { player2.lastDir = "left"; }
  else if (keys.ArrowRight) { player2.lastDir = "right"; }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "CapsLock") { e.preventDefault(); return; }
  
  // Player1 shoots with Space
  if (e.code === "Space") {
    if (player1.canShoot && gameRunning && !gamePaused) {
      shootBullet(player1, 1);
      player1.canShoot = false;
    }
    return;
  }
  // Player2 shoots with Enter
  if (e.code === "Enter") {
    if (player2.canShoot && gameRunning && !gamePaused) {
      shootBullet(player2, 2);
      player2.canShoot = false;
    }
    return;
  }
  
  if (keys.hasOwnProperty(e.key)) {
    if (e.key === "p") { togglePause(); return; }
    keys[e.key] = true;
    updateDirection();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "CapsLock") { e.preventDefault(); return; }
  
  if (e.code === "Space") {
    player1.canShoot = true;
    return;
  }
  if (e.code === "Enter") {
    player2.canShoot = true;
    return;
  }
  
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
    updateDirection();
  }
});

/* --------------------------
   GAME LOGIC: MOVEMENT & COLLISIONS
----------------------------- */
function movePlayers() {
  let oldP1 = { x: player1.x, y: player1.y };
  let oldP2 = { x: player2.x, y: player2.y };
  
  // Player1 movement
  let dx1 = 0, dy1 = 0;
  if (keys.a && player1.x > 0) dx1 = -speed;
  if (keys.d && player1.x + player1.width < canvas.width) dx1 = speed;
  if (keys.w && player1.y > 0) dy1 = -speed;
  if (keys.s && player1.y + player1.height < canvas.height) dy1 = speed;
  
  // Player2 movement using arrow keys
  let dx2 = 0, dy2 = 0;
  if (keys.ArrowLeft && player2.x > 0) dx2 = -speed;
  if (keys.ArrowRight && player2.x + player2.width < canvas.width) dx2 = speed;
  if (keys.ArrowUp && player2.y > 0) dy2 = -speed;
  if (keys.ArrowDown && player2.y + player2.height < canvas.height) dy2 = speed;
  
  player1.x += dx1;
  player2.x += dx2;
  if (rectCollision(player1, player2)) {
    player1.x = oldP1.x;
    player2.x = oldP2.x;
  }
  
  player1.y += dy1;
  player2.y += dy2;
  if (rectCollision(player1, player2)) {
    player1.y = oldP1.y;
    player2.y = oldP2.y;
  }
  
  // Update shield status – each player's shield is toggled directly via its key (q for Player1, m for Player2)
  player1.shieldActive = keys.q;
  player2.shieldActive = keys.m;
  updateDirection();
}

function rectCollision(rect1, rect2) {
  const margin = 5;
  return rect1.x < rect2.x + rect2.width + margin &&
         rect1.x + rect1.width > rect2.x - margin &&
         rect1.y < rect2.y + rect2.height + margin &&
         rect1.y + rect1.height > rect2.y - margin;
}

/* --------------------------
   BULLET HANDLING
----------------------------- */
function bulletHitsPlayer(bullet, player) {
  return bullet.x >= player.x &&
         bullet.x <= player.x + player.width &&
         bullet.y >= player.y &&
         bullet.y <= player.y + player.height;
}

function shootBullet(player, playerNum) {
  const bullet = {
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
    speed: 10,
    direction: player.lastDir,
    player: playerNum
  };
  bullets.push(bullet);
  shootSound.currentTime = 0;
  shootSound.play();
}

/* --------------------------
   DRAWING FUNCTIONS
----------------------------- */
function drawPlayers() {
  ctx.fillStyle = player1.color;
  ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
  
  ctx.fillStyle = player2.color;
  ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
}

function drawTopStatus() {
  // Increased bar dimensions for improved UI.
  const barWidth = 300, barHeight = 20;
  const leftX = 20, topY = 20;
  const rightX = canvas.width - barWidth - 20;
  
  // --- Player 1 Health Bar ---
  ctx.fillStyle = "red";
  ctx.fillRect(leftX, topY, (player1.health / 100) * barWidth, barHeight);
  ctx.strokeStyle = "white";
  ctx.strokeRect(leftX, topY, barWidth, barHeight);
  
  // Health text (increased font size)
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  ctx.fillText("Health: " + player1.health + "%", leftX + 5, topY + 22);
  
  // --- Player 1 Shield Bar ---
  let shieldColor1 = player1.shield > 0
    ? ctx.createLinearGradient(leftX, topY + barHeight + 5, leftX + barWidth, topY + barHeight + 5)
    : "#777";
  if (player1.shield > 0) {
    shieldColor1.addColorStop(0, "#4A90E2");
    shieldColor1.addColorStop(1, "#003366");
  }
  ctx.fillStyle = shieldColor1;
  ctx.fillRect(leftX, topY + barHeight + 5, (player1.shield / 100) * barWidth, barHeight);
  ctx.strokeStyle = "white";
  ctx.strokeRect(leftX, topY + barHeight + 5, barWidth, barHeight);
  
  // Shield text (increased font size)
  ctx.fillStyle = "white";
  ctx.fillText("Shield: " + player1.shield + "% 🛡️", leftX + 5, topY + (barHeight * 2) + 12);
  
  // Draw a border around health/shield if shield is active (thicker border)
  if (player1.shieldActive) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 4;
    ctx.strokeRect(leftX - 2, topY - 2, barWidth + 4, barHeight * 2 + 9);
    ctx.lineWidth = 1; // Reset line width
  }
  
  // --- Player 2 Health Bar ---
  ctx.textAlign = "right";
  ctx.fillStyle = "red";
  ctx.fillRect(rightX, topY, (player2.health / 100) * barWidth, barHeight);
  ctx.strokeStyle = "white";
  ctx.strokeRect(rightX, topY, barWidth, barHeight);
  
  // Health text for Player 2
  ctx.fillStyle = "white";
  ctx.fillText("Health: " + player2.health + "%", rightX + barWidth - 5, topY + 22);
  
  // --- Player 2 Shield Bar ---
  let shieldColor2 = player2.shield > 0
    ? ctx.createLinearGradient(rightX, topY + barHeight + 5, rightX + barWidth, topY + barHeight + 5)
    : "#777";
  if (player2.shield > 0) {
    shieldColor2.addColorStop(0, "#4A90E2");
    shieldColor2.addColorStop(1, "#003366");
  }
  ctx.fillStyle = shieldColor2;
  ctx.fillRect(rightX, topY + barHeight + 5, (player2.shield / 100) * barWidth, barHeight);
  ctx.strokeStyle = "white";
  ctx.strokeRect(rightX, topY + barHeight + 5, barWidth, barHeight);
  
  // Shield text for Player 2
  ctx.fillStyle = "white";
  ctx.fillText("Shield: " + player2.shield + "% 🛡️", rightX + barWidth - 5, topY + (barHeight * 2) + 12);
  
  if (player2.shieldActive) {
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 4;
    ctx.strokeRect(rightX - 2, topY - 2, barWidth + 4, barHeight * 2 + 9);
    ctx.lineWidth = 1;
  }
  
  // --- Player Names (displayed centered below shield bars with increased font size) ---
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "blue";
  ctx.fillText("🟦 " + p1Name, leftX + barWidth / 2, topY + (barHeight * 2) + 50);
  ctx.fillStyle = "red";
  ctx.fillText("🟥 " + p2Name, rightX + barWidth / 2, topY + (barHeight * 2) + 50);
  ctx.textAlign = "left"; // Reset alignment
}

// Note: drawControls() is no longer called since controls are shown below the canvas via HTML.

/* --------------------------
   ANIMATION & GAME LOOP
----------------------------- */
function dropAnimation(callback) {
  const dropSpeed = 5;
  // New destination: drop to near the bottom of canvas.
  const destinationY = canvas.height - player1.height - 50;
  function animate() {
    let done = true;
    if (player1.y < destinationY) {
      player1.y += dropSpeed;
      if (player1.y > destinationY) player1.y = destinationY;
      done = false;
    }
    if (player2.y < destinationY) {
      player2.y += dropSpeed;
      if (player2.y > destinationY) player2.y = destinationY;
      done = false;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayers();
    drawTopStatus();
    if (!done) {
      requestAnimationFrame(animate);
    } else {
      // Position players at their designated sides.
      player1.x = 50;
      player2.x = canvas.width - player2.width - 50;
      // Show instruction overlay for 2 seconds.
      document.getElementById("instructionScreen").classList.remove("hidden");
      document.getElementById("p1Instruction").innerText = p1Name;
      document.getElementById("p2Instruction").innerText = p2Name;
      setTimeout(() => {
        document.getElementById("instructionScreen").classList.add("hidden");
        callback();
      }, 2000);
    }
  }
  animate();
}

function updateShields() {
  const players = [player1, player2];
  players.forEach(player => {
    if (player.shieldActive && player.shield > 0) {
      // Reduced depletion rate for shield.
      player.shield -= 0.3;
      if (player.shield <= 0) {
        player.shield = 0;
        player.shieldActive = false;
        player.shieldBroken = true;
        shieldBreakSound.currentTime = 0;
        shieldBreakSound.play();
        setTimeout(() => { player.shieldBroken = false; }, 3000);
      }
    } else if (!player.shieldActive && !player.shieldBroken && player.shield < 100) {
      player.shield += 0.2;
      if (player.shield > 100) player.shield = 100;
    }
  });
}

function checkWinCondition() {
  if (player1.health <= 0) return p2Name;
  if (player2.health <= 0) return p1Name;
  return null;
}

function gameLoop() {
  if (!gameRunning || gamePaused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    switch(bullet.direction) {
      case "up":    bullet.y -= bullet.speed; break;
      case "down":  bullet.y += bullet.speed; break;
      case "left":  bullet.x -= bullet.speed; break;
      case "right": bullet.x += bullet.speed; break;
    }
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }
    // Check collisions
    if (bullet.player !== 1 && bulletHitsPlayer(bullet, player1)) {
      player1.health = Math.max(0, player1.health - 10);
      hitSound.currentTime = 0;
      hitSound.play();
      bullets.splice(i, 1);
      continue;
    }
    if (bullet.player !== 2 && bulletHitsPlayer(bullet, player2)) {
      player2.health = Math.max(0, player2.health - 10);
      hitSound.currentTime = 0;
      hitSound.play();
      bullets.splice(i, 1);
      continue;
    }
    
    // Draw bullet
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  updateShields();
  drawPlayers();
  movePlayers();
  drawTopStatus();
  
  let winner = checkWinCondition();
  if (winner !== null) {
    gameRunning = false;
    document.getElementById("gameOverScreen").classList.remove("hidden");
    // Update the winner's name in the game over screen.
    document.getElementById("winnerName").innerText = winner;
    return;
  }
  
  requestAnimationFrame(gameLoop);
}

/* --------------------------
   GAME START & CONTROL FUNCTIONS
----------------------------- */
// Renamed startGame() to duoStartGame() so that main.js can load it.
function duoStartGame() {
  document.getElementById("startScreen").classList.add("hidden");
  const p1Input = document.getElementById("p1Name");
  if (p1Input.value.trim() !== "") p1Name = p1Input.value;
  const p2Input = document.getElementById("p2Name");
  if (p2Input.value.trim() !== "") p2Name = p2Input.value;
  gameRunning = true;
  startBackgroundMusic();
  
  // Set players off-screen for drop animation.
  // Adjusted starting positions so they drop from different heights.
  player1.y = -player1.height - 20;
  player2.y = -player2.height - 100;
  
  dropAnimation(() => {
    gameLoop();
  });
}

function restartGame() {
  location.reload();
}

function playAgain() {
  restartGame();
}

function togglePause() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  const pauseScreen = document.getElementById("pauseScreen");
  if (gamePaused) {
    pauseScreen.classList.remove("hidden");
  } else {
    pauseScreen.classList.add("hidden");
    gameLoop();
  }
}

// Expose duo mode functions globally.
window.duoStartGame = duoStartGame;
window.restartGame = restartGame;
window.togglePause = togglePause;
window.playAgain = playAgain;
