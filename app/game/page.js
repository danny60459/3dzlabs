"use client";
import { useEffect, useRef, useState } from "react";

// ─── Canvas / layout constants ────────────────────────────────────────────────
const W      = 800;
const H      = 560;
const HUD_H  = 60;
const GH     = H - HUD_H;
const WALL   = 16;
const DOOR_W = 56;
const MX     = W / 2;
const MY     = GH / 2;

// ─── Palette ──────────────────────────────────────────────────────────────────
const GREEN   = "#00ffa0";
const DIM     = "#00cc7a";
const RED     = "#ff3060";
const BG      = "#03050f";
const SURFACE = "#060f0a";

// ─── Entity sizes ─────────────────────────────────────────────────────────────
const P_SZ = 20;
const E_SZ = 20;
const T_SZ = 10;
const D_SZ = 34;

// ─── Player speed (logical px/frame — canvas coords are always 800×560 so this ─
// ─── is identical on every device regardless of CSS scaling or devicePixelRatio) ─
const P_SPEED = 3;

// ─── Laser timing ─────────────────────────────────────────────────────────────
const LASER_ON     = 1.5;   // seconds beam is active
const LASER_PERIOD = 2.3;   // total cycle (1.5 on + 0.8 off)

// ─── Sector config ────────────────────────────────────────────────────────────
const SECTOR_TIMERS = [30, 30, 30];
const SECTOR_RANGES = [[0, 3], [3, 6], [6, 9]];

// ─── Leaderboard ──────────────────────────────────────────────────────────────
const LB_KEY_DESKTOP = "daemon_leaderboard_desktop";
const LB_KEY_MOBILE  = "daemon_leaderboard_mobile";
const CYBER_NAMES = [
  "SYNX","VOID","ARCX","HEXX","BYTE","KORE","NEXX","ZER0","XENN","KRYP",
  "VIP3","NULS","DRVN","GR1D","BL4Z","PRXM","SLNT","FLUX","VRTX","GL1T",
  "PHNT","SHDW","QU4D","DR4X","NEON","THRX","WYRE","RNGE","KAIS","MNTR",
];
const CYBER_SFX   = ["7","99","0","X","EX","01","13","77","88","4","IX","00"];
const BLOCKED_WORDS = new Set([
  // English
  "FUCK","FUK","FCK","SHIT","SHT","CUNT","CNT","BITCH","DICK","DIK","COCK",
  "PUSS","TWAT","WANK","SLUT","RAPE","JIZZ","TITS","BOOB","PORN","KKK","NAZI",
  "NIGR","NIGG","SPIC","KYKE","KIKE","FAGS","FAGG","FAG","COON","KOON","RETAR",
  "ASS","CUM","SUK","TIT",
  // Spanish
  "PUTA","PUTO","MERD","CONN","SALP","POLLA","VERGA","JODE","CULO","PENE","CAGO",
  // French
  "FOTR","ENCU","BAIS","MERDE",
  // Portuguese
  "PORR","CARA","FODA","BUCH",
  // German
  "FICK","ARSC","HURE","FOTZE","WICHS",
]);

