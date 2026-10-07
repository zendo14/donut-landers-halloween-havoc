/*
===========================================================
DONUT LAND: KILLER ARTS MEDIA
Portrait Mobile Runner
===========================================================

- Portrait gameplay
- Tap to jump
- Character selection
- Sprinkles
- Glaze
- Chocolate Von Donut
- Original BG.jpg repeating background
- Menu music
- Gameplay music
- Existing obstacle images
- Logo / by graphic
- Local high score
===========================================================
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const loadingScreen = document.getElementById("loading-screen");


/* ========================================================
   VIRTUAL GAME SIZE
======================================================== */

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;


/* ========================================================
   ASSET PATHS
======================================================== */

const PATHS = {

    logo:
        "assets/logo.png",

    by:
        "assets/by.png",

    background:
        "assets/backgrounds/BG.jpg",

    characters: {

        sprinkles:
            "assets/characters/sprinkles.png",

        glaze:
            "assets/characters/glaze.png",

        chocolate:
            "assets/characters/chocolate.png"
    },

    music: {

        menu:
            "assets/music/menu.mp3",

        game:
            "assets/music/gamemusic.mp3"
    }
};


/* ========================================================
   IMAGE LOADER
======================================================== */

const images = {};

function loadImage(name, src) {

    return new Promise((resolve) => {

        const image = new Image();

        image.onload = function () {

            images[name] = image;

            resolve(image);
        };

        image.onerror = function () {

            console.warn("Could not load image:", src);

            images[name] = null;

            resolve(null);
        };

        image.src = src;
    });
}


/* ========================================================
   AUDIO
======================================================== */

const menuMusic = new Audio(PATHS.music.menu);
const gameMusic = new Audio(PATHS.music.game);

menuMusic.loop = true;
gameMusic.loop = true;

menuMusic.volume = 0.45;
gameMusic.volume = 0.45;


/* ========================================================
   GAME STATE
======================================================== */

let state = "menu";

let selectedCharacter = "sprinkles";

let score = 0;
let highScore = Number(localStorage.getItem("donutLandHighScore") || 0);

let level = 1;

let gameSpeed = 3.2;

let lastTime = 0;

let backgroundX = 0;

let obstacleTimer = 0;

let gameStarted = false;


/* ========================================================
   PLAYER
======================================================== */

const player = {

    x: 68,

    y: 450,

    width: 62,

    height: 62,

    velocityY: 0,

    gravity: 0.52,

    jumpPower: -10.5,

    grounded: false
};


/* ========================================================
   CHARACTERS
======================================================== */

const characters = {

    sprinkles: {

        name: "SPRINKLES",

        imageName: "sprinkles",

        color: "#ff66aa"
    },

    glaze: {

        name: "GLAZE",

        imageName: "glaze",

        color: "#ff8b32"
    },

    chocolate: {

        name: "CHOCOLATE VON DONUT",

        imageName: "chocolate",

        color: "#7b4b2a"
    }
};


/* ========================================================
   OBSTACLES
======================================================== */

const obstacleSources = [

    "assets/objects/coffee_cup.png",

    "assets/objects/half_eaten_donut.png",

    "assets/objects/donut_box.png",

    "assets/objects/zombie_donut.png",

    "assets/objects/donut_garbage.png",

    "assets/objects/bat_donut.png",

    "assets/objects/tombstone_donut.png",

    "assets/objects/ghost_donut.png",

    "assets/objects/spider_donut.png"
];

const obstacles = [];

const obstacleImages = [];


/* ========================================================
   LOAD EVERYTHING
======================================================== */

