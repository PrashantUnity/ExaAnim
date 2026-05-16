function draw1DGraphs() {
    const u = state1D.u;
    const a = state1D.a;
    const t = state1D.t;
    const tMax = get1DTimeHorizon(u, a);
    const base = { history: state1D.history, tCur: t, tMax };
    const showCalc = typeof isCalculusShown === 'function' && isCalculusShown();
    const graphs = [
        {
            id: 'graph-st',
            key: 's',
            yLabel: 's (m)',
            color: COLOR_PRIMARY,
            yExtents: get1DYExtents(u, a, tMax, 's'),
            tangentAt: showCalc ? { u, a } : null
        },
        {
            id: 'graph-vt',
            key: 'v',
            yLabel: 'v (m/s)',
            color: '#ef4444',
            yExtents: get1DYExtents(u, a, tMax, 'v'),
            areaUnder: showCalc ? { u, a } : null
        },
        { id: 'graph-at', key: 'a', yLabel: 'a (m/s²)', color: '#22c55e', yExtents: get1DYExtents(u, a, tMax, 'a'), staticVal: a, drawStaticLine: true }
    ];
    for (const g of graphs) {
        const el = document.getElementById(g.id);
        if (el) drawMotionGraph(el, { ...base, ...g });
    }
}

function pushHistory1D() {
    const last = state1D.history[state1D.history.length - 1];
    if (last && last.t === state1D.t) {
        last.s = state1D.x;
        last.v = state1D.v;
        last.a = state1D.a;
        return;
    }
    state1D.history.push({ t: state1D.t, s: state1D.x, v: state1D.v, a: state1D.a });
    if (state1D.history.length > HISTORY_MAX) state1D.history.shift();
}

function clearHistory1D() {
    state1D.history = [{ t: 0, s: 0, v: state1D.u, a: state1D.a }];
}

let state1DPrev = { t: 0, x: 0 };

function update1DLiveFormulas() {
    const u = state1D.u;
    const a = state1D.a;
    const t = state1D.t;
    const v = state1D.v;
    const s = state1D.x;
    const v2 = v * v;
    const u2 = u * u;
    const rhsV2 = u2 + 2 * a * s;

    setLiveText('live-1d-at-t', `At t = ${formatNum(t)} s`);
    setLiveText('live-formula-v', formatSubst(
        'v = u + at',
        formatNum(v),
        `${u} + (${a})(${formatNum(t)})`
    ));
    setLiveText('live-formula-s', formatSubst(
        's = ut + ½at²',
        formatNum(s),
        `(${u})(${formatNum(t)}) + ½(${a})(${formatNum(t)})²`
    ));
    setLiveText('live-formula-v2', formatSubst(
        'v² = u² + 2as',
        formatNum(v2),
        `${formatNum(u2)} + 2(${a})(${formatNum(s)}) = ${formatNum(rhsV2)}`
    ));
    setLiveText('live-1d-graph-hint', `On v–t: slope ≈ ${formatNum(a)} m/s² (acceleration)`);

    if (typeof isCalculusShown === 'function' && isCalculusShown()) {
        const area = areaUnderVT(u, a, t);
        const dt = t - state1DPrev.t;
        let calcLine = `Area under v–t (0→t) ≈ ${formatNum(area)} m  |  s = ${formatNum(s)} m`;
        if (dt > 0.001) {
            const avgRate = (s - state1DPrev.x) / dt;
            calcLine += `  |  Δs/Δt ≈ ${formatNum(avgRate)} m/s vs v = ${formatNum(v)} m/s`;
        }
        setLiveText('live-1d-calculus', calcLine);
    }
    state1DPrev = { t, x: s };
}

function update1DStats() {
    document.getElementById('stat-1d-t').innerText = state1D.t.toFixed(2);
    document.getElementById('stat-1d-s').innerText = state1D.x.toFixed(2);
    document.getElementById('stat-1d-v').innerText = state1D.v.toFixed(2);
    document.getElementById('stat-1d-a').innerText = state1D.a.toFixed(2);

    const braking = Math.abs(state1D.v) > 0.05 && state1D.a !== 0 &&
        ((state1D.v > 0 && state1D.a < 0) || (state1D.v < 0 && state1D.a > 0));
    const brakeEl = document.getElementById('stat-1d-braking');
    if (brakeEl) brakeEl.classList.toggle('hidden', !braking);

    update1DLiveFormulas();
}

