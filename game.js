(() => {
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = 540, H = 960;
canvas.width = W; canvas.height = H;

const $ = id => document.getElementById(id);
const menu = $("menu"), gameOver = $("gameOver"), leaderboard = $("leaderboard");
const hud = $("hud"), choices = $("characterChoices");
const scoreEl = $("score"), levelEl = $("level"), multEl = $("multiplier");

const characters = [
  {id:"sprinkles", name:"Sprinkles", file:"assets/characters/sprinkles.png"},
  {id:"glaze", name:"Glaze", file:"assets/characters/glaze.png"},
  {id:"chocolate", name:"Chocolate Von Donut", file:"assets/characters/chocolate.png"}
];

const levels = [
  {name:"Donut Land", theme:"Halloween Shop", duration:35, speed:210, gap:1.35, obstacles:["donut_box","donut_tray","donut_stack","rolling_pin"], collectibles:["candy"]},
  {name:"Donut Land After Dark", theme:"Haunted Shop", duration:35, speed:245, gap:1.18, obstacles:["zombie_donut","ghost_donut","donut_box","donut_tray"], collectibles:["candy"]},
  {name:"Haunted Bakery", theme:"Back Room", duration:35, speed:280, gap:1.05, obstacles:["zombie_donut","vampire_donut","mixing_bowl","rolling_pin"], collectibles:["candy"]},
  {name:"Graveyard", theme:"Moonlit Graveyard", duration:35, speed:315, gap:.94, obstacles:["ghost_donut","zombie_donut","bat_donut","jack_o_lantern_donut"], collectibles:["candy"]},
  {name:"Halloween Factory", theme:"Donut Factory", duration:40, speed:350, gap:.82, obstacles:["spider_donut","bat_donut","witch_donut","vampire_donut","zombie_donut"], collectibles:["candy"]}
];

const objectData = {
  // hit = the visible artwork bounds inside each transparent PNG.
  // This prevents transparent padding from behaving like an invisible obstacle.
  candy:{w:52,h:52,points:25,kind:"collectible",hit:[.11,.35,.89,.97]},
  donut_box:{w:86,h:76,points:30,kind:"obstacle",hit:[.11,.29,.89,.97]},
  donut_tray:{w:92,h:70,points:30,kind:"obstacle",hit:[.11,.33,.89,.97]},
  donut_stack:{w:82,h:86,points:35,kind:"obstacle",hit:[.11,.16,.89,.97]},
  mixing_bowl:{w:86,h:78,points:35,kind:"obstacle",hit:[.11,.18,.89,.97]},
  rolling_pin:{w:92,h:64,points:30,kind:"obstacle",hit:[.10,.35,.90,.97]},
  zombie_donut:{w:78,h:78,points:40,kind:"obstacle",hit:[.11,.20,.89,.97]},
  ghost_donut:{w:78,h:82,points:45,kind:"obstacle",hit:[.11,.21,.89,.97]},
  vampire_donut:{w:80,h:84,points:50,kind:"obstacle",hit:[.11,.16,.89,.97]},
  witch_donut:{w:82,h:88,points:55,kind:"obstacle",hit:[.11,.09,.89,.97]},
  spider_donut:{w:84,h:82,points:60,kind:"obstacle",hit:[.11,.21,.89,.97]},
  bat_donut:{w:86,h:78,points:60,kind:"obstacle",hit:[.06,.21,.94,.97]},
  jack_o_lantern_donut:{w:82,h:82,points:65,kind:"obstacle",hit:[.11,.14,.89,.97]}
};

const images = {};
function loadImage(src){
  return new Promise((resolve,reject)=>{
    const im = new Image();
    im.onload=()=>resolve(im);
    im.onerror=reject;
    im.src=src;
  });
}

let selected = null;
let state = "menu";
let last = 0;
let score = 0;
let elapsed = 0;
let levelIndex = 0;
let multiplier = 1;
let combo = 0;
let spawnTimer = 0;
let levelStartScore = 0;
let bgOffset = 0;
let obstacles = [];
let particles = [];
let player = {x:48,y:730,w:100,h:100,vy:0,onGround:true,jumpCount:0};
let audioCtx = null;
let audioUnlocked = false;
let musicAudio = null;
const GAME_MUSIC = "assets/music/game-music.mp3";
const TITLE_MUSIC = "assets/music/title-theme.mp3";

function setupCharacters(){
  choices.innerHTML = "";
  characters.forEach(c=>{
    const card=document.createElement("div");
    card.className="character-card";
    card.innerHTML=`<img src="${c.file}" alt="${c.name}"><span>${c.name}</span>`;
    card.addEventListener("pointerdown",e=>{
      e.preventDefault();
      selected=c;
      document.querySelectorAll(".character-card").forEach(x=>x.classList.remove("selected"));
      card.classList.add("selected");
      $("startBtn").disabled=false;
      sfx("select");
      // Character selection is a real user gesture, so browsers allow music to begin here.
      playMenuMusic();
    });
    choices.appendChild(card);
  });
}

async function preload(){
  const list = [
    ...characters.map(c=>[c.id,c.file]),
    ["bg","assets/backgrounds/BG.jpg"],
    ...Object.keys(objectData).map(k=>[k,`assets/objects/${k}.png`])
  ];
  await Promise.all(list.map(async ([key,src])=>{
    try{ images[key]=await loadImage(src); }catch(e){ console.warn("Missing asset:",src); }
  }));
}

function ensureAudio(){
  try{
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended") audioCtx.resume();
    audioUnlocked=true;
  }catch(e){}
}

function unlockAudio(){
  ensureAudio();
  if(audioCtx && audioCtx.state==="suspended") audioCtx.resume();
}

function tone(freq,duration,type="sine",volume=.09,when=0){
  try{
    ensureAudio();
    if(!audioCtx)return;
    const now=audioCtx.currentTime+when;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,now);
    g.gain.setValueAtTime(0.0001,now);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.012);
    g.gain.exponentialRampToValueAtTime(0.0001,now+duration);
    o.connect(g).connect(audioCtx.destination);
    o.start(now);o.stop(now+duration+.025);
  }catch(e){}
}
function noise(duration=.08,volume=.045){
  try{
    ensureAudio();
    if(!audioCtx)return;
    const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*duration,audioCtx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*(1-i/data.length);
    const src=audioCtx.createBufferSource(), g=audioCtx.createGain();
    g.gain.value=volume; src.buffer=buffer; src.connect(g).connect(audioCtx.destination); src.start();
  }catch(e){}
}
function sfx(name){
  try{
    unlockAudio();
    const map={
      select:()=>{tone(660,.07,"triangle",.10);tone(880,.11,"triangle",.075,.07);},
      jump:()=>{tone(390,.08,"square",.095);tone(585,.10,"square",.08,.07);tone(780,.13,"triangle",.065,.14);},
      land:()=>{tone(115,.08,"sine",.09);noise(.06,.025);},
      score:()=>{tone(740,.06,"triangle",.075);tone(980,.09,"triangle",.065,.06);},
      high:()=>{tone(660,.08,"triangle",.08);tone(880,.08,"triangle",.08,.08);tone(1100,.15,"triangle",.075,.16);},
      hit:()=>{tone(170,.18,"sawtooth",.11);tone(95,.28,"sawtooth",.085,.08);noise(.14,.04);},
      over:()=>{tone(300,.15,"sine",.08);tone(220,.20,"sine",.075,.15);tone(140,.30,"sine",.065,.34);},
      button:()=>tone(420,.07,"triangle",.075),
      level:()=>{tone(520,.10,"triangle",.085);tone(700,.10,"triangle",.085,.10);tone(920,.18,"triangle",.08,.20);}
    };
    if(map[name])map[name]();
  }catch(e){}
}

