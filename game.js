// ============================================================
// DONUT LAND: KILLER ARTS MEDIA
// Portrait Mobile Runner
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const loadingScreen = document.getElementById("loading-screen");

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// ============================================================
// ASSETS
// ============================================================

const images = {};

const assetPaths = {
    logo: "assets/logo.png",
    by: "assets/by.png",

    background: "assets/backgrounds/BG.jpg",

    sprinkles: "assets/characters/sprinkles.png",
    glaze: "assets/characters/glaze.png",
    chocolate: "assets/characters/chocolate.png",

    // NEW DONUT / ZOMBIE / HALLOWEEN OBSTACLES
    zombieDonut: "assets/objects/zombie_donut.png",
    donutGarbage: "assets/objects/donut_garbage.png",
    batDonut: "assets/objects/bat_donut.png",
    tombstoneDonut: "assets/objects/tombstone_donut.png",
    ghostDonut: "assets/objects/ghost_donut.png",
    spiderDonut: "assets/objects/spider_donut.png"
};

// ============================================================
// MUSIC
// ============================================================

const musicPaths = {
    menu: "assets/music/title-theme.mp3",
    level1: "assets/music/level1.mp3",
    level2: "assets/music/level2.mp3",
    level3: "assets/music/level3.mp3",
    level4: "assets/music/level4.mp3",
    level5: "assets/music/level5.mp3"
};

const music = {};

Object.keys(musicPaths).forEach(key => {
    music[key] = new Audio(musicPaths[key]);
    music[key].loop = true;
    music[key].volume = 0.55;
});

// ============================================================
// GAME STATE
// ============================================================

let state = "menu";

let selectedCharacter = "sprinkles";

let score = 0;
let highScore = Number(localStorage.getItem("donutLandHighScore") || 0);

let level = 1;

let gameSpeed = 220;

let lastTime = 0;

let backgroundX = 0;

let obstacleTimer = 0;
let obstacleDelay = 1.45;

let audioUnlocked = false;

// ============================================================
// CHARACTER DATA
// ============================================================

const characters = {
    sprinkles: {
        name: "SPRINKLES",
        image: null
    },

    glaze: {
        name: "GLAZE",
        image: null
    },

    chocolate: {
        name: "CHOCOLATE",
        image: null
    }
};

// ============================================================
// OBSTACLES
// ============================================================

const obstacleTypes = [
    {
        name: "zombieDonut",
        image: null,
        width: 55,
        height: 55
    },

    {
        name: "donutGarbage",
        image: null,
        width: 58,
        height: 48
    },

    {
        name: "batDonut",
        image: null,
        width: 58,
        height: 45
    },

    {
        name: "tombstoneDonut",
        image: null,
        width: 55,
        height: 65
    },

    {
        name: "ghostDonut",
        image: null,
        width: 55,
        height: 58
    },

    {
        name: "spiderDonut",
        image: null,
        width: 55,
        height: 55
    }
];

let obstacles = [];

// ============================================================
// PLAYER
// ============================================================

const player = {
    x: 72,
    y: 500,

    width: 58,
    height: 70,

    vy: 0,

    gravity: 1900,

    jumpPower: -760,

    onGround: true
};

// ============================================================
// IMAGE LOADING
// ============================================================

function loadImage(name, path) {
    return new Promise(resolve => {
        const img = new Image();

        img.onload = function () {
            images[name] = img;
            resolve(img);
        };

        img.onerror = function () {
            console.warn("Could not load image:", path);
            images[name] = null;
            resolve(null);
        };

        img.src = path;
    });
}

async function loadAllAssets() {

    const promises = [];

    Object.keys(assetPaths).forEach(key => {
        promises.push(loadImage(key, assetPaths[key]));
    });

    await Promise.all(promises);

    characters.sprinkles.image = images.sprinkles;
    characters.glaze.image = images.glaze;
    characters.chocolate.image = images.chocolate;

    obstacleTypes.forEach(obstacle => {
        obstacle.image = images[obstacle.name];
    });

    loadingScreen.classList.add("hidden");
}