// --- 1D MOTION ---
const canvas1D = document.getElementById('canvas-1d');
const ctx1D = canvas1D.getContext('2d');

let state1D = {
    u: 0, a: 2, t: 0,
    x: 0, v: 0,
    isRunning: false,
    isPaused: false,
    lastTimestamp: 0,
    pixelsPerMeter: 10,
    offsetX: 400,
    history: [],
    trail: []
};

function sync1DSliders() {
    document.getElementById('slider-1d-u').value = state1D.u;
    document.getElementById('slider-1d-a').value = state1D.a;
    document.getElementById('val-1d-u').innerText = state1D.u + ' m/s';
    document.getElementById('val-1d-a').innerText = state1D.a + ' m/s²';
}

function apply1DPreset(u, a, autoStart) {
    state1D.u = u;
    state1D.a = a;
    sync1DSliders();
    reset1D();
    if (autoStart) start1D();
}

function update1DInputs() {
    state1D.u = parseFloat(document.getElementById('slider-1d-u').value);
    state1D.a = parseFloat(document.getElementById('slider-1d-a').value);
    document.getElementById('val-1d-u').innerText = state1D.u + ' m/s';
    document.getElementById('val-1d-a').innerText = state1D.a + ' m/s²';

    if (!state1D.isRunning) {
        state1D.t = 0;
        state1D.x = 0;
        state1D.v = state1D.u;
        state1D.trail = [];
        clearHistory1D();
        draw1D();
    }
}

function updatePauseButton() {
    const btn = document.getElementById('btn-1d-pause');
    if (!btn) return;
    if (!state1D.isRunning && !state1D.isPaused) {
        btn.textContent = 'Pause';
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.textContent = state1D.isPaused ? 'Resume' : 'Pause';
    }
}

function togglePause1D() {
    if (!state1D.isRunning && !state1D.isPaused) return;
    state1D.isPaused = !state1D.isPaused;
    if (!state1D.isPaused) {
        state1D.lastTimestamp = performance.now();
        requestAnimationFrame(loop1D);
    }
    updatePauseButton();
}

function advance1DPhysics(dt) {
    state1D.t += dt;
    state1D.x = state1D.u * state1D.t + 0.5 * state1D.a * state1D.t * state1D.t;
    state1D.v = state1D.u + state1D.a * state1D.t;
    state1D.trail.push({ x: state1D.x });
    if (state1D.trail.length > 80) state1D.trail.shift();
    pushHistory1D();
}

function start1D() {
    if (state1D.isRunning && !state1D.isPaused) return;
    if (state1D.isPaused) {
        state1D.isPaused = false;
        state1D.lastTimestamp = performance.now();
        updatePauseButton();
        requestAnimationFrame(loop1D);
        return;
    }
    state1D.t = 0;
    state1D.x = 0;
    state1D.v = state1D.u;
    state1D.trail = [];
    clearHistory1D();
    state1D.isRunning = true;
    state1D.isPaused = false;
    state1D.lastTimestamp = performance.now();
    updatePauseButton();
    requestAnimationFrame(loop1D);
}

function reset1D() {
    state1D.isRunning = false;
    state1D.isPaused = false;
    state1D.t = 0;
    state1D.x = 0;
    state1D.v = state1D.u;
    state1D.trail = [];
    state1D.offsetX = 400;
    state1DPrev = { t: 0, x: 0 };
    clearHistory1D();
    updatePauseButton();
    draw1D();
}

function step1D() {
    if (state1D.isRunning && !state1D.isPaused) return;
    if (!state1D.isRunning) {
        state1D.isRunning = true;
        state1D.isPaused = true;
        if (state1D.history.length <= 1 && state1D.t === 0) clearHistory1D();
    }
    advance1DPhysics(STEP_DT);
    updatePauseButton();
    draw1D();
}