function stopMusic(){
  if(musicAudio){
    musicAudio.pause();
    musicAudio.currentTime=0;
    musicAudio.removeAttribute("src");
    musicAudio.load();
    musicAudio=null;
  }
}

function playTrack(src){
  try{
    ensureAudio();
    if(musicAudio && musicAudio.src.endsWith(src)){
      if(musicAudio.paused) musicAudio.play().catch(()=>{});
      return;
    }
    if(musicAudio){
      musicAudio.pause();
      musicAudio.removeAttribute("src");
      musicAudio.load();
    }
    const a=new Audio(src);
    a.loop=true;
    a.autoplay=false;
    a.preload="auto";
    a.playsInline=true;
    a.volume=.38;
    a.addEventListener("error",()=>{
      // If a separate title track is not supplied, use the gameplay track.
      if(src===TITLE_MUSIC) playTrack(GAME_MUSIC);
    });
    musicAudio=a;
    const promise=a.play();
    if(promise) promise.catch(()=>{});
  }catch(e){}
}

function playMenuMusic(){
  // Prefer a supplied title-theme.mp3. If it is not present, use the game track.
  playTrack(TITLE_MUSIC);
}

function playMusic(){
  // One continuous gameplay track for every level.
  playTrack(GAME_MUSIC);
}