// ─── Room pools — 2 variants per slot, one randomly chosen each playthrough ───
// Exits fixed by slot: S1[0]→right:1  S1[1]→left:0+right:2  S1[2]→left:1
//                      S2[3]→right:4  S2[4]→left:3+right:5  S2[5]→left:4
//                      S3[6]→right:7  S3[7]→left:6+right:8  S3[8]→left:7
// Laser coords: horizontal { x1:16, x2:784 }  vertical { y1:16, y2:484 }
// Enemy spawns ≥120px from any door centre (door centres at wall midpoints)
const ROOM_POOLS = [
  // ── Slot 0 · S1 entry ────────────────────────────────────────────────────
  [
    {
      name: "S1-R1a",
      innerWalls: [[200,80,160,14],[200,80,14,140],[500,300,14,184],[300,380,180,14]],
      enemyDefs: [{ x:400,y:180,speed:0.9 },{ x:600,y:380,speed:0.8 },{ x:250,y:360,speed:1.0 }],
      treasureDefs: [{ x:350,y:130 },{ x:620,y:200 },{ x:680,y:430 }],
      exits: [{ side:"right", toRoom:1 }],
      lasers: [{ x1:440, y1:300, x2:784, y2:300, phase:0, on:1.2, period:3.0 }],
      movingWallDefs: [],
    },
    {
      name: "S1-R1b",
      innerWalls: [[160,160,14,180],[160,160,200,14],[520,220,200,14],[400,360,200,14]],
      enemyDefs: [{ x:350,y:250,speed:0.9 },{ x:600,y:150,speed:1.0 },{ x:580,y:400,speed:0.8 }],
      treasureDefs: [{ x:200,y:90 },{ x:640,y:90 },{ x:300,y:430 }],
      exits: [{ side:"right", toRoom:1 }],
      lasers: [{ x1:400, y1:16, x2:400, y2:226, phase:0.5, on:1.2, period:3.0 }],
      movingWallDefs: [],
    },
  ],
  // ── Slot 1 · S1 middle ───────────────────────────────────────────────────
  [
    {
      name: "S1-R2a",
      innerWalls: [[280,120,14,200],[280,120,180,14],[480,320,180,14],[480,200,14,130]],
      enemyDefs: [{ x:200,y:200,speed:0.9 },{ x:600,y:300,speed:0.85 },{ x:380,y:400,speed:1.0 }],
      treasureDefs: [{ x:180,y:400 },{ x:380,y:200 },{ x:660,y:130 }],
      exits: [{ side:"left", toRoom:0 },{ side:"right", toRoom:2 }],
      lasers: [{ x1:480, y1:190, x2:784, y2:190, phase:0.8, on:1.2, period:3.0 }],
      movingWallDefs: [],
    },
    {
      name: "S1-R2b",
      innerWalls: [[160,200,180,14],[160,200,14,180],[500,120,180,14],[500,120,14,200]],
      enemyDefs: [{ x:350,y:150,speed:0.95 },{ x:220,y:380,speed:0.9 },{ x:580,y:350,speed:1.0 }],
      treasureDefs: [{ x:680,y:430 },{ x:200,y:120 },{ x:400,y:300 }],
      exits: [{ side:"left", toRoom:0 },{ side:"right", toRoom:2 }],
      lasers: [{ x1:16, y1:320, x2:784, y2:320, phase:0.3, on:1.2, period:3.0 }],
      movingWallDefs: [],
    },
  ],
  // ── Slot 2 · S1 final ────────────────────────────────────────────────────
  [
    {
      name: "S1-R3a",
      innerWalls: [[160,120,200,14],[160,120,14,180],[480,280,14,200],[300,380,200,14],[580,100,14,180]],
      enemyDefs: [{ x:350,y:200,speed:1.0 },{ x:580,y:380,speed:0.9 },{ x:220,y:380,speed:0.85 }],
      treasureDefs: [{ x:350,y:100 },{ x:680,y:200 },{ x:200,y:440 },{ x:600,y:450 }],
      exits: [{ side:"left", toRoom:1 }],
      lasers: [{ x1:300, y1:16, x2:300, y2:484, phase:1.2, on:1.2, period:3.0 }],
      movingWallDefs: [],
    },
    {
      name: "S1-R3b",
      innerWalls: [[200,180,240,14],[200,180,14,160],[450,100,14,160],[550,300,200,14],[200,360,200,14]],
      enemyDefs: [{ x:400,y:280,speed:1.0 },{ x:600,y:150,speed:0.9 },{ x:250,y:430,speed:0.85 }],
      treasureDefs: [{ x:180,y:120 },{ x:650,y:430 },{ x:450,y:420 },{ x:680,y:240 }],
      exits: [{ side:"left", toRoom:1 }],
      lasers: [{ x1:16, y1:180, x2:784, y2:180, phase:0.6, on:1.2, period:3.0 }],
      movingWallDefs: [],
    },
  ],
  // ── Slot 3 · S2 entry ────────────────────────────────────────────────────
  [
    {
      name: "S2-R1a",
      innerWalls: [[300,80,14,200],[100,280,190,14],[520,180,14,200],[180,380,240,14]],
      enemyDefs: [{ x:200,y:170,speed:1.0 },{ x:580,y:130,speed:1.05 },{ x:380,y:400,speed:0.95 },{ x:620,y:390,speed:1.0 }],
      treasureDefs: [{ x:160,y:130 },{ x:450,y:130 },{ x:300,y:340 },{ x:680,y:200 }],
      exits: [{ side:"right", toRoom:4 }],
      lasers: [
        { x1:16, y1:290, x2:784, y2:290, phase:0,   on:1.2, period:3.0 },
        { x1:320, y1:16, x2:320, y2:484, phase:1.1, on:1.2, period:3.0 },
      ],
      movingWallDefs: [{ x:450, y:180, w:120, h:14, axis:"x", min:350, max:560, speed:1.2 }],
    },
    {
      name: "S2-R1b",
      innerWalls: [[200,100,220,14],[200,100,14,160],[480,280,14,180],[280,360,200,14],[580,120,160,14]],
      enemyDefs: [{ x:350,y:200,speed:1.0 },{ x:600,y:400,speed:1.05 },{ x:220,y:400,speed:0.95 },{ x:640,y:220,speed:1.0 }],
      treasureDefs: [{ x:180,y:400 },{ x:350,y:100 },{ x:660,y:100 },{ x:500,y:430 }],
      exits: [{ side:"right", toRoom:4 }],
      lasers: [
        { x1:16, y1:175, x2:784, y2:175, phase:0.5, on:1.2, period:3.0 },
        { x1:550, y1:16, x2:550, y2:484, phase:1.3, on:1.2, period:3.0 },
      ],
      movingWallDefs: [{ x:200, y:280, w:14, h:100, axis:"y", min:220, max:370, speed:1.0 }],
    },
  ],
  // ── Slot 4 · S2 middle ───────────────────────────────────────────────────
  [
    {
      name: "S2-R2a",
      innerWalls: [[200,120,14,200],[200,120,180,14],[500,200,14,200],[360,380,140,14],[300,300,14,80]],
      enemyDefs: [{ x:350,y:220,speed:1.0 },{ x:580,y:130,speed:1.05 },{ x:220,y:400,speed:0.95 },{ x:630,y:380,speed:1.0 }],
      treasureDefs: [{ x:200,y:200 },{ x:650,y:430 },{ x:380,y:350 },{ x:580,y:280 }],
      exits: [{ side:"left", toRoom:3 },{ side:"right", toRoom:5 }],
      lasers: [
        { x1:16, y1:310, x2:784, y2:310, phase:0.5, on:1.2, period:3.0 },
        { x1:450, y1:16, x2:450, y2:484, phase:1.4, on:1.2, period:3.0 },
      ],
      movingWallDefs: [{ x:500, y:300, w:160, h:14, axis:"x", min:400, max:620, speed:1.1 }],
    },
    {
      name: "S2-R2b",
      innerWalls: [[180,200,180,14],[180,200,14,180],[480,100,180,14],[480,100,14,200],[280,360,200,14]],
      enemyDefs: [{ x:400,y:180,speed:1.05 },{ x:220,y:380,speed:0.95 },{ x:600,y:360,speed:1.0 },{ x:350,y:420,speed:1.05 }],
      treasureDefs: [{ x:200,y:130 },{ x:660,y:430 },{ x:400,y:300 },{ x:600,y:130 }],
      exits: [{ side:"left", toRoom:3 },{ side:"right", toRoom:5 }],
      lasers: [
        { x1:16, y1:195, x2:784, y2:195, phase:0.2, on:1.2, period:3.0 },
        { x1:350, y1:16, x2:350, y2:484, phase:1.1, on:1.2, period:3.0 },
      ],
      movingWallDefs: [{ x:180, y:300, w:14, h:120, axis:"y", min:240, max:364, speed:1.2 }],
    },
  ],
  // ── Slot 5 · S2 final ────────────────────────────────────────────────────
  [
    {
      name: "S2-R3a",
      innerWalls: [[80,120,280,14],[80,120,14,180],[80,300,200,14],[440,200,14,220],[560,330,200,14]],
      enemyDefs: [{ x:300,y:220,speed:1.0 },{ x:560,y:180,speed:1.05 },{ x:350,y:400,speed:0.95 },{ x:650,y:420,speed:1.0 }],
      treasureDefs: [{ x:200,y:80 },{ x:400,y:100 },{ x:530,y:450 },{ x:700,y:260 },{ x:160,y:400 }],
      exits: [{ side:"left", toRoom:4 }],
      lasers: [
        { x1:16, y1:310, x2:784, y2:310, phase:0.3, on:1.2, period:3.0 },
        { x1:500, y1:16, x2:500, y2:484, phase:1.2, on:1.2, period:3.0 },
      ],
      movingWallDefs: [{ x:300, y:100, w:160, h:14, axis:"x", min:200, max:430, speed:1.2 }],
    },
    {
      name: "S2-R3b",
      innerWalls: [[200,160,220,14],[200,160,14,160],[480,260,14,200],[250,360,200,14],[580,100,160,14]],
      enemyDefs: [{ x:400,y:200,speed:1.05 },{ x:220,y:430,speed:1.0 },{ x:620,y:200,speed:0.95 },{ x:560,y:420,speed:1.05 }],
      treasureDefs: [{ x:180,y:100 },{ x:400,y:430 },{ x:640,y:430 },{ x:700,y:130 },{ x:300,y:300 }],
      exits: [{ side:"left", toRoom:4 }],
      lasers: [
        { x1:16, y1:170, x2:784, y2:170, phase:0.7, on:1.2, period:3.0 },
        { x1:380, y1:16, x2:380, y2:484, phase:1.5, on:1.2, period:3.0 },
      ],
      movingWallDefs: [{ x:480, y:200, w:14, h:120, axis:"y", min:160, max:320, speed:1.3 }],
    },
  ],
  // ── Slot 6 · S3 entry ────────────────────────────────────────────────────
  [
    {
      name: "S3-R1a",
      innerWalls: [[200,80,14,260],[200,80,180,14],[520,220,14,160],[300,360,180,14],[560,100,160,14]],
      enemyDefs: [{ x:400,y:200,speed:1.05 },{ x:580,y:400,speed:1.1 },{ x:350,y:420,speed:1.0 },{ x:640,y:200,speed:1.15 },{ x:280,y:180,speed:1.05 }],
      treasureDefs: [{ x:200,y:430 },{ x:390,y:55 },{ x:660,y:150 },{ x:610,y:440 },{ x:680,y:310 }],
      exits: [{ side:"right", toRoom:7 }],
      lasers: [
        { x1:16, y1:165, x2:784, y2:165, phase:0,   on:1.2, period:3.0 },
        { x1:400, y1:16, x2:400, y2:484, phase:0.7, on:1.2, period:3.0 },
        { x1:16, y1:370, x2:784, y2:370, phase:1.5, on:1.2, period:3.0 },
      ],
      movingWallDefs: [
        { x:200, y:250, w:160, h:14, axis:"x", min:200, max:520, speed:1.5 },
        { x:540, y:150, w:14, h:120, axis:"y", min:100, max:300, speed:1.8 },
      ],
    },
    {
      name: "S3-R1b",
      innerWalls: [[160,140,200,14],[160,140,14,200],[500,200,14,200],[280,370,200,14],[550,100,14,160]],
      enemyDefs: [{ x:350,y:200,speed:1.1 },{ x:620,y:380,speed:1.05 },{ x:280,y:400,speed:1.15 },{ x:630,y:200,speed:1.0 },{ x:430,y:420,speed:1.1 }],
      treasureDefs: [{ x:180,y:430 },{ x:400,y:80 },{ x:680,y:130 },{ x:600,y:450 },{ x:260,y:300 }],
      exits: [{ side:"right", toRoom:7 }],
      lasers: [
        { x1:16, y1:200, x2:784, y2:200, phase:0.3, on:1.2, period:3.0 },
        { x1:300, y1:16, x2:300, y2:484, phase:1.0, on:1.2, period:3.0 },
        { x1:16, y1:380, x2:784, y2:380, phase:1.6, on:1.2, period:3.0 },
      ],
      movingWallDefs: [
        { x:380, y:280, w:180, h:14, axis:"x", min:300, max:560, speed:1.6 },
        { x:200, y:250, w:14, h:100, axis:"y", min:200, max:380, speed:1.5 },
      ],
    },
  ],
  // ── Slot 7 · S3 middle ───────────────────────────────────────────────────
  [
    {
      name: "S3-R2a",
      innerWalls: [[160,180,200,14],[160,80,14,200],[420,280,14,180],[420,280,200,14],[580,100,14,200],[240,370,160,14]],
      enemyDefs: [{ x:300,y:200,speed:1.1 },{ x:220,y:400,speed:1.05 },{ x:560,y:200,speed:1.15 },{ x:640,y:400,speed:1.1 },{ x:400,y:430,speed:1.0 }],
      treasureDefs: [{ x:200,y:130 },{ x:280,y:310 },{ x:680,y:240 },{ x:360,y:450 },{ x:540,y:80 }],
      exits: [{ side:"left", toRoom:6 },{ side:"right", toRoom:8 }],
      lasers: [
        { x1:16, y1:185, x2:784, y2:185, phase:0.2, on:1.2, period:3.0 },
        { x1:500, y1:16, x2:500, y2:484, phase:0.9, on:1.2, period:3.0 },
        { x1:16, y1:380, x2:784, y2:380, phase:1.6, on:1.2, period:3.0 },
      ],
      movingWallDefs: [
        { x:300, y:160, w:160, h:14, axis:"x", min:200, max:420, speed:1.6 },
        { x:580, y:280, w:14, h:100, axis:"y", min:220, max:364, speed:1.7 },
      ],
    },
    {
      name: "S3-R2b",
      innerWalls: [[200,200,180,14],[200,100,14,200],[460,300,14,180],[350,380,180,14],[580,100,14,200]],
      enemyDefs: [{ x:360,y:170,speed:1.1 },{ x:220,y:420,speed:1.15 },{ x:540,y:200,speed:1.05 },{ x:660,y:400,speed:1.1 },{ x:420,y:430,speed:1.0 }],
      treasureDefs: [{ x:200,y:140 },{ x:660,y:130 },{ x:310,y:310 },{ x:400,y:450 },{ x:560,y:420 }],
      exits: [{ side:"left", toRoom:6 },{ side:"right", toRoom:8 }],
      lasers: [
        { x1:16, y1:210, x2:784, y2:210, phase:0.5, on:1.2, period:3.0 },
        { x1:300, y1:16, x2:300, y2:484, phase:1.2, on:1.2, period:3.0 },
        { x1:16, y1:360, x2:784, y2:360, phase:1.9, on:1.2, period:3.0 },
      ],
      movingWallDefs: [
        { x:420, y:200, w:160, h:14, axis:"x", min:350, max:600, speed:1.5 },
        { x:200, y:280, w:14, h:100, axis:"y", min:240, max:384, speed:1.8 },
      ],
    },
  ],
  // ── Slot 8 · S3 final ────────────────────────────────────────────────────
  [
    {
      name: "S3-R3a",
      innerWalls: [[180,120,260,14],[180,120,14,180],[180,300,160,14],[480,200,14,180],[480,370,200,14],[560,100,14,100]],
      enemyDefs: [{ x:380,y:200,speed:1.15 },{ x:220,y:380,speed:1.1 },{ x:600,y:180,speed:1.2 },{ x:560,y:430,speed:1.1 },{ x:380,y:420,speed:1.05 }],
      treasureDefs: [{ x:200,y:80 },{ x:430,y:80 },{ x:700,y:430 },{ x:260,y:390 },{ x:560,y:460 },{ x:680,y:300 }],
      exits: [{ side:"left", toRoom:7 }],
      lasers: [
        { x1:16, y1:150, x2:784, y2:150, phase:0,   on:1.2, period:3.0 },
        { x1:450, y1:16, x2:450, y2:484, phase:0.8, on:1.2, period:3.0 },
        { x1:16, y1:350, x2:784, y2:350, phase:1.4, on:1.2, period:3.0 },
      ],
      movingWallDefs: [
        { x:300, y:240, w:180, h:14, axis:"x", min:200, max:480, speed:1.7 },
        { x:180, y:280, w:14, h:100, axis:"y", min:220, max:380, speed:1.8 },
      ],
    },
    {
      name: "S3-R3b",
      innerWalls: [[160,140,280,14],[160,140,14,160],[160,300,170,14],[460,200,14,180],[460,360,200,14],[540,100,14,100]],
      enemyDefs: [{ x:360,y:200,speed:1.1 },{ x:220,y:400,speed:1.2 },{ x:580,y:170,speed:1.15 },{ x:540,y:440,speed:1.1 },{ x:400,y:400,speed:1.05 }],
      treasureDefs: [{ x:180,y:80 },{ x:400,y:80 },{ x:680,y:450 },{ x:260,y:390 },{ x:540,y:460 },{ x:700,y:290 }],
      exits: [{ side:"left", toRoom:7 }],
      lasers: [
        { x1:16, y1:170, x2:784, y2:170, phase:0.2, on:1.2, period:3.0 },
        { x1:330, y1:16, x2:330, y2:484, phase:0.9, on:1.2, period:3.0 },
        { x1:16, y1:380, x2:784, y2:380, phase:1.5, on:1.2, period:3.0 },
      ],
      movingWallDefs: [
        { x:380, y:260, w:180, h:14, axis:"x", min:280, max:520, speed:1.8 },
        { x:460, y:280, w:14, h:100, axis:"y", min:240, max:384, speed:1.6 },
      ],
    },
  ],
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function GamePage() {
  const canvasRef = useRef(null);
  const keysRef   = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const isMobile = navigator.maxTouchPoints > 0;

    // ── Mutable game state ──────────────────────────────────────────────────
    let phase     = "title";  // "title"|"playing"|"sectorComplete"|"gameover"|"nameEntry"|"leaderboard"
    let sectorIdx = 0;
    let roomIdx   = 0;
    let score     = 0;
    let lives     = 3;
    let timer     = SECTOR_TIMERS[0];
    let lastTick  = performance.now();
    let lastHitTime          = -Infinity;
    let touchingLaserIndices = new Set();
    let platformKey          = LB_KEY_DESKTOP;
    let shakeFrames          = 0;
    let flashMsg             = "";
    let flashFrames          = 0;
    let audioCtx             = null;
    let soundEnabled         = true;
    let bgAudio              = null;
    let sectorCompleteAudio  = null;
    let bgMusicVolume        = 0.3;
    let gameStartTime        = 0;
    let completionTime       = 0;
    let lastSubmittedId      = "";
    let lastSubmittedScore   = -1;
    const nameEntry = { mode: "choose", selection: 0, input: "", error: "", errorTimer: 0 };

    const player = { x: WALL + 34, y: MY };
    const daemon  = { x: 0, y: 0, active: false, speed: (isMobile ? 0.7 : 0.6) * P_SPEED, spawnAge: 0 };

    let checkpoint        = null;  // { score, lives } saved on first S3 entry
    let continueCountdown = 10;
    let continueLastTick  = 0;

    let rooms      = makeRooms();
    let roomStates = makeRoomStates();

    function makeRooms() {
      return ROOM_POOLS.map(pool => pool[Math.floor(Math.random() * pool.length)]);
    }

    function pickHeartPos(roomDef) {
      const margin = WALL + 60;
      for (let attempt = 0; attempt < 80; attempt++) {
        const x = margin + Math.random() * (W - margin * 2);
        const y = margin + Math.random() * (GH - margin * 2);
        let ok = true;
        for (const e of roomDef.enemyDefs) {
          if ((x - e.x) ** 2 + (y - e.y) ** 2 < 70 * 70) { ok = false; break; }
        }
        if (ok) {
          for (const [wx, wy, ww, wh] of roomDef.innerWalls) {
            if (x > wx - 35 && x < wx + ww + 35 && y > wy - 35 && y < wy + wh + 35) { ok = false; break; }
          }
        }
        if (ok) return { x, y, collected: false };
      }
      return { x: W / 2, y: GH / 2, collected: false };
    }

    function makeRoomStates() {
      const s2HeartRoom = SECTOR_RANGES[1][0] + Math.floor(Math.random() * 3);
      const s3HeartRoom = SECTOR_RANGES[2][0] + Math.floor(Math.random() * 3);
      return rooms.map((r, idx) => ({
        enemies:     r.enemyDefs.map(e => ({ x: e.x, y: e.y, speed: e.speed, vx: 0, vy: 0, wanderTimer: 0, lastX: e.x, lastY: e.y, stuckCount: 0 })),
        treasures:   r.treasureDefs.map(t => ({ ...t, collected: false })),
        movingWalls: (r.movingWallDefs ?? []).map(mw => ({ ...mw, dir: 1 })),
        heart:       (idx === s2HeartRoom || idx === s3HeartRoom) ? pickHeartPos(r) : null,
      }));
    }

    // ── Mobile keyboard shim for name entry ───────────────────────────────
    const hiddenInput = document.createElement("input");
    hiddenInput.type  = "text";
    hiddenInput.autocomplete = "off";
    hiddenInput.style.cssText = "position:fixed;opacity:0;width:1px;height:1px;top:0;left:0;pointer-events:none;";
    document.body.appendChild(hiddenInput);
    hiddenInput.addEventListener("input", () => {
      const v = hiddenInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      hiddenInput.value = v;
      nameEntry.input = v;
    });

    // ── Leaderboard helpers ────────────────────────────────────────────────
    function generateCyberpunkId() {
      const base = CYBER_NAMES[Math.floor(Math.random() * CYBER_NAMES.length)];
      const sfx  = Math.random() > 0.45 ? CYBER_SFX[Math.floor(Math.random() * CYBER_SFX.length)] : "";
      return (base + sfx).slice(0, 6);
    }
    function containsProfanity(s) {
      const u = s.toUpperCase();
      for (const w of BLOCKED_WORDS) { if (u.includes(w)) return true; }
      return false;
    }
    function fmtTime(secs) {
      return `${String(Math.floor(secs / 60)).padStart(2,"0")}:${String(secs % 60).padStart(2,"0")}`;
    }
    function loadLeaderboard(key) {
      const k = key || platformKey;
      try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
    }
    function submitScore(id) {
      lastSubmittedId    = id;
      lastSubmittedScore = score;
      const lb = loadLeaderboard(platformKey);
      lb.push({ id, score, time: completionTime, date: new Date().toISOString().slice(0, 10) });
      lb.sort((a, b) => b.score !== a.score ? b.score - a.score : a.time - b.time);
      try { localStorage.setItem(platformKey, JSON.stringify(lb.slice(0, 10))); } catch {}
    }
    function submitManual() {
      const id = nameEntry.input.trim();
      if (id.length < 3) {
        nameEntry.error = "MIN 3 CHARACTERS"; nameEntry.errorTimer = 130; return;
      }
      if (containsProfanity(id)) {
        nameEntry.error = "ID REJECTED  —  TRY AGAIN"; nameEntry.errorTimer = 140;
        nameEntry.input = ""; hiddenInput.value = ""; return;
      }
      submitScore(id); phase = "leaderboard";
    }

    function enterSector(idx) {
      sectorIdx     = idx;
      roomIdx       = SECTOR_RANGES[idx][0];
      timer         = SECTOR_TIMERS[idx];
      lastTick      = performance.now();
      lastHitTime          = performance.now();
      touchingLaserIndices = new Set();
      player.x      = WALL + 34;
      player.y      = MY;
      daemon.active = false;
      daemon.speed  = (isMobile ? 0.7 : 0.6) * P_SPEED;
      daemon.x        = 0;
      daemon.y        = 0;
      daemon.spawnAge = 0;
      unduckMusic();
      if (idx === 2 && !checkpoint) {
        checkpoint = { score, lives };
      }
    }

    // ── Audio ──────────────────────────────────────────────────────────────
    function ac() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      startBgMusic();
      return audioCtx;
    }

    // Two-tone pickup beep
    function sndLoot() {
      if (!soundEnabled) return;
      try {
        const c = ac(), now = c.currentTime;
        [660, 1050].forEach((freq, i) => {
          const osc = c.createOscillator(), g = c.createGain();
          osc.type = "square"; osc.frequency.value = freq;
          osc.connect(g); g.connect(c.destination);
          const t0 = now + i * 0.065;
          g.gain.setValueAtTime(0.12, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
          osc.start(t0); osc.stop(t0 + 0.11);
        });
      } catch(e) {}
    }

    // Warm ascending chord on heart pickup
    function sndHeart() {
      if (!soundEnabled) return;
      try {
        const c = ac(), now = c.currentTime;
        [523, 659, 784, 1047].forEach((freq, i) => {
          const osc = c.createOscillator(), g = c.createGain();
          osc.type = "sine"; osc.frequency.value = freq;
          osc.connect(g); g.connect(c.destination);
          const t0 = now + i * 0.07;
          g.gain.setValueAtTime(0.14, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.26);
          osc.start(t0); osc.stop(t0 + 0.27);
        });
      } catch(e) {}
    }

    // Low thump once per second while timer ≤ 15
    function sndWarnPulse() {
      if (!soundEnabled) return;
      try {
        const c = ac(), now = c.currentTime;
        const osc = c.createOscillator(), g = c.createGain();
        osc.type = "sine"; osc.frequency.value = 110;
        osc.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.28, now + 0.025);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now); osc.stop(now + 0.23);
      } catch(e) {}
    }

    // Rising sawtooth sweep when daemon materialises
    function sndDaemonSpawn() {
      if (!soundEnabled) return;
      try {
        const c = ac(), now = c.currentTime;
        const osc = c.createOscillator(), filt = c.createBiquadFilter(), g = c.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 1.6);
        filt.type = "lowpass";
        filt.frequency.setValueAtTime(300, now);
        filt.frequency.exponentialRampToValueAtTime(5000, now + 1.6);
        osc.connect(filt); filt.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.22, now + 0.08);
        g.gain.setValueAtTime(0.22, now + 1.3);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc.start(now); osc.stop(now + 1.9);
      } catch(e) {}
    }

    // Noise burst + descending pitch sweep on hit / death
    function sndDeath() {
      if (!soundEnabled) return;
      try {
        const c = ac(), now = c.currentTime;
        const len = Math.floor(c.sampleRate * 0.55);
        const buf = c.createBuffer(1, len, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource(), filt = c.createBiquadFilter(), g = c.createGain();
        src.buffer = buf;
        filt.type = "bandpass"; filt.frequency.value = 180; filt.Q.value = 0.6;
        src.connect(filt); filt.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        src.start(now);
        const osc = c.createOscillator(), g2 = c.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.55);
        osc.connect(g2); g2.connect(c.destination);
        g2.gain.setValueAtTime(0.18, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now); osc.stop(now + 0.56);
      } catch(e) {}
    }

    // Three-note ascending chime on room clear
    function sndRoomClear() {
      if (!soundEnabled) return;
      try {
        const c = ac(), now = c.currentTime;
        [523, 659, 784].forEach((freq, i) => {
          const osc = c.createOscillator(), g = c.createGain();
          osc.type = "square"; osc.frequency.value = freq;
          osc.connect(g); g.connect(c.destination);
          const t0 = now + i * 0.1;
          g.gain.setValueAtTime(0.09, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
          osc.start(t0); osc.stop(t0 + 0.19);
        });
      } catch(e) {}
    }

    // Four-note arpeggio with held final note on sector clear
    function sndSectorFanfare() {
      if (!soundEnabled) return;
      try {
        const c = ac(), now = c.currentTime;
        [523, 659, 784, 1047].forEach((freq, i) => {
          const osc = c.createOscillator(), g = c.createGain();
          osc.type = "square"; osc.frequency.value = freq;
          osc.connect(g); g.connect(c.destination);
          const t0 = now + i * 0.13;
          const dur = i === 3 ? 0.55 : 0.18;
          g.gain.setValueAtTime(0.11, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
          osc.start(t0); osc.stop(t0 + dur + 0.01);
        });
      } catch(e) {}
    }

    // Extended ascending run with big final note on full victory
    function sndWinFanfare() {
      if (!soundEnabled) return;
      try {
        const c = ac(), now = c.currentTime;
        [523, 659, 784, 1047, 784, 1047, 1568].forEach((freq, i) => {
          const osc = c.createOscillator(), g = c.createGain();
          osc.type = "square"; osc.frequency.value = freq;
          osc.connect(g); g.connect(c.destination);
          const t0 = now + i * 0.1;
          const last = i === 6;
          g.gain.setValueAtTime(last ? 0.16 : 0.1, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + (last ? 0.9 : 0.14));
          osc.start(t0); osc.stop(t0 + (last ? 0.91 : 0.15));
        });
      } catch(e) {}
    }

    // ── Background music, ducking & sound toggle ───────────────────────────
    function startBgMusic() {
      if (bgAudio) return;
      bgAudio        = new Audio("/music/background.mp3");
      bgAudio.loop   = true;
      bgAudio.volume = bgMusicVolume;
      bgAudio.muted  = !soundEnabled;
      bgAudio.play().catch(() => {});
    }

    function playSectorCompleteVoice() {
      if (!soundEnabled) return;
      if (!sectorCompleteAudio) sectorCompleteAudio = new Audio("/sounds/sector-complete.mp3");
      sectorCompleteAudio.currentTime = 0;
      sectorCompleteAudio.play().catch(() => {});
    }

    function duckMusic() {
      bgMusicVolume = 0.1;
      if (bgAudio) bgAudio.volume = bgMusicVolume;
    }

    function unduckMusic() {
      bgMusicVolume = 0.3;
      if (bgAudio) bgAudio.volume = bgMusicVolume;
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      if (bgAudio) bgAudio.muted = !soundEnabled;
    }

    function drawSoundBtn(x, y, w, h) {
      ctx.save();
      ctx.fillStyle   = soundEnabled ? "rgba(0,255,160,0.06)" : "rgba(255,48,96,0.07)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = soundEnabled ? "rgba(0,204,122,0.45)" : "rgba(255,48,96,0.55)";
      ctx.lineWidth   = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle   = soundEnabled ? DIM : RED;
      ctx.font        = "bold 12px monospace";
      ctx.textAlign   = "center";
      ctx.shadowBlur  = 0;
      ctx.fillText(soundEnabled ? "♪  ON" : "✕  OFF", x + w / 2, y + h / 2 + 4);
      ctx.restore();
    }

    // ── Input ──────────────────────────────────────────────────────────────
    const keys = keysRef.current;
    const onDown  = e => { keys[e.key] = true; };
    const onUp    = e => { keys[e.key] = false; };
    const onR     = e => {
      if ((e.key === "r" || e.key === "R") && phase !== "playing" && phase !== "title"
          && !(phase === "nameEntry" && nameEntry.mode === "typing")) {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        restart();
      }
    };
    const onEnter = e => {
      if (e.key !== "Enter") return;
      if (phase === "title") {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        startBgMusic();
        phase = "playing"; lastTick = performance.now(); gameStartTime = performance.now();
      } else if (phase === "sectorComplete") { enterSector(sectorIdx + 1); phase = "playing"; }
        else if (phase === "continue")       { useContinue(); }
    };
    const onNameKey = (e) => {
      if (phase !== "nameEntry") return;
      if (nameEntry.mode === "choose") {
        if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") nameEntry.selection = 0;
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") nameEntry.selection = 1;
        if (e.key === "Tab") { e.preventDefault(); nameEntry.selection = 1 - nameEntry.selection; }
        if (e.key === "Enter") {
          if (nameEntry.selection === 0) {
            submitScore(generateCyberpunkId()); phase = "leaderboard";
          } else {
            nameEntry.mode = "typing"; nameEntry.input = ""; hiddenInput.value = ""; hiddenInput.focus();
          }
        }
      } else if (nameEntry.mode === "typing") {
        if (e.key === "Backspace") {
          e.preventDefault();
          nameEntry.input = nameEntry.input.slice(0, -1); hiddenInput.value = nameEntry.input;
        } else if (e.key === "Enter") {
          submitManual();
        } else if (/^[A-Za-z0-9]$/.test(e.key) && nameEntry.input.length < 6) {
          e.preventDefault();
          nameEntry.input += e.key.toUpperCase(); hiddenInput.value = nameEntry.input;
        }
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    window.addEventListener("keydown", onR);
    window.addEventListener("keydown", onEnter);
    window.addEventListener("keydown", onNameKey);

    // ── Geometry helpers ───────────────────────────────────────────────────
    function overlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x &&
             a.y < b.y + b.h && a.y + a.h > b.y;
    }
    function pRect() {
      return { x: player.x - P_SZ / 2, y: player.y - P_SZ / 2, w: P_SZ, h: P_SZ };
    }

    function buildWalls(idx) {
      const room  = rooms[idx];
      const exits = new Set(room.exits.map(e => e.side));
      const out   = [];
      const borders = [
        { side: "left",  bx: 0,        by: 0,        bw: WALL, bh: GH,   mid: MY, horiz: false },
        { side: "right", bx: W - WALL, by: 0,        bw: WALL, bh: GH,   mid: MY, horiz: false },
        { side: "up",    bx: 0,        by: 0,        bw: W,    bh: WALL, mid: MX, horiz: true  },
        { side: "down",  bx: 0,        by: GH-WALL,  bw: W,    bh: WALL, mid: MX, horiz: true  },
      ];
      for (const b of borders) {
        if (!exits.has(b.side)) {
          out.push({ x: b.bx, y: b.by, w: b.bw, h: b.bh });
        } else {
          const half = DOOR_W / 2;
          if (b.horiz) {
            out.push({ x: b.bx,        y: b.by, w: b.mid - half,     h: b.bh });
            out.push({ x: b.mid + half, y: b.by, w: W - b.mid - half, h: b.bh });
          } else {
            out.push({ x: b.bx, y: b.by,         w: b.bw, h: b.mid - half       });
            out.push({ x: b.bx, y: b.mid + half,  w: b.bw, h: GH - b.mid - half });
          }
        }
      }
      for (const [x, y, w, h] of room.innerWalls) out.push({ x, y, w, h });
      for (const mw of (roomStates[idx]?.movingWalls ?? [])) out.push({ x: mw.x, y: mw.y, w: mw.w, h: mw.h });
      return out;
    }

    function resolveWalls(walls) {
      for (let pass = 0; pass < 3; pass++) {
        for (const w of walls) {
          const pr = pRect();
          if (!overlap(pr, w)) continue;
          const oL = pr.x + pr.w - w.x;
          const oR = w.x + w.w  - pr.x;
          const oT = pr.y + pr.h - w.y;
          const oB = w.y + w.h  - pr.y;
          const mn = Math.min(oL, oR, oT, oB);
          if      (mn === oL) player.x -= oL;
          else if (mn === oR) player.x += oR;
          else if (mn === oT) player.y -= oT;
          else                player.y += oB;
        }
      }
    }

    function checkDoors() {
      const hw = DOOR_W / 2;
      for (const exit of rooms[roomIdx].exits) {
        const { side, toRoom } = exit;
        if (side === "right" && player.x > W - WALL - 3  && Math.abs(player.y - MY) < hw) { enterRoom(toRoom, "left");  return; }
        if (side === "left"  && player.x < WALL + 3      && Math.abs(player.y - MY) < hw) { enterRoom(toRoom, "right"); return; }
        if (side === "down"  && player.y > GH - WALL - 3 && Math.abs(player.x - MX) < hw) { enterRoom(toRoom, "up");    return; }
        if (side === "up"    && player.y < WALL + 3      && Math.abs(player.x - MX) < hw) { enterRoom(toRoom, "down");  return; }
      }
    }

    function enterRoom(idx, fromSide) {
      roomIdx = idx;
      if (fromSide === "left")  { player.x = WALL + P_SZ;      player.y = MY; }
      if (fromSide === "right") { player.x = W - WALL - P_SZ;  player.y = MY; }
      if (fromSide === "up")    { player.x = MX; player.y = WALL + P_SZ; }
      if (fromSide === "down")  { player.x = MX; player.y = GH - WALL - P_SZ; }
      lastHitTime          = performance.now();
      touchingLaserIndices = new Set();
      if (daemon.active) {
        daemon.x = WALL + 8;
        daemon.y = WALL + 8;
      }
    }

    // ── Update ─────────────────────────────────────────────────────────────
    function triggerGameOver() {
      if (sectorIdx === 2) {
        if (!checkpoint) checkpoint = { score, lives };
        if (!checkpoint.used) {
          phase = "continue"; continueCountdown = 10; continueLastTick = performance.now();
          return;
        }
      }
      phase = "gameover";
    }

    function useContinue() {
      checkpoint.used = true;
      lives = 3;
      const [s3Start, s3End] = SECTOR_RANGES[2];
      const s3HeartRoom = s3Start + Math.floor(Math.random() * 3);
      for (let i = s3Start; i < s3End; i++) {
        roomStates[i] = {
          enemies:     rooms[i].enemyDefs.map(e => ({ x: e.x, y: e.y, speed: e.speed, vx: 0, vy: 0, wanderTimer: 0, lastX: e.x, lastY: e.y, stuckCount: 0 })),
          treasures:   rooms[i].treasureDefs.map(t => ({ ...t, collected: false })),
          movingWalls: (rooms[i].movingWallDefs ?? []).map(mw => ({ ...mw, dir: 1 })),
          heart:       (i === s3HeartRoom) ? pickHeartPos(rooms[i]) : null,
        };
      }
      enterSector(2);
      phase = "playing";
    }

    function update() {
      if (phase === "continue") {
        const now = performance.now();
        if (now - continueLastTick >= 1000) {
          continueLastTick = now;
          if (--continueCountdown <= 0) phase = "gameover";
        }
        return;
      }
      if (phase === "nameEntry") {
        if (nameEntry.errorTimer > 0) nameEntry.errorTimer--;
        return;
      }
      if (phase !== "playing") return;

      const now = performance.now();
      if (now - lastTick >= 1000) {
        lastTick = now;
        if (timer > 0) timer--;
        if (timer > 0 && timer <= 15 && !daemon.active) sndWarnPulse();
        if (timer === 0 && !daemon.active) {
          daemon.active   = true;
          daemon.x        = WALL + 8;
          daemon.y        = WALL + 8;
          daemon.spawnAge = 0;
          sndDaemonSpawn();
        }
      }

      let mx = 0, my = 0;
      if (keys["ArrowLeft"]  || keys["a"] || keys["A"]) mx -= 1;
      if (keys["ArrowRight"] || keys["d"] || keys["D"]) mx += 1;
      if (keys["ArrowUp"]    || keys["w"] || keys["W"]) my -= 1;
      if (keys["ArrowDown"]  || keys["s"] || keys["S"]) my += 1;
      if (mx !== 0 && my !== 0) { mx *= 0.7071; my *= 0.7071; }
      const desktopScale    = isMobile ? 1.0 : canvas.clientWidth / 320;
      const playerSpeedMult = isMobile ? 1.0 : 0.8;
      const enemySpeedMult  = isMobile ? P_SPEED * 0.8 : 0.8;
      player.x += mx * P_SPEED * playerSpeedMult / desktopScale;
      player.y += my * P_SPEED * playerSpeedMult / desktopScale;

      const walls = buildWalls(roomIdx);
      resolveWalls(walls);
      checkDoors();

      const rs = roomStates[roomIdx];
      for (const e of rs.enemies) {
        if (--e.wanderTimer <= 0) {
          const ang = Math.random() * Math.PI * 2;
          e.vx = Math.cos(ang) * e.speed * enemySpeedMult;
          e.vy = Math.sin(ang) * e.speed * enemySpeedMult;
          e.wanderTimer = 60 + Math.floor(Math.random() * 120);
        }
        const nx = e.x + e.vx, ny = e.y + e.vy;
        const eRect = { x: nx - E_SZ/2, y: ny - E_SZ/2, w: E_SZ, h: E_SZ };
        let blocked = false;
        for (const w of walls) { if (overlap(eRect, w)) { blocked = true; break; } }
        if (blocked) {
          const ang = Math.random() * Math.PI * 2;
          e.vx = Math.cos(ang) * e.speed * enemySpeedMult;
          e.vy = Math.sin(ang) * e.speed * enemySpeedMult;
          e.wanderTimer = 60 + Math.floor(Math.random() * 120);
        } else { e.x = nx; e.y = ny; }
        e.stuckCount++;
        if (e.stuckCount >= 120) {
          const moved = Math.sqrt((e.x - e.lastX) ** 2 + (e.y - e.lastY) ** 2);
          if (moved < 5) {
            e.x = W / 2 + (Math.random() - 0.5) * 220;
            e.y = GH / 2 + (Math.random() - 0.5) * 160;
            e.x = Math.max(WALL + E_SZ + 10, Math.min(W - WALL - E_SZ - 10, e.x));
            e.y = Math.max(WALL + E_SZ + 10, Math.min(GH - WALL - E_SZ - 10, e.y));
            e.vx = 0; e.vy = 0; e.wanderTimer = 0;
          }
          e.lastX = e.x; e.lastY = e.y; e.stuckCount = 0;
        }
      }
      for (const mw of rs.movingWalls) {
        if (mw.axis === "x") {
          mw.x += mw.speed * mw.dir;
          if (mw.x >= mw.max || mw.x <= mw.min) { mw.dir *= -1; mw.x = Math.max(mw.min, Math.min(mw.max, mw.x)); }
        } else {
          mw.y += mw.speed * mw.dir;
          if (mw.y >= mw.max || mw.y <= mw.min) { mw.dir *= -1; mw.y = Math.max(mw.min, Math.min(mw.max, mw.y)); }
        }
      }

      {
        const nowMs = performance.now();
        const isInvincible = nowMs - lastHitTime < 2000;
        const pr = pRect();
        let hit = false;

        if (!isInvincible) {
          for (const e of rs.enemies) {
            if (overlap(pr, { x: e.x - E_SZ/2, y: e.y - E_SZ/2, w: E_SZ, h: E_SZ })) {
              hit = true; break;
            }
          }
        }

        const tSec = nowMs / 1000;
        const lasers = rooms[roomIdx].lasers ?? [];
        for (let li = 0; li < lasers.length; li++) {
          const L = lasers[li];
          const laserOn = L.on ?? LASER_ON, laserPer = L.period ?? LASER_PERIOD;
          const on = ((tSec + L.phase) % laserPer) < laserOn;
          const horiz = L.y1 === L.y2;
          const lr = horiz
            ? { x: L.x1, y: L.y1 - 3, w: L.x2 - L.x1, h: 6 }
            : { x: L.x1 - 3, y: L.y1, w: 6, h: L.y2 - L.y1 };
          if (on && overlap(pr, lr)) {
            if (!touchingLaserIndices.has(li)) {
              touchingLaserIndices.add(li);
              if (!isInvincible) hit = true;
            }
          } else {
            touchingLaserIndices.delete(li);
          }
        }

        if (hit) {
          lives--;
          lastHitTime = nowMs;
          shakeFrames = 14;
          sndDeath();
          if (lives <= 0) { triggerGameOver(); return; }
        }
      }

      const pr = pRect();
      let gotLoot = false;
      for (const t of rs.treasures) {
        if (t.collected) continue;
        if (overlap(pr, { x: t.x - T_SZ, y: t.y - T_SZ, w: T_SZ * 2, h: T_SZ * 2 })) {
          t.collected = true;
          score += 10;
          gotLoot = true;
          sndLoot();
        }
      }

      // Check sector / room complete
      if (gotLoot) {
        const roomSector = SECTOR_RANGES.findIndex(([s, e]) => roomIdx >= s && roomIdx < e);
        sectorIdx = roomSector;
        const [sStart, sEnd] = SECTOR_RANGES[roomSector];
        if (roomStates.slice(sStart, sEnd).every(s => s.treasures.every(t => t.collected))) {
          score += 100;
          if (roomSector === 2) {
            score += 500;
            score += lives * 100;
            completionTime = Math.round((performance.now() - gameStartTime) / 1000);
            platformKey    = canvas.clientWidth <= 500 ? LB_KEY_MOBILE : LB_KEY_DESKTOP;
            nameEntry.mode = "choose"; nameEntry.selection = 0;
            nameEntry.input = ""; nameEntry.error = ""; nameEntry.errorTimer = 0;
            phase = "nameEntry"; sndWinFanfare();
          }
          else                 { phase = "sectorComplete"; sndSectorFanfare(); duckMusic(); playSectorCompleteVoice(); }
          return;
        }
        if (rs.treasures.every(t => t.collected)) sndRoomClear();
      }

      // Heart pickup
      if (rs.heart && !rs.heart.collected) {
        if (overlap(pr, { x: rs.heart.x - 14, y: rs.heart.y - 14, w: 28, h: 28 })) {
          rs.heart.collected = true;
          sndHeart();
          if (lives < 3) {
            lives++;
            flashMsg = "LIFE  RESTORED";
          } else {
            score += 100;
            flashMsg = "BONUS  +100";
          }
          flashFrames = 150;
        }
      }
      if (flashFrames > 0) flashFrames--;

      if (daemon.active) {
        if (daemon.spawnAge < 240) daemon.spawnAge++;
        const dx = player.x - daemon.x;
        const dy = player.y - daemon.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        daemon.x += (dx / dist) * daemon.speed * playerSpeedMult / desktopScale;
        daemon.y += (dy / dist) * daemon.speed * playerSpeedMult / desktopScale;
        if (performance.now() - lastHitTime >= 2000 && overlap(pRect(), { x: daemon.x - D_SZ/2, y: daemon.y - D_SZ/2, w: D_SZ, h: D_SZ })) {
          sndDeath(); shakeFrames = 22;
          triggerGameOver();
        }
      }
    }

    // ── Title screen ───────────────────────────────────────────────────────
    function drawTitle(t) {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = "rgba(0,255,160,0.012)";
        ctx.fillRect(0, y, W, 1);
      }
      ctx.textAlign = "center";
      ctx.fillStyle = DIM;
      ctx.font = "14px monospace";
      ctx.letterSpacing = "4px";
      ctx.fillText("3DZLABS PRESENTS", W / 2, 148);
      ctx.letterSpacing = "0px";
      const art = [
        " ██████╗  █████╗ ███████╗███╗   ███╗ ██████╗ ███╗   ██╗",
        " ██╔══██╗██╔══██╗██╔════╝████╗ ████║██╔═══██╗████╗  ██║",
        " ██║  ██║███████║█████╗  ██╔████╔██║██║   ██║██╔██╗ ██║",
        " ██║  ██║██╔══██║██╔══╝  ██║╚██╔╝██║██║   ██║██║╚██╗██║",
        " ██████╔╝██║  ██║███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║",
        " ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝",
      ];
      ctx.font = "14px monospace";
      ctx.fillStyle = GREEN;
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = 10;
      for (let i = 0; i < art.length; i++) ctx.fillText(art[i], W / 2, 210 + i * 24);
      ctx.shadowBlur = 0;
      if (Math.floor(t / 520) % 2) {
        ctx.fillStyle = GREEN;
        ctx.font = "17px monospace";
        ctx.shadowColor = GREEN;
        ctx.shadowBlur = 8;
        ctx.fillText("TAP  ·  PRESS ENTER  ·  TO START", W / 2, 395);
        ctx.shadowBlur = 0;
      }
      drawSoundBtn(16, H - 48, 96, 26);
      ctx.textAlign = "left";
      ctx.shadowColor = "transparent";
    }

    // ── Sector complete screen ─────────────────────────────────────────────
    function drawSectorComplete(t) {
      ctx.fillStyle = "rgba(3,5,15,0.92)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";

      ctx.fillStyle  = GREEN;
      ctx.font       = "bold 40px monospace";
      ctx.shadowColor = GREEN;
      ctx.shadowBlur  = 28;
      ctx.fillText("SECTOR COMPLETE", W / 2, H / 2 - 70);
      ctx.shadowBlur = 0;

      ctx.fillStyle = DIM;
      ctx.font = "14px monospace";
      ctx.fillText(`SECTOR ${sectorIdx + 1} CLEARED  ·  +100 BONUS`, W / 2, H / 2 - 20);
      ctx.fillText(`SCORE  ${String(score).padStart(6, "0")}`, W / 2, H / 2 + 14);

      ctx.fillStyle = "#00cc7a88";
      ctx.font = "11px monospace";
      ctx.fillText(
        `NEXT: SECTOR ${sectorIdx + 2}  ·  ${SECTOR_TIMERS[sectorIdx + 1]}s TIMER  ·  ${sectorIdx + 1 === 1 ? "MEDIUM" : "HARD"} DIFFICULTY`,
        W / 2, H / 2 + 50
      );

      if (Math.floor(t / 520) % 2) {
        ctx.fillStyle = GREEN;
        ctx.font = "13px monospace";
        ctx.shadowColor = GREEN;
        ctx.shadowBlur = 8;
        ctx.fillText("TAP  ·  PRESS ENTER  ·  TO CONTINUE", W / 2, H / 2 + 90);
        ctx.shadowBlur = 0;
      }

      ctx.textAlign = "left";
      ctx.shadowColor = "transparent";
    }

    // ── Draw ───────────────────────────────────────────────────────────────
    function draw() {
      const t = Date.now();

      if (phase === "title")           { drawTitle(t); return; }
      if (phase === "sectorComplete")  { drawSectorComplete(t); return; }
      if (phase === "continue")        { drawContinue(t); return; }
      if (phase === "nameEntry")       { drawNameEntry(t); return; }
      if (phase === "leaderboard")     { drawLeaderboard(t); return; }

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      drawHUD(t);

      ctx.save();
      ctx.translate(0, HUD_H);
      if (shakeFrames > 0) {
        ctx.translate(
          (Math.random() - 0.5) * shakeFrames * 0.4,
          (Math.random() - 0.5) * shakeFrames * 0.4
        );
        shakeFrames--;
      }

      ctx.fillStyle = SURFACE;
      ctx.fillRect(-12, -12, W + 24, GH + 24);

      for (let y = 0; y < GH; y += 3) {
        ctx.fillStyle = "rgba(0,255,160,0.016)";
        ctx.fillRect(0, y, W, 1);
      }

      drawRoom(t);
      drawLasers(t);
      drawTreasures(t);
      drawHearts(t);
      drawEnemies(t);
      if (daemon.active) drawDaemon(t);
      drawPlayer(t);
      if (flashFrames > 0) drawFlashMsg();
      if (phase === "playing") drawControlsLegend();

      ctx.restore();

      const warnAt = Math.ceil(SECTOR_TIMERS[sectorIdx] * 0.4);
      if (timer > 0 && timer <= warnAt && !daemon.active) drawWarning(t);
      if (phase === "gameover") drawOverlay("GAME OVER", RED, `SCORE  ${String(score).padStart(6,"0")}`, "TAP  ·  [R]  TO RESTART");
    }

    // ── HUD ─────────────────────────────────────────────────────────────────
    function drawHUD(t) {
      ctx.fillStyle = "#0a1a0e";
      ctx.fillRect(0, 0, W, HUD_H);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, HUD_H - 1);

      ctx.strokeStyle = "rgba(0,255,160,0.18)";
      [W/2 - 115, W/2 + 105].forEach(lx => {
        ctx.beginPath(); ctx.moveTo(lx, 10); ctx.lineTo(lx, HUD_H - 10); ctx.stroke();
      });

      const rs  = roomStates[roomIdx];
      const col = rs.treasures.filter(x => x.collected).length;
      const tot = rs.treasures.length;
      const warnAt = Math.ceil(SECTOR_TIMERS[sectorIdx] * 0.4);
      const timerColor = (timer <= warnAt && Math.floor(t / 350) % 2) ? RED : (timer <= warnAt ? "#ff8040" : GREEN);

      ctx.font = "bold 18px monospace";
      ctx.textAlign = "left";

      ctx.fillStyle = GREEN;
      ctx.fillText(`SCORE  ${String(score).padStart(6, "0")}`, 16, 24);
      ctx.fillStyle = lives <= 1 ? RED : GREEN;
      ctx.fillText(`LIVES  ${"♥".repeat(lives)}${"♡".repeat(Math.max(0, 3 - lives))}`, 16, 46);

      ctx.textAlign = "center";
      ctx.fillStyle = timerColor;
      ctx.fillText(`TIME  ${String(timer).padStart(3, "0")}s`, W / 2, 24);
      ctx.fillStyle = col === tot ? GREEN : DIM;
      ctx.fillText(`LOOT  ${col} / ${tot}`, W / 2, 46);

      const localRoom = roomIdx - SECTOR_RANGES[sectorIdx][0];
      ctx.textAlign = "right";
      ctx.fillStyle = DIM;
      ctx.fillText(rooms[roomIdx].name, W - 16, 24);
      ctx.fillStyle = GREEN;
      ctx.fillText(`SEC ${sectorIdx + 1}/3  RM ${localRoom + 1}/3`, W - 16, 46);

      drawSoundBtn(512, 12, 80, 36);
      ctx.textAlign = "left";
    }

    // ── Room ────────────────────────────────────────────────────────────────
    function drawRoom(t) {
      const walls = buildWalls(roomIdx);
      const room  = rooms[roomIdx];

      ctx.strokeStyle = "rgba(0,255,160,0.05)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GH); ctx.stroke(); }
      for (let y = 0; y < GH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      for (const w of walls) {
        ctx.fillStyle = "#0d2619";
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = "rgba(0,255,160,0.10)";
        ctx.lineWidth = 0.5;
        const steps = Math.min(Math.max(w.w, w.h), 80);
        for (let i = 0; i < steps; i += 8) {
          ctx.beginPath();
          ctx.moveTo(w.x + Math.min(i, w.w - 1), w.y);
          ctx.lineTo(w.x, w.y + Math.min(i, w.h - 1));
          ctx.stroke();
        }
      }

      for (const mw of roomStates[roomIdx].movingWalls) {
        ctx.fillStyle = "#1f1a06";
        ctx.fillRect(mw.x, mw.y, mw.w, mw.h);
        ctx.strokeStyle = "#ff8030";
        ctx.lineWidth = 1;
        ctx.strokeRect(mw.x, mw.y, mw.w, mw.h);
        ctx.shadowColor = "#ff8030";
        ctx.shadowBlur = 6;
        ctx.strokeRect(mw.x, mw.y, mw.w, mw.h);
        ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
      }

      const pulse = Math.sin(t / 600) * 0.12 + 0.18;
      for (const exit of room.exits) {
        let dx, dy, dw, dh;
        if (exit.side === "left")  { dx = 0;           dy = MY - DOOR_W/2; dw = WALL;   dh = DOOR_W; }
        if (exit.side === "right") { dx = W - WALL;    dy = MY - DOOR_W/2; dw = WALL;   dh = DOOR_W; }
        if (exit.side === "up")    { dx = MX-DOOR_W/2; dy = 0;             dw = DOOR_W; dh = WALL;   }
        if (exit.side === "down")  { dx = MX-DOOR_W/2; dy = GH - WALL;     dw = DOOR_W; dh = WALL;   }
        ctx.fillStyle = `rgba(0,255,160,${pulse})`;
        ctx.fillRect(dx, dy, dw, dh);
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(dx, dy, dw, dh);
        ctx.setLineDash([]);
        ctx.fillStyle = GREEN;
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        const arrows = { left: "◄", right: "►", up: "▲", down: "▼" };
        ctx.fillText(arrows[exit.side], dx + dw / 2, dy + dh / 2 + 4);
        ctx.textAlign = "left";
      }
    }

    // ── Lasers ──────────────────────────────────────────────────────────────
    function drawLasers(t) {
      const tSec = performance.now() / 1000;
      for (const L of (rooms[roomIdx].lasers ?? [])) {
        const laserOn = L.on ?? LASER_ON, laserPer = L.period ?? LASER_PERIOD;
        const on = ((tSec + L.phase) % laserPer) < laserOn;
        const pulse = Math.sin(t / 180) * 0.3 + 0.7;
        ctx.save();
        if (on) {
          ctx.shadowColor = RED;
          ctx.shadowBlur  = 18 + pulse * 12;
          ctx.strokeStyle = `rgba(255,30,60,${0.7 + pulse * 0.3})`;
          ctx.lineWidth   = 3;
          ctx.beginPath();
          ctx.moveTo(L.x1, L.y1);
          ctx.lineTo(L.x2, L.y2);
          ctx.stroke();
          ctx.shadowBlur  = 4;
          ctx.strokeStyle = "#ffcccc";
          ctx.lineWidth   = 1;
          ctx.beginPath();
          ctx.moveTo(L.x1, L.y1);
          ctx.lineTo(L.x2, L.y2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = "rgba(255,30,60,0.15)";
          ctx.lineWidth   = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(L.x1, L.y1);
          ctx.lineTo(L.x2, L.y2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
        const ea = on ? 1 : 0.3;
        ctx.shadowColor = on ? RED : "transparent";
        ctx.shadowBlur  = on ? 8 : 0;
        ctx.fillStyle   = `rgba(255,30,60,${ea})`;
        ctx.fillRect(L.x1 - 3, L.y1 - 3, 6, 6);
        ctx.fillRect(L.x2 - 3, L.y2 - 3, 6, 6);
        ctx.shadowBlur  = 0;
        ctx.shadowColor = "transparent";
      }
    }

    // ── Treasures ───────────────────────────────────────────────────────────
    function drawTreasures(t) {
      for (const tr of roomStates[roomIdx].treasures) {
        if (tr.collected) continue;
        const pulse = Math.sin(t / 380) * 0.3 + 0.7;
        ctx.shadowColor = GREEN;
        ctx.shadowBlur  = 10 * pulse;
        ctx.fillStyle   = `rgba(0,255,160,${pulse * 0.55})`;
        ctx.strokeStyle = GREEN;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(tr.x,        tr.y - T_SZ);
        ctx.lineTo(tr.x + T_SZ, tr.y);
        ctx.lineTo(tr.x,        tr.y + T_SZ);
        ctx.lineTo(tr.x - T_SZ, tr.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(tr.x - 1, tr.y - 1, 3, 3);
      }
      ctx.shadowColor = "transparent";
    }

    // ── Enemies ─────────────────────────────────────────────────────────────
    function drawEnemies(t) {
      for (const e of roomStates[roomIdx].enemies) {
        const s = E_SZ / 2;
        ctx.strokeStyle = "#ff3060";
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(e.x - s, e.y - s, E_SZ, E_SZ);
        ctx.beginPath();
        ctx.moveTo(e.x - s + 4, e.y - s + 4); ctx.lineTo(e.x + s - 4, e.y + s - 4);
        ctx.moveTo(e.x + s - 4, e.y - s + 4); ctx.lineTo(e.x - s + 4, e.y + s - 4);
        ctx.stroke();
        ctx.fillStyle = "#ff3060";
        ctx.fillRect(e.x - 5, e.y - 4, 3, 3);
        ctx.fillRect(e.x + 2, e.y - 4, 3, 3);
        const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy) || 1;
        ctx.fillRect(e.x + (e.vx / spd) * (s + 4) - 1, e.y + (e.vy / spd) * (s + 4) - 1, 2, 2);
      }
    }

    // ── Daemon skull ────────────────────────────────────────────────────────
    function drawDaemon(t) {
      // Ease-out cubic spawn growth over first 55 frames
      const sp = Math.min(daemon.spawnAge / 55, 1);
      const sc = 1 - Math.pow(1 - sp, 3);
      if (sc < 0.01) return;

      const cx = daemon.x;
      const cy = daemon.y;
      const r  = 28;
      const pulse   = Math.sin(t / 220) * 0.5 + 0.5;
      const breathe = 1 + pulse * 0.04;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc * breathe, sc * breathe);

      // ── Cranium ─────────────────────────────────────────────────────────
      ctx.shadowColor = "#ff0030";
      ctx.shadowBlur  = 28 + pulse * 22;
      ctx.fillStyle   = `rgb(${Math.floor(215 + pulse * 40)},${Math.floor(pulse * 28)},38)`;
      ctx.beginPath();
      ctx.moveTo(-r * 0.68,  r * 0.18);
      ctx.quadraticCurveTo(-r * 0.98, -r * 0.12, -r * 0.74, -r * 0.70);
      ctx.quadraticCurveTo(-r * 0.30, -r * 1.10,         0, -r * 1.10);
      ctx.quadraticCurveTo( r * 0.30, -r * 1.10,  r * 0.74, -r * 0.70);
      ctx.quadraticCurveTo( r * 0.98, -r * 0.12,  r * 0.68,  r * 0.18);
      ctx.lineTo( r * 0.52,  r * 0.18);
      ctx.lineTo( r * 0.50,  r * 0.60);
      ctx.lineTo(-r * 0.50,  r * 0.60);
      ctx.lineTo(-r * 0.52,  r * 0.18);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(255,${Math.floor(55 + pulse * 65)},55,0.88)`;
      ctx.lineWidth   = 1.8;
      ctx.stroke();

      // ── Eye sockets ─────────────────────────────────────────────────────
      ctx.shadowBlur  = 0;
      const eyeY = -r * 0.26;
      const eRX  =  r * 0.235;
      const eRY  =  r * 0.285;

      ctx.fillStyle = "#020408";
      ctx.beginPath();
      ctx.ellipse(-r * 0.335, eyeY, eRX, eRY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse( r * 0.335, eyeY, eRX, eRY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ember glow rings
      ctx.strokeStyle = `rgba(255,55,55,${0.28 + pulse * 0.52})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(-r * 0.335, eyeY, eRX * 0.55, eRY * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse( r * 0.335, eyeY, eRX * 0.55, eRY * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Burning cores
      ctx.fillStyle = `rgba(255,85,35,${0.45 + pulse * 0.55})`;
      ctx.beginPath();
      ctx.ellipse(-r * 0.335, eyeY, eRX * 0.22, eRY * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse( r * 0.335, eyeY, eRX * 0.22, eRY * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Nose cavity ─────────────────────────────────────────────────────
      ctx.fillStyle = "#020408";
      ctx.beginPath();
      ctx.moveTo(        0,  r * 0.01);
      ctx.lineTo(-r * 0.13,  r * 0.19);
      ctx.lineTo( r * 0.13,  r * 0.19);
      ctx.closePath();
      ctx.fill();

      // ── Mouth line ──────────────────────────────────────────────────────
      ctx.strokeStyle = "#010306";
      ctx.lineWidth   = 2.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.50, r * 0.19);
      ctx.lineTo( r * 0.50, r * 0.19);
      ctx.stroke();

      // ── Teeth (4 downward triangles) ────────────────────────────────────
      const tTY = r * 0.20;
      const tBY = r * 0.53;
      const tHW = r * 0.10;
      const tXs = [-r * 0.35, -r * 0.12, r * 0.12, r * 0.35];

      ctx.fillStyle = `rgba(255,${Math.floor(175 + pulse * 80)},110,0.94)`;
      for (const tx of tXs) {
        ctx.beginPath();
        ctx.moveTo(tx - tHW, tTY);
        ctx.lineTo(tx,       tBY);
        ctx.lineTo(tx + tHW, tTY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(80,0,0,0.65)";
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }

      // Tooth-gap cuts
      ctx.strokeStyle = "#010306";
      ctx.lineWidth   = 2;
      for (const gx of [-r * 0.235, 0, r * 0.235]) {
        ctx.beginPath();
        ctx.moveTo(gx, tTY);
        ctx.lineTo(gx, tBY * 0.80);
        ctx.stroke();
      }

      ctx.restore();
      ctx.shadowBlur  = 0;
      ctx.shadowColor = "transparent";

      // DAEMON label fades in after halfway through spawn
      if (sp > 0.5) {
        const a = Math.min(1, (sp - 0.5) * 2);
        ctx.shadowColor = "#ff0030";
        ctx.shadowBlur  = 7;
        ctx.fillStyle   = `rgba(255,0,55,${a * (0.65 + pulse * 0.35)})`;
        ctx.font        = "bold 9px monospace";
        ctx.textAlign   = "center";
        ctx.fillText("DAEMON", cx, cy - r * sc * breathe - 8);
        ctx.shadowBlur  = 0;
        ctx.shadowColor = "transparent";
        ctx.textAlign   = "left";
      }
    }

    // ── Player ──────────────────────────────────────────────────────────────
    function drawPlayer(t) {
      const timeSinceHit = performance.now() - lastHitTime;
      if (timeSinceHit < 2000 && Math.floor(timeSinceHit / 83) % 2 === 0) return;
      const s = P_SZ / 2;
      ctx.shadowColor = GREEN;
      ctx.shadowBlur  = 12;
      ctx.strokeStyle = GREEN;
      ctx.lineWidth   = 2;
      ctx.strokeRect(player.x - s, player.y - s, P_SZ, P_SZ);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - s);
      ctx.lineTo(player.x, player.y - s - 7);
      ctx.stroke();
      ctx.fillStyle = GREEN;
      ctx.fillRect(player.x - 2, player.y - s - 9, 4, 4);
      ctx.fillRect(player.x - 2, player.y - 2, 4, 4);
      ctx.shadowBlur  = 0;
      ctx.shadowColor = "transparent";
    }

    // ── Name entry screen ───────────────────────────────────────────────────
    function drawNameEntry(t) {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = "rgba(0,255,160,0.012)"; ctx.fillRect(0, y, W, 1);
      }
      ctx.textAlign = "center";

      ctx.font = "bold 36px monospace"; ctx.fillStyle = GREEN;
      ctx.shadowColor = GREEN; ctx.shadowBlur = 20;
      ctx.fillText("YOU  ESCAPED!", W / 2, 88);
      ctx.shadowBlur = 0;

      ctx.fillStyle = DIM; ctx.font = "13px monospace";
      ctx.letterSpacing = "4px";
      ctx.fillText("ENTER OPERATOR ID", W / 2, 122);
      ctx.letterSpacing = "0px";

      ctx.fillStyle = "rgba(0,255,160,0.5)"; ctx.font = "12px monospace";
      ctx.fillText(
        `SCORE  ${String(score).padStart(6,"0")}   ·   TIME  ${fmtTime(completionTime)}`,
        W / 2, 148
      );

      ctx.strokeStyle = "rgba(0,255,160,0.18)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(80, 164); ctx.lineTo(W - 80, 164); ctx.stroke();

      if (nameEntry.mode === "choose") {
        const btnW = 190, btnH = 78, btnY = H / 2 - 52;
        const autoX = W / 2 - 208, manX = W / 2 + 18;

        [[autoX, "AUTO", "RANDOM CALLSIGN", 0], [manX, "MANUAL", "TYPE YOUR ID", 1]].forEach(([bx, lbl, sub, idx]) => {
          const sel = nameEntry.selection === idx;
          ctx.fillStyle   = sel ? "rgba(0,255,160,0.13)" : "rgba(0,255,160,0.03)";
          ctx.fillRect(bx, btnY, btnW, btnH);
          ctx.strokeStyle = sel ? GREEN : "rgba(0,204,122,0.32)";
          ctx.lineWidth   = sel ? 2 : 1;
          if (sel) { ctx.shadowColor = GREEN; ctx.shadowBlur = 14; }
          ctx.strokeRect(bx, btnY, btnW, btnH);
          ctx.shadowBlur = 0; ctx.shadowColor = "transparent";

          ctx.fillStyle = sel ? GREEN : DIM;
          ctx.font      = "bold 19px monospace";
          ctx.fillText(lbl, bx + btnW / 2, btnY + 31);
          ctx.fillStyle = sel ? "rgba(0,255,160,0.55)" : "rgba(0,204,122,0.32)";
          ctx.font      = "10px monospace";
          ctx.fillText(sub, bx + btnW / 2, btnY + 55);
        });

        ctx.fillStyle = "rgba(0,204,122,0.42)"; ctx.font = "11px monospace";
        ctx.fillText("◄ ►  CHOOSE  ·  ENTER  TO CONFIRM", W / 2, H / 2 + 66);
      }

      if (nameEntry.mode === "typing") {
        const boxW = 300, boxH = 56, bx = W / 2 - 150, by = H / 2 - 48;

        ctx.fillStyle = "rgba(0,255,160,0.06)";
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = GREEN; ctx.lineWidth = 2;
        ctx.shadowColor = GREEN; ctx.shadowBlur = 12;
        ctx.strokeRect(bx, by, boxW, boxH);
        ctx.shadowBlur = 0; ctx.shadowColor = "transparent";

        const cur = Math.floor(t / 480) % 2 ? "█" : " ";
        ctx.fillStyle = GREEN; ctx.font = "bold 28px monospace";
        ctx.shadowColor = GREEN; ctx.shadowBlur = 8;
        ctx.fillText(nameEntry.input + cur, W / 2, by + 37);
        ctx.shadowBlur = 0; ctx.shadowColor = "transparent";

        ctx.fillStyle = "rgba(0,204,122,0.48)"; ctx.font = "10px monospace";
        ctx.fillText("A – Z  ·  0 – 9  ·  3 – 6 CHARACTERS", W / 2, by + 72);

        // CONFIRM button
        const cbW = 200, cbH = 36, cbX = W / 2 - 100, cbY = H / 2 + 22;
        ctx.fillStyle   = "rgba(0,255,160,0.09)";
        ctx.strokeStyle = "rgba(0,255,160,0.5)"; ctx.lineWidth = 1.5;
        ctx.fillRect(cbX, cbY, cbW, cbH);
        ctx.strokeRect(cbX, cbY, cbW, cbH);
        ctx.fillStyle = DIM; ctx.font = "12px monospace";
        ctx.fillText("CONFIRM  [ENTER]", W / 2, cbY + 24);

        if (nameEntry.errorTimer > 0) {
          const ea = Math.min(1, nameEntry.errorTimer / 40);
          ctx.fillStyle   = `rgba(255,48,96,${ea})`;
          ctx.font        = "bold 12px monospace";
          ctx.shadowColor = RED; ctx.shadowBlur = 10;
          ctx.fillText(nameEntry.error, W / 2, cbY + 62);
          ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
        }
      }

      ctx.textAlign = "left"; ctx.shadowColor = "transparent";
    }

    // ── Leaderboard screen ──────────────────────────────────────────────────
    function drawLeaderboard(t) {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = "rgba(0,255,160,0.012)"; ctx.fillRect(0, y, W, 1);
      }
      ctx.textAlign = "center";

      ctx.font = "bold 28px monospace"; ctx.fillStyle = GREEN;
      ctx.shadowColor = GREEN; ctx.shadowBlur = 18;
      ctx.fillText("HALL  OF  OPERATORS", W / 2, 44);
      ctx.shadowBlur = 0;

      ctx.font = "11px monospace";
      ctx.fillStyle = platformKey === LB_KEY_DESKTOP ? "#60c0ff" : "#ff80c0";
      ctx.fillText(platformKey === LB_KEY_DESKTOP ? "— DESKTOP RANKINGS —" : "— MOBILE RANKINGS —", W / 2, 62);

      ctx.strokeStyle = "rgba(0,255,160,0.28)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, 74); ctx.lineTo(W - 60, 74); ctx.stroke();

      const lb = loadLeaderboard(platformKey);

      if (lb.length === 0) {
        ctx.fillStyle = DIM; ctx.font = "14px monospace";
        ctx.fillText("— NO RECORDS —", W / 2, H / 2);
      } else {
        const cols = { rnk: 62, id: 120, score: 352, time: 480, date: 578 };
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(0,204,122,0.42)"; ctx.font = "10px monospace";
        ctx.fillText("RNK",      cols.rnk,   98);
        ctx.fillText("OPERATOR", cols.id,    98);
        ctx.fillText("SCORE",    cols.score, 98);
        ctx.fillText("TIME",     cols.time,  98);
        ctx.fillText("DATE",     cols.date,  98);
        ctx.strokeStyle = "rgba(0,255,160,0.12)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(60, 105); ctx.lineTo(W - 60, 105); ctx.stroke();

        let highlighted = false;
        for (let i = 0; i < Math.min(lb.length, 10); i++) {
          const e   = lb[i];
          const ry  = 126 + i * 36;
          const isNew = !highlighted && e.id === lastSubmittedId && e.score === lastSubmittedScore;
          if (isNew) highlighted = true;

          if (isNew) {
            ctx.fillStyle = "rgba(255,220,80,0.08)";
            ctx.fillRect(58, ry - 14, W - 116, 22);
          }

          ctx.fillStyle = isNew
            ? "rgba(255,220,80,0.95)"
            : i === 0 ? GREEN : `rgba(0,204,122,${0.9 - i * 0.05})`;
          if (isNew || i === 0) { ctx.shadowColor = isNew ? "#ffdc50" : GREEN; ctx.shadowBlur = 8; }
          ctx.font = i < 3 ? "bold 14px monospace" : "13px monospace";

          ctx.fillText(`${String(i + 1).padStart(2,"0")}`,     cols.rnk,   ry);
          ctx.fillText(e.id.slice(0,8).padEnd(8),              cols.id,    ry);
          ctx.fillText(String(e.score).padStart(6,"0"),        cols.score, ry);
          ctx.fillText(fmtTime(e.time ?? 0),                   cols.time,  ry);
          ctx.fillText(e.date ?? "",                           cols.date,  ry);
          ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
        }
      }

      ctx.textAlign = "center";
      if (Math.floor(t / 520) % 2) {
        ctx.fillStyle = DIM; ctx.font = "12px monospace";
        ctx.shadowColor = GREEN; ctx.shadowBlur = 5;
        ctx.fillText("TAP  ·  [R]  TO PLAY AGAIN", W / 2, H - 34);
        ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
      }
      ctx.textAlign = "left"; ctx.shadowColor = "transparent";
    }

    // ── Heart pickups ───────────────────────────────────────────────────────
    function drawHearts(t) {
      const rs = roomStates[roomIdx];
      if (!rs.heart || rs.heart.collected) return;
      const pulse = Math.sin(t / 400) * 0.4 + 0.6;
      const s = 11;
      const { x, y } = rs.heart;
      const oy = y - s * 0.25;

      function heartPath() {
        ctx.beginPath();
        ctx.moveTo(x, oy + s);
        ctx.bezierCurveTo(x - s * 2, oy + s * 0.5, x - s, oy - s * 0.8, x, oy - s * 0.4);
        ctx.bezierCurveTo(x + s, oy - s * 0.8, x + s * 2, oy + s * 0.5, x, oy + s);
        ctx.closePath();
      }

      ctx.save();
      ctx.shadowColor = "#ff4080";
      ctx.shadowBlur  = 18 + pulse * 12;
      ctx.fillStyle   = `rgba(255,60,110,${0.65 + pulse * 0.35})`;
      heartPath(); ctx.fill();
      ctx.shadowBlur  = 4;
      ctx.strokeStyle = `rgba(255,185,215,${0.7 + pulse * 0.3})`;
      ctx.lineWidth   = 1.5;
      heartPath(); ctx.stroke();
      ctx.shadowBlur  = 0;
      ctx.shadowColor = "transparent";
      ctx.restore();
    }

    // ── Flash message (LIFE RESTORED / BONUS +100) ──────────────────────────
    function drawFlashMsg() {
      const a = flashFrames <= 40 ? flashFrames / 40 : 1;
      ctx.save();
      ctx.textAlign   = "center";
      ctx.font        = "bold 22px monospace";
      ctx.shadowColor = "#ff69b4";
      ctx.shadowBlur  = 22;
      ctx.fillStyle   = `rgba(255,140,200,${a})`;
      ctx.fillText(flashMsg, W / 2, GH / 2 - 60);
      ctx.shadowBlur  = 0;
      ctx.shadowColor = "transparent";
      ctx.textAlign   = "left";
      ctx.restore();
    }

    // ── Desktop controls legend ─────────────────────────────────────────────
    function drawControlsLegend() {
      if (canvas.clientWidth <= 500) return;
      const x = W - 14;
      const y = GH - 14;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.textAlign   = "right";
      ctx.font        = "10px monospace";
      ctx.fillStyle   = GREEN;
      ctx.fillText("WASD  ·  ARROW KEYS", x, y - 14);
      ctx.fillText("MOVE", x, y);
      ctx.restore();
    }

    // ── Warning flash ───────────────────────────────────────────────────────
    function drawWarning(t) {
      if (Math.floor(t / 420) % 2) return;
      ctx.save();
      ctx.translate(0, HUD_H);
      ctx.strokeStyle = RED;
      ctx.lineWidth   = 3;
      ctx.strokeRect(2, 2, W - 4, GH - 4);
      ctx.fillStyle = "rgba(255,48,96,0.05)";
      ctx.fillRect(0, 0, W, GH);
      ctx.fillStyle = RED;
      ctx.font = "bold 17px monospace";
      ctx.textAlign = "center";
      ctx.fillText("⚠  DAEMON INCOMING — COLLECT ALL LOOT NOW  ⚠", W / 2, 24);
      ctx.textAlign = "left";
      ctx.restore();
    }

    // ── Game-over / win overlay ─────────────────────────────────────────────
    function drawOverlay(title, titleColor, sub, hint) {
      ctx.fillStyle = "rgba(3,5,15,0.90)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle  = titleColor;
      ctx.font       = "bold 54px monospace";
      ctx.shadowColor = titleColor;
      ctx.shadowBlur  = 24;
      ctx.fillText(title, W / 2, H / 2 - 44);
      ctx.shadowBlur = 0;
      ctx.fillStyle = GREEN;
      ctx.font      = "16px monospace";
      ctx.fillText(sub, W / 2, H / 2 + 10);
      ctx.fillStyle = DIM;
      ctx.font      = "13px monospace";
      ctx.fillText(hint, W / 2, H / 2 + 48);
      ctx.textAlign = "left";
      ctx.shadowColor = "transparent";
    }

    // ── Continue screen ─────────────────────────────────────────────────────
    function drawContinue(t) {
      ctx.fillStyle = "rgba(3,5,15,0.94)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";

      ctx.fillStyle  = RED;
      ctx.font       = "bold 52px monospace";
      ctx.shadowColor = RED;
      ctx.shadowBlur  = 30;
      ctx.fillText("CONTINUE?", W / 2, H / 2 - 68);
      ctx.shadowBlur = 0;

      if (Math.floor(t / 500) % 2) {
        ctx.fillStyle  = GREEN;
        ctx.font       = "bold 18px monospace";
        ctx.shadowColor = GREEN;
        ctx.shadowBlur  = 10;
        ctx.fillText("INSERT COIN  ·  PRESS ENTER", W / 2, H / 2 - 16);
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle  = continueCountdown <= 3 ? RED : DIM;
      ctx.font       = "bold 56px monospace";
      ctx.shadowColor = continueCountdown <= 3 ? RED : DIM;
      ctx.shadowBlur  = 20;
      ctx.fillText(String(continueCountdown), W / 2, H / 2 + 64);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(0,204,122,0.55)";
      ctx.font      = "13px monospace";
      ctx.fillText("SECTOR 3 CHECKPOINT — ONE FREE CONTINUE", W / 2, H / 2 + 108);

      ctx.textAlign   = "left";
      ctx.shadowColor = "transparent";
    }

    // ── Restart ─────────────────────────────────────────────────────────────
    function restart() {
      rooms              = makeRooms();
      phase              = "playing";
      sectorIdx          = 0;
      score              = 0;
      lives              = 3;
      checkpoint         = null;
      gameStartTime      = performance.now();
      lastSubmittedId    = "";
      lastSubmittedScore = -1;
      nameEntry.mode = "choose"; nameEntry.selection = 0;
      nameEntry.input = ""; nameEntry.error = ""; nameEntry.errorTimer = 0;
      roomStates = makeRoomStates();
      enterSector(0);
    }

    // ── Touch-to-action (title tap, sector-complete tap, restart tap) ──────
    const onCanvasTouch = (e) => {
      e.preventDefault();
      const rect  = canvas.getBoundingClientRect();
      const touch = e.touches[0] || e.changedTouches[0];
      const cx    = (touch.clientX - rect.left) * (W / rect.width);
      const cy    = (touch.clientY - rect.top)  * (H / rect.height);
      if (phase === "title" && cx >= 16 && cx < 112 && cy >= H - 48 && cy < H - 22) {
        toggleSound(); return;
      }
      if ((phase === "playing" || phase === "gameover") && cx >= 512 && cx < 592 && cy >= 12 && cy < 48) {
        toggleSound(); return;
      }
      if (phase === "title") {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        startBgMusic();
        phase = "playing"; lastTick = performance.now(); gameStartTime = performance.now();
      } else if (phase === "sectorComplete") {
        enterSector(sectorIdx + 1); phase = "playing";
      } else if (phase === "continue") {
        useContinue();
      } else if (phase === "gameover") {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        restart();
      } else if (phase === "leaderboard") {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        restart();
      } else if (phase === "nameEntry") {
        if (nameEntry.mode === "choose") {
          const btnW = 190, btnH = 78, btnY = H / 2 - 52;
          if (cy >= btnY && cy <= btnY + btnH) {
            if (cx >= W / 2 - 208 && cx <= W / 2 - 18) {
              submitScore(generateCyberpunkId()); phase = "leaderboard";
            } else if (cx >= W / 2 + 18 && cx <= W / 2 + 208) {
              nameEntry.mode = "typing"; nameEntry.input = ""; hiddenInput.value = ""; hiddenInput.focus();
            }
          }
        } else if (nameEntry.mode === "typing") {
          const cbY = H / 2 + 22;
          if (cy >= cbY && cy <= cbY + 36) {
            submitManual();
          } else {
            hiddenInput.focus();
          }
        }
      }
    };
    const onCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx   = (e.clientX - rect.left) * (W / rect.width);
      const cy   = (e.clientY - rect.top)  * (H / rect.height);
      if (phase === "title" && cx >= 16 && cx < 112 && cy >= H - 48 && cy < H - 22) {
        toggleSound(); return;
      }
      if ((phase === "playing" || phase === "gameover") && cx >= 512 && cx < 592 && cy >= 12 && cy < 48) {
        toggleSound(); return;
      }
    };
    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("touchstart", onCanvasTouch, { passive: false });

    // ── Game loop ───────────────────────────────────────────────────────────
    let raf;
    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click",      onCanvasClick);
      canvas.removeEventListener("touchstart", onCanvasTouch);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup",   onUp);
      window.removeEventListener("keydown", onR);
      window.removeEventListener("keydown", onEnter);
      window.removeEventListener("keydown", onNameKey);
      hiddenInput.blur();
      document.body.removeChild(hiddenInput);
      if (bgAudio) { bgAudio.pause(); bgAudio = null; }
      if (audioCtx) { audioCtx.close(); audioCtx = null; }
    };
  }, []);

  // ── Orientation & side state ───────────────────────────────────────────────
  const [isLandscape, setIsLandscape] = useState(false);
  const [padSide,     setPadSide]     = useState("right");
  const [isTouch]      = useState(() =>
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
  const showTrackpad   = isLandscape && isTouch;
  const activePtrId    = useRef(null);
  const touchOriginRef = useRef(null);

  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Trackpad helpers ──────────────────────────────────────────────────────
  const DEAD_ZONE = 16;

  const pushDirection = (dx, dy) => {
    const keys = keysRef.current;
    keys["ArrowUp"]    = false;
    keys["ArrowDown"]  = false;
    keys["ArrowLeft"]  = false;
    keys["ArrowRight"] = false;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < DEAD_ZONE) return;
    const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    if      (deg < 22.5  || deg >= 337.5) { keys["ArrowRight"] = true; }
    else if (deg < 67.5)                  { keys["ArrowRight"] = true; keys["ArrowDown"]  = true; }
    else if (deg < 112.5)                 { keys["ArrowDown"]  = true; }
    else if (deg < 157.5)                 { keys["ArrowLeft"]  = true; keys["ArrowDown"]  = true; }
    else if (deg < 202.5)                 { keys["ArrowLeft"]  = true; }
    else if (deg < 247.5)                 { keys["ArrowLeft"]  = true; keys["ArrowUp"]    = true; }
    else if (deg < 292.5)                 { keys["ArrowUp"]    = true; }
    else                                  { keys["ArrowRight"] = true; keys["ArrowUp"]    = true; }
  };

  const onTrackDown = (e) => {
    e.preventDefault();
    if (activePtrId.current !== null) return;
    activePtrId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    touchOriginRef.current = { x: e.clientX, y: e.clientY };
  };

  const onTrackMove = (e) => {
    e.preventDefault();
    if (e.pointerId !== activePtrId.current || !touchOriginRef.current) return;
    pushDirection(e.clientX - touchOriginRef.current.x, e.clientY - touchOriginRef.current.y);
  };

  const onTrackUp = (e) => {
    if (e.pointerId !== activePtrId.current) return;
    activePtrId.current    = null;
    touchOriginRef.current = null;
    const keys = keysRef.current;
    keys["ArrowUp"] = keys["ArrowDown"] = keys["ArrowLeft"] = keys["ArrowRight"] = false;
  };

  // ── Trackpad zone + swap button ────────────────────────────────────────────
  const TRACK_W = 220;

  const trackpadEl = (
    <div
      onPointerDown={onTrackDown}
      onPointerMove={onTrackMove}
      onPointerUp={onTrackUp}
      onPointerCancel={onTrackUp}
      style={{
        flex:           "1 1 0",
        minHeight:      "120px",
        border:         "1px dashed rgba(0,255,160,0.32)",
        background:     "rgba(0,255,160,0.018)",
        touchAction:    "none",
        userSelect:     "none",
        cursor:         "crosshair",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        boxSizing:      "border-box",
      }}
    >
      <span style={{
        color:         "rgba(0,255,160,0.18)",
        fontFamily:    "monospace",
        fontSize:      "10px",
        letterSpacing: "3px",
        pointerEvents: "none",
      }}>SWIPE</span>
    </div>
  );

  const swapBtn = (
    <button
      onClick={() => setPadSide(s => s === "right" ? "left" : "right")}
      style={{
        background:    "rgba(0,255,160,0.05)",
        border:        "1px solid rgba(0,255,160,0.22)",
        color:         "rgba(0,255,160,0.48)",
        fontFamily:    "monospace",
        fontSize:      "9px",
        padding:       "5px 12px",
        borderRadius:  "3px",
        cursor:        "pointer",
        letterSpacing: "2px",
        touchAction:   "manipulation",
        WebkitTapHighlightColor: "transparent",
        flexShrink:    0,
      }}
    >
      {padSide === "right" ? "◄ LEFTY" : "RIGHTY ►"}
    </button>
  );

  // ── Canvas sizing ──────────────────────────────────────────────────────────
  const canvasStyle = {
    display:        "block",
    border:         "1px solid #00ffa0",
    imageRendering: "pixelated",
    maxWidth:       showTrackpad ? `calc(100vw - ${TRACK_W + 8}px)` : "100%",
    maxHeight:      isLandscape ? "100svh" : "calc(100svh - 200px)",
    width:          "auto",
    height:         "auto",
    flexShrink:     0,
    touchAction:    "none",
  };

  return (
    <main style={{
      minHeight:      "100svh",
      background:     "#03050f",
      display:        "flex",
      flexDirection:  isLandscape ? "row" : "column",
      alignItems:     isLandscape ? "stretch" : "center",
      justifyContent: "flex-start",
      padding:        "0",
      boxSizing:      "border-box",
      overflow:       "hidden",
    }}>
      {/* Portrait header */}
      {!isLandscape && (
        <div style={{ padding: "6px 4px 4px", fontFamily: "monospace", color: "#00ffa0", fontSize: "10px", letterSpacing: "3px", textAlign: "center", flexShrink: 0 }}>
          DAEMON.EXE &nbsp;·&nbsp; 3 SECTORS · 9 ROOMS · COLLECT ALL ◆
        </div>
      )}

      {/* Landscape left-hand trackpad */}
      {showTrackpad && padSide === "left" && (
        <div style={{ width: `${TRACK_W}px`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {trackpadEl}
          <div style={{ padding: "4px", display: "flex", justifyContent: "center", flexShrink: 0 }}>{swapBtn}</div>
        </div>
      )}

      {/* Canvas — always-present wrapper keeps canvasRef stable across layout changes */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flex:           isLandscape ? "1 1 0" : undefined,
        width:          isLandscape ? undefined : "100%",
      }}>
        <canvas ref={canvasRef} width={800} height={560} style={canvasStyle} />
      </div>

      {/* Landscape right-hand trackpad */}
      {showTrackpad && padSide === "right" && (
        <div style={{ width: `${TRACK_W}px`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {trackpadEl}
          <div style={{ padding: "4px", display: "flex", justifyContent: "center", flexShrink: 0 }}>{swapBtn}</div>
        </div>
      )}

      {/* Portrait controls below canvas */}
      {!isLandscape && (
        <div style={{ display: "flex", flexDirection: "column", alignSelf: "stretch", flex: "1 1 0" }}>
          <div style={{ padding: "4px 0 2px", display: "flex", justifyContent: "center", flexShrink: 0 }}>{swapBtn}</div>
          {trackpadEl}
          <div style={{ padding: "2px 4px 4px", fontFamily: "monospace", color: "#00cc7a", fontSize: "10px", textAlign: "center", letterSpacing: "1px", flexShrink: 0 }}>
            ◆ LOOT &nbsp;·&nbsp; ✕ AVOID &nbsp;·&nbsp; ► EXITS &nbsp;·&nbsp; [R] RESTART
          </div>
        </div>
      )}
    </main>
  );
}
