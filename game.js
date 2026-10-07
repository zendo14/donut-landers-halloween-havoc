// ============================================================
// DONUT LANDERS: HALLOWEEN HAVOC
// V1.1
// Donut Land • Killer Arts Media • #ZTFILMS
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CONFIG = {
    width: 1024,
    height: 576,

    gravity: 0.62,
    jumpPower: -13,

    baseSpeed: 5,
    maxSpeed: 12,

    groundY: 485,

    levelDistance: 1200,

    playerWidth: 58,
    playerHeight: 58
};

// ------------------------------------------------------------
// ASSETS
// ------------------------------------------------------------

const assets = {
    logo: new Image(),
    by: new Image(),

    backgrounds: [
        new Image(),
        new Image(),
        new Image(),
        new Image(),
        new Image()
    ],

    menuMusic: new Audio("assets/music/menu.mp3"),
    gameMusic: new Audio("assets/music/gamemusic.mp3")
};

assets.logo.src = "assets/logo.png";
assets.by.src = "assets/by.png";

assets.backgrounds[0].src = "assets/backgrounds/BG.jpg";
assets.backgrounds[1].src = "assets/backgrounds/BG2.jpg";
assets.backgrounds[2].src = "assets/backgrounds/BG3.jpg";
assets.backgrounds[3].src = "assets/backgrounds/BG4.jpg";
assets.backgrounds[4].src = "assets/backgrounds/BG5.jpg";

assets.menuMusic.loop = true;
assets.gameMusic.loop = true;

assets.menuMusic.volume = 0.65;
assets.gameMusic.volume = 0.55;

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------

let state = {
    screen: "menu",

    score: 0,
    level: 1,

    distance: 0,
    backgroundX: 0,

    gameRunning: false,

    lastTime: 0,

    obstacleTimer: 0,
    obstacleInterval: 1100,

    candyTimer: 0,

    speed: CONFIG.baseSpeed,

    obstacles: [],
    collectibles: []
};

// ------------------------------------------------------------
// PLAYER
// ------------------------------------------------------------

