// main.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let money = 0;
let birdsShot = 0;

let birds = [];
let particles = [];
let powerUps = [];

// Game settings
let birdSpawnRate = 800; // ms
let moneyMultiplier = 1;
let lastBirdSpawn = 0;

// Shop levels
let birdLevel = 1;
let multiLevel = 1;
const birdPriceBase = 50;
const multiPriceBase = 80;

// Quests
let quests = [
    { id: 1, desc: "ยิงนก 10 ตัว", target: 10, current: 0, reward: 80, completed: false },
    { id: 2, desc: "สะสมเงิน 300", target: 300, current: 0, reward: 120, completed: false },
    { id: 3, desc: "ยิงนก 30 ตัว", target: 30, current: 0, reward: 200, completed: false }
];

// Bird class
class Bird {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * (canvas.height * 0.6);
        this.speed = 2 + Math.random() * 3;
        this.size = 28;
        this.angle = Math.random() * Math.PI * 2;
        this.alive = true;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * 0.8;
        
        // Bounce on edges
        if (this.x < 0 || this.x > canvas.width) this.angle = Math.PI - this.angle;
        if (this.y < 0) this.angle = -this.angle;
        
        // Occasionally change direction
        if (Math.random() < 0.02) this.angle += (Math.random() - 0.5) * 1.2;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * 0.3);
        
        // Body
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.7, this.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(this.size * 0.4, -this.size * 0.2, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(this.size * 0.7, -this.size * 0.25);
        ctx.lineTo(this.size * 1.1, -this.size * 0.2);
        ctx.lineTo(this.size * 0.7, -this.size * 0.15);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.size * 0.5, -this.size * 0.3, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.size * 0.52, -this.size * 0.3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Particle for hit effect
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 35;
        this.color = ['#ffd700', '#ff4500', '#ffff00'][Math.floor(Math.random()*3)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3;
        this.life--;
    }

    draw() {
        ctx.globalAlpha = this.life / 35;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 6, 6);
        ctx.globalAlpha = 1;
    }
}

// Shoot
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = birds.length - 1; i >= 0; i--) {
        const bird = birds[i];
        const dx = bird.x - clickX;
        const dy = bird.y - clickY;
        
        if (Math.sqrt(dx*dx + dy*dy) < bird.size * 1.3) {
            // Hit!
            bird.alive = false;
            birdsShot++;
            score += 10 * moneyMultiplier;
            money += 15 * moneyMultiplier;

            // Particles
            for (let j = 0; j < 18; j++) {
                particles.push(new Particle(bird.x, bird.y));
            }

            // Remove bird after short delay
            setTimeout(() => {
                const idx = birds.indexOf(bird);
                if (idx > -1) birds.splice(idx, 1);
            }, 80);

            updateUI();
            checkQuests();
            break;
        }
    }
});

// Update UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('money').textContent = money;
    document.getElementById('birdsShot').textContent = birdsShot;
}

// Shop
const shopModal = document.getElementById('shopModal');
const questModal = document.getElementById('questModal');

document.getElementById('shopBtn').addEventListener('click', () => {
    shopModal.style.display = 'flex';
    document.getElementById('birdPrice').textContent = Math.floor(birdPriceBase * Math.pow(1.6, birdLevel-1));
    document.getElementById('multiPrice').textContent = Math.floor(multiPriceBase * Math.pow(1.7, multiLevel-1));
    document.getElementById('birdLevel').textContent = birdLevel;
    document.getElementById('multiLevel').textContent = multiLevel;
    document.getElementById('currentMulti').textContent = moneyMultiplier;
});

document.getElementById('closeShop').addEventListener('click', () => {
    shopModal.style.display = 'none';
});

document.getElementById('buyBirds').addEventListener('click', () => {
    const price = Math.floor(birdPriceBase * Math.pow(1.6, birdLevel-1));
    if (money >= price) {
        money -= price;
        birdLevel++;
        birdSpawnRate = Math.max(180, birdSpawnRate - 110);
        updateUI();
        alert(`ซื้อสำเร็จ! จำนวนนกเพิ่มขึ้น (ระดับ ${birdLevel})`);
    } else {
        alert("เงินไม่พอ!");
    }
});

document.getElementById('buyMultiplier').addEventListener('click', () => {
    const price = Math.floor(multiPriceBase * Math.pow(1.7, multiLevel-1));
    if (money >= price) {
        money -= price;
        multiLevel++;
        moneyMultiplier = 1 + (multiLevel - 1) * 0.6;
        updateUI();
        alert(`ซื้อสำเร็จ! คูณเงินเป็น x${moneyMultiplier.toFixed(1)}`);
    } else {
        alert("เงินไม่พอ!");
    }
});

// Quests
document.getElementById('questBtn').addEventListener('click', showQuests);

function showQuests() {
    const container = document.getElementById('questsList');
    container.innerHTML = '';
    
    quests.forEach(quest => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            <strong>${quest.desc}</strong><br>
            ${quest.current} / ${quest.target} 
            \( {quest.completed ? '✅' : `<button onclick="claimReward( \){quest.id})">รับรางวัล ${quest.reward} 🪙</button>`}
        `;
        container.appendChild(div);
    });
    
    questModal.style.display = 'flex';
}

document.getElementById('closeQuest').addEventListener('click', () => {
    questModal.style.display = 'none';
});

window.claimReward = function(id) {
    const quest = quests.find(q => q.id === id);
    if (quest && !quest.completed && quest.current >= quest.target) {
        money += quest.reward;
        quest.completed = true;
        updateUI();
        alert(`ได้รับ ${quest.reward} 🪙!`);
        showQuests();
    }
};

function checkQuests() {
    quests.forEach(quest => {
        if (!quest.completed) {
            if (quest.id === 1 || quest.id === 3) {
                quest.current = birdsShot;
            } else if (quest.id === 2) {
                quest.current = Math.max(quest.current, money);
            }
        }
    });
}

// Game loop
function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn birds
    if (timestamp - lastBirdSpawn > birdSpawnRate) {
        birds.push(new Bird());
        lastBirdSpawn = timestamp;
        
        // Occasionally spawn 2 birds
        if (Math.random() < 0.3 && birdLevel > 2) {
            birds.push(new Bird());
        }
    }

    // Update and draw birds
    for (let i = birds.length - 1; i >= 0; i--) {
        const bird = birds[i];
        if (bird.alive) {
            bird.update();
            bird.draw();
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(gameLoop);
}

// Start game
updateUI();
requestAnimationFrame(gameLoop);

// Welcome message
setTimeout(() => {
    alert("ยินดีต้อนรับสู่เกมยิงนกกีวี่!\nคลิกที่ตัวนกเพื่อยิง\nซื้อไอเทมเพื่อเพิ่มความยากและรางวัล");
}, 600);