async function loadAssets() {

    await Promise.all([

        loadImage("logo", PATHS.logo),

        loadImage("by", PATHS.by),

        loadImage("background", PATHS.background),

        loadImage(
            "sprinkles",
            PATHS.characters.sprinkles
        ),

        loadImage(
            "glaze",
            PATHS.characters.glaze
        ),

        loadImage(
            "chocolate",
            PATHS.characters.chocolate
        )
    ]);


    for (let i = 0; i < obstacleSources.length; i++) {

        const image = await loadImage(
            "obstacle" + i,
            obstacleSources[i]
        );

        if (image) {
            obstacleImages.push(image);
        }
    }


    loadingScreen.classList.add("hidden");

    startMenuMusic();

    requestAnimationFrame(gameLoop);
}


/* ========================================================
   AUDIO CONTROL
======================================================== */

function startMenuMusic() {

    gameMusic.pause();

    gameMusic.currentTime = 0;

    menuMusic.play().catch(() => {});
}


function startGameMusic() {

    menuMusic.pause();

    menuMusic.currentTime = 0;

    gameMusic.play().catch(() => {});
}


/* ========================================================
   BACKGROUND
======================================================== */

function drawBackground() {

    const background = images.background;

    if (!background) {

        ctx.fillStyle = "#17213b";

        ctx.fillRect(
            0,
            0,
            GAME_WIDTH,
            GAME_HEIGHT
        );

        return;
    }


    /*
        Keep the original background repeating.

        The image is scaled to the complete portrait height.
        It repeats horizontally as the player moves.
    */

    const scale =
        GAME_HEIGHT / background.height;

    const width =
        background.width * scale;


    backgroundX -= gameSpeed * 0.25;


    if (backgroundX <= -width) {

        backgroundX += width;
    }


    ctx.drawImage(

        background,

        backgroundX,
        0,
        width,
        GAME_HEIGHT
    );


    ctx.drawImage(

        background,

        backgroundX + width,
        0,
        width,
        GAME_HEIGHT
    );


    ctx.drawImage(

        background,

        backgroundX + width * 2,
        0,
        width,
        GAME_HEIGHT
    );
}


/* ========================================================
   LOGO
======================================================== */

function drawLogo() {

    const logo = images.logo;

    if (!logo) {

        ctx.fillStyle = "#fff";

        ctx.textAlign = "center";

        ctx.font =
            "bold 30px Arial";

        ctx.fillText(
            "DONUT LAND",
            GAME_WIDTH / 2,
            90
        );

        return;
    }


    const maxWidth = 285;

    const scale =
        Math.min(
            1,
            maxWidth / logo.width
        );


    const width =
        logo.width * scale;

    const height =
        logo.height * scale;


    ctx.drawImage(

        logo,

        (GAME_WIDTH - width) / 2,

        45,

        width,

        height
    );
}


/* ========================================================
   BY GRAPHIC
======================================================== */

function drawByGraphic() {

    const by = images.by;

    if (!by) {
        return;
    }


    const maxWidth = 210;

    const scale =
        Math.min(
            1,
            maxWidth / by.width
        );


    const width =
        by.width * scale;

    const height =
        by.height * scale;


    ctx.drawImage(

        by,

        (GAME_WIDTH - width) / 2,

        GAME_HEIGHT - height - 46,

        width,

        height
    );
}


/* ========================================================
   COPYRIGHT
======================================================== */

function drawCopyright() {

    ctx.fillStyle = "#fff";

    ctx.textAlign = "center";

    ctx.font =
        "10px Arial";

    ctx.fillText(

        "All rights reserved Donut Land, Killer Arts Media and #ZTFILMS | V1",

        GAME_WIDTH / 2,

        GAME_HEIGHT - 17
    );
}


/* ========================================================
   MENU
======================================================== */

function drawMenu() {

    drawBackground();

    drawLogo();


    /*
        PLAY button
    */

    drawButton(

        GAME_WIDTH / 2,

        300,

        210,

        58,

        "PLAY"
    );


    /*
        CHARACTER button
    */

    drawButton(

        GAME_WIDTH / 2,

        375,

        210,

        58,

        "CHARACTERS"
    );


    /*
        High score
    */

    ctx.textAlign = "center";

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 16px Arial";

    ctx.fillText(

        "HIGH SCORE: " + highScore,

        GAME_WIDTH / 2,

        455
    );


    drawByGraphic();

    drawCopyright();
}