const player = {
    x: 150,
    y: CONFIG.groundY - CONFIG.playerHeight,

    width: CONFIG.playerWidth,
    height: CONFIG.playerHeight,

    velocityY: 0,

    grounded: true,

    squash: 1,

    jump() {

        if (!this.grounded) return;

        this.velocityY = CONFIG.jumpPower;
        this.grounded = false;

        this.squash = 0.85;
    },

    update(dt) {

        this.velocityY += CONFIG.gravity * dt;

        this.y += this.velocityY * dt;

        const floor = CONFIG.groundY - this.height;

        if (this.y >= floor) {

            this.y = floor;

            this.velocityY = 0;

            this.grounded = true;

            this.squash += (1 - this.squash) * 0.25;

        } else {

            this.grounded = false;

            this.squash += (1 - this.squash) * 0.15;
        }
    },

    draw() {

        ctx.save();

        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;

        ctx.translate(centerX, bottomY);

        ctx.scale(1, this.squash);

        // Donut body
        ctx.beginPath();
        ctx.arc(0, -30, 27, 0, Math.PI * 2);

        ctx.fillStyle = "#d98a45";
        ctx.fill();

        // Frosting
        ctx.beginPath();
        ctx.arc(0, -34, 23, 0, Math.PI * 2);

        ctx.fillStyle = "#f4b6d2";
        ctx.fill();

        // Donut hole
        ctx.beginPath();
        ctx.arc(0, -34, 7, 0, Math.PI * 2);

        ctx.fillStyle = "#7a4326";
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#111";

        ctx.beginPath();
        ctx.arc(-8, -39, 3, 0, Math.PI * 2);
        ctx.arc(8, -39, 3, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.beginPath();

        ctx.arc(
            0,
            -34,
            8,
            0.15 * Math.PI,
            0.85 * Math.PI
        );

        ctx.strokeStyle = "#111";
        ctx.lineWidth = 2;

        ctx.stroke();

        ctx.restore();
    }
};

// ------------------------------------------------------------
// OBSTACLE TYPES
// ------------------------------------------------------------

const OBSTACLE_TYPES = [

    {
        type: "half_eaten_donut",
        width: 58,
        height: 45
    },

    {
        type: "donut_piece",
        width: 52,
        height: 35
    },

    {
        type: "coffee_spill",
        width: 82,
        height: 25
    },

    {
        type: "coffee_cup",
        width: 45,
        height: 62
    },

    {
        type: "white_coffee_mug",
        width: 52,
        height: 58
    },

    {
        type: "donut_box",
        width: 65,
        height: 48
    },

    {
        type: "open_donut_box",
        width: 72,
        height: 52
    },

    {
        type: "bad_donut",
        width: 58,
        height: 48
    },

    {
        type: "crushed_donut",
        width: 65,
        height: 32
    },

    {
        type: "donut_garbage",
        width: 68,
        height: 58
    },

    {
        type: "zombie_donut",
        width: 62,
        height: 62
    },

    {
        type: "ghost_donut",
        width: 60,
        height: 65
    },

    {
        type: "bat_donut",
        width: 72,
        height: 55
    },

    {
        type: "tombstone",
        width: 55,
        height: 75
    },

    {
        type: "skull",
        width: 55,
        height: 55
    },

    {
        type: "spider",
        width: 55,
        height: 65
    },

    {
        type: "spider_web",
        width: 70,
        height: 65
    },

    {
        type: "candy",
        width: 40,
        height: 45
    },

    {
        type: "jack_o_lantern_donut",
        width: 62,
        height: 60
    },

    {
        type: "witch_donut",
        width: 65,
        height: 65
    }
];

// ------------------------------------------------------------
// OBSTACLE CREATION
// ------------------------------------------------------------

function createObstacle() {

    const type =
        OBSTACLE_TYPES[
            Math.floor(Math.random() * OBSTACLE_TYPES.length)
        ];

    const obstacle = {

        type: type.type,

        x: CONFIG.width + 80,

        y:
            CONFIG.groundY -
            type.height,

        width: type.width,

        height: type.height,

        passed: false
    };

    state.obstacles.push(obstacle);
}

// ------------------------------------------------------------
// COLLECTIBLES
// ------------------------------------------------------------

function createCandy() {

    state.collectibles.push({

        type: "candy",

        x: CONFIG.width + 80,

        y:
            CONFIG.groundY -
            130 -
            Math.random() * 100,

        width: 38,

        height: 38,

        collected: false
    });
}

// ------------------------------------------------------------
// COLLISION
// ------------------------------------------------------------

function collision(a, b) {

    const padding = 8;

    return (

        a.x + padding <
        b.x + b.width - padding &&

        a.x + a.width - padding >
        b.x + padding &&

        a.y + padding <
        b.y + b.height - padding &&

        a.y + a.height - padding >
        b.y + padding
    );
}

// ------------------------------------------------------------
// LEVEL SYSTEM
// ------------------------------------------------------------

function updateLevel() {

    const newLevel =
        Math.min(
            5,
            Math.floor(state.distance / CONFIG.levelDistance) + 1
        );

    if (newLevel !== state.level) {

        state.level = newLevel;

        state.speed =
            Math.min(
                CONFIG.maxSpeed,
                CONFIG.baseSpeed +
                (state.level - 1) * 1.25
            );

        state.obstacleInterval =
            Math.max(
                650,
                1100 -
                (state.level - 1) * 80
            );
    }
}

// ------------------------------------------------------------
// BACKGROUND
// ------------------------------------------------------------

function drawBackground() {

    const image =
        assets.backgrounds[state.level - 1];

    if (!image.complete || !image.naturalWidth) {

        ctx.fillStyle = "#111";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        return;
    }

    const scale =
        canvas.height /
        image.naturalHeight;

    const width =
        image.naturalWidth * scale;

    let x =
        -state.backgroundX % width;

    while (x < canvas.width) {

        ctx.drawImage(
            image,
            x,
            0,
            width,
            canvas.height
        );

        x += width;
    }
}

// ------------------------------------------------------------
// DRAW OBSTACLES
// ------------------------------------------------------------

function drawObstacle(o) {

    ctx.save();

    ctx.translate(o.x, o.y);

    switch (o.type) {

        case "half_eaten_donut":
            drawHalfDonut(o);
            break;

        case "donut_piece":
            drawDonutPiece(o);
            break;

        case "coffee_spill":
            drawCoffeeSpill(o);
            break;

        case "coffee_cup":
            drawCoffeeCup(o);
            break;

        case "white_coffee_mug":
            drawWhiteMug(o);
            break;

        case "donut_box":
            drawDonutBox(o);
            break;

        case "open_donut_box":
            drawOpenDonutBox(o);
            break;

        case "bad_donut":
            drawBadDonut(o);
            break;

        case "crushed_donut":
            drawCrushedDonut(o);
            break;

        case "donut_garbage":
            drawDonutGarbage(o);
            break;

        case "zombie_donut":
            drawZombieDonut(o);
            break;

        case "ghost_donut":
            drawGhostDonut(o);
            break;

        case "bat_donut":
            drawBatDonut(o);
            break;

        case "tombstone":
            drawTombstone(o);
            break;

        case "skull":
            drawSkull(o);
            break;

        case "spider":
            drawSpider(o);
            break;

        case "spider_web":
            drawSpiderWeb(o);
            break;

        case "candy":
            drawCandy(o);
            break;

        case "jack_o_lantern_donut":
            drawJackOLantern(o);
            break;

        case "witch_donut":
            drawWitchDonut(o);
            break;
    }

    ctx.restore();
}

// ------------------------------------------------------------
// DONUT SHOP ART
// ------------------------------------------------------------

function drawHalfDonut(o) {

    ctx.fillStyle = "#d68a42";

    ctx.beginPath();
    ctx.arc(
        o.width / 2,
        o.height / 2,
        24,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#f3a8c6";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        o.height / 2 - 3,
        19,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.arc(
        o.width / 2 + 18,
        o.height / 2 - 18,
        9,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawDonutPiece(o) {

    ctx.fillStyle = "#d88b46";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        o.height / 2,
        22,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#f5b5cf";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        o.height / 2,
        14,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawCoffeeSpill(o) {

    ctx.fillStyle = "#5a321f";

    ctx.beginPath();

    ctx.ellipse(
        o.width / 2,
        o.height / 2,
        o.width / 2,
        o.height / 2.7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#8a5736";

    ctx.beginPath();

    ctx.ellipse(
        o.width / 2 - 10,
        o.height / 2 - 3,
        15,
        5,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawCoffeeCup(o) {

    ctx.fillStyle = "#c66b32";

    ctx.fillRect(
        7,
        12,
        o.width - 14,
        o.height - 16
    );

    ctx.fillStyle = "#5a321f";

    ctx.beginPath();

    ctx.ellipse(
        o.width / 2,
        13,
        18,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#c66b32";
    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.arc(
        o.width - 5,
        34,
        12,
        -Math.PI / 2,
        Math.PI / 2
    );

    ctx.stroke();
}

function drawWhiteMug(o) {

    ctx.fillStyle = "#f4f4f4";

    ctx.fillRect(
        7,
        14,
        o.width - 18,
        o.height - 17
    );

    ctx.fillStyle = "#432719";

    ctx.beginPath();

    ctx.ellipse(
        o.width / 2 - 2,
        14,
        18,
        6,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#f4f4f4";
    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.arc(
        o.width - 7,
        36,
        12,
        -Math.PI / 2,
        Math.PI / 2
    );

    ctx.stroke();
}

function drawDonutBox(o) {

    ctx.fillStyle = "#d79a52";

    ctx.fillRect(
        4,
        15,
        o.width - 8,
        o.height - 15
    );

    ctx.strokeStyle = "#7c421f";
    ctx.lineWidth = 3;

    ctx.strokeRect(
        4,
        15,
        o.width - 8,
        o.height - 15
    );

    ctx.fillStyle = "#f5d28c";

    ctx.fillRect(
        10,
        21,
        o.width - 20,
        8
    );
}

function drawOpenDonutBox(o) {

    ctx.fillStyle = "#e5b36a";

    ctx.fillRect(
        5,
        22,
        o.width - 10,
        o.height - 22
    );

    ctx.strokeStyle = "#7c421f";
    ctx.lineWidth = 3;

    ctx.strokeRect(
        5,
        22,
        o.width - 10,
        o.height - 22
    );

    ctx.fillStyle = "#f5b6cf";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        37,
        12,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawBadDonut(o) {

    ctx.fillStyle = "#65402d";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        o.height / 2,
        23,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#333";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        o.height / 2,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#e85b42";

    ctx.beginPath();

    ctx.arc(
        18,
        20,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        39,
        28,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawCrushedDonut(o) {

    ctx.fillStyle = "#9d5e35";

    ctx.beginPath();

    ctx.ellipse(
        o.width / 2,
        o.height / 2,
        o.width / 2,
        o.height / 2.2,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#e99fc0";

    ctx.fillRect(
        10,
        12,
        o.width - 20,
        7
    );
}

function drawDonutGarbage(o) {

    ctx.fillStyle = "#727272";

    ctx.fillRect(
        10,
        15,
        o.width - 20,
        o.height - 15
    );

    ctx.fillStyle = "#d98245";

    ctx.beginPath();

    ctx.arc(
        27,
        20,
        13,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#f4b0ca";

    ctx.beginPath();

    ctx.arc(
        48,
        30,
        12,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

// ------------------------------------------------------------
// HALLOWEEN ART
// ------------------------------------------------------------

function drawZombieDonut(o) {

    ctx.fillStyle = "#718f54";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        o.height / 2,
        27,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#6a4b36";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        o.height / 2,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#111";

    ctx.fillRect(15, 18, 7, 7);
    ctx.fillRect(39, 18, 7, 7);

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(18, 43);
    ctx.lineTo(43, 43);

    ctx.stroke();
}

function drawGhostDonut(o) {

    ctx.fillStyle = "rgba(245,245,255,0.95)";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        27,
        25,
        Math.PI,
        0
    );

    ctx.lineTo(
        o.width - 8,
        o.height - 10
    );

    ctx.lineTo(
        o.width - 20,
        o.height - 20
    );

    ctx.lineTo(
        o.width / 2,
        o.height - 8
    );

    ctx.lineTo(
        20,
        o.height - 20
    );

    ctx.lineTo(
        8,
        o.height - 10
    );

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.arc(23, 28, 4, 0, Math.PI * 2);
    ctx.arc(39, 28, 4, 0, Math.PI * 2);

    ctx.fill();
}

function drawBatDonut(o) {

    ctx.fillStyle = "#21152b";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        31,
        20,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(25, 25);
    ctx.lineTo(3, 10);
    ctx.lineTo(8, 36);
    ctx.lineTo(25, 32);

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(47, 25);
    ctx.lineTo(69, 10);
    ctx.lineTo(64, 36);
    ctx.lineTo(47, 32);

    ctx.fill();

    ctx.fillStyle = "#e95c54";

    ctx.beginPath();

    ctx.arc(25, 28, 3, 0, Math.PI * 2);
    ctx.arc(47, 28, 3, 0, Math.PI * 2);

    ctx.fill();
}

function drawTombstone(o) {

    ctx.fillStyle = "#727272";

    ctx.beginPath();

    ctx.moveTo(7, o.height);

    ctx.lineTo(7, 22);

    ctx.quadraticCurveTo(
        o.width / 2,
        0,
        o.width - 7,
        22
    );

    ctx.lineTo(
        o.width - 7,
        o.height
    );

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle = "#252525";

    ctx.font = "bold 20px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "RIP",
        o.width / 2,
        45
    );
}

function drawSkull(o) {

    ctx.fillStyle = "#eee";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        23,
        21,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillRect(
        17,
        30,
        22,
        17
    );

    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.arc(21, 23, 6, 0, Math.PI * 2);
    ctx.arc(35, 23, 6, 0, Math.PI * 2);

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(28, 28);
    ctx.lineTo(24, 34);
    ctx.lineTo(32, 34);

    ctx.fill();
}

function drawSpider(o) {

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
        o.width / 2,
        0
    );

    ctx.lineTo(
        o.width / 2,
        17
    );

    ctx.stroke();

    ctx.fillStyle = "#171717";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        36,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#171717";

    for (let i = 0; i < 4; i++) {

        const y = 23 + i * 9;

        ctx.beginPath();

        ctx.moveTo(
            o.width / 2 - 8,
            y
        );

        ctx.lineTo(
            2,
            y - 10
        );

        ctx.moveTo(
            o.width / 2 + 8,
            y
        );

        ctx.lineTo(
            o.width - 2,
            y - 10
        );

        ctx.stroke();
    }
}

function drawSpiderWeb(o) {

    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 2;

    const cx = o.width / 2;
    const cy = o.height / 2;

    for (let i = 0; i < 8; i++) {

        const angle =
            i *
            Math.PI /
            4;

        ctx.beginPath();

        ctx.moveTo(cx, cy);

        ctx.lineTo(
            cx +
            Math.cos(angle) * 35,

            cy +
            Math.sin(angle) * 35
        );

        ctx.stroke();
    }

    for (let r = 10; r <= 30; r += 10) {

        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            r,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }
}

function drawCandy(o) {

    ctx.fillStyle = "#ff6f91";

    ctx.beginPath();

    ctx.roundRect(
        8,
        10,
        24,
        22,
        6
    );

    ctx.fill();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(8, 14);
    ctx.lineTo(1, 7);

    ctx.moveTo(32, 14);
    ctx.lineTo(39, 7);

    ctx.stroke();
}

function drawJackOLantern(o) {

    ctx.fillStyle = "#ed782d";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        o.height / 2,
        27,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.moveTo(15, 27);
    ctx.lineTo(25, 23);
    ctx.lineTo(22, 34);

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(39, 23);
    ctx.lineTo(49, 27);
    ctx.lineTo(42, 34);

    ctx.fill();

    ctx.fillRect(
        21,
        39,
        20,
        4
    );
}

function drawWitchDonut(o) {

    ctx.fillStyle = "#9d68bd";

    ctx.beginPath();

    ctx.arc(
        o.width / 2,
        39,
        21,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#20152d";

    ctx.beginPath();

    ctx.moveTo(
        12,
        28
    );

    ctx.lineTo(
        32,
        2
    );

    ctx.lineTo(
        53,
        28
    );

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle = "#e0a73a";

    ctx.fillRect(
        8,
        27,
        48,
        6
    );
}

// ------------------------------------------------------------
// COLLECTIBLE DRAWING
// ------------------------------------------------------------

function drawCollectible(c) {

    drawCandy(c);
}

// ------------------------------------------------------------
// UPDATE OBSTACLES
// ------------------------------------------------------------

function updateObstacles(dt) {

    state.obstacleTimer += dt * 16.67;

    if (
        state.obstacleTimer >
        state.obstacleInterval
    ) {

        createObstacle();

        state.obstacleTimer = 0;
    }

    for (let i = state.obstacles.length - 1; i >= 0; i--) {

        const o = state.obstacles[i];

        o.x -= state.speed * dt;

        if (!o.passed && o.x + o.width < player.x) {

            o.passed = true;

            state.score += 10;
        }

        if (collision(player, o)) {

            endGame();

            return;
        }

        if (o.x + o.width < -100) {

            state.obstacles.splice(i, 1);
        }
    }
}

// ------------------------------------------------------------
// UPDATE COLLECTIBLES
// ------------------------------------------------------------

function updateCollectibles(dt) {

    state.candyTimer += dt * 16.67;

    if (state.candyTimer > 1600) {

        createCandy();

        state.candyTimer = 0;
    }

    for (
        let i = state.collectibles.length - 1;
        i >= 0;
        i--
    ) {

        const c = state.collectibles[i];

        c.x -= state.speed * dt;

        if (collision(player, c)) {

            state.score += 25;

            state.collectibles.splice(i, 1);

            continue;
        }

        if (c.x + c.width < -50) {

            state.collectibles.splice(i, 1);
        }
    }
}

// ------------------------------------------------------------
// GAME UPDATE
// ------------------------------------------------------------

function update(dt) {

    if (!state.gameRunning) return;

    player.update(dt);

    updateObstacles(dt);

    updateCollectibles(dt);

    state.distance += state.speed * dt;

    state.backgroundX +=
        state.speed * dt;

    updateLevel();

    state.score +=
        Math.floor(state.speed * dt);
}

// ------------------------------------------------------------
// GAME DRAW
// ------------------------------------------------------------

function drawGame() {

    drawBackground();

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";

    ctx.fillRect(
        0,
        CONFIG.groundY,
        canvas.width,
        canvas.height -
        CONFIG.groundY
    );

    // Collectibles
    for (const c of state.collectibles) {

        ctx.save();

        ctx.translate(
            c.x,
            c.y
        );

        drawCollectible(c);

        ctx.restore();
    }

    // Obstacles
    for (const o of state.obstacles) {

        drawObstacle(o);
    }

    player.draw();

    drawHUD();
}

// ------------------------------------------------------------
// HUD
// ------------------------------------------------------------

function drawHUD() {

    ctx.save();

    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.fillRect(
        15,
        15,
        235,
        78
    );

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 20px Arial";

    ctx.textAlign = "left";

    ctx.fillText(
        "SCORE: " +
        state.score,
        30,
        43
    );

    ctx.fillText(
        "LEVEL: " +
        state.level,
        30,
        70
    );

    ctx.restore();
}

// ------------------------------------------------------------
// MENU
// ------------------------------------------------------------

function drawMenu() {

    ctx.fillStyle = "#090909";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Logo
    if (
        assets.logo.complete &&
        assets.logo.naturalWidth
    ) {

        const maxWidth = 570;

        const scale =
            Math.min(
                1,
                maxWidth /
                assets.logo.naturalWidth
            );

        const w =
            assets.logo.naturalWidth *
            scale;

        const h =
            assets.logo.naturalHeight *
            scale;

        const float =
            Math.sin(
                performance.now() / 700
            ) * 8;

        ctx.drawImage(
            assets.logo,
            canvas.width / 2 - w / 2,
            65 + float,
            w,
            h
        );

    } else {

        ctx.fillStyle = "#fff";

        ctx.font =
            "bold 60px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            "DONUT LAND",
            canvas.width / 2,
            170
        );
    }

    // Start button
    ctx.fillStyle = "#d58a42";

    ctx.roundRect(
        canvas.width / 2 - 145,
        350,
        290,
        70,
        15
    );

    ctx.fill();

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 28px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "TAP TO PLAY",
        canvas.width / 2,
        394
    );

    // Creator graphic
    if (
        assets.by.complete &&
        assets.by.naturalWidth
    ) {

        const w = 330;

        const h =
            assets.by.naturalHeight *
            (w /
            assets.by.naturalWidth);

        ctx.drawImage(
            assets.by,
            canvas.width / 2 - w / 2,
            445,
            w,
            h
        );
    }

    ctx.fillStyle = "#aaa";

    ctx.font =
        "14px Arial";

    ctx.fillText(
        "All rights reserved Donut Land, Killer Arts Media and #ZTFILMS | V1.1",
        canvas.width / 2,
        555
    );
}

// ------------------------------------------------------------
// GAME OVER
// ------------------------------------------------------------

function drawGameOver() {

    drawGame();

    ctx.fillStyle =
        "rgba(0,0,0,0.72)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#fff";

    ctx.textAlign = "center";

    ctx.font =
        "bold 58px Arial";

    ctx.fillText(
        "GAME OVER",
        canvas.width / 2,
        190
    );

    ctx.font =
        "bold 28px Arial";

    ctx.fillText(
        "SCORE: " +
        state.score,
        canvas.width / 2,
        245
    );

    ctx.fillStyle = "#d58a42";

    ctx.roundRect(
        canvas.width / 2 - 145,
        320,
        290,
        65,
        15
    );

    ctx.fill();

    ctx.fillStyle = "#fff";

    ctx.fillText(
        "TAP TO TRY AGAIN",
        canvas.width / 2,
        362
    );
}

// ------------------------------------------------------------
// START GAME
// ------------------------------------------------------------

function startGame() {

    state.screen = "game";

    state.score = 0;

    state.level = 1;

    state.distance = 0;

    state.backgroundX = 0;

    state.speed =
        CONFIG.baseSpeed;

    state.obstacles = [];

    state.collectibles = [];

    state.obstacleTimer = 0;

    state.candyTimer = 0;

    player.x = 150;

    player.y =
        CONFIG.groundY -
        player.height;

    player.velocityY = 0;

    player.grounded = true;

    state.gameRunning = true;

    assets.menuMusic.pause();

    assets.menuMusic.currentTime = 0;

    assets.gameMusic.currentTime = 0;

    assets.gameMusic.play()
        .catch(() => {});
}

// ------------------------------------------------------------
// GAME OVER
// ------------------------------------------------------------

function endGame() {

    state.gameRunning = false;

    state.screen = "gameover";

    assets.gameMusic.pause();

    assets.gameMusic.currentTime = 0;
}

// ------------------------------------------------------------
// RETURN TO MENU
// ------------------------------------------------------------

function returnToMenu() {

    state.screen = "menu";

    state.gameRunning = false;

    assets.gameMusic.pause();

    assets.gameMusic.currentTime = 0;

    assets.menuMusic.play()
        .catch(() => {});
}

// ------------------------------------------------------------
// INPUT
// ------------------------------------------------------------

function handleInput() {

    if (state.screen === "menu") {

        startGame();

        return;
    }

    if (state.screen === "game") {

        player.jump();

        return;
    }

    if (state.screen === "gameover") {

        startGame();

        return;
    }
}

// Mouse
canvas.addEventListener(
    "mousedown",
    handleInput
);

// Touch / iPhone / Android
canvas.addEventListener(
    "touchstart",
    function(e) {

        e.preventDefault();

        handleInput();

    },
    {
        passive: false
    }
);

// Keyboard remains available on desktop
window.addEventListener(
    "keydown",
    function(e) {

        if (
            e.code === "Space" ||
            e.code === "ArrowUp"
        ) {

            e.preventDefault();

            handleInput();
        }
    }
);

// ------------------------------------------------------------
// AUDIO START
// ------------------------------------------------------------

// Mobile browsers generally require audio to begin after
// a user interaction.

document.addEventListener(
    "touchstart",
    function startAudio() {

        if (state.screen === "menu") {

            assets.menuMusic.play()
                .catch(() => {});
        }

        document.removeEventListener(
            "touchstart",
            startAudio
        );
    },
    {
        once: true
    }
);

document.addEventListener(
    "click",
    function startMenuAudio() {

        if (state.screen === "menu") {

            assets.menuMusic.play()
                .catch(() => {});
        }

    }
);

// ------------------------------------------------------------
// RESPONSIVE CANVAS
// ------------------------------------------------------------

function resizeCanvas() {

    const ratio =
        CONFIG.width /
        CONFIG.height;

    let width =
        window.innerWidth;

    let height =
        window.innerHeight;

    if (width / height > ratio) {

        width =
            height * ratio;

    } else {

        height =
            width / ratio;
    }

    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";
}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();

// ------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------

function gameLoop(timestamp) {

    if (!state.lastTime) {

        state.lastTime = timestamp;
    }

    let dt =
        (timestamp -
        state.lastTime) /
        16.67;

    state.lastTime = timestamp;

    // Prevent huge jumps after tab switching
    dt =
        Math.min(
            dt,
            2
        );

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (
        state.screen === "menu"
    ) {

        drawMenu();

    } else if (
        state.screen === "game"
    ) {

        update(dt);

        drawGame();

    } else if (
        state.screen === "gameover"
    ) {

        drawGameOver();
    }

    requestAnimationFrame(
        gameLoop
    );
}

// ------------------------------------------------------------
// START
// ------------------------------------------------------------

requestAnimationFrame(
    gameLoop
);