// ============================================================
// AUDIO
// ============================================================

let audioContext = null;

function unlockAudio() {

    if (audioUnlocked) return;

    try {

        if (!audioContext) {
            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        audioUnlocked = true;

    } catch (error) {
        console.log("Audio unlock error:", error);
    }
}

function sfx(type) {

    if (!audioUnlocked || !audioContext) return;

    const now = audioContext.currentTime;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    let startFrequency = 400;
    let endFrequency = 600;
    let duration = 0.12;
    let volume = 0.08;

    if (type === "character") {
        startFrequency = 420;
        endFrequency = 760;
        duration = 0.18;
        volume = 0.10;
    }

    if (type === "button") {
        startFrequency = 300;
        endFrequency = 450;
        duration = 0.08;
        volume = 0.07;
    }

    if (type === "jump") {
        startFrequency = 280;
        endFrequency = 720;
        duration = 0.18;
        volume = 0.09;
    }

    if (type === "score") {
        startFrequency = 650;
        endFrequency = 900;
        duration = 0.10;
        volume = 0.07;
    }

    if (type === "highscore") {
        startFrequency = 500;
        endFrequency = 1100;
        duration = 0.25;
        volume = 0.10;
    }

    if (type === "collision") {
        startFrequency = 180;
        endFrequency = 70;
        duration = 0.25;
        volume = 0.12;
    }

    if (type === "gameover") {
        startFrequency = 260;
        endFrequency = 90;
        duration = 0.40;
        volume = 0.12;
    }

    oscillator.type = "square";

    oscillator.frequency.setValueAtTime(
        startFrequency,
        now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFrequency),
        now + duration
    );

    gain.gain.setValueAtTime(volume, now);

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + duration
    );

    oscillator.start(now);
    oscillator.stop(now + duration);
}

// ============================================================
// MUSIC CONTROL
// ============================================================

function stopAllMusic() {

    Object.values(music).forEach(track => {
        track.pause();

        try {
            track.currentTime = 0;
        } catch (error) {}
    });
}

function startMenuMusic() {

    if (!audioUnlocked) return;

    stopAllMusic();

    music.menu.play().catch(() => {});
}

function startLevelMusic() {

    if (!audioUnlocked) return;

    stopAllMusic();

    const track = music["level" + level] || music.level1;

    track.play().catch(() => {});
}

// ============================================================
// PLAYER RESET
// ============================================================

function resetPlayer() {

    player.x = 72;
    player.y = 500;
    player.vy = 0;
    player.onGround = true;
}

// ============================================================
// START GAME
// ============================================================

function startGame() {

    unlockAudio();

    state = "game";

    score = 0;
    level = 1;

    gameSpeed = 220;

    obstacleTimer = 0;

    obstacleDelay = 1.45;

    obstacles = [];

    resetPlayer();

    startLevelMusic();
}

// ============================================================
// JUMP
// ============================================================

function jump() {

    if (state !== "game") return;

    if (!player.onGround) return;

    player.vy = player.jumpPower;

    player.onGround = false;

    sfx("jump");
}

// ============================================================
// SELECT CHARACTER
// ============================================================

function selectCharacter(character) {

    selectedCharacter = character;

    sfx("character");
}

// ============================================================
// TOUCH / MOBILE CONTROLS
// ============================================================

// IMPORTANT:
// This is intentionally using touchstart directly.
// This is the mobile behavior we want restored.

canvas.addEventListener(
    "touchstart",
    function (event) {

        event.preventDefault();

        unlockAudio();

        if (state === "game") {
            jump();
            return;
        }

        handleCanvasTap();

    },
    {
        passive: false
    }
);

// Prevent the browser from turning a swipe/touch into page movement.

canvas.addEventListener(
    "touchmove",
    function (event) {
        event.preventDefault();
    },
    {
        passive: false
    }
);

canvas.addEventListener(
    "touchend",
    function (event) {
        event.preventDefault();
    },
    {
        passive: false
    }
);

