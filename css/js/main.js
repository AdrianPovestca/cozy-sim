const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Personajul
const sim = {
  x: 300,
  y: 200,
  targetX: 300,
  targetY: 200,
  speed: 2,
  color: '#e8a87c',
  name: 'Sim'
};

// Click pe canvas → setăm destinația
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  sim.targetX = (e.clientX - rect.left) * scaleX;
  sim.targetY = (e.clientY - rect.top) * scaleY;
});

// Mișcare lină spre țintă
function updateSim() {
  const dx = sim.targetX - sim.x;
  const dy = sim.targetY - sim.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > sim.speed) {
    sim.x += (dx / dist) * sim.speed;
    sim.y += (dy / dist) * sim.speed;
  } else {
    sim.x = sim.targetX;
    sim.y = sim.targetY;
  }
}

// Desenare
function draw() {
  ctx.fillStyle = '#faf0e6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Covor moale
  ctx.fillStyle = '#f0e0d0';
  ctx.beginPath();
  ctx.roundRect(80, 60, 440, 280, 20);
  ctx.fill();

  // Sim-ul cu umbră
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  ctx.beginPath();
  ctx.arc(sim.x, sim.y, 16, 0, Math.PI * 2);
  ctx.fillStyle = sim.color;
  ctx.fill();

  // Ochișori
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.beginPath();
  ctx.arc(sim.x - 5, sim.y - 4, 2.5, 0, Math.PI * 2);
  ctx.arc(sim.x + 5, sim.y - 4, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#4a3728';
  ctx.fill();

  // Nume
  ctx.font = '12px system-ui';
  ctx.fillStyle = '#8b7355';
  ctx.textAlign = 'center';
  ctx.fillText(sim.name, sim.x, sim.y - 26);
}

// Game loop
function loop() {
  updateSim();
  draw();
  requestAnimationFrame(loop);
}

loop();