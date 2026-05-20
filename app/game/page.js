"use client";
import { useEffect, useRef } from "react";

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

// ─── Sector config ────────────────────────────────────────────────────────────
const SECTOR_TIMERS = [60, 45, 30];
const SECTOR_RANGES = [[0, 3], [3, 6], [6, 9]];

// ─── 9 rooms across 3 sectors ─────────────────────────────────────────────────
const ROOMS = [
  // ── SECTOR 1 · Easy ──────────────────────────────────────────────────────
  {
    name: "S1-R1",
    innerWalls: [
      [130,  90, 150, 14],
      [130,  90,  14, 110],
      [490, 210,  14, 150],
      [310, 360, 190,  14],
    ],
    enemyDefs: [
      { x: 210, y: 160, axis: "x", min: 150, max: 370, speed: 1.5 },
      { x: 560, y: 355, axis: "y", min: 250, max: 430, speed: 1.2 },
    ],
    treasureDefs: [{ x: 360, y: 130 }, { x: 615, y: 160 }, { x: 670, y: 400 }],
    exits: [{ side: "right", toRoom: 1 }],
  },
  {
    name: "S1-R2",
    innerWalls: [
      [200, 120,  14, 190],
      [200, 120, 140,  14],
      [460, 310, 190,  14],
      [550, 190,  14, 120],
    ],
    enemyDefs: [
      { x: 110, y: 200, axis: "x", min:  50, max: 185, speed: 1.8 },
      { x: 390, y: 160, axis: "x", min: 230, max: 440, speed: 1.5 },
    ],
    treasureDefs: [{ x: 100, y: 395 }, { x: 360, y: 250 }, { x: 650, y: 110 }],
    exits: [{ side: "left", toRoom: 0 }, { side: "right", toRoom: 2 }],
  },
  {
    name: "S1-R3",
    innerWalls: [
      [110, 160, 190,  14],
      [110, 160,  14, 190],
      [410, 110,  14, 170],
      [580, 290,  14, 170],
      [300, 380, 160,  14],
    ],
    enemyDefs: [
      { x: 210, y: 110, axis: "x", min: 140, max: 395, speed: 1.8 },
      { x: 510, y: 210, axis: "y", min:  90, max: 300, speed: 1.6 },
      { x: 160, y: 390, axis: "y", min: 360, max: 460, speed: 1.5 },
    ],
    treasureDefs: [{ x: 350, y: 110 }, { x: 110, y: 435 }, { x: 560, y: 130 }, { x: 680, y: 260 }],
    exits: [{ side: "left", toRoom: 1 }],
  },

  // ── SECTOR 2 · Medium ────────────────────────────────────────────────────
  {
    name: "S2-R1",
    innerWalls: [
      [350,  80,  14, 180],
      [100, 260, 240,  14],
      [520, 200,  14, 180],
      [200, 380, 200,  14],
    ],
    enemyDefs: [
      { x: 200, y: 150, axis: "y", min:  90, max: 250, speed: 2.0 },
      { x: 480, y: 120, axis: "x", min: 375, max: 770, speed: 2.2 },
      { x: 650, y: 430, axis: "y", min: 280, max: 460, speed: 2.0 },
    ],
    treasureDefs: [{ x: 160, y: 130 }, { x: 450, y: 130 }, { x: 300, y: 330 }, { x: 690, y: 170 }],
    exits: [{ side: "right", toRoom: 4 }],
  },
  {
    name: "S2-R2",
    innerWalls: [
      [160, 100,  14, 200],
      [160, 100, 180,  14],
      [500, 200,  14, 200],
      [360, 390, 140,  14],
      [260, 310, 100,  14],
    ],
    enemyDefs: [
      { x:  90, y: 310, axis: "y", min: 120, max: 460, speed: 2.3 },
      { x: 320, y: 180, axis: "x", min: 190, max: 490, speed: 2.0 },
      { x: 620, y: 120, axis: "y", min:  80, max: 390, speed: 2.5 },
    ],
    treasureDefs: [{ x: 90, y: 140 }, { x: 680, y: 430 }, { x: 300, y: 240 }, { x: 570, y: 310 }],
    exits: [{ side: "left", toRoom: 3 }, { side: "right", toRoom: 5 }],
  },
  {
    name: "S2-R3",
    innerWalls: [
      [ 80, 120, 300,  14],
      [ 80, 120,  14, 160],
      [ 80, 280, 200,  14],
      [440, 180,  14, 220],
      [560, 320, 200,  14],
      [440, 400, 120,  14],
    ],
    enemyDefs: [
      { x: 200, y: 200, axis: "x", min: 110, max: 370, speed: 2.2 },
      { x: 350, y: 360, axis: "y", min: 300, max: 460, speed: 2.5 },
      { x: 580, y: 220, axis: "y", min: 100, max: 305, speed: 2.8 },
      { x: 690, y: 430, axis: "x", min: 580, max: 760, speed: 2.3 },
    ],
    treasureDefs: [{ x: 200, y: 80 }, { x: 400, y: 100 }, { x: 520, y: 450 }, { x: 720, y: 260 }, { x: 100, y: 400 }],
    exits: [{ side: "left", toRoom: 4 }],
  },

  // ── SECTOR 3 · Hard ──────────────────────────────────────────────────────
  {
    name: "S3-R1",
    innerWalls: [
      [200,  80,  14, 260],
      [200,  80, 210,  14],
      [540, 210,  14, 160],
      [540, 210, 140,  14],
      [300, 360, 160,  14],
    ],
    enemyDefs: [
      { x: 110, y: 180, axis: "y", min: 100, max: 330, speed: 2.5 },
      { x: 380, y: 155, axis: "x", min: 230, max: 520, speed: 2.8 },
      { x: 650, y: 300, axis: "y", min: 230, max: 460, speed: 3.0 },
      { x: 430, y: 440, axis: "x", min: 310, max: 760, speed: 2.7 },
    ],
    treasureDefs: [{ x: 100, y: 430 }, { x: 390, y: 55 }, { x: 660, y: 150 }, { x: 610, y: 440 }, { x: 250, y: 290 }],
    exits: [{ side: "right", toRoom: 7 }],
  },
  {
    name: "S3-R2",
    innerWalls: [
      [120, 200, 200,  14],
      [120,  80,  14, 200],
      [400, 300,  14, 160],
      [400, 300, 200,  14],
      [600, 100,  14, 200],
      [240, 380, 160,  14],
    ],
    enemyDefs: [
      { x: 220, y: 130, axis: "x", min: 140, max: 390, speed: 3.0 },
      { x:  90, y: 360, axis: "y", min: 220, max: 460, speed: 2.8 },
      { x: 520, y: 180, axis: "y", min: 100, max: 290, speed: 3.2 },
      { x: 700, y: 390, axis: "y", min: 310, max: 460, speed: 2.9 },
    ],
    treasureDefs: [{ x: 90, y: 130 }, { x: 260, y: 300 }, { x: 680, y: 240 }, { x: 360, y: 450 }, { x: 540, y: 80 }],
    exits: [{ side: "left", toRoom: 6 }, { side: "right", toRoom: 8 }],
  },
  {
    name: "S3-R3",
    innerWalls: [
      [160, 120, 280,  14],
      [160, 120,  14, 170],
      [160, 290, 170,  14],
      [480, 200,  14, 180],
      [480, 380, 200,  14],
      [560, 100,  14, 100],
    ],
    enemyDefs: [
      { x:  90, y: 220, axis: "y", min: 140, max: 460, speed: 3.0 },
      { x: 320, y: 180, axis: "x", min: 180, max: 470, speed: 3.3 },
      { x: 650, y: 150, axis: "y", min:  80, max: 390, speed: 3.5 },
      { x: 580, y: 440, axis: "x", min: 490, max: 760, speed: 3.0 },
      { x: 300, y: 420, axis: "x", min: 175, max: 470, speed: 3.2 },
    ],
    treasureDefs: [{ x: 90, y: 80 }, { x: 420, y: 80 }, { x: 700, y: 430 }, { x: 250, y: 390 }, { x: 560, y: 460 }, { x: 680, y: 300 }],
    exits: [{ side: "left", toRoom: 7 }],
  },
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
    const daemon  = { x: 0, y: 0, active: false, speed: 1.1, spawnAge: 0 };

    let roomStates = makeRoomStates();

    function makeRoomStates() {
      return ROOMS.map(r => ({
        enemies:   r.enemyDefs.map(e => ({ ...e, dir: 1, speed: e.speed * 1.4 })),
        treasures: r.treasureDefs.map(t => ({ ...t, collected: false })),
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
      daemon.speed  = 1.1 + idx * 0.35;
      daemon.x        = 0;
      daemon.y        = 0;
      daemon.spawnAge = 0;
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
      const room  = ROOMS[idx];
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
      for (const exit of ROOMS[roomIdx].exits) {
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
    function update() {
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
      player.x += mx * 3;
      player.y += my * 3;

      const walls = buildWalls(roomIdx);
      resolveWalls(walls);
      checkDoors();

      const rs = roomStates[roomIdx];
      for (const e of rs.enemies) {
        if (e.axis === "x") {
          e.x += e.speed * e.dir;
          if (e.x >= e.max || e.x <= e.min) { e.dir *= -1; e.x = Math.max(e.min, Math.min(e.max, e.x)); }
        } else {
          e.y += e.speed * e.dir;
          if (e.y >= e.max || e.y <= e.min) { e.dir *= -1; e.y = Math.max(e.min, Math.min(e.max, e.y)); }
        }
      }

      if (iframes > 0) {
        iframes--;
      } else {
        const pr = pRect();
        for (const e of rs.enemies) {
          if (overlap(pr, { x: e.x - E_SZ/2, y: e.y - E_SZ/2, w: E_SZ, h: E_SZ })) {
            lives--;
            iframes = 90;
            shakeFrames = 14;
            sndDeath();
            if (lives <= 0) { phase = "gameover"; return; }
            break;
          }
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
        daemon.x += (dx / dist) * daemon.speed;
        daemon.y += (dy / dist) * daemon.speed;
        if (overlap(pRect(), { x: daemon.x - D_SZ/2, y: daemon.y - D_SZ/2, w: D_SZ, h: D_SZ })) {
          sndDeath(); shakeFrames = 22;
          phase = "gameover";
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
      ctx.font = "11px monospace";
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
      ctx.font = "11px monospace";
      ctx.fillStyle = GREEN;
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = 10;
      for (let i = 0; i < art.length; i++) ctx.fillText(art[i], W / 2, 210 + i * 19);
      ctx.shadowBlur = 0;
      if (Math.floor(t / 520) % 2) {
        ctx.fillStyle = GREEN;
        ctx.font = "13px monospace";
        ctx.shadowColor = GREEN;
        ctx.shadowBlur = 8;
        ctx.fillText("TAP  ·  PRESS ENTER  ·  TO START", W / 2, 380);
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

      ctx.font = "bold 13px monospace";
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
      ctx.fillText(ROOMS[roomIdx].name, W - 16, 24);
      ctx.fillStyle = GREEN;
      ctx.fillText(`SEC ${sectorIdx + 1}/3  RM ${localRoom + 1}/3`, W - 16, 46);

      ctx.textAlign = "left";
    }

    // ── Room ────────────────────────────────────────────────────────────────
    function drawRoom(t) {
      const walls = buildWalls(roomIdx);
      const room  = ROOMS[roomIdx];

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
        const pipX = e.axis === "x" ? e.x + (e.dir > 0 ? s + 3 : -s - 5) : e.x;
        const pipY = e.axis === "y" ? e.y + (e.dir > 0 ? s + 3 : -s - 5) : e.y;
        ctx.fillRect(pipX, pipY, 2, 2);
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
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("⚠  DAEMON INCOMING — COLLECT ALL LOOT NOW  ⚠", W / 2, 20);
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

    // ── Restart ─────────────────────────────────────────────────────────────
    function restart() {
      phase      = "playing";
      sectorIdx  = 0;
      score      = 0;
      lives      = 3;
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

  const dpadHandlers = (key) => ({
    onPointerDown:   (e) => { e.preventDefault(); keysRef.current[key] = true;  },
    onPointerUp:     ()  => { keysRef.current[key] = false; },
    onPointerLeave:  ()  => { keysRef.current[key] = false; },
    onPointerCancel: ()  => { keysRef.current[key] = false; },
  });

  const btnBase = {
    background:               "rgba(0,255,160,0.12)",
    border:                   "1px solid rgba(0,255,160,0.55)",
    color:                    "#00ffa0",
    fontFamily:               "monospace",
    fontSize:                 "18px",
    width:                    "48px",
    height:                   "48px",
    display:                  "flex",
    alignItems:               "center",
    justifyContent:           "center",
    borderRadius:             "4px",
    boxShadow:                "0 0 10px rgba(0,255,160,0.3), inset 0 0 6px rgba(0,255,160,0.08)",
    cursor:                   "pointer",
    userSelect:               "none",
    touchAction:              "none",
    WebkitTapHighlightColor:  "transparent",
    flexShrink:               0,
  };

  return (
    <main className="min-h-screen bg-[#03050f] flex flex-col items-center justify-center py-2 sm:py-8 px-2 sm:px-4">
      <div className="mb-2 font-mono text-[#00ffa0] text-xs tracking-widest text-center">
        DAEMON.EXE &nbsp;·&nbsp; WASD / ARROWS / D-PAD &nbsp;·&nbsp; 3 SECTORS · 9 ROOMS · COLLECT ALL ◆
      </div>

      {/* Canvas wrapper — relative so D-pad can overlay it */}
      <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={560}
          style={{
            display:         "block",
            border:          "1px solid #00ffa0",
            imageRendering:  "pixelated",
            maxWidth:        "100%",
            maxHeight:       "calc(100svh - 110px)",
            width:           "auto",
            height:          "auto",
            touchAction:     "none",
          }}
        />

        {/* D-pad — bottom-left overlay */}
        <div style={{
          position:   "absolute",
          bottom:     "14px",
          left:       "14px",
          display:    "grid",
          gridTemplateColumns: "repeat(3, 48px)",
          gridTemplateRows:    "repeat(3, 48px)",
          gap:        "5px",
          touchAction: "none",
        }}>
          {/* Row 1 — Up only */}
          <div />
          <button {...dpadHandlers("ArrowUp")}    style={btnBase}>▲</button>
          <div />
          {/* Row 2 — Left · centre pip · Right */}
          <button {...dpadHandlers("ArrowLeft")}  style={btnBase}>◄</button>
          <div style={{ ...btnBase, background: "rgba(0,255,160,0.04)", cursor: "default", boxShadow: "none", border: "1px solid rgba(0,255,160,0.18)" }} />
          <button {...dpadHandlers("ArrowRight")} style={btnBase}>►</button>
          {/* Row 3 — Down only */}
          <div />
          <button {...dpadHandlers("ArrowDown")}  style={btnBase}>▼</button>
          <div />
        </div>
      </div>

      <div className="mt-2 font-mono text-[#00cc7a] text-xs text-center space-x-4">
        <span>◆ LOOT</span>
        <span>·</span>
        <span>✕ ENEMIES (AVOID)</span>
        <span>·</span>
        <span>► EXITS</span>
        <span>·</span>
        <span>[R] RESTART</span>
      </div>
    </main>
  );
}