/* ========================================================
   BUTTON
======================================================== */

function drawButton(
    x,
    y,
    width,
    height,
    text
) {

    ctx.save();


    ctx.fillStyle =
        "rgba(0,0,0,0.78)";

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 3;


    roundRect(

        x - width / 2,

        y - height / 2,

        width,

        height,

        12
    );


    ctx.fill();

    ctx.stroke();


    ctx.fillStyle =
        "#ffffff";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.font =
        "bold 23px Arial";


    ctx.fillText(

        text,

        x,

        y
    );


    ctx.restore();
}


/* ========================================================
   CHARACTER SELECT
======================================================== */

function drawCharacterSelect() {

    drawBackground();


    ctx.textAlign = "center";

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 27px Arial";

    ctx.fillText(

        "CHOOSE YOUR DONUT",

        GAME_WIDTH / 2,

        45
    );


    const names =
        Object.keys(characters);


    const cardWidth = 100;

    const cardHeight = 175;

    const gap = 10;

    const totalWidth =
        cardWidth * 3 +
        gap * 2;


    const startX =
        (GAME_WIDTH - totalWidth) / 2;


    names.forEach(
        (name, index) => {

            const character =
                characters[name];


            const x =
                startX +
                index *
                (cardWidth + gap);


            const y = 105;


            /*
                Card
            */

            ctx.fillStyle =
                name === selectedCharacter
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(0,0,0,0.72)";


            ctx.strokeStyle =
                name === selectedCharacter
                    ? character.color
                    : "#ffffff";


            ctx.lineWidth =
                name === selectedCharacter
                    ? 5
                    : 2;


            roundRect(

                x,

                y,

                cardWidth,

                cardHeight,

                12
            );


            ctx.fill();

            ctx.stroke();


            /*
                Character image
            */

            const image =
                images[character.imageName];


            if (image) {

                const maxSize = 78;

                const scale =
                    Math.min(

                        maxSize / image.width,

                        maxSize / image.height
                    );


                const width =
                    image.width * scale;

                const height =
                    image.height * scale;


                ctx.drawImage(

                    image,

                    x +
                        (cardWidth - width) / 2,

                    y + 22,

                    width,

                    height
                );
            }


            /*
                Character name
            */

            ctx.fillStyle =
                name === selectedCharacter
                    ? "#111"
                    : "#fff";


            ctx.font =
                "bold 12px Arial";


            ctx.textAlign =
                "center";


            let displayName =
                character.name;


            if (name === "chocolate") {

                displayName =
                    "CHOCOLATE";
            }


            ctx.fillText(

                displayName,

                x + cardWidth / 2,

                y + 125
            );


            if (name === selectedCharacter) {

                ctx.font =
                    "bold 10px Arial";

                ctx.fillText(

                    "SELECTED",

                    x + cardWidth / 2,

                    y + 148
                );
            }
        }
    );


    /*
        Back button
    */

    drawButton(

        GAME_WIDTH / 2,

        510,

        150,

        48,

        "BACK"
    );


    /*
        Continue
    */

    drawButton(

        GAME_WIDTH / 2,

        570,

        190,

        48,

        "PLAY"
    );


    drawCopyright();
}


/* ========================================================
   GAME
======================================================== */

function drawGame() {

    drawBackground();


    /*
        Ground
    */

    const groundY =
        GAME_HEIGHT - 90;


    /*
        Player
    */

    drawPlayer();


    /*
        Obstacles
    */

    obstacles.forEach(
        obstacle => {

            drawObstacle(obstacle);
        }
    );


    /*
        Score
    */

    ctx.textAlign =
        "left";

    ctx.fillStyle =
        "#fff";

    ctx.font =
        "bold 18px Arial";


    ctx.fillText(

        "SCORE: " +
        Math.floor(score),

        15,

        30
    );


    ctx.font =
        "bold 13px Arial";


    ctx.fillText(

        "LEVEL " + level,

        15,

        50
    );
}