function draw1DMeterTicks(roadY) {
    const ppm = state1D.pixelsPerMeter;
    const originScreen = state1D.offsetX;
    ctx1D.fillStyle = '#94a3b8';
    ctx1D.font = '11px monospace';
    ctx1D.textAlign = 'center';
    const minM = Math.floor((-originScreen) / ppm) - 2;
    const maxM = Math.ceil((canvas1D.width - originScreen) / ppm) + 2;
    for (let m = minM; m <= maxM; m++) {
        const px = originScreen + m * ppm;
        if (px < 0 || px > canvas1D.width) continue;
        ctx1D.strokeStyle = m === 0 ? '#ef4444' : '#64748b';
        ctx1D.lineWidth = m % 5 === 0 ? 2 : 1;
        ctx1D.beginPath();
        ctx1D.moveTo(px, roadY);
        ctx1D.lineTo(px, roadY + (m % 5 === 0 ? 14 : 8));
        ctx1D.stroke();
        if (m % 5 === 0 && m !== 0) {
            ctx1D.fillStyle = '#cbd5e1';
            ctx1D.fillText(m + 'm', px, roadY - 6);
        }
    }
}

function draw1D() {
    ctx1D.clearRect(0, 0, canvas1D.width, canvas1D.height);
    const roadY = canvas1D.height / 2 + 20;

    ctx1D.fillStyle = '#1e293b';
    ctx1D.fillRect(0, 0, canvas1D.width, roadY);
    ctx1D.fillStyle = '#334155';
    ctx1D.fillRect(0, roadY, canvas1D.width, canvas1D.height - roadY);

    draw1DMeterTicks(roadY);

    let boxDrawX = state1D.offsetX + state1D.x * state1D.pixelsPerMeter;
    if (boxDrawX > canvas1D.width - 100) state1D.offsetX -= boxDrawX - (canvas1D.width - 100);
    if (boxDrawX < 100) state1D.offsetX += 100 - boxDrawX;
    boxDrawX = state1D.offsetX + state1D.x * state1D.pixelsPerMeter;

    if (state1D.trail.length > 1) {
        ctx1D.strokeStyle = 'rgba(13, 148, 136, 0.35)';
        ctx1D.lineWidth = 3;
        ctx1D.beginPath();
        for (let i = 0; i < state1D.trail.length; i++) {
            const tx = state1D.offsetX + state1D.trail[i].x * state1D.pixelsPerMeter;
            const ty = canvas1D.height / 2 + 5;
            if (i === 0) ctx1D.moveTo(tx, ty);
            else ctx1D.lineTo(tx, ty);
        }
        ctx1D.stroke();
    }

    ctx1D.fillStyle = '#ef4444';
    ctx1D.fillRect(state1D.offsetX - 2, canvas1D.height / 2, 4, 30);
    ctx1D.fillStyle = '#fff';
    ctx1D.font = '14px monospace';
    ctx1D.fillText('x=0', state1D.offsetX - 14, canvas1D.height / 2 - 10);

    const carY = canvas1D.height / 2 - 30;
    ctx1D.fillStyle = COLOR_PRIMARY;
    ctx1D.fillRect(boxDrawX - 25, carY, 50, 50);
    ctx1D.fillStyle = '#0f172a';
    ctx1D.beginPath();
    ctx1D.arc(boxDrawX - 15, roadY, 8, 0, Math.PI * 2);
    ctx1D.fill();
    ctx1D.beginPath();
    ctx1D.arc(boxDrawX + 15, roadY, 8, 0, Math.PI * 2);
    ctx1D.fill();

    const arrowY = carY + 10;
    const aScale = state1D.a * 8;
    if (Math.abs(state1D.a) > 0.05) {
        drawVectorArrow(ctx1D, boxDrawX, arrowY + 18, boxDrawX + aScale, arrowY + 18, '#22c55e', 'a', false);
    }
    if (Math.abs(state1D.v) > 0.1) {
        const vScale = state1D.v * 3;
        drawVectorArrow(ctx1D, boxDrawX, arrowY, boxDrawX + vScale, arrowY, '#ef4444', 'v', false);
    }

    update1DStats();
    draw1DGraphs();
}

function loop1D(timestamp) {
    if (!state1D.isRunning || state1D.isPaused) return;

    let dt = (timestamp - state1D.lastTimestamp) / 1000;
    if (dt < 0) dt = 0;
    if (dt > 0.1) dt = 0.1;
    state1D.lastTimestamp = timestamp;

    advance1DPhysics(dt);
    draw1D();

    if (state1D.t < 20) {
        requestAnimationFrame(loop1D);
    } else {
        state1D.isRunning = false;
        state1D.isPaused = false;
        updatePauseButton();
    }
}

clearHistory1D();
update1DInputs();
updatePauseButton();