canvas.addEventListener(
    "touchcancel",
    function (event) {
        event.preventDefault();
    },
    {
        passive: false
    }
);

// Pointer fallback for browsers/desktops.

canvas.addEventListener(
    "pointerdown",
    function (event) {

        // Let touchstart handle actual phones.
        if (event.pointerType === "touch") return;

        event.preventDefault();

        unlockAudio();

        if (state === "game") {
            jump();
        } else {
            handleCanvasTap();
        }

    },
    {
        passive: false
    }
);

// ============================================================
// KEYBOARD
// ============================================================

document.addEventListener("keydown", function (event) {

    unlockAudio();

    if (
        event.code === "Space" ||
        event.code === "ArrowUp"
    ) {

        event.preventDefault();

        if (state === "game") {
            jump();
        } else {
            handleCanvasTap();
        }
    }
});

// ============================================================
// CANVAS TAP HANDLER
// ============================================================

function handleCanvasTap() {

    if (state === "menu") {

        state = "characters";

        sfx("button");

        return;
    }

    if (state === "characters") {

        // Character selection is handled by screen regions.
        return;
    }

    if (state === "gameover") {

        startGame();

        return;
    }
}

// ============================================================
// CHARACTER SCREEN TOUCH AREAS
// ============================================================

canvas.addEventListener(
    "click",
    function (event) {

        unlockAudio();

        const rect = canvas.getBoundingClientRect();

        const scaleX = GAME_WIDTH / rect.width;
        const scaleY = GAME_HEIGHT / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        if (state === "menu") {

            state = "characters";

            sfx("button");

            return;
        }

        if (state === "characters") {

            if (
                x >= 20 &&
                x <= 120 &&
                y >= 230 &&
                y <= 430
            ) {

                selectCharacter("sprinkles");

                startGame();

                return;
            }

            if (
                x >= 130 &&
                x <= 230 &&
                y >= 230 &&
                y <= 430
            ) {

                selectCharacter("glaze");

                startGame();

                return;
            }

            if (
                x >= 240 &&
                x <= 340 &&
                y >= 230 &&
                y <= 430
            ) {

                selectCharacter("chocolate");

                startGame();

                return;
            }
        }

        if (state === "gameover") {

            startGame();

        }

    },
    {
        passive: false
    }
);

// ============================================================
// SPAWN OBSTACLE
// ============================================================

function spawnObstacle() {

    const source =
        obstacleTypes[
            Math.floor(
                Math.random() * obstacleTypes.length
            )
        ];

    const obstacle = {

        image: source.image,

        x: GAME_WIDTH + 30,

        y: 500,

        width: source.width,

        height: source.height,

        scored: false

    };

    // Flying objects

    if (
        source.name === "batDonut" ||
        source.name === "ghostDonut" ||
        source.name === "spiderDonut"
    ) {

        obstacle.y =
            390 +
            Math.random() * 100;

    }

    obstacles.push(obstacle);
}

// ============================================================
// COLLISION
// ============================================================

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

// ============================================================
// UPDATE PLAYER
// ============================================================

function updatePlayer(delta) {

    player.vy += player.gravity * delta;

    player.y += player.vy * delta;

    const groundY = 500;

    if (player.y >= groundY) {

        if (!player.onGround) {
            player.onGround = true;
        }

        player.y = groundY;

        player.vy = 0;
    }
}

// ============================================================
// UPDATE OBSTACLES
// ============================================================

function updateObstacles(delta) {

    obstacleTimer += delta;

    if (obstacleTimer >= obstacleDelay) {

        obstacleTimer = 0;

        spawnObstacle();

        obstacleDelay =
            1.05 +
            Math.random() * 0.8;
    }

    obstacles.forEach(obstacle => {

        obstacle.x -= gameSpeed * delta;

        if (
            !obstacle.scored &&
            obstacle.x + obstacle.width < player.x
        ) {

            obstacle.scored = true;

            score++;

            sfx("score");

            if (score % 10 === 0) {

                level++;

                if (level > 5) {
                    level = 5;
                }

                gameSpeed += 25;

                startLevelMusic();
            }
        }
    });

    obstacles = obstacles.filter(
        obstacle =>
            obstacle.x + obstacle.width > -50
    );
}

