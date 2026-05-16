// Global Constants
const G = 9.81;
// ExaAnim palette — never use #3762e3 or #fffbed
const COLOR_PRIMARY = '#0d9488';
const COLOR_PRIMARY_DARK = '#0f766e';
const COLOR_PRIMARY_LIGHT = '#2dd4bf';
const HISTORY_MAX = 300;
const STEP_DT = 0.1;

// --- Graph helpers ---
function drawGraphAxes(ctx, w, h, pad, yLabel, xMax, yMin, yMax) {
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const gy = pad.top + (plotH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(pad.left, gy);
        ctx.lineTo(w - pad.right, gy);
        ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
        const gx = pad.left + (plotW * i) / 4;
        ctx.beginPath();
        ctx.moveTo(gx, pad.top);
        ctx.lineTo(gx, h - pad.bottom);
        ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, h - pad.bottom);
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('t (s)', pad.left + plotW / 2, h - 4);
    ctx.save();
    ctx.translate(10, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(yMax.toFixed(1), pad.left - 4, pad.top + 8);
    ctx.fillText(yMin.toFixed(1), pad.left - 4, h - pad.bottom);
    ctx.textAlign = 'center';
    ctx.fillText('0', pad.left, h - pad.bottom + 12);
    ctx.fillText(xMax.toFixed(1), w - pad.right, h - pad.bottom + 12);

    return { plotW, plotH };
}

function valueToY(val, yMin, yMax, pad, plotH, h) {
    const range = yMax - yMin || 1;
    const norm = (val - yMin) / range;
    return h - pad.bottom - norm * plotH;
}

function timeToX(t, xMax, pad, plotW) {
    return pad.left + (t / xMax) * plotW;
}

function padYRange(yMin, yMax) {
    const padY = Math.max(0.5, (yMax - yMin) * 0.12);
    yMin -= padY;
    yMax += padY;
    if (yMin === yMax) {
        yMin -= 1;
        yMax += 1;
    }
    return { yMin, yMax };
}

/** Full time axis for 1D run (matches sim cap / natural stop). */
function get1DTimeHorizon(u, a) {
    const cap = 20;
    if (Math.abs(a) < 0.01) return cap;
    if ((u > 0 && a < 0) || (u < 0 && a > 0)) {
        const tStop = -u / a;
        if (tStop > 0) return Math.min(cap, Math.max(1, tStop * 1.05));
    }
    return cap;
}

function get1DYExtents(u, a, tMax, key) {
    if (key === 'a') return padYRange(a, a);
    const steps = 32;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (let i = 0; i <= steps; i++) {
        const t = (tMax * i) / steps;
        const val = key === 's' ? u * t + 0.5 * a * t * t : u + a * t;
        yMin = Math.min(yMin, val);
        yMax = Math.max(yMax, val);
    }
    return padYRange(yMin, yMax);
}

function get2DYExtents(u, thetaDeg, tMax, key) {
    const rad = thetaDeg * Math.PI / 180;
    const ux = u * Math.cos(rad);
    const uy = u * Math.sin(rad);
    const steps = 32;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (let i = 0; i <= steps; i++) {
        const t = (tMax * i) / steps;
        let val;
        if (key === 'y') val = uy * t - 0.5 * G * t * t;
        else if (key === 'x') val = ux * t;
        else val = uy - G * t;
        yMin = Math.min(yMin, val);
        yMax = Math.max(yMax, val);
    }
    if (key === 'y') yMin = Math.min(yMin, 0);
    return padYRange(yMin, yMax);
}

function drawMotionGraph(canvas, config) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = { left: 36, right: 10, top: 14, bottom: 22 };

    const history = config.history || [];
    const tCur = config.tCur ?? 0;
    const historyTMax = history.length ? Math.max(...history.map(p => p.t)) : 0;
    const xMax = Math.max(config.tMax ?? 0, tCur, historyTMax, 1);

    let yMin;
    let yMax;
    if (config.yExtents) {
        yMin = config.yExtents.yMin;
        yMax = config.yExtents.yMax;
    } else {
        yMin = config.yMin;
        yMax = config.yMax;
        if (history.length) {
            const vals = history.map(p => p[config.key]);
            yMin = Math.min(yMin, ...vals, config.staticVal !== undefined ? config.staticVal : Infinity);
            yMax = Math.max(yMax, ...vals, config.staticVal !== undefined ? config.staticVal : -Infinity);
        }
        if (config.staticVal !== undefined) {
            yMin = Math.min(yMin, config.staticVal);
            yMax = Math.max(yMax, config.staticVal);
        }
        ({ yMin, yMax } = padYRange(yMin, yMax));
    }

    const { plotW, plotH } = drawGraphAxes(ctx, w, h, pad, config.yLabel, xMax, yMin, yMax);

    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;

    if (history.length >= 2) {
        for (const pt of history) {
            const px = timeToX(pt.t, xMax, pad, plotW);
            const py = valueToY(pt[config.key], yMin, yMax, pad, plotH, h);
            if (!started) { ctx.moveTo(px, py); started = true; }
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    } else if (history.length === 1) {
        const pt = history[0];
        const px = timeToX(pt.t, xMax, pad, plotW);
        const py = valueToY(pt[config.key], yMin, yMax, pad, plotH, h);
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    if (config.drawStaticLine && config.staticVal !== undefined) {
        const py = valueToY(config.staticVal, yMin, yMax, pad, plotH, h);
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pad.left, py);
        ctx.lineTo(pad.left + plotW, py);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    const cx = timeToX(tCur, xMax, pad, plotW);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, pad.top);
    ctx.lineTo(cx, h - pad.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    if (config.areaUnder) {
        drawGraphAreaUnder(ctx, config, { w, h, pad, plotW, plotH, xMax, yMin, yMax, cx });
    }
    if (config.tangentAt) {
        drawGraphTangent(ctx, config, { w, h, pad, plotW, plotH, xMax, yMin, yMax, cx, tCur });
    }
}

/** Shaded region from t=0 to tCur under v–t (or similar) — displacement / integral visual. */
function drawGraphAreaUnder(ctx, config, dims) {
    const { h, pad, plotW, plotH, xMax, yMin, yMax, cx } = dims;
    const tEnd = Math.min(config.tCur ?? 0, xMax);
    if (tEnd <= 0) return;

    const u = config.areaUnder.u ?? 0;
    const a = config.areaUnder.a ?? 0;
    const uy = config.areaUnder.uy;
    const g = config.areaUnder.g ?? G;

    const x0 = timeToX(0, xMax, pad, plotW);
    const steps = Math.max(8, Math.floor(tEnd * 12));
    ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.beginPath();
    ctx.moveTo(x0, h - pad.bottom);
    for (let i = 0; i <= steps; i++) {
        const t = (tEnd * i) / steps;
        const v = uy !== undefined ? uy - g * t : u + a * t;
        const px = timeToX(t, xMax, pad, plotW);
        const py = valueToY(v, yMin, yMax, pad, plotH, h);
        ctx.lineTo(px, py);
    }
    ctx.lineTo(cx, h - pad.bottom);
    ctx.closePath();
    ctx.fill();
}

/** Tangent on s–t at current time; slope ≈ instantaneous velocity. */
function drawGraphTangent(ctx, config, dims) {
    const { w, h, pad, plotW, plotH, xMax, yMin, yMax, cx, tCur } = dims;
    const tan = config.tangentAt;
    const t = tCur ?? 0;
    if (t <= 0 || t > xMax) return;

    const u = tan.u ?? 0;
    const a = tan.a ?? 0;
    const s0 = u * t + 0.5 * a * t * t;
    const slope = u + a * t;
    const dt = Math.min(1.2, t * 0.35, (xMax - t) * 0.35);
    if (dt < 0.05) return;

    const t1 = Math.max(0, t - dt);
    const t2 = Math.min(xMax, t + dt);
    const s1 = u * t1 + 0.5 * a * t1 * t1;
    const s2 = u * t2 + 0.5 * a * t2 * t2;
    const px0 = timeToX(t, xMax, pad, plotW);
    const py0 = valueToY(s0, yMin, yMax, pad, plotH, h);
    const px1 = timeToX(t1, xMax, pad, plotW);
    const py1 = valueToY(s1, yMin, yMax, pad, plotH, h);
    const px2 = timeToX(t2, xMax, pad, plotW);
    const py2 = valueToY(s2, yMin, yMax, pad, plotH, h);

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();

    ctx.fillStyle = '#7c3aed';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    const label = `slope ≈ ${slope.toFixed(1)}`;
    const lx = Math.min(px0 + 4, w - pad.right - 52);
    const ly = Math.max(pad.top + 10, py0 - 8);
    ctx.fillText(label, lx, ly);
}

/** Trapezoid area under v(t) from 0 to t (kinematic u, a). */
function areaUnderVT(u, a, t) {
    if (t <= 0) return 0;
    const vEnd = u + a * t;
    return 0.5 * (u + vEnd) * t;
}

function drawVectorArrow(ctx, fromX, fromY, toX, toY, color, label, dashed) {
    const headlen = 12;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const len = Math.hypot(dx, dy);
    if (len < 2) return;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = dashed ? 2 : 3;
    if (dashed) ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();

    if (label) {
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(label, toX + 8, toY - 8);
    }
}

/** Match canvas bitmap size to its container so CSS never stretches the plot. */
function fitCanvasToDisplay(canvas, aspectRatio) {
    const container =
        canvas.closest('.canvas-container') ||
        canvas.closest('.graph-panel') ||
        canvas.parentElement;
    if (!container || !aspectRatio || aspectRatio <= 0) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.round(cssW / aspectRatio));
    const bw = Math.max(1, Math.round(cssW * dpr));
    const bh = Math.max(1, Math.round(cssH * dpr));
    const changed = canvas.width !== bw || canvas.height !== bh;

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.style.maxWidth = '100%';
    canvas.style.flex = 'none';
    canvas.width = bw;
    canvas.height = bh;

    return changed;
}

const GRAPH_ASPECT = 260 / 160;

function refreshVisibleGraphCanvases() {
    const s1 = document.getElementById('section-1d');
    const s2 = document.getElementById('section-2d');
    if (s1 && s1.style.display !== 'none' && typeof draw1DGraphs === 'function') {
        draw1DGraphs();
    }
    if (s2 && s2.style.display !== 'none' && typeof draw2DGraphs === 'function') {
        draw2DGraphs();
    }
}

function refitLessonCanvasesForTab(tabId) {
    requestAnimationFrame(() => {
        if (tabId === '1d') {
            const c = document.getElementById('canvas-1d');
            if (c) {
                fitCanvasToDisplay(c, 2);
                if (typeof draw1D === 'function') draw1D();
            }
            ['graph-st', 'graph-vt', 'graph-at'].forEach((id) => {
                const g = document.getElementById(id);
                if (g) fitCanvasToDisplay(g, GRAPH_ASPECT);
            });
            if (typeof draw1DGraphs === 'function') draw1DGraphs();
        } else if (tabId === 'vectors') {
            const c = document.getElementById('canvas-vectors');
            if (c) {
                fitCanvasToDisplay(c, 4 / 3);
                if (typeof layoutVectorsCanvas === 'function') layoutVectorsCanvas();
                if (typeof drawVectors === 'function') drawVectors();
            }
        } else if (tabId === '2d') {
            const c = document.getElementById('canvas-2d');
            if (c) {
                fitCanvasToDisplay(c, 4 / 3);
                if (typeof layout2DCanvas === 'function') layout2DCanvas();
                if (typeof draw2DEnvironment === 'function') draw2DEnvironment();
            }
            ['graph-2d-yt', 'graph-2d-xt', 'graph-2d-vyt'].forEach((id) => {
                const g = document.getElementById(id);
                if (g) fitCanvasToDisplay(g, GRAPH_ASPECT);
            });
            if (typeof draw2DGraphs === 'function') draw2DGraphs();
        } else if (tabId === 'guide' && typeof drawGuideSamples === 'function') {
            drawGuideSamples();
        }
    });
}

function initLessonCanvases() {
    const graphIds = [
        'graph-st', 'graph-vt', 'graph-at',
        'graph-2d-yt', 'graph-2d-xt', 'graph-2d-vyt'
    ];

    const observe = (canvas, aspect, onResize) => {
        if (!canvas) return;
        const container =
            canvas.closest('.canvas-container') ||
            canvas.closest('.graph-panel') ||
            canvas.parentElement;
        if (!container) return;

        const run = () => {
            fitCanvasToDisplay(canvas, aspect);
            onResize();
        };

        const ro = new ResizeObserver(() => requestAnimationFrame(run));
        ro.observe(container);
        run();
    };

    observe(document.getElementById('canvas-1d'), 2, () => {
        if (typeof draw1D === 'function') draw1D();
    });

    observe(document.getElementById('canvas-vectors'), 4 / 3, () => {
        if (typeof layoutVectorsCanvas === 'function') layoutVectorsCanvas();
        if (typeof drawVectors === 'function') drawVectors();
    });

    observe(document.getElementById('canvas-2d'), 4 / 3, () => {
        if (typeof layout2DCanvas === 'function') layout2DCanvas();
        if (typeof draw2DEnvironment === 'function') draw2DEnvironment();
    });

    graphIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observe(el, GRAPH_ASPECT, refreshVisibleGraphCanvases);
    });

    ['guide-canvas-const', 'guide-canvas-linear', 'guide-canvas-quad'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) observe(el, 220 / 140, () => {
            if (typeof drawGuideSamples === 'function') drawGuideSamples();
        });
    });
}