function getScores(){
  try{return JSON.parse(localStorage.getItem("donutLandersScores")||"[]");}catch(e){return[]}
}
function saveScores(arr){localStorage.setItem("donutLandersScores",JSON.stringify(arr.slice(0,10)))}
function qualifies(n){return getScores().length<10 || n>getScores()[getScores().length-1].score}
function renderScores(){
  const arr=getScores();
  const el=$("scores");el.innerHTML="";
  if(!arr.length){el.innerHTML="<li>No scores yet. Be the first!</li>";return}
  arr.forEach((x,i)=>{const li=document.createElement("li");li.textContent=`${i+1}. ${x.name} — ${x.score.toLocaleString()}`;el.appendChild(li)});
}
function submitScore(){
  const name=($("playerName").value||"YOU").trim().toUpperCase().slice(0,12);
  const arr=getScores();
  arr.push({name:name||"YOU",score:Math.floor(score),date:Date.now()});
  arr.sort((a,b)=>b.score-a.score);saveScores(arr);
  $("nameEntry").classList.add("hidden");$("notQualified").classList.add("hidden");
  renderScores();sfx("high");
}

function startGame(){
  if(!selected)return;
  ensureAudio();sfx("button");
  state="playing";menu.classList.add("hidden");gameOver.classList.add("hidden");leaderboard.classList.add("hidden");hud.classList.remove("hidden");
  score=0;elapsed=0;levelIndex=0;multiplier=1;combo=0;spawnTimer=.8;bgOffset=0;obstacles=[];particles=[];
  player={x:48,y:720,w:100,h:100,vy:0,onGround:true,jumpCount:0};
  levelStartScore=0; updateHud(); playMusic();
  last=performance.now(); requestAnimationFrame(loop);
}

function jump(){
  if(state!=="playing")return;
  ensureAudio();
  if(player.onGround){
    player.vy=-820;player.onGround=false;player.jumpCount++;
    sfx("jump");
  }
}

function spawnObject(){
  const L=levels[levelIndex];
  const pool=Math.random()<.78?L.obstacles:L.collectibles;
  const type=pool[Math.floor(Math.random()*pool.length)];
  const d=objectData[type];
  // Never create a collidable object if its image did not load.
  // A missing image must never become an invisible obstacle.
  const im=images[type];
  if(!im || !im.complete || im.naturalWidth===0) return;

  const scale=.68+Math.random()*.18;
  const groundY=820;
  const isCollect=d.kind==="collectible";
  const y=isCollect?groundY-70-(Math.random()<.35?55:0):groundY-d.h;
  obstacles.push({
    type, x:W+24, y, w:d.w*scale, h:d.h*scale,
    kind:d.kind, points:d.points, passed:false, angle:0,
    hit:d.hit
  });
}

