"use client";
import { useEffect, useRef } from "react";

// ─── Canvas / layout constants ───────────────────────────────────────────────
const W      = 800;
const H      = 560;
const HUD_H  = 60;
const GH     = H - HUD_H;   // game-area height: 500
const WALL   = 16;
const DOOR_W = 56;
const MX     = W / 2;       // room centre x
const MY     = GH / 2;      // room centre y

// ─── Palette ──────────────────────────────────────────────────────────────────
const GREEN   = "#00ffa0";
const DIM     = "#00cc7a";
const RED     = "#ff3060";
const BG      = "#03050f";
const SURFACE = "#060f0a";

// ─── Entity sizes ─────────────────────────────────────────────────────────────
const P_SZ = 20;   // player
const E_SZ = 20;   // enemy
const T_SZ = 10;   // treasure half-size
const D_SZ = 34;   // daemon

// ─── Room definitions ─────────────────────────────────────────────────────────
//  innerWalls : [x, y, w, h] in game-area coords
//  enemyDefs  : patrol segments; axis "x"|"y", dir starts at +1
//  treasureDefs: spawn positions
const ROOMS = [
  {
    name: "SECTOR-01",
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
    treasureDefs: [
      { x: 360, y: 130 },
      { x: 615, y: 160 },
      { x: 670, y: 400 },
    ],
    exits: [{ side: "right", toRoom: 1 }],
  },
  {
    name: "SECTOR-02",
    innerWalls: [
      [200, 120,  14, 190],
      [200, 120, 140,  14],
      [460, 310, 190,  14],
      [550, 190,  14, 120],
    ],
    enemyDefs: [
      { x: 110, y: 200, axis: "x", min:  50, max: 185, speed: 1.8 },
      { x: 390, y: 160, axis: "x", min: 230, max: 440, speed: 1.5 },
      { x: 660, y: 360, axis: "y", min: 200, max: 440, speed: 2.0 },
    ],
    treasureDefs: [
      { x: 100, y: 395 },
      { x: 360, y: 250 },
      { x: 650, y: 110 },
      { x: 470, y: 435 },
    ],
    exits: [
      { side: "left",  toRoom: 0 },
      { side: "down",  toRoom: 2 },
    ],
  },
  {
    name: "SECTOR-03",
    innerWalls: [
      [110, 160, 190,  14],
      [110, 160,  14, 190],
      [410, 110,  14, 170],
      [580, 290,  14, 170],
      [300, 380, 160,  14],
    ],
    enemyDefs: [
      { x: 210, y: 110, axis: "x", min: 140, max: 395, speed: 2.0 },
      { x: 510, y: 210, axis: "y", min:  90, max: 300, speed: 1.8 },
      { x: 650, y: 395, axis: "x", min: 610, max: 760, speed: 2.3 },
      { x: 160, y: 390, axis: "y", min: 360, max: 460, speed: 1.6 },
    ],
    treasureDefs: [
      { x: 350, y: 110 },
      { x: 110, y: 435 },
      { x: 560, y: 130 },
      { x: 680, y: 260 },
      { x: 420, y: 435 },
      { x: 260, y: 260 },
    ],
    exits: [{ side: "up", toRoom: 1 }],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function GamePage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // ── Mutable game state (plain vars inside closure) ──────────────────────
    let phase    = "playing";   // "playing" | "gameover" | "win"
    let roomIdx  = 0;
    let score    = 0;
    let lives    = 3;
    let timer    = 120;
    let lastTick = performance.now();
    let iframes  = 0;           // invincibility frames after enemy hit

    const player = { x: WALL + 34, y: MY };

    const daemon = { x: 0, y: 0, active: false, speed: 1.1 };

    // Per-room mutable state (enemies + treasures)
    let roomStates = makeRoomStates();

    function makeRoomStates() {
      return ROOMS.map(r => ({
        enemies:   r.enemyDefs.map(e => ({ ...e, dir: 1 })),
        treasures: r.treasureDefs.map(t => ({ ...t, collected: false })),
      }));
    }

    // ── Input ──────────────────────────────────────────────────────────────
    const keys = {};
    const onDown = e => { keys[e.key] = true; };
    const onUp   = e => { keys[e.key] = false; };
    const onR    = e => {
      if ((e.key === "r" || e.key === "R") && phase !== "playing") restart();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    window.addEventListener("keydown", onR);

    // ── Geometry helpers ───────────────────────────────────────────────────
    function overlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x &&
             a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function pRect() {
      return { x: player.x - P_SZ / 2, y: player.y - P_SZ / 2, w: P_SZ, h: P_SZ };
    }

    // Build wall rects for a given room (border + inner)
    function buildWalls(idx) {
      const room  = ROOMS[idx];
      const exits = new Set(room.exits.map(e => e.side));
      const out   = [];

      // Border wall segments with door gaps
      const borders = [
        { side: "left",  bx: 0,       by: 0,       bw: WALL, bh: GH,   mid: MY, horiz: false },
        { side: "right", bx: W - WALL, by: 0,       bw: WALL, bh: GH,   mid: MY, horiz: false },
        { side: "up",    bx: 0,       by: 0,       bw: W,    bh: WALL, mid: MX, horiz: true  },
        { side: "down",  bx: 0,       by: GH-WALL, bw: W,    bh: WALL, mid: MX, horiz: true  },
      ];

      for (const b of borders) {
        if (!exits.has(b.side)) {
          out.push({ x: b.bx, y: b.by, w: b.bw, h: b.bh });
        } else {
          const half = DOOR_W / 2;
          if (b.horiz) {
            // gap in x
            out.push({ x: b.bx,            y: b.by, w: b.mid - half,         h: b.bh });
            out.push({ x: b.mid + half,     y: b.by, w: W - b.mid - half,     h: b.bh });
          } else {
            // gap in y
            out.push({ x: b.bx, y: b.by,            w: b.bw, h: b.mid - half       });
            out.push({ x: b.bx, y: b.mid + half,     w: b.bw, h: GH - b.mid - half });
          }
        }
      }

      // Inner walls
      for (const [x, y, w, h] of room.innerWalls) out.push({ x, y, w, h });

      return out;
    }

    // Push player out of walls (3 iterations to handle corners)
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
        if (side === "right" && player.x > W - WALL - 3       && Math.abs(player.y - MY) < hw) { enterRoom(toRoom, "left");  return; }
        if (side === "left"  && player.x < WALL + 3           && Math.abs(player.y - MY) < hw) { enterRoom(toRoom, "right"); return; }
        if (side === "down"  && player.y > GH - WALL - 3      && Math.abs(player.x - MX) < hw) { enterRoom(toRoom, "up");    return; }
        if (side === "up"    && player.y < WALL + 3           && Math.abs(player.x - MX) < hw) { enterRoom(toRoom, "down");  return; }
      }
    }

    function enterRoom(idx, fromSide) {
      roomIdx = idx;
      if (fromSide === "left")  { player.x = WALL + P_SZ; player.y = MY; }
      if (fromSide === "right") { player.x = W - WALL - P_SZ; player.y = MY; }
      if (fromSide === "up")    { player.x = MX; player.y = WALL + P_SZ; }
      if (fromSide === "down")  { player.x = MX; player.y = GH - WALL - P_SZ; }
      // Daemon teleports to corner and speeds up each room change
      if (daemon.active) {
        daemon.x = WALL + 8;
        daemon.y = WALL + 8;
        daemon.speed = Math.min(daemon.speed + 0.3, 3.5);
      }
    }

    // ── Update ─────────────────────────────────────────────────────────────
    function update() {
      if (phase !== "playing") return;

      // Countdown timer (1 tick per second)
      const now = performance.now();
      if (now - lastTick >= 1000) {
        lastTick = now;
        if (timer > 0) timer--;
        if (timer === 0 && !daemon.active) {
          daemon.active = true;
          daemon.x = WALL + 8;
          daemon.y = WALL + 8;
        }
      }

      // Player movement
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

      // Enemy patrol
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

      // Enemy collision (with invincibility window)
      if (iframes > 0) {
        iframes--;
      } else {
        const pr = pRect();
        for (const e of rs.enemies) {
          if (overlap(pr, { x: e.x - E_SZ/2, y: e.y - E_SZ/2, w: E_SZ, h: E_SZ })) {
            lives--;
            iframes = 90;
            if (lives <= 0) { phase = "gameover"; return; }
            break;
          }
        }
      }

      // Treasure pickup
      const pr = pRect();
      for (const t of rs.treasures) {
        if (t.collected) continue;
        if (overlap(pr, { x: t.x - T_SZ, y: t.y - T_SZ, w: T_SZ * 2, h: T_SZ * 2 })) {
          t.collected = true;
          score += 10;
        }
      }

      // Win: all rooms cleared
      if (roomStates.every(s => s.treasures.every(t => t.collected))) {
        score += 200;
        phase = "win";
        return;
      }

      // Daemon chase
      if (daemon.active) {
        const dx = player.x - daemon.x;
        const dy = player.y - daemon.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        daemon.x += (dx / dist) * daemon.speed;
        daemon.y += (dy / dist) * daemon.speed;
        if (overlap(pRect(), { x: daemon.x - D_SZ/2, y: daemon.y - D_SZ/2, w: D_SZ, h: D_SZ })) {
          phase = "gameover";
        }
      }
    }

    // ── Draw ───────────────────────────────────────────────────────────────
    function draw() {
      const t = Date.now();

      // Full background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      drawHUD(t);

      // Game world offset by HUD height
      ctx.save();
      ctx.translate(0, HUD_H);

      // Floor
      ctx.fillStyle = SURFACE;
      ctx.fillRect(0, 0, W, GH);

      // Subtle scanlines
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

      // Screen-space overlays
      if (timer > 0 && timer <= 30 && !daemon.active) drawWarning(t);
      if (phase === "gameover") drawOverlay("GAME OVER",  RED,   `SCORE  ${String(score).padStart(6,"0")}`, "PRESS [R] TO RESTART");
      if (phase === "win")      drawOverlay("ESCAPED!",   GREEN, `SCORE  ${String(score).padStart(6,"0")}  +200 BONUS`, "PRESS [R] TO PLAY AGAIN");
    }

    // ── HUD ─────────────────────────────────────────────────────────────────
    function drawHUD(t) {
      ctx.fillStyle = "#0a1a0e";
      ctx.fillRect(0, 0, W, HUD_H);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, HUD_H - 1);

      // Vertical dividers
      ctx.strokeStyle = "rgba(0,255,160,0.18)";
      [W/2 - 115, W/2 + 105].forEach(lx => {
        ctx.beginPath(); ctx.moveTo(lx, 10); ctx.lineTo(lx, HUD_H - 10); ctx.stroke();
      });

      const rs  = roomStates[roomIdx];
      const col = rs.treasures.filter(x => x.collected).length;
      const tot = rs.treasures.length;
      const timerColor = (timer <= 30 && Math.floor(t / 350) % 2) ? RED : (timer <= 30 ? "#ff8040" : GREEN);

      ctx.font = "bold 13px monospace";
      ctx.textAlign = "left";

      // Left panel: score + lives
      ctx.fillStyle = GREEN;
      ctx.fillText(`SCORE  ${String(score).padStart(6, "0")}`, 16, 24);
      ctx.fillStyle = lives <= 1 ? RED : GREEN;
      ctx.fillText(`LIVES  ${"♥".repeat(lives)}${"♡".repeat(Math.max(0, 3 - lives))}`, 16, 46);

      // Centre panel: timer + loot
      ctx.textAlign = "center";
      ctx.fillStyle = timerColor;
      ctx.fillText(`TIME  ${String(timer).padStart(3, "0")}s`, W / 2, 24);
      ctx.fillStyle = col === tot ? GREEN : DIM;
      ctx.fillText(`LOOT  ${col} / ${tot}`, W / 2, 46);

      // Right panel: room name + number
      ctx.fillStyle = DIM;
      ctx.fillText(ROOMS[roomIdx].name, W - 80, 24);
      ctx.fillStyle = GREEN;
      ctx.fillText(`ROOM  ${roomIdx + 1} / 3`, W - 80, 46);

      ctx.textAlign = "left";
    }

    // ── Room ────────────────────────────────────────────────────────────────
    function drawRoom(t) {
      const walls = buildWalls(roomIdx);
      const room  = ROOMS[roomIdx];

      // Grid lines
      ctx.strokeStyle = "rgba(0,255,160,0.05)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GH); ctx.stroke(); }
      for (let y = 0; y < GH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Wall blocks
      for (const w of walls) {
        ctx.fillStyle = "#0d2619";
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
        // Hatch decoration (capped to keep it fast)
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

      // Door glows + arrows
      const pulse = Math.sin(t / 600) * 0.12 + 0.18;
      for (const exit of room.exits) {
        let dx, dy, dw, dh;
        if (exit.side === "left")  { dx = 0;        dy = MY - DOOR_W/2; dw = WALL;   dh = DOOR_W; }
        if (exit.side === "right") { dx = W - WALL;  dy = MY - DOOR_W/2; dw = WALL;   dh = DOOR_W; }
        if (exit.side === "up")    { dx = MX - DOOR_W/2; dy = 0;         dw = DOOR_W; dh = WALL;   }
        if (exit.side === "down")  { dx = MX - DOOR_W/2; dy = GH - WALL; dw = DOOR_W; dh = WALL;   }
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
        // Sparkle centre
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
        // Outer box
        ctx.strokeRect(e.x - s, e.y - s, E_SZ, E_SZ);
        // X mark
        ctx.beginPath();
        ctx.moveTo(e.x - s + 4, e.y - s + 4); ctx.lineTo(e.x + s - 4, e.y + s - 4);
        ctx.moveTo(e.x + s - 4, e.y - s + 4); ctx.lineTo(e.x - s + 4, e.y + s - 4);
        ctx.stroke();
        // Red "eyes"
        ctx.fillStyle = "#ff3060";
        ctx.fillRect(e.x - 5, e.y - 4, 3, 3);
        ctx.fillRect(e.x + 2, e.y - 4, 3, 3);
        // Direction pip
        const pipX = e.axis === "x" ? e.x + (e.dir > 0 ? s + 3 : -s - 5) : e.x;
        const pipY = e.axis === "y" ? e.y + (e.dir > 0 ? s + 3 : -s - 5) : e.y;
        ctx.fillRect(pipX, pipY, 2, 2);
      }
    }

    // ── Daemon ──────────────────────────────────────────────────────────────
    function drawDaemon(t) {
      const s     = D_SZ / 2;
      const pulse = Math.sin(t / 180) * 0.5 + 0.5;

      // Outer glow
      ctx.shadowColor = "#ff0050";
      ctx.shadowBlur  = 22 + pulse * 16;

      // Body
      ctx.strokeStyle = `rgb(255,${Math.floor(pulse * 64)},80)`;
      ctx.lineWidth   = 3;
      ctx.strokeRect(daemon.x - s, daemon.y - s, D_SZ, D_SZ);

      // Inner cross
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(daemon.x - s, daemon.y); ctx.lineTo(daemon.x + s, daemon.y);
      ctx.moveTo(daemon.x, daemon.y - s); ctx.lineTo(daemon.x, daemon.y + s);
      ctx.stroke();

      // Eyes
      ctx.fillStyle = "#ff0050";
      ctx.fillRect(daemon.x - 9, daemon.y - 7, 7, 7);
      ctx.fillRect(daemon.x + 2, daemon.y - 7, 7, 7);

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      // Label above
      ctx.fillStyle = "#ff0050";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("DAEMON", daemon.x, daemon.y - s - 5);
      ctx.textAlign = "left";
    }

    // ── Player ──────────────────────────────────────────────────────────────
    function drawPlayer(t) {
      // Blink during invincibility
      if (iframes > 0 && Math.floor(iframes / 5) % 2 === 0) return;

      const s = P_SZ / 2;
      ctx.shadowColor = GREEN;
      ctx.shadowBlur  = 12;
      ctx.strokeStyle = GREEN;
      ctx.lineWidth   = 2;
      ctx.strokeRect(player.x - s, player.y - s, P_SZ, P_SZ);

      // Antenna
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - s);
      ctx.lineTo(player.x, player.y - s - 7);
      ctx.stroke();
      ctx.fillStyle = GREEN;
      ctx.fillRect(player.x - 2, player.y - s - 9, 4, 4);

      // Core
      ctx.fillRect(player.x - 2, player.y - 2, 4, 4);

      ctx.shadowBlur  = 0;
      ctx.shadowColor = "transparent";
    }

    // ── Warning flash (timer ≤ 30) ──────────────────────────────────────────
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
      phase    = "playing";
      roomIdx  = 0;
      score    = 0;
      lives    = 3;
      timer    = 120;
      lastTick = performance.now();
      iframes  = 0;
      player.x = WALL + 34;
      player.y = MY;
      daemon.active = false;
      daemon.speed  = 1.1;
      daemon.x      = 0;
      daemon.y      = 0;
      roomStates = makeRoomStates();
    }

    // ── Game loop ───────────────────────────────────────────────────────────
    let raf;
    function loop() {
      update();
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup",   onUp);
      window.removeEventListener("keydown", onR);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#03050f] flex flex-col items-center justify-center py-8 px-4">
      <div className="mb-3 font-mono text-[#00ffa0] text-xs tracking-widest text-center">
        DUNGEON.EXE &nbsp;·&nbsp; MOVE: WASD / ARROW KEYS &nbsp;·&nbsp; COLLECT ALL ◆ BEFORE THE DAEMON ARRIVES
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={560}
        style={{ display: "block", border: "1px solid #00ffa0", imageRendering: "pixelated", maxWidth: "100%" }}
      />

      <div className="mt-3 font-mono text-[#00cc7a] text-xs text-center space-x-4">
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