// ============================================================
// CHECK COLLISIONS
// ============================================================

function checkCollisions() {

    const playerBox = {
        x: player.x + 8,
        y: player.y + 8,
        width: player.width - 16,
        height: player.height - 12
    };

    for (const obstacle of obstacles) {

        if (collision(playerBox, obstacle)) {

            endGame();

            return;
        }
    }
}

// ============================================================
// END GAME
// ============================================================

function endGame() {

    if (state !== "game") return;

    state = "gameover";

    sfx("collision");

    setTimeout(() => {
        sfx("gameover");
    }, 120);

    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "donutLandHighScore",
            highScore
        );

        setTimeout(() => {
            sfx("highscore");
        }, 350);
    }

    stopAllMusic();
}

// ============================================================
// BACKGROUND
// ============================================================

function drawBackground() {

    if (!images.background) {

        ctx.fillStyle = "#181818";

        ctx.fillRect(
            0,
            0,
            GAME_WIDTH,
            GAME_HEIGHT
        );

        return;
    }

    const image = images.background;

    const scale =
        GAME_HEIGHT / image.height;

    const width =
        image.width * scale;

    backgroundX -= gameSpeed * 0.15 *
        (1 / 60);

    if (backgroundX <= -width) {
        backgroundX += width;
    }

    ctx.drawImage(
        image,
        backgroundX,
        0,
        width,
        GAME_HEIGHT
    );

    ctx.drawImage(
        image,
        backgroundX + width,
        0,
        width,
        GAME_HEIGHT
    );
}

// ============================================================
// DRAW PLAYER
// ============================================================

function drawPlayer() {

    const character =
        characters[selectedCharacter];

    if (!character.image) {

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );

        return;
    }

    ctx.drawImage(
        character.image,
        player.x,
        player.y,
        player.width,
        player.height
    );
}

// ============================================================
// DRAW OBSTACLES
// ============================================================

function drawObstacles() {

    obstacles.forEach(obstacle => {

        if (!obstacle.image) return;

        ctx.drawImage(
            obstacle.image,
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );
    });
}

// ============================================================
// TEXT
// ============================================================

function drawText(
    text,
    x,
    y,
    size = 24,
    align = "center"
) {

    ctx.font =
        `bold ${size}px Arial, Helvetica, sans-serif`;

    ctx.textAlign = align;

    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";

    ctx.strokeStyle = "#000000";

    ctx.lineWidth = 5;

    ctx.strokeText(
        text,
        x,
        y
    );

    ctx.fillText(
        text,
        x,
        y
    );
}

// ============================================================
// MENU
// ============================================================

function drawMenu() {

    ctx.fillStyle = "rgba(0,0,0,0.38)";

    ctx.fillRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );

    if (images.logo) {

        const maxWidth = 300;

        const ratio =
            images.logo.height /
            images.logo.width;

        const width =
            Math.min(
                maxWidth,
                images.logo.width
            );

        const height =
            width * ratio;

        ctx.drawImage(
            images.logo,
            (GAME_WIDTH - width) / 2,
            90,
            width,
            height
        );

    } else {

        drawText(
            "DONUT LAND",
            GAME_WIDTH / 2,
            170,
            42
        );
    }

    drawText(
        "TAP TO START",
        GAME_WIDTH / 2,
        440,
        25
    );

    drawText(
        "DONUTS • ZOMBIES • HALLOWEEN",
        GAME_WIDTH / 2,
        480,
        13
    );

    drawBottomCredit();
}

// ============================================================
// CHARACTER SELECTION
// ============================================================