function update(dt){
  elapsed+=dt;
  const L=levels[levelIndex];
  const progress=Math.min(1,elapsed/L.duration);
  const speed=L.speed + progress*55 + levelIndex*16;
  bgOffset += speed*dt*.18;
  spawnTimer-=dt;
  if(spawnTimer<=0){
    spawnObject();
    const variance=(Math.random()-.5)*.28;
    spawnTimer=Math.max(.55,L.gap+variance-(elapsed/L.duration)*.25);
  }

  player.vy += 2050*dt;
  player.y += player.vy*dt;
  const ground=820-player.h;
  if(player.y>=ground){
    if(!player.onGround && player.vy>100)sfx("land");
    player.y=ground;player.vy=0;player.onGround=true;
  }

  obstacles.forEach(o=>{
    o.x-=speed*dt;
    if(o.kind==="collectible") o.y += Math.sin((elapsed+o.x)*.01)*.2;
    if(!o.passed && o.x+o.w<player.x){
      o.passed=true;
      if(o.kind==="obstacle"){
        combo++;multiplier=combo>=5?3:combo>=3?2:1;
        score+=15*multiplier;sfx("score");burst(o.x,o.y,6);
      }
    }
  });

  // collisions
  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    if(o.x+o.w< -80){obstacles.splice(i,1);continue}
    if(hitbox(player,o)){
      if(o.kind==="collectible"){
        score+=o.points*multiplier;sfx("score");burst(o.x,o.y,12);obstacles.splice(i,1);
      }else{
        gameEnd();return;
      }
    }
  }

  score += dt*10*(1+levelIndex*.15);
  if(Math.floor(elapsed)%10===0 && Math.random()<dt) sfx("score");

  if(elapsed>=L.duration){
    if(levelIndex<levels.length-1){
      score+=250*(levelIndex+1);
      levelIndex++;elapsed=0;spawnTimer=.7;multiplier=1;combo=0;obstacles=[];sfx("level");
      // One continuous game track plays across every level.
      playMusic();
    }else{
      // endless final level: keep escalating
      elapsed=0;levelIndex=4;spawnTimer=.6;score+=500;sfx("level");
    }
  }
  updateHud();
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.life-=dt});
  particles=particles.filter(p=>p.life>0);
}

function hitbox(a,b){
  // Player collision box is intentionally forgiving.
  const ax=a.x+22, ay=a.y+20, aw=a.w-44, ah=a.h-24;

  // Use the actual visible artwork bounds for the obstacle.
  // Most PNGs contain transparent padding around the drawing; using the
  // whole PNG made the player collide with objects before they were visible.
  const h=b.hit || [.14,.14,.86,.96];
  const bx=b.x+b.w*h[0];
  const by=b.y+b.h*h[1];
  const bw=b.w*(h[2]-h[0]);
  const bh=b.h*(h[3]-h[1]);

  return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
}
function burst(x,y,n){
  for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*160,vy:-Math.random()*180,life:.4+Math.random()*.4});
}
function updateHud(){
  scoreEl.textContent=Math.floor(score).toLocaleString();
  levelEl.textContent=String(levelIndex+1);
  multEl.textContent=String(multiplier);
}

