/*
 * Portada interactiva de Maison Dulce — «la mesa de pastelería viva» (versión 2: física real).
 * - Entrada: los elementos caen desde arriba, rebotan y se asientan; cada uno suelta un destello dorado al aterrizar.
 * - PC: se pueden AGARRAR con el mouse, arrastrar y LANZAR. Ruedan, chocan entre ellos (el macaron manda a la torta), rebotan en los bordes
 *   y, si los dejas quietos unos segundos, vuelven despacio a su lugar. Si pasas el mouse rápido por encima, los empujas.
 * - Celular: pasar el dedo rápido empuja las piezas livianas; tocar una pieza hace saltar brillos dorados y pétalos.
 * - Los pétalos del fondo huyen del cursor como si hubiera viento. Sin movimiento cuando no se toca nada (salvo los pétalos).
 * El título, el subtítulo y los botones siguen siendo texto normal de la página.
 */
(function () {
  'use strict';
  var hero = document.getElementById('hero');
  var stage = document.getElementById('portada-stage');
  var cv = document.getElementById('portada-fx');
  if (!hero || !stage || !cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Elementos ----------
     d = composición de PC sobre la foto original de 1672 x 941 (cx, cy = centro; size = diámetro del objeto)
     m = composición de celular sobre un marco de 390 x 640
     f = medidas del archivo (img/medidas.json): w, h del archivo y ancho del objeto sin margen
     rot = giro de reposo en grados */
  var CFG = [
    // Tortas grandes HUNDIDAS (sink): solo se ve su parte de arriba, como en la foto. Si las arrastras hacia arriba se ven completas.
    { id: 'torta-izquierda', f: { w: 1100, h: 1111, o: 846 }, d: { cx: 45,   cy: 820, size: 600 }, rot: 2,  wl: 0.12, z: 9, sink: true },
    { id: 'torta-rosa',      f: { w: 1081, h: 1139, o: 831 }, d: { cx: 595,  cy: 800, size: 490 }, m: { cx: 105, cy: 665, size: 250 }, rot: -3, sink: true },
    { id: 'torta-crema',     f: { w: 1040, h: 1056, o: 800 }, d: { cx: 1430, cy: 815, size: 470 }, m: { cx: 300, cy: 664, size: 240 }, rot: 4,  sink: true },
    // la ramita: solo asoman sus florecitas entre las tortas (fija, no se mueve)
    { id: 'gypsophila-punta', f: { w: 470, h: 472, o: 362 }, d: { cx: 372, cy: 660, size: 170 }, rot: -8, fijo: true, z: 5 },
    // izquierda
    { id: 'peonia', f: { w: 479, h: 550, o: 369 }, d: { cx: 78, cy: 250, size: 170 }, rot: 0, tall: true },
    { id: 'cupcake-rosa', f: { w: 491, h: 495, o: 377 }, d: { cx: 92, cy: 432, size: 175 }, m: { cx: 52, cy: 430, size: 84 }, rot: 0 },
    { id: 'flor-pequena', f: { w: 200, h: 209, o: 154 }, d: { cx: 232, cy: 435, size: 70 }, rot: 0 },
    { id: 'arandano', f: { w: 130, h: 130, o: 100 }, d: { cx: 180, cy: 338, size: 38 }, rot: 0 },
    // los dos macarons de la izquierda: ahora son DOS piezas separadas (el rosa apoyado sobre el crema)
    { id: 'macaron-izq-crema', img: 'macaron-crema', f: { w: 349, h: 355, o: 269 }, d: { cx: 300, cy: 525, size: 125 }, m: { cx: 150, cy: 405, size: 70 }, rot: -12, flip: true, rk: 0.5 },
    { id: 'macaron-izq-rosa', img: 'macaron-rosa', f: { w: 419, h: 432, o: 323 }, d: { cx: 378, cy: 478, size: 150 }, m: { cx: 205, cy: 478, size: 92 }, rot: -28, flip: true, rk: 0.5 },
    // derecha
    // el hueco del centro: una taza de té (pieza móvil como las demás)
    { id: 'taza-te', f: { w: 520, h: 534, o: 400 }, d: { cx: 1010, cy: 612, size: 190 }, rot: 8, lento: 0.25 },     // lleva líquido: se mueve al 25 %, sin rodar
    { id: 'macaron-rosa-oro', f: { w: 349, h: 350, o: 269 }, d: { cx: 1282, cy: 590, size: 125 }, m: { cx: 330, cy: 455, size: 76 }, rot: -5 },
    { id: 'cupcake-crema', f: { w: 435, h: 439, o: 335 }, d: { cx: 1405, cy: 520, size: 155 }, m: { cx: 255, cy: 392, size: 74 }, rot: 3 },
    { id: 'capullo', f: { w: 349, h: 352, o: 269 }, d: { cx: 1467, cy: 388, size: 125 }, rot: 6 },
    // plato FIJO (no se mueve) con sus piezas encima: se pueden sacar y siempre vuelven a su plato
    { id: 'plato-derecho', f: { w: 761, h: 766, o: 585 }, d: { cx: 1655, cy: 520, size: 330 }, rot: 0, fijo: true, z: 6 },
    { id: 'frambuesa', f: { w: 210, h: 202, o: 162 }, d: { cx: 1605, cy: 412, size: 75 }, rot: 20 },
    { id: 'macaron-plato-1', img: 'macaron-rosa-oro', f: { w: 349, h: 350, o: 269 }, d: { cx: 1565, cy: 510, size: 112 }, rot: 30, flip: true, rk: 0.6 },
    { id: 'macaron-plato-2', img: 'macaron-crema', f: { w: 349, h: 355, o: 269 }, d: { cx: 1642, cy: 497, size: 100 }, rot: -15, flip: true, rk: 0.6 },
    { id: 'macaron-plato-3', img: 'macaron-rosa-oro', f: { w: 349, h: 350, o: 269 }, d: { cx: 1628, cy: 610, size: 112 }, rot: 100, rk: 0.6 }
  ];

  var xK = 1, items = [], W = 0, H = 0, mobile = false, S = 1, offX = 0, frameH = 941;
  var pointer = { x: 0, y: 0, active: false, vx: 0, vy: 0, t: 0, type: 'mouse' };
  var drag = null;
  var phase = 'entrada', phaseT = 0;
  var running = false, raf = 0, last = 0, visible = true, started = false;
  var particles = [], petals = [], pairT = {};

  CFG.forEach(function (c, i) {
    var img = document.createElement('img');
    img.className = 'p-item';
    img.src = 'img/' + (c.img || c.id) + '.webp';
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    var zz = c.z != null ? c.z : 10 + i;
    var sh = document.createElement('img');                 // sombra aparte: no gira con la pieza, siempre cae hacia abajo
    sh.className = 'p-item p-shadow';
    sh.src = 'img/' + (c.img || c.id) + '-s.webp';
    sh.alt = ''; sh.decoding = 'async'; sh.draggable = false;
    sh.style.zIndex = String(zz * 2);
    img.style.zIndex = String(zz * 2 + 1);
    stage.appendChild(sh);
    stage.appendChild(img);
    items.push({ c: c, el: img, sh: sh, on: true, hx: 0, hy: 0, w: 0, h: 0, r: 50, m: 1, x: 0, y: 0, vx: 0, vy: 0, ang: 0, sc: 1, vs: 0,
      delay: 0.04 + (i % 10) * 0.07, started: false, landed: false, settled: false, idle: 0, grabbed: false, z: c.z != null ? c.z : 10 + i, fijo: !!c.fijo });
  });

  function op(it, v) { it.el.style.opacity = v; it.sh.style.opacity = v; }
  function setZ(it, z) { it.z = z; it.sh.style.zIndex = String(z * 2); it.el.style.zIndex = String(z * 2 + 1); }

  /* ---------- Medidas ---------- */
  function layout() {
    W = hero.clientWidth; H = hero.clientHeight;
    mobile = W < 900;
    // El tamaño de las piezas depende del ancho Y del alto disponible: así la portada nunca se pasa de la primera pantalla.
    // Zona de texto arriba ≈ 370 px; las piezas ocupan lo que queda (421 px de la foto original en PC; el marco de 640 px en celular).
    if (mobile) { S = Math.min(Math.min(W, 520) / 390, H / 640); offX = (W - 390 * S) / 2; frameH = 640; xK = S; }
    else {
      // La portada de PC enseña la parte de arriba de la foto (hasta 680 de sus 941 px): por eso las tortas quedan hundidas.
      S = Math.max(0.3, Math.min(W / 1672, H / 680)); offX = 0; frameH = 941; xK = W / 1672;
    }
    items.forEach(function (it) {
      var c = mobile ? it.c.m : it.c.d;
      it.on = !!c;
      it.el.style.display = c ? '' : 'none'; it.sh.style.display = c ? '' : 'none';
      if (!c) return;
      var objPx = c.size * S;
      it.w = objPx * it.c.f.w / it.c.f.o;
      it.h = it.w * it.c.f.h / it.c.f.w;
      it.el.style.width = it.w + 'px'; it.sh.style.width = it.w + 'px';
      it.hx = offX + c.cx * xK;
      it.hy = mobile ? H - (frameH - c.cy) * S : c.cy * S;
      it.off = objPx * 0.035;                                                     // cuánto cae la sombra hacia abajo
      it.r = objPx / 2 * (it.c.rk || 0.9);
      it.wl = it.c.wl != null ? it.c.wl : 0.7;
      it.m = it.r * it.r / 1000 * (it.c.lento ? 2 : 1);
      // el lugar de reposo nunca puede quedar fuera de los bordes de la mesa (en pantallas anchas la portada es más baja que la foto)
      it.bt = it.c.sink ? it.hy + it.r * 0.35 : H - it.r * 0.4;                    // las tortas hundidas pueden quedar con casi todo el cuerpo fuera
      it.top = it.c.tall ? Math.max(it.r * 0.85, it.h * 0.42) : it.r * 0.85;       // la peonía es alta (con tallo): no debe cortarse arriba
      if (!it.fijo) it.hx = Math.min(W - it.r * 0.7, Math.max(it.r * it.wl, it.hx));
      if (!it.fijo) it.hy = Math.min(it.bt, Math.max(it.top, it.hy));
      if (phase !== 'entrada' || !started) { it.x = it.hx; it.y = it.hy; it.vx = it.vy = 0; }
    });
    relajarLugares();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!petals.length) initPetals();
    draw();
  }

  /* En pantallas anchas o angostas algunas piezas podrían quedar encimadas en su lugar de reposo: se separan aquí para que al empezar a jugar no den un saltito. */
  function relajarLugares() {
    var n, i, j, a, b;
    for (n = 0; n < 12; n++) {
      for (i = 0; i < items.length; i++) for (j = i + 1; j < items.length; j++) {
        a = items[i]; b = items[j]; if (!a.on || !b.on || a.fijo || b.fijo) continue;
        var dx = b.hx - a.hx, dy = b.hy - a.hy, d = Math.sqrt(dx * dx + dy * dy) || 0.01, min = a.r + b.r + 2;
        if (d >= min) continue;
        var over = min - d, wa = 1 / a.m, wb = 1 / b.m, ws = wa + wb;
        a.hx -= dx / d * over * wa / ws; a.hy -= dy / d * over * wa / ws;
        b.hx += dx / d * over * wb / ws; b.hy += dy / d * over * wb / ws;
      }
      items.forEach(function (it) {
        if (!it.on) return;
        if (!it.fijo) it.hx = Math.min(W - it.r * 0.7, Math.max(it.r * it.wl, it.hx));
        if (!it.fijo) it.hy = Math.min(it.bt, Math.max(it.top, it.hy));
      });
    }
    items.forEach(function (it) { if (it.on && (phase !== 'entrada' || !started)) { it.x = it.hx; it.y = it.hy; } });
  }

  function initPetals() {
    var n = mobile ? 6 : 10;
    for (var i = 0; i < n; i++) petals.push(newPetal(true));
  }
  function newPetal(anywhere) {
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : -20, vy: 14 + Math.random() * 16, vx: 0, sway: 14 + Math.random() * 20,
      ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 1.2, s: (7 + Math.random() * 6) * Math.max(S, 0.8) * (mobile ? 1.1 : 1), a: 0.55 + Math.random() * 0.3 };
  }

  /* ---------- Entrada (caída) ---------- */
  function startDrop(t) {
    started = true; phase = 'entrada'; phaseT = t;
    items.forEach(function (it) {
      if (!it.on) return;
      if (it.fijo) { it.x = it.hx; it.y = it.hy; it.vx = it.vy = 0; it.ang = 0; it.started = false; it.landed = it.settled = true; op(it, '0'); return; }
      it.x = it.hx + (Math.random() - 0.5) * 60 * S;
      it.y = -(it.r + 30 + Math.random() * 40);
      it.vx = (Math.random() - 0.5) * 120; it.vy = 0; it.ang = (Math.random() - 0.5) * 40;
      it.started = false; it.landed = false; it.settled = false; it.idle = 0;
      op(it, '0');
    });
  }

  /* ---------- Física ---------- */
  var K = 52, C = 8.2;                 // entrada: resorte hacia su lugar y amortiguación (rebota)
  function impact(x, y, n) { burst(x, y, n, true); }

  function step(dt, t) {
    var i, j, a, b, allLanded = true;
    // --- movimiento ---
    for (i = 0; i < items.length; i++) {
      a = items[i]; if (!a.on) continue;
      if (a.fijo) { if (!a.started && phase === 'entrada' && t - phaseT >= a.delay + 0.5) { a.started = true; op(a, '1'); } if (!a.started && phase === 'entrada') allLanded = false; continue; }
      var py0 = a.y;
      if (phase === 'entrada') {
        if (!a.started) {
          if (t - phaseT < a.delay) { allLanded = false; continue; }
          a.started = true; op(a, '1');
        }
        if (a.settled) { a.vy = 0; a.y = a.hy; }                   // ya aterrizó: se queda quieta (antes seguía «cayendo» y luego pegaba un salto)
        else a.vy += 5600 * S * dt;                                // gravedad: caen y rebotan
        a.vx += (60 * (a.hx - a.x) - 14 * a.vx) * dt;               // y se acomodan de lado sin balancearse
      } else if (!a.grabbed) {
        // libre: sin resorte; fricción de mesa; si lleva rato quieto, vuelve despacio a su lugar
        a.idle += dt;
        var f = Math.exp((a.c.lento ? -3.4 : -2.2) * dt);
        a.vx *= f; a.vy *= f;
        if (a.idle > 2.6) {
          var k = Math.min(1, (a.idle - 2.6) / 1.2) * 9;
          a.vx += (k * (a.hx - a.x) - 4.4 * Math.sqrt(k) * a.vx * 0.55) * dt;
          a.vy += (k * (a.hy - a.y) - 4.4 * Math.sqrt(k) * a.vy * 0.55) * dt;
        }
      }
      if (a.grabbed && drag) {
        var tx = pointer.x + drag.ox, ty = pointer.y + drag.oy;
        var ks = a.c.lento ? 22 * a.c.lento : 22, cap = a.c.lento ? 3200 * a.c.lento : 3200;
        a.vx = Math.max(-cap, Math.min(cap, (tx - a.x) * ks));
        a.vy = Math.max(-cap, Math.min(cap, (ty - a.y) * ks));
        a.idle = 0;
      }
      var vmax = (2600 / (1 + a.m / 6)) * (a.c.lento || 1), sp = Math.hypot(a.vx, a.vy);
      if (!a.grabbed && phase !== 'entrada' && sp > vmax) { a.vx *= vmax / sp; a.vy *= vmax / sp; }
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (phase === 'entrada' && a.started && !a.settled) {
        if (a.y >= a.hy && a.vy > 0) {                              // toca la mesa: rebota (cada vez menos) y se queda
          a.y = a.hy;
          if (!a.landed) { a.landed = true; impact(a.x, a.hy + a.r * 0.15, 9); }
          a.vy = -a.vy * 0.34;
          if (a.vy > -110) { a.vy = 0; a.settled = true; }
        }
        if (!a.settled) allLanded = false;
      }
      // rueda mientras se desliza; vuelve a su giro de reposo al regresar a su lugar
      if (!a.c.lento) a.ang += a.vx / a.r * dt * 57.3 * 0.45;
      if (phase === 'entrada' || (!a.grabbed && a.idle > 2.6)) a.ang += (0 - a.ang) * Math.min(1, dt * 3.2);
      a.vs += (-120 * (a.sc - 1) - 10 * a.vs) * dt; a.sc += a.vs * dt;
    }
    if (phase === 'entrada') {
      if ((allLanded && t - phaseT > 0.3) || t - phaseT > 3.5) {
        phase = 'libre';
        items.forEach(function (it) { it.idle = 0; if (it.on) { it.x = it.hx; it.y = it.hy; it.vx = 0; it.vy = 0; } });
      }
    } else {
      // --- choques entre piezas ---
      for (i = 0; i < items.length; i++) for (j = i + 1; j < items.length; j++) {
        a = items[i]; b = items[j]; if (!a.on || !b.on || a.fijo || b.fijo) continue;
        var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy), min = a.r + b.r, key = i * 32 + j;
        if (d >= min || d < 0.001) { pairT[key] = 0; continue; }
        pairT[key] = (pairT[key] || 0) + dt;
        if (pairT[key] > 0.9) continue;                                         // trabadas: se atraviesan hasta separarse
        if (!a.grabbed && !b.grabbed && a.idle > 2.6 && b.idle > 2.6) continue;  // las dos van de regreso: no se estorban
        var nx = dx / d, ny = dy / d, over = min - d;
        var ia = 1 / (a.grabbed ? a.m * 10 : a.m), ib = 1 / (b.grabbed ? b.m * 10 : b.m), s = ia + ib;
        a.x -= nx * over * ia / s; a.y -= ny * over * ia / s;
        b.x += nx * over * ib / s; b.y += ny * over * ib / s;
        var rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel < 0) {
          var imp = -(1 + 0.7) * rel / s;
          a.vx -= imp * ia * nx; a.vy -= imp * ia * ny; b.vx += imp * ib * nx; b.vy += imp * ib * ny;
          if (-rel > 60) { a.idle = 0; b.idle = 0; }
          if (-rel > 260) impact(a.x + nx * a.r, a.y + ny * a.r, Math.min(10, 3 + (-rel / 200) | 0));
        }
      }
      // --- bordes de la mesa ---
      for (i = 0; i < items.length; i++) {
        a = items[i]; if (!a.on || a.fijo) continue;
        var l = a.r * a.wl, rr = W - a.r * 0.7, tp = a.top, bt = a.bt;
        if (a.x < l) { a.x = l; a.vx = Math.abs(a.vx) * 0.72; a.idle = 0; }
        if (a.x > rr) { a.x = rr; a.vx = -Math.abs(a.vx) * 0.72; a.idle = 0; }
        if (a.y < tp) { a.y = tp; a.vy = Math.abs(a.vy) * 0.72; a.idle = 0; }
        if (a.y > bt) { a.y = bt; a.vy = -Math.abs(a.vy) * 0.72; a.idle = 0; }
      }
    }
    // --- pétalos (huyen del cursor) y destellos ---
    petals.forEach(function (p) {
      if (pointer.active) {
        var qx = p.x - pointer.x, qy = p.y - pointer.y, qd = Math.sqrt(qx * qx + qy * qy) || 1;
        if (qd < 150 * Math.max(S, 0.8)) { var w = (1 - qd / (150 * Math.max(S, 0.8))); p.vx += qx / qd * w * 520 * dt; p.y += qy / qd * w * 90 * dt; }
      }
      p.vx *= Math.exp(-1.4 * dt);
      p.y += p.vy * dt; p.ph += dt * 0.9; p.x += (Math.sin(p.ph) * p.sway + p.vx) * dt; p.rot += p.vr * dt;
      if (p.y > H + 24 || p.x < -60 || p.x > W + 60) Object.assign(p, newPetal(false));
    });
    for (i = particles.length - 1; i >= 0; i--) {
      var q = particles[i]; q.life -= dt;
      if (q.life <= 0) { particles.splice(i, 1); continue; }
      q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
    }
  }

  /* ---------- Dibujo ---------- */
  function petalPath(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.8, s * 0.7, 0, s);
    ctx.bezierCurveTo(-s * 0.8, s * 0.7, -s * 0.9, -s * 0.6, 0, -s);
    ctx.closePath();
  }
  function star(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s); ctx.lineTo(s * 0.28, -s * 0.28); ctx.lineTo(s, 0); ctx.lineTo(s * 0.28, s * 0.28);
    ctx.lineTo(0, s); ctx.lineTo(-s * 0.28, s * 0.28); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.28, -s * 0.28);
    ctx.closePath();
  }
  function draw() {
    items.forEach(function (it) {
      if (!it.on) return;
      // la sombra tiene la MISMA silueta y el MISMO giro que la pieza; solo se corre hacia abajo en la pantalla (la traslación va fuera del giro)
      it.sh.style.transform = 'translate3d(' + (it.x - it.w / 2).toFixed(1) + 'px,' + (it.y - it.h / 2 + it.off * it.sc).toFixed(1) + 'px,0) rotate(' + (it.c.rot + it.ang).toFixed(2) + 'deg) scale(' + (it.c.flip ? -it.sc : it.sc).toFixed(3) + ',' + it.sc.toFixed(3) + ')';
      it.el.style.transform = 'translate3d(' + (it.x - it.w / 2).toFixed(1) + 'px,' + (it.y - it.h / 2).toFixed(1) + 'px,0) rotate(' + (it.c.rot + it.ang).toFixed(2) + 'deg) scale(' + (it.c.flip ? -it.sc : it.sc).toFixed(3) + ',' + it.sc.toFixed(3) + ')';
    });
    ctx.clearRect(0, 0, W, H);
    petals.forEach(function (p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.a;
      var g = ctx.createLinearGradient(0, -p.s, 0, p.s); g.addColorStop(0, '#F7B3C4'); g.addColorStop(1, '#EE8FA9');
      ctx.fillStyle = g; petalPath(p.s); ctx.fill(); ctx.restore();
    });
    particles.forEach(function (q) {
      var a = Math.max(0, Math.min(1, q.life / q.max * 1.6));
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.globalAlpha = a;
      if (q.kind === 'spark') { ctx.fillStyle = q.col; star(q.s); ctx.fill(); }
      else { ctx.fillStyle = '#F4A3B8'; petalPath(q.s); ctx.fill(); }
      ctx.restore();
    });
  }

  /* Destellos dorados (y pétalos si es un toque) */
  function burst(x, y, n, soloBrillos) {
    if (reduce) return;
    var cols = ['#E9C46A', '#F2D98C', '#D9A93F', '#FFF1B8'];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.28, v = (90 + Math.random() * 230) * Math.max(S, 0.8);
      particles.push({ kind: 'spark', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 110, g: 380, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8,
        s: (3 + Math.random() * 4) * Math.max(S, 0.8), life: 0.6 + Math.random() * 0.6, max: 1.2, col: cols[(Math.random() * cols.length) | 0] });
    }
    if (soloBrillos) return;
    for (var j = 0; j < 8; j++) {
      var b = Math.random() * 6.28, w = 70 + Math.random() * 150;
      particles.push({ kind: 'petal', x: x, y: y, vx: Math.cos(b) * w, vy: Math.sin(b) * w - 160, g: 260, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6,
        s: (6 + Math.random() * 5) * Math.max(S, 0.8), life: 1.3 + Math.random() * 0.9, max: 2.2 });
    }
  }
  function pop(it) {
    it.vs += 5; it.idle = 0;
    var kp = it.c.lento || 1;
    it.vx += (Math.random() - 0.5) * 260 / Math.sqrt(it.m) * kp; it.vy += (Math.random() - 0.5) * 260 / Math.sqrt(it.m) * kp;
    burst(it.x, it.y, 16, false);
  }

  /* ---------- Gestos ---------- */
  function topItemAt(x, y) {
    var best = null;
    items.forEach(function (it) {
      if (!it.on || it.fijo || phase === 'entrada') return;
      if (Math.hypot(x - it.x, y - it.y) <= it.r * 1.05 && (!best || it.z >= best.z)) best = it;
    });
    return best;
  }
  function pos(e) {
    var r = hero.getBoundingClientRect(), tt = performance.now();
    var nx = e.clientX - r.left, ny = e.clientY - r.top, dtm = Math.max(8, Math.min(120, tt - pointer.t));
    var vx = pointer.active ? (nx - pointer.x) / dtm * 1000 : 0, vy = pointer.active ? (ny - pointer.y) / dtm * 1000 : 0;
    pointer.vx = pointer.vx * 0.55 + vx * 0.45; pointer.vy = pointer.vy * 0.55 + vy * 0.45;
    pointer.t = tt; pointer.x = nx; pointer.y = ny; pointer.type = e.pointerType || 'mouse';
  }
  hero.addEventListener('pointermove', function (e) {
    pos(e);
    if (drag) { drag.moved += Math.hypot(pointer.vx, pointer.vy) / 60; pointer.active = true; return; }
    // pasar rápido por encima empuja lo liviano (lo pesado, como las tortas, apenas se mueve)
    var sp = Math.hypot(pointer.vx, pointer.vy);
    if (pointer.active && sp > 140 && phase !== 'entrada') {
      var vx = Math.max(-1400, Math.min(1400, pointer.vx)), vy = Math.max(-1400, Math.min(1400, pointer.vy));
      items.forEach(function (it) {
        if (!it.on || it.fijo) return;
        var d = Math.hypot(it.x - pointer.x, it.y - pointer.y);
        if (d < it.r + 18) { var f = 1 - Math.max(0, d - it.r * 0.3) / (it.r + 18); var kk = it.c.lento || 1; it.vx += vx * 1.0 * f / it.m * kk; it.vy += vy * 1.0 * f / it.m * kk; it.idle = 0; }
      });
    }
    pointer.active = true;
    if (e.pointerType === 'mouse') hero.style.cursor = topItemAt(pointer.x, pointer.y) ? 'grab' : '';
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { if (!drag) { pointer.active = false; hero.style.cursor = ''; } });
  hero.addEventListener('pointerdown', function (e) {
    pos(e); pointer.active = true;
    if (e.target.closest && e.target.closest('a,button')) return;
    var it = topItemAt(pointer.x, pointer.y);
    if (!it) return;
    drag = { it: it, ox: it.x - pointer.x, oy: it.y - pointer.y, moved: 0, mouse: e.pointerType === 'mouse', t: performance.now() };
    if (drag.mouse) {
      it.grabbed = true; it.idle = 0; setZ(it, 50); hero.style.cursor = 'grabbing';
      try { hero.setPointerCapture(e.pointerId); } catch (err) { /* sin captura: sigue funcionando dentro de la portada */ }
    }
  });
  function soltar(e) {
    if (!drag) return;
    var it = drag.it, corto = drag.moved < 6 && performance.now() - drag.t < 450;
    if (it.grabbed) {
      it.grabbed = false; it.idle = 0;
      var s = Math.hypot(pointer.vx, pointer.vy), cap = 2200;
      var k = s > cap ? cap / s : 1;
      it.vx = corto ? 0 : pointer.vx * k; it.vy = corto ? 0 : pointer.vy * k;
      setZ(it, it.c.z != null ? it.c.z : 10 + CFG.indexOf(it.c));
    }
    if (corto) pop(it);
    drag = null;
    if (!e || e.pointerType !== 'mouse') pointer.active = false;
    hero.style.cursor = '';
  }
  hero.addEventListener('pointerup', soltar);
  hero.addEventListener('pointercancel', soltar);

  /* ---------- Bucle ---------- */
  function frame(now) {
    raf = 0;
    if (!running) return;
    var t = now / 1000, dt = Math.min(0.033, last ? t - last : 0.016); last = t;
    step(dt, t); draw();
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    var should = visible && !document.hidden && !reduce && started;
    if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(hero);
  }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 150); });

  /* ---------- Arranque: esperar las imágenes y dejar caer ---------- */
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!started) layout(); });
  var listos = items.map(function (it) { return it.el.decode ? Promise.all([it.el.decode(), it.sh.decode()]).catch(function () {}) : Promise.resolve(); });
  var go = false;
  function arrancar() {
    if (go) return; go = true;
    if (reduce) { items.forEach(function (it) { op(it, '1'); it.x = it.hx; it.y = it.hy; }); phase = 'libre'; draw(); return; }
    startDrop(performance.now() / 1000); sync();
  }
  Promise.all(listos).then(arrancar);
  setTimeout(arrancar, 3000);
})();