function drawCharacters() {

    ctx.fillStyle = "rgba(0,0,0,0.45)";

    ctx.fillRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );

    drawText(
        "CHOOSE YOUR DONUT",
        GAME_WIDTH / 2,
        70,
        27
    );

    drawCharacterCard(
        characters.sprinkles,
        70,
        310,
        selectedCharacter === "sprinkles"
    );

    drawCharacterCard(
        characters.glaze,
        180,
        310,
        selectedCharacter === "glaze"
    );

    drawCharacterCard(
        characters.chocolate,
        290,
        310,
        selectedCharacter === "chocolate"
    );

    drawText(
        "TAP A CHARACTER",
        GAME_WIDTH / 2,
        460,
        18
    );

    drawText(
        "THEN RUN",
        GAME_WIDTH / 2,
        490,
        14
    );

    drawBottomCredit();
}

function drawCharacterCard(
    character,
    x,
    y,
    selected
) {

    if (selected) {

        ctx.strokeStyle = "#ffffff";

        ctx.lineWidth = 4;

        ctx.strokeRect(
            x - 48,
            y - 90,
            96,
            150
        );
    }

    if (character.image) {

        ctx.drawImage(
            character.image,
            x - 35,
            y - 70,
            70,
            80
        );
    }

    drawText(
        character.name,
        x,
        y + 35,
        11
    );
}

// ============================================================
// GAME HUD
// ============================================================

function drawHUD() {

    drawText(
        "SCORE " + score,
        15,
        25,
        15,
        "left"
    );

    drawText(
        "LEVEL " + level,
        GAME_WIDTH - 15,
        25,
        15,
        "right"
    );
}

// ============================================================
// GAME OVER
// ============================================================

function drawGameOver() {

    drawBackground();

    drawObstacles();

    drawPlayer();

    ctx.fillStyle = "rgba(0,0,0,0.62)";

    ctx.fillRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );

    drawText(
        "GAME OVER",
        GAME_WIDTH / 2,
        220,
        38
    );

    drawText(
        "SCORE " + score,
        GAME_WIDTH / 2,
        285,
        22
    );

    drawText(
        "HIGH SCORE " + highScore,
        GAME_WIDTH / 2,
        325,
        18
    );

    drawText(
        "TAP TO PLAY AGAIN",
        GAME_WIDTH / 2,
        410,
        20
    );

    drawBottomCredit();
}

// ============================================================
// BOTTOM CREDIT
// ============================================================

function drawBottomCredit() {

    if (images.by) {

        const maxWidth = 170;

        const ratio =
            images.by.height /
            images.by.width;

        const width =
            Math.min(
                maxWidth,
                images.by.width
            );

        const height =
            width * ratio;

        ctx.drawImage(
            images.by,
            (GAME_WIDTH - width) / 2,
            535,
            width,
            height
        );

    }

    drawText(
        "All rights reserved Donut Land, Killer Arts Media and #ZTFILMS | V1",
        GAME_WIDTH / 2,
        610,
        7
    );
}

// ============================================================
// DRAW GAME
// ============================================================

function drawGame() {

    drawBackground();

    drawObstacles();

    drawPlayer();

    drawHUD();
}

// ============================================================
// UPDATE
// ============================================================

function update(delta) {

    if (state !== "game") return;

    updatePlayer(delta);

    updateObstacles(delta);

    checkCollisions();
}

// ============================================================
// DRAW
// ============================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );

    if (state === "menu") {

        drawBackground();
        drawMenu();

        return;
    }

    if (state === "characters") {

        drawBackground();
        drawCharacters();

        return;
    }

    if (state === "game") {

        drawGame();

        return;
    }

    if (state === "gameover") {

        drawGameOver();

        return;
    }
}

// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }

    let delta =
        (timestamp - lastTime) / 1000;

    lastTime = timestamp;

    if (delta > 0.05) {
        delta = 0.05;
    }

    update(delta);

    draw();

    requestAnimationFrame(gameLoop);
}

// ============================================================
// INITIALIZATION
// ============================================================

loadAllAssets().then(() => {

    requestAnimationFrame(gameLoop);

});