/* ========================================================
   PLAYER DRAW
======================================================== */

function drawPlayer() {

    const character =
        characters[selectedCharacter];


    const image =
        images[character.imageName];


    if (!image) {

        ctx.fillStyle =
            character.color;


        ctx.beginPath();

        ctx.arc(

            player.x + player.width / 2,

            player.y + player.height / 2,

            player.width / 2,

            0,

            Math.PI * 2
        );

        ctx.fill();

        return;
    }


    ctx.drawImage(

        image,

        player.x,

        player.y,

        player.width,

        player.height
    );
}


/* ========================================================
   OBSTACLE DRAW
======================================================== */

function drawObstacle(obstacle) {

    if (!obstacle.image) {

        ctx.fillStyle =
            "#222";

        ctx.fillRect(

            obstacle.x,

            obstacle.y,

            obstacle.width,

            obstacle.height
        );

        return;
    }


    ctx.drawImage(

        obstacle.image,

        obstacle.x,

        obstacle.y,

        obstacle.width,

        obstacle.height
    );
}


/* ========================================================
   CREATE OBSTACLE
======================================================== */

function createObstacle() {

    if (
        obstacleImages.length === 0
    ) {
        return;
    }


    const image =
        obstacleImages[
            Math.floor(
                Math.random() *
                obstacleImages.length
            )
        ];


    const size =
        42 +
        Math.random() * 15;


    const groundY =
        GAME_HEIGHT - 88;


    obstacles.push({

        x:
            GAME_WIDTH + 30,

        y:
            groundY - size,

        width:
            size,

        height:
            size,

        image:
            image,

        counted:
            false
    });
}


/* ========================================================
   UPDATE PLAYER
======================================================== */

function updatePlayer(delta) {

    player.velocityY +=
        player.gravity *
        delta;


    player.y +=
        player.velocityY *
        delta;


    const groundY =
        GAME_HEIGHT - 88 -
        player.height;


    if (
        player.y >= groundY
    ) {

        player.y =
            groundY;

        player.velocityY =
            0;

        player.grounded =
            true;

    } else {

        player.grounded =
            false;
    }
}


/* ========================================================
   UPDATE OBSTACLES
======================================================== */

function updateObstacles(delta) {

    obstacleTimer += delta;


    /*
        Spawn obstacles.
    */

    if (
        obstacleTimer >
        1150
    ) {

        createObstacle();

        obstacleTimer = 0;
    }


    obstacles.forEach(
        obstacle => {

            obstacle.x -=
                gameSpeed *
                delta /
                16.67;


            if (
                !obstacle.counted &&
                obstacle.x +
                    obstacle.width <
                    player.x
            ) {

                obstacle.counted =
                    true;

                score += 10;
            }
        }
    );


    /*
        Remove old obstacles.
    */

    for (
        let i =
            obstacles.length - 1;

        i >= 0;

        i--
    ) {

        if (
            obstacles[i].x +
                obstacles[i].width <
                -50
        ) {

            obstacles.splice(
                i,
                1
            );
        }
    }
}


/* ========================================================
   COLLISION
======================================================== */

function checkCollision() {

    /*
        Slightly shrink the collision
        boxes so the game feels fair.
    */

    const padding = 9;


    const playerBox = {

        x:
            player.x +
            padding,

        y:
            player.y +
            padding,

        width:
            player.width -
            padding * 2,

        height:
            player.height -
            padding * 2
    };


    for (
        const obstacle of obstacles
    ) {

        const obstacleBox = {

            x:
                obstacle.x +
                5,

            y:
                obstacle.y +
                5,

            width:
                obstacle.width -
                10,

            height:
                obstacle.height -
                10
        };


        if (

            playerBox.x <
                obstacleBox.x +
                obstacleBox.width &&

            playerBox.x +
                playerBox.width >
                obstacleBox.x &&

            playerBox.y <
                obstacleBox.y +
                obstacleBox.height &&

            playerBox.y +
                playerBox.height >
                obstacleBox.y

        ) {

            return true;
        }
    }


    return false;
}