function draw(){
  ctx.clearRect(0,0,W,H);
  drawBackground();
  drawObjects();
  drawPlayer();
  drawParticles();
}
function drawBackground(){
  const im=images.bg;
  if(!im){ctx.fillStyle="#2b1739";ctx.fillRect(0,0,W,H);return}
  // Portrait cover crop: keep the countertop visible near the bottom.
  const scale=Math.max(W/im.width,H/im.height)*1.04;
  const dw=im.width*scale, dh=im.height*scale;
  const maxX=Math.max(0,dw-W);
  const x=-(bgOffset%(maxX||1));
  const y=H-dh;
  ctx.drawImage(im,x,y,dw,dh);
  const overlays=["rgba(255,120,40,0.02)","rgba(55,20,120,0.18)","rgba(35,10,55,0.24)","rgba(20,20,70,0.34)","rgba(110,25,90,0.22)"];
  ctx.fillStyle=overlays[levelIndex]||overlays[0];
  ctx.fillRect(0,0,W,H);
  // Ground strip makes the running lane clear even when background art is cropped.
  ctx.fillStyle="rgba(65,22,18,.35)";
  ctx.fillRect(0,820,W,H-820);
}
function drawObjects(){
  obstacles.forEach(o=>{
    const im=images[o.type];
    if(!im)return;
    ctx.drawImage(im,o.x,o.y,o.w,o.h);
  });
}
function drawPlayer(){
  const im=images[selected?.id];
  if(!im)return;
  const bob=player.onGround?Math.sin(performance.now()*.012)*2:0;
  ctx.drawImage(im,player.x,player.y+bob,player.w,player.h);
}
function drawParticles(){
  ctx.save();
  particles.forEach(p=>{
    ctx.globalAlpha=Math.max(0,p.life*2);
    ctx.fillStyle="#ffb42e";
    ctx.fillRect(p.x,p.y,5,5);
  });
  ctx.restore();
}

function gameEnd(){
  state="gameover";hud.classList.add("hidden");stopMusic();sfx("hit");setTimeout(()=>sfx("over"),80);
  $("finalScore").textContent=Math.floor(score).toLocaleString();
  $("finalLevel").textContent=`Reached ${levels[levelIndex].name}`;
  const q=qualifies(Math.floor(score));
  $("nameEntry").classList.toggle("hidden",!q);
  $("notQualified").classList.toggle("hidden",q);
  $("playAgainBtn").classList.remove("hidden");
  gameOver.classList.remove("hidden");
  if(q){$("playerName").value="";setTimeout(()=>$("playerName").focus(),100)}
}

function openLeaderboard(){
  renderScores();leaderboard.classList.remove("hidden");
}
function closeLeaderboard(){leaderboard.classList.add("hidden")}

canvas.addEventListener("pointerdown",e=>{
  e.preventDefault();
  if(state==="playing")jump();
});
window.addEventListener("keydown",e=>{
  if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();jump();}
});

$("startBtn").addEventListener("pointerdown",e=>{e.preventDefault();startGame()});
$("leaderboardBtn").addEventListener("pointerdown",e=>{e.preventDefault();sfx("button");openLeaderboard()});
$("gameOverLeaderboardBtn").addEventListener("pointerdown",e=>{e.preventDefault();sfx("button");openLeaderboard()});
$("closeLeaderboardBtn").addEventListener("pointerdown",e=>{e.preventDefault();sfx("button");closeLeaderboard()});
$("saveScoreBtn").addEventListener("pointerdown",e=>{e.preventDefault();submitScore()});
$("playAgainBtn").addEventListener("pointerdown",e=>{e.preventDefault();startGame()});
$("menuBtn").addEventListener("pointerdown",e=>{
  e.preventDefault();sfx("button");stopMusic();gameOver.classList.add("hidden");menu.classList.remove("hidden");state="menu";
});

function loop(t){
  if(state!=="playing"){draw();return}
  const dt=Math.min(.033,(t-last)/1000);last=t;
  update(dt);draw();requestAnimationFrame(loop);
}

(async function init(){
  setupCharacters();
  await preload();
  renderScores();
  state="menu";
  draw();
  // Mobile browsers block audible autoplay until the user interacts.
  // Start the menu track automatically on the first tap, with no "tap to unmute" step.
  const startMenuOnFirstGesture=()=>{
    unlockAudio();
    if(state==="menu") playMenuMusic();
  };
  document.addEventListener("pointerdown",startMenuOnFirstGesture,{passive:false});
})();
})();