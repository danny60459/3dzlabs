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
      enemyDefs: [{ x:200,y:170,speed:1.4 },{ x:580,y:130,speed:1.5 },{ x:380,y:400,speed:1.3 },{ x:620,y:390,speed:1.4 }],
      treasureDefs: [{ x:160,y:130 },{ x:450,y:130 },{ x:300,y:340 },{ x:680,y:200 }],
      exits: [{ side:"right", toRoom:4 }],
      lasers: [
        { x1:16, y1:290, x2:784, y2:290, phase:0,   on:1.5, period:2.3 },
        { x1:320, y1:16, x2:320, y2:484, phase:1.1, on:1.5, period:2.3 },
      ],
      movingWallDefs: [{ x:450, y:180, w:120, h:14, axis:"x", min:350, max:560, speed:1.2 }],
    },
    {
      name: "S2-R1b",
      innerWalls: [[200,100,220,14],[200,100,14,160],[480,280,14,180],[280,360,200,14],[580,120,160,14]],
      enemyDefs: [{ x:350,y:200,speed:1.4 },{ x:600,y:400,speed:1.5 },{ x:220,y:400,speed:1.3 },{ x:640,y:220,speed:1.4 }],
      treasureDefs: [{ x:180,y:400 },{ x:350,y:100 },{ x:660,y:100 },{ x:500,y:430 }],
      exits: [{ side:"right", toRoom:4 }],
      lasers: [
        { x1:16, y1:175, x2:784, y2:175, phase:0.5, on:1.5, period:2.3 },
        { x1:550, y1:16, x2:550, y2:484, phase:1.3, on:1.5, period:2.3 },
      ],
      movingWallDefs: [{ x:200, y:280, w:14, h:100, axis:"y", min:220, max:370, speed:1.0 }],
    },
  ],
  // ── Slot 4 · S2 middle ───────────────────────────────────────────────────
  [
    {
      name: "S2-R2a",
      innerWalls: [[200,120,14,200],[200,120,180,14],[500,200,14,200],[360,380,140,14],[300,300,14,80]],
      enemyDefs: [{ x:350,y:220,speed:1.4 },{ x:580,y:130,speed:1.5 },{ x:220,y:400,speed:1.3 },{ x:630,y:380,speed:1.4 }],
      treasureDefs: [{ x:200,y:200 },{ x:650,y:430 },{ x:380,y:350 },{ x:580,y:280 }],
      exits: [{ side:"left", toRoom:3 },{ side:"right", toRoom:5 }],
      lasers: [
        { x1:16, y1:310, x2:784, y2:310, phase:0.5, on:1.5, period:2.3 },
        { x1:450, y1:16, x2:450, y2:484, phase:1.4, on:1.5, period:2.3 },
      ],
      movingWallDefs: [{ x:500, y:300, w:160, h:14, axis:"x", min:400, max:620, speed:1.1 }],
    },
    {
      name: "S2-R2b",
      innerWalls: [[180,200,180,14],[180,200,14,180],[480,100,180,14],[480,100,14,200],[280,360,200,14]],
      enemyDefs: [{ x:400,y:180,speed:1.5 },{ x:220,y:380,speed:1.3 },{ x:600,y:360,speed:1.4 },{ x:350,y:420,speed:1.5 }],
      treasureDefs: [{ x:200,y:130 },{ x:660,y:430 },{ x:400,y:300 },{ x:600,y:130 }],
      exits: [{ side:"left", toRoom:3 },{ side:"right", toRoom:5 }],
      lasers: [
        { x1:16, y1:195, x2:784, y2:195, phase:0.2, on:1.5, period:2.3 },
        { x1:350, y1:16, x2:350, y2:484, phase:1.1, on:1.5, period:2.3 },
      ],
      movingWallDefs: [{ x:180, y:300, w:14, h:120, axis:"y", min:240, max:364, speed:1.2 }],
    },
  ],
  // ── Slot 5 · S2 final ────────────────────────────────────────────────────
  [
    {
      name: "S2-R3a",
      innerWalls: [[80,120,280,14],[80,120,14,180],[80,300,200,14],[440,200,14,220],[560,330,200,14]],
      enemyDefs: [{ x:300,y:220,speed:1.4 },{ x:560,y:180,speed:1.5 },{ x:350,y:400,speed:1.3 },{ x:650,y:420,speed:1.4 }],
      treasureDefs: [{ x:200,y:80 },{ x:400,y:100 },{ x:530,y:450 },{ x:700,y:260 },{ x:160,y:400 }],
      exits: [{ side:"left", toRoom:4 }],
      lasers: [
        { x1:16, y1:310, x2:784, y2:310, phase:0.3, on:1.5, period:2.3 },
        { x1:500, y1:16, x2:500, y2:484, phase:1.2, on:1.5, period:2.3 },
      ],
      movingWallDefs: [{ x:300, y:100, w:160, h:14, axis:"x", min:200, max:430, speed:1.2 }],
    },
    {
      name: "S2-R3b",
      innerWalls: [[200,160,220,14],[200,160,14,160],[480,260,14,200],[250,360,200,14],[580,100,160,14]],
      enemyDefs: [{ x:400,y:200,speed:1.5 },{ x:220,y:430,speed:1.4 },{ x:620,y:200,speed:1.3 },{ x:560,y:420,speed:1.5 }],
      treasureDefs: [{ x:180,y:100 },{ x:400,y:430 },{ x:640,y:430 },{ x:700,y:130 },{ x:300,y:300 }],
      exits: [{ side:"left", toRoom:4 }],
      lasers: [
        { x1:16, y1:170, x2:784, y2:170, phase:0.7, on:1.5, period:2.3 },
        { x1:380, y1:16, x2:380, y2:484, phase:1.5, on:1.5, period:2.3 },
      ],
      movingWallDefs: [{ x:480, y:200, w:14, h:120, axis:"y", min:160, max:320, speed:1.3 }],
    },
  ],
  // ── Slot 6 · S3 entry ────────────────────────────────────────────────────
  [
    {
      name: "S3-R1a",
      innerWalls: [[200,80,14,260],[200,80,180,14],[520,220,14,160],[300,360,180,14],[560,100,160,14]],
      enemyDefs: [{ x:400,y:200,speed:1.9 },{ x:580,y:400,speed:2.0 },{ x:350,y:420,speed:1.8 },{ x:640,y:200,speed:2.1 },{ x:280,y:180,speed:1.9 }],
      treasureDefs: [{ x:200,y:430 },{ x:390,y:55 },{ x:660,y:150 },{ x:610,y:440 },{ x:680,y:310 }],
      exits: [{ side:"right", toRoom:7 }],
      lasers: [
        { x1:16, y1:165, x2:784, y2:165, phase:0,   on:1.8, period:2.5 },
        { x1:400, y1:16, x2:400, y2:484, phase:0.7, on:1.8, period:2.5 },
        { x1:16, y1:370, x2:784, y2:370, phase:1.5, on:1.8, period:2.5 },
      ],
      movingWallDefs: [
        { x:200, y:250, w:160, h:14, axis:"x", min:200, max:520, speed:1.5 },
        { x:540, y:150, w:14, h:120, axis:"y", min:100, max:300, speed:1.8 },
      ],
    },
    {
      name: "S3-R1b",
      innerWalls: [[160,140,200,14],[160,140,14,200],[500,200,14,200],[280,370,200,14],[550,100,14,160]],
      enemyDefs: [{ x:350,y:200,speed:2.0 },{ x:620,y:380,speed:1.9 },{ x:280,y:400,speed:2.1 },{ x:630,y:200,speed:1.8 },{ x:430,y:420,speed:2.0 }],
      treasureDefs: [{ x:180,y:430 },{ x:400,y:80 },{ x:680,y:130 },{ x:600,y:450 },{ x:260,y:300 }],
      exits: [{ side:"right", toRoom:7 }],
      lasers: [
        { x1:16, y1:200, x2:784, y2:200, phase:0.3, on:1.8, period:2.5 },
        { x1:300, y1:16, x2:300, y2:484, phase:1.0, on:1.8, period:2.5 },
        { x1:16, y1:380, x2:784, y2:380, phase:1.6, on:1.8, period:2.5 },
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
      enemyDefs: [{ x:300,y:200,speed:2.0 },{ x:220,y:400,speed:1.9 },{ x:560,y:200,speed:2.1 },{ x:640,y:400,speed:2.0 },{ x:400,y:430,speed:1.8 }],
      treasureDefs: [{ x:200,y:130 },{ x:280,y:310 },{ x:680,y:240 },{ x:360,y:450 },{ x:540,y:80 }],
      exits: [{ side:"left", toRoom:6 },{ side:"right", toRoom:8 }],
      lasers: [
        { x1:16, y1:185, x2:784, y2:185, phase:0.2, on:1.8, period:2.5 },
        { x1:500, y1:16, x2:500, y2:484, phase:0.9, on:1.8, period:2.5 },
        { x1:16, y1:380, x2:784, y2:380, phase:1.6, on:1.8, period:2.5 },
      ],
      movingWallDefs: [
        { x:300, y:160, w:160, h:14, axis:"x", min:200, max:420, speed:1.6 },
        { x:580, y:280, w:14, h:100, axis:"y", min:220, max:364, speed:1.7 },
      ],
    },
    {
      name: "S3-R2b",
      innerWalls: [[200,200,180,14],[200,100,14,200],[460,300,14,180],[350,380,180,14],[580,100,14,200]],
      enemyDefs: [{ x:360,y:170,speed:2.0 },{ x:220,y:420,speed:2.1 },{ x:540,y:200,speed:1.9 },{ x:660,y:400,speed:2.0 },{ x:420,y:430,speed:1.8 }],
      treasureDefs: [{ x:200,y:140 },{ x:660,y:130 },{ x:310,y:310 },{ x:400,y:450 },{ x:560,y:420 }],
      exits: [{ side:"left", toRoom:6 },{ side:"right", toRoom:8 }],
      lasers: [
        { x1:16, y1:210, x2:784, y2:210, phase:0.5, on:1.8, period:2.5 },
        { x1:300, y1:16, x2:300, y2:484, phase:1.2, on:1.8, period:2.5 },
        { x1:16, y1:360, x2:784, y2:360, phase:1.9, on:1.8, period:2.5 },
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
      enemyDefs: [{ x:380,y:200,speed:2.1 },{ x:220,y:380,speed:2.0 },{ x:600,y:180,speed:2.2 },{ x:560,y:430,speed:2.0 },{ x:380,y:420,speed:1.9 }],
      treasureDefs: [{ x:200,y:80 },{ x:430,y:80 },{ x:700,y:430 },{ x:260,y:390 },{ x:560,y:460 },{ x:680,y:300 }],
      exits: [{ side:"left", toRoom:7 }],
      lasers: [
        { x1:16, y1:150, x2:784, y2:150, phase:0,   on:1.8, period:2.5 },
        { x1:450, y1:16, x2:450, y2:484, phase:0.8, on:1.8, period:2.5 },
        { x1:16, y1:350, x2:784, y2:350, phase:1.4, on:1.8, period:2.5 },
      ],
      movingWallDefs: [
        { x:300, y:240, w:180, h:14, axis:"x", min:200, max:480, speed:1.7 },
        { x:180, y:280, w:14, h:100, axis:"y", min:220, max:380, speed:1.8 },
      ],
    },
    {
      name: "S3-R3b",
      innerWalls: [[160,140,280,14],[160,140,14,160],[160,300,170,14],[460,200,14,180],[460,360,200,14],[540,100,14,100]],
      enemyDefs: [{ x:360,y:200,speed:2.0 },{ x:220,y:400,speed:2.2 },{ x:580,y:170,speed:2.1 },{ x:540,y:440,speed:2.0 },{ x:400,y:400,speed:1.9 }],
      treasureDefs: [{ x:180,y:80 },{ x:400,y:80 },{ x:680,y:450 },{ x:260,y:390 },{ x:540,y:460 },{ x:700,y:290 }],
      exits: [{ side:"left", toRoom:7 }],
      lasers: [
        { x1:16, y1:170, x2:784, y2:170, phase:0.2, on:1.8, period:2.5 },
        { x1:330, y1:16, x2:330, y2:484, phase:0.9, on:1.8, period:2.5 },
        { x1:16, y1:380, x2:784, y2:380, phase:1.5, on:1.8, period:2.5 },
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

    // ── Mutable game state ──────────────────────────────────────────────────
    let phase     = "title";  // "title"|"playing"|"sectorComplete"|"gameover"|"win"
    let sectorIdx = 0;
    let roomIdx   = 0;
    let score     = 0;
    let lives     = 3;
    let timer     = SECTOR_TIMERS[0];
    let lastTick  = performance.now();
    let iframes     = 0;
    let shakeFrames = 0;
    let audioCtx    = null;

    const player = { x: WALL + 34, y: MY };
    const daemon  = { x: 0, y: 0, active: false, speed: 1.2, spawnAge: 0 };

    let checkpoint        = null;  // { score, lives } saved on first S3 entry
    let continueCountdown = 10;
    let continueLastTick  = 0;

    let rooms      = makeRooms();
    let roomStates = makeRoomStates();

    function makeRooms() {
      return ROOM_POOLS.map(pool => pool[Math.floor(Math.random() * pool.length)]);
    }
    function makeRoomStates() {
      return rooms.map(r => ({
        enemies:     r.enemyDefs.map(e => ({ x: e.x, y: e.y, speed: e.speed, vx: 0, vy: 0, wanderTimer: 0 })),
        treasures:   r.treasureDefs.map(t => ({ ...t, collected: false })),
        movingWalls: (r.movingWallDefs ?? []).map(mw => ({ ...mw, dir: 1 })),
      }));
    }

    function enterSector(idx) {
      sectorIdx     = idx;
      roomIdx       = SECTOR_RANGES[idx][0];
      timer         = SECTOR_TIMERS[idx];
      lastTick      = performance.now();
      iframes       = 0;
      player.x      = WALL + 34;
      player.y      = MY;
      daemon.active = false;
      daemon.speed  = [0.35, 0.6, 0.9][idx];
      daemon.x        = 0;
      daemon.y        = 0;
      daemon.spawnAge = 0;
      if (idx === 2 && !checkpoint) {
        checkpoint = { score, lives };
      }
    }

    // ── Audio ──────────────────────────────────────────────────────────────
    function ac() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    }

    // Two-tone pickup beep
    function sndLoot() {
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

    // Low thump once per second while timer ≤ 15
    function sndWarnPulse() {
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

    // ── Input ──────────────────────────────────────────────────────────────
    const keys = keysRef.current;
    const onDown  = e => { keys[e.key] = true; };
    const onUp    = e => { keys[e.key] = false; };
    const onR     = e => {
      if ((e.key === "r" || e.key === "R") && phase !== "playing" && phase !== "title") {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        restart();
      }
    };
    const onEnter = e => {
      if (e.key !== "Enter") return;
      if (phase === "title") {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        phase = "playing"; lastTick = performance.now();
      } else if (phase === "sectorComplete") { enterSector(sectorIdx + 1); phase = "playing"; }
        else if (phase === "continue")       { useContinue(); }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    window.addEventListener("keydown", onR);
    window.addEventListener("keydown", onEnter);

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
      if (daemon.active) {
        daemon.x = WALL + 8;
        daemon.y = WALL + 8;
        daemon.speed = Math.min(daemon.speed + 0.3, 4.0);
      }
    }

    // ── Update ─────────────────────────────────────────────────────────────
    function triggerGameOver() {
      if (sectorIdx === 2 && checkpoint && !checkpoint.used) {
        phase = "continue"; continueCountdown = 10; continueLastTick = performance.now();
      } else {
        phase = "gameover";
      }
    }

    function useContinue() {
      checkpoint.used = true;
      lives = 3;
      const [s3Start, s3End] = SECTOR_RANGES[2];
      for (let i = s3Start; i < s3End; i++) {
        roomStates[i] = {
          enemies:     rooms[i].enemyDefs.map(e => ({ x: e.x, y: e.y, speed: e.speed, vx: 0, vy: 0, wanderTimer: 0 })),
          treasures:   rooms[i].treasureDefs.map(t => ({ ...t, collected: false })),
          movingWalls: (rooms[i].movingWallDefs ?? []).map(mw => ({ ...mw, dir: 1 })),
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
      const speedScale = canvas.width / 800;
      player.x += (mx * P_SPEED) / speedScale;
      player.y += (my * P_SPEED) / speedScale;

      const walls = buildWalls(roomIdx);
      resolveWalls(walls);
      checkDoors();

      const rs = roomStates[roomIdx];
      for (const e of rs.enemies) {
        if (--e.wanderTimer <= 0) {
          const ang = Math.random() * Math.PI * 2;
          e.vx = Math.cos(ang) * e.speed;
          e.vy = Math.sin(ang) * e.speed;
          e.wanderTimer = 60 + Math.floor(Math.random() * 120);
        }
        const nx = e.x + e.vx, ny = e.y + e.vy;
        const eRect = { x: nx - E_SZ/2, y: ny - E_SZ/2, w: E_SZ, h: E_SZ };
        let blocked = false;
        for (const w of walls) { if (overlap(eRect, w)) { blocked = true; break; } }
        if (blocked) {
          const ang = Math.random() * Math.PI * 2;
          e.vx = Math.cos(ang) * e.speed;
          e.vy = Math.sin(ang) * e.speed;
          e.wanderTimer = 60 + Math.floor(Math.random() * 120);
        } else { e.x = nx; e.y = ny; }
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

      if (iframes > 0) {
        iframes--;
      } else {
        const pr = pRect();
        let hit = false;
        for (const e of rs.enemies) {
          if (overlap(pr, { x: e.x - E_SZ/2, y: e.y - E_SZ/2, w: E_SZ, h: E_SZ })) {
            hit = true; break;
          }
        }
        if (!hit) {
          const tSec = performance.now() / 1000;
          for (const L of (rooms[roomIdx].lasers ?? [])) {
            const laserOn = L.on ?? LASER_ON, laserPer = L.period ?? LASER_PERIOD;
            const on = ((tSec + L.phase) % laserPer) < laserOn;
            if (!on) continue;
            const horiz = L.y1 === L.y2;
            const lr = horiz
              ? { x: L.x1, y: L.y1 - 3, w: L.x2 - L.x1, h: 6 }
              : { x: L.x1 - 3, y: L.y1, w: 6, h: L.y2 - L.y1 };
            if (overlap(pr, lr)) { hit = true; break; }
          }
        }
        if (hit) {
          lives--;
          iframes = 12;
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
        const [sStart, sEnd] = SECTOR_RANGES[sectorIdx];
        if (roomStates.slice(sStart, sEnd).every(s => s.treasures.every(t => t.collected))) {
          score += 100;
          if (sectorIdx === 2) { score += 500; phase = "win"; sndWinFanfare(); }
          else                 { phase = "sectorComplete"; sndSectorFanfare(); }
          return;
        }
        if (rs.treasures.every(t => t.collected)) sndRoomClear();
      }

      if (daemon.active) {
        if (daemon.spawnAge < 240) daemon.spawnAge++;
        const dx = player.x - daemon.x;
        const dy = player.y - daemon.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dScale = canvas.width / 800;
        daemon.x += (dx / dist) * daemon.speed / dScale;
        daemon.y += (dy / dist) * daemon.speed / dScale;
        if (overlap(pRect(), { x: daemon.x - D_SZ/2, y: daemon.y - D_SZ/2, w: D_SZ, h: D_SZ })) {
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
      drawEnemies(t);
      if (daemon.active) drawDaemon(t);
      drawPlayer(t);

      ctx.restore();

      const warnAt = Math.ceil(SECTOR_TIMERS[sectorIdx] * 0.4);
      if (timer > 0 && timer <= warnAt && !daemon.active) drawWarning(t);
      if (phase === "gameover") drawOverlay("GAME OVER", RED,   `SCORE  ${String(score).padStart(6,"0")}`, "TAP  ·  [R]  TO RESTART");
      if (phase === "win")      drawOverlay("ESCAPED!",  GREEN, `SCORE  ${String(score).padStart(6,"0")}  +500 BONUS`, "TAP  ·  [R]  TO PLAY AGAIN");
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
      if (iframes > 0 && Math.floor(iframes / 5) % 2 === 0) return;
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
      ctx.font       = "bold 42px monospace";
      ctx.shadowColor = RED;
      ctx.shadowBlur  = 30;
      ctx.fillText("INSERT COIN", W / 2, H / 2 - 68);
      ctx.shadowBlur = 0;

      if (Math.floor(t / 500) % 2) {
        ctx.fillStyle  = GREEN;
        ctx.font       = "bold 20px monospace";
        ctx.shadowColor = GREEN;
        ctx.shadowBlur  = 10;
        ctx.fillText("PRESS ENTER TO CONTINUE", W / 2, H / 2 - 12);
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
      rooms      = makeRooms();
      phase      = "playing";
      sectorIdx  = 0;
      score      = 0;
      lives      = 3;
      checkpoint = null;
      roomStates = makeRoomStates();
      enterSector(0);
    }

    // ── Touch-to-action (title tap, sector-complete tap, restart tap) ──────
    const onCanvasTouch = (e) => {
      e.preventDefault();
      if (phase === "title") {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        phase = "playing"; lastTick = performance.now();
      } else if (phase === "sectorComplete") {
        enterSector(sectorIdx + 1); phase = "playing";
      } else if (phase === "continue") {
        useContinue();
      } else if (phase === "gameover" || phase === "win") {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        restart();
      }
    };
    canvas.addEventListener("touchstart", onCanvasTouch, { passive: false });

    // ── Game loop ───────────────────────────────────────────────────────────
    let raf;
    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("touchstart", onCanvasTouch);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup",   onUp);
      window.removeEventListener("keydown", onR);
      window.removeEventListener("keydown", onEnter);
      if (audioCtx) { audioCtx.close(); audioCtx = null; }
    };
  }, []);

  // ── Orientation & side state ───────────────────────────────────────────────
  const [isLandscape,  setIsLandscape]  = useState(false);
  const [padSide,      setPadSide]      = useState("right");
  const [stickPos,     setStickPos]     = useState({ x: 0, y: 0 });
  const [stickActive,  setStickActive]  = useState(false);
  const activePtrId = useRef(null);

  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Joystick helpers ───────────────────────────────────────────────────────
  const DEAD_ZONE = 16;
  const MAX_DIST  = 58;

  const clampStick = (dx, dy) => {
    const d = Math.sqrt(dx * dx + dy * dy);
    return d <= MAX_DIST ? { x: dx, y: dy } : { x: (dx / d) * MAX_DIST, y: (dy / d) * MAX_DIST };
  };

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

  const clearStick = () => {
    activePtrId.current = null;
    setStickPos({ x: 0, y: 0 });
    setStickActive(false);
    const keys = keysRef.current;
    keys["ArrowUp"] = keys["ArrowDown"] = keys["ArrowLeft"] = keys["ArrowRight"] = false;
  };

  const getDelta = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      dx: e.clientX - (rect.left + rect.width  / 2),
      dy: e.clientY - (rect.top  + rect.height / 2),
    };
  };

  const onJoyDown = (e) => {
    e.preventDefault();
    if (activePtrId.current !== null) return;
    activePtrId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { dx, dy } = getDelta(e);
    setStickPos(clampStick(dx, dy));
    setStickActive(true);
    pushDirection(dx, dy);
  };

  const onJoyMove = (e) => {
    e.preventDefault();
    if (e.pointerId !== activePtrId.current) return;
    const { dx, dy } = getDelta(e);
    setStickPos(clampStick(dx, dy));
    pushDirection(dx, dy);
  };

  const onJoyUp = (e) => {
    if (e.pointerId !== activePtrId.current) return;
    clearStick();
  };

  // ── Control panel (joystick + swap button) ─────────────────────────────────
  const ZONE = 168;

  const controlPanel = (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     isLandscape ? (padSide === "right" ? "flex-start" : "flex-end") : "center",
      justifyContent: "center",
      gap:            "10px",
      padding:        isLandscape ? "8px 12px" : "10px 8px 4px",
      flexShrink:     0,
    }}>
      {/* Joystick zone */}
      <div
        onPointerDown={onJoyDown}
        onPointerMove={onJoyMove}
        onPointerUp={onJoyUp}
        onPointerCancel={onJoyUp}
        style={{
          position:     "relative",
          width:        `${ZONE}px`,
          height:       `${ZONE}px`,
          borderRadius: "50%",
          background:   "rgba(0,255,160,0.05)",
          border:       `1px solid rgba(0,255,160,${stickActive ? "0.55" : "0.28"})`,
          boxShadow:    stickActive
            ? "0 0 22px rgba(0,255,160,0.22), inset 0 0 28px rgba(0,255,160,0.07)"
            : "0 0 12px rgba(0,255,160,0.10), inset 0 0 18px rgba(0,255,160,0.04)",
          touchAction:  "none",
          userSelect:   "none",
          cursor:       "crosshair",
          transition:   "border-color 0.1s, box-shadow 0.1s",
        }}
      >
        {/* Cardinal hint arrows */}
        {[
          { lbl: "▲", s: { top:    "7px", left: "50%", transform: "translateX(-50%)" } },
          { lbl: "▼", s: { bottom: "7px", left: "50%", transform: "translateX(-50%)" } },
          { lbl: "◄", s: { left:   "7px", top:  "50%", transform: "translateY(-50%)" } },
          { lbl: "►", s: { right:  "7px", top:  "50%", transform: "translateY(-50%)" } },
        ].map(({ lbl, s }) => (
          <span key={lbl} style={{
            position:      "absolute",
            color:         `rgba(0,255,160,${stickActive ? "0.18" : "0.30"})`,
            fontSize:      "11px",
            fontFamily:    "monospace",
            pointerEvents: "none",
            lineHeight:    1,
            transition:    "color 0.1s",
            ...s,
          }}>{lbl}</span>
        ))}

        {/* Centre ring */}
        <div style={{
          position:      "absolute",
          top: "50%", left: "50%",
          transform:     "translate(-50%, -50%)",
          width:         "8px",
          height:        "8px",
          borderRadius:  "50%",
          border:        "1px solid rgba(0,255,160,0.35)",
          pointerEvents: "none",
        }} />

        {/* Thumb nub */}
        <div style={{
          position:      "absolute",
          top:           `calc(50% + ${stickPos.y}px)`,
          left:          `calc(50% + ${stickPos.x}px)`,
          transform:     "translate(-50%, -50%)",
          width:         "36px",
          height:        "36px",
          borderRadius:  "50%",
          background:    stickActive ? "rgba(0,255,160,0.28)" : "rgba(0,255,160,0.12)",
          border:        `1.5px solid rgba(0,255,160,${stickActive ? "0.85" : "0.40"})`,
          boxShadow:     stickActive
            ? "0 0 20px rgba(0,255,160,0.65), 0 0 6px rgba(0,255,160,0.9)"
            : "0 0 8px rgba(0,255,160,0.25)",
          transition:    stickActive ? "none" : "all 0.18s cubic-bezier(0.22,1,0.36,1)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Handedness swap button */}
      <button
        onClick={() => setPadSide(s => s === "right" ? "left" : "right")}
        style={{
          background:    "rgba(0,255,160,0.05)",
          border:        "1px solid rgba(0,255,160,0.25)",
          color:         "rgba(0,255,160,0.5)",
          fontFamily:    "monospace",
          fontSize:      "9px",
          padding:       "5px 12px",
          borderRadius:  "3px",
          cursor:        "pointer",
          letterSpacing: "2px",
          touchAction:   "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {padSide === "right" ? "◄ LEFTY" : "RIGHTY ►"}
      </button>
    </div>
  );

  // ── Canvas sizing ──────────────────────────────────────────────────────────
  const canvasStyle = {
    display:        "block",
    border:         "1px solid #00ffa0",
    imageRendering: "pixelated",
    maxWidth:       isLandscape ? `calc(100vw - ${ZONE + 48}px)` : "100%",
    maxHeight:      isLandscape ? "100svh" : `calc(100svh - ${ZONE + 80}px)`,
    width:          "auto",
    height:         "auto",
    touchAction:    "none",
  };

  return (
    <main style={{
      minHeight:      "100svh",
      background:     "#03050f",
      display:        "flex",
      flexDirection:  isLandscape ? "row" : "column",
      alignItems:     "center",
      justifyContent: "center",
      padding:        isLandscape ? "4px" : "6px 4px",
      gap:            isLandscape ? "0" : "0",
      boxSizing:      "border-box",
      overflow:       "hidden",
    }}>
      {/* Header — portrait only */}
      {!isLandscape && (
        <div style={{ marginBottom: "6px", fontFamily: "monospace", color: "#00ffa0", fontSize: "10px", letterSpacing: "3px", textAlign: "center" }}>
          DAEMON.EXE &nbsp;·&nbsp; 3 SECTORS · 9 ROOMS · COLLECT ALL ◆
        </div>
      )}

      {/* Landscape + left-hand: controls on the left */}
      {isLandscape && padSide === "left" && controlPanel}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={560}
        style={canvasStyle}
      />

      {/* Landscape + right-hand (default): controls on the right */}
      {isLandscape && padSide === "right" && controlPanel}

      {/* Portrait: controls below canvas */}
      {!isLandscape && controlPanel}

      {/* Footer — portrait only */}
      {!isLandscape && (
        <div style={{ marginTop: "4px", fontFamily: "monospace", color: "#00cc7a", fontSize: "10px", textAlign: "center", letterSpacing: "1px" }}>
          ◆ LOOT &nbsp;·&nbsp; ✕ AVOID &nbsp;·&nbsp; ► EXITS &nbsp;·&nbsp; [R] RESTART
        </div>
      )}
    </main>
  );
}