/* ========================================================
   START GAME
======================================================== */

function startGame() {

    state =
        "game";


    score =
        0;


    level =
        1;


    gameSpeed =
        3.2;


    backgroundX =
        0;


    obstacleTimer =
        0;


    obstacles.length =
        0;


    player.x =
        68;


    player.y =
        450;


    player.velocityY =
        0;


    gameStarted =
        true;


    startGameMusic();
}


/* ========================================================
   GAME OVER
======================================================== */

function gameOver() {

    state =
        "gameover";


    if (
        score >
        highScore
    ) {

        highScore =
            Math.floor(score);


        localStorage.setItem(

            "donutLandHighScore",

            highScore
        );
    }


    gameMusic.pause();

    gameMusic.currentTime =
        0;
}


/* ========================================================
   DRAW GAME OVER
======================================================== */

function drawGameOver() {

    drawGame();


    ctx.fillStyle =
        "rgba(0,0,0,0.72)";


    ctx.fillRect(

        0,

        0,

        GAME_WIDTH,

        GAME_HEIGHT
    );


    ctx.textAlign =
        "center";


    ctx.fillStyle =
        "#fff";


    ctx.font =
        "bold 38px Arial";


    ctx.fillText(

        "GAME OVER",

        GAME_WIDTH / 2,

        220
    );


    ctx.font =
        "bold 22px Arial";


    ctx.fillText(

        "SCORE: " +
        Math.floor(score),

        GAME_WIDTH / 2,

        270
    );


    ctx.font =
        "18px Arial";


    ctx.fillText(

        "HIGH SCORE: " +
        highScore,

        GAME_WIDTH / 2,

        305
    );


    drawButton(

        GAME_WIDTH / 2,

        380,

        190,

        55,

        "PLAY AGAIN"
    );


    drawButton(

        GAME_WIDTH / 2,

        450,

        190,

        55,

        "MENU"
    );
}


/* ========================================================
   INPUT
======================================================== */

canvas.addEventListener(

    "pointerdown",

    function (event) {

        event.preventDefault();


        const rect =
            canvas.getBoundingClientRect();


        const scaleX =
            GAME_WIDTH /
            rect.width;

        const scaleY =
            GAME_HEIGHT /
            rect.height;


        const x =
            (event.clientX -
                rect.left) *
            scaleX;


        const y =
            (event.clientY -
                rect.top) *
            scaleY;


        handleInput(x, y);
    },

    {
        passive: false
    }
);


/* ========================================================
   INPUT HANDLER
======================================================== */

function handleInput(x, y) {


    /*
        MENU
    */

    if (
        state === "menu"
    ) {

        /*
            PLAY
        */

        if (
            x > 70 &&
            x < 290 &&
            y > 270 &&
            y < 330
        ) {

            state =
                "characterSelect";

            return;
        }


        /*
            CHARACTERS
        */

        if (
            x > 70 &&
            x < 290 &&
            y > 345 &&
            y < 405
        ) {

            state =
                "characterSelect";

            return;
        }
    }


    /*
        CHARACTER SELECT
    */

    else if (
        state === "characterSelect"
    ) {

        const cardWidth =
            100;

        const gap =
            10;

        const totalWidth =
            cardWidth * 3 +
            gap * 2;

        const startX =
            (GAME_WIDTH -
                totalWidth) /
            2;


        const names =
            Object.keys(characters);


        for (
            let i = 0;

            i < names.length;

            i++
        ) {

            const cardX =
                startX +
                i *
                (cardWidth + gap);


            if (
                x >= cardX &&
                x <= cardX +
                    cardWidth &&
                y >= 105 &&
                y <= 280
            ) {

                selectedCharacter =
                    names[i];

                return;
            }
        }


        /*
            BACK
        */

        if (
            x > 105 &&
            x < 255 &&
            y > 485 &&
            y < 535
        ) {

            state =
                "menu";

            startMenuMusic();

            return;
        }


        /*
            PLAY
        */

        if (
            x > 85 &&
            x < 275 &&
            y > 545 &&
            y < 600
        ) {

            startGame();

            return;
        }
    }


    /*
        GAME
    */

    else if (
        state === "game"
    ) {

        jump();
    }


    /*
        GAME OVER
    */

    else if (
        state === "gameover"
    ) {

        if (
            x > 85 &&
            x < 275 &&
            y > 350 &&
            y < 410
        ) {

            startGame();

            return;
        }


        if (
            x > 85 &&
            x < 275 &&
            y > 425 &&
            y < 480
        ) {

            state =
                "menu";

            startMenuMusic();

            return;
        }
    }
}


/* ========================================================
   JUMP
======================================================== */

function jump() {

    if (
        state !== "game"
    ) {
        return;
    }


    if (
        player.grounded
    ) {

        player.velocityY =
            player.jumpPower;

        player.grounded =
            false;
    }
}


/* ========================================================
   KEYBOARD
   Kept only for desktop testing.
   Phone remains tap-only.
======================================================== */

window.addEventListener(

    "keydown",

    function (event) {

        if (
            event.code ===
                "Space" ||
            event.code ===
                "ArrowUp"
        ) {

            event.preventDefault();

            if (
                state === "game"
            ) {

                jump();
            }
        }
    }
);


/* ========================================================
   LEVEL PROGRESSION
======================================================== */

function updateLevel() {

    const newLevel =
        Math.min(

            5,

            Math.floor(
                score / 100
            ) + 1
        );


    if (
        newLevel !== level
    ) {

        level =
            newLevel;


        gameSpeed =
            3.2 +
            (level - 1) *
            0.35;
    }
}


/* ========================================================
   MAIN UPDATE
======================================================== */

function update(delta) {

    if (
        state !== "game"
    ) {

        return;
    }


    updatePlayer(delta);

    updateObstacles(delta);

    updateLevel();


    if (
        checkCollision()
    ) {

        gameOver();
    }
}


/* ========================================================
   MAIN DRAW
======================================================== */

function draw() {

    ctx.clearRect(

        0,

        0,

        GAME_WIDTH,

        GAME_HEIGHT
    );


    if (
        state === "menu"
    ) {

        drawMenu();

    } else if (
        state === "characterSelect"
    ) {

        drawCharacterSelect();

    } else if (
        state === "game"
    ) {

        drawGame();

    } else if (
        state === "gameover"
    ) {

        drawGameOver();
    }
}


/* ========================================================
   GAME LOOP
======================================================== */

function gameLoop(timestamp) {

    if (!lastTime) {

        lastTime =
            timestamp;
    }


    let delta =
        timestamp -
        lastTime;


    lastTime =
        timestamp;


    /*
        Prevent huge jumps after
        browser tab switching.
    */

    delta =
        Math.min(
            delta,
            32
        );


    update(delta);

    draw();


    requestAnimationFrame(
        gameLoop
    );
}


/* ========================================================
   ROUNDED RECTANGLE
======================================================== */

function roundRect(
    x,
    y,
    width,
    height,
    radius
) {

    ctx.beginPath();

    ctx.moveTo(
        x + radius,
        y
    );

    ctx.lineTo(
        x + width - radius,
        y
    );

    ctx.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    ctx.lineTo(
        x + width,
        y + height - radius
    );

    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    ctx.lineTo(
        x + radius,
        y + height
    );

    ctx.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    ctx.lineTo(
        x,
        y + radius
    );

    ctx.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    ctx.closePath();
}


/* ========================================================
   START
======================================================== */

loadAssets();
