// --- VECTORS ---
const canvasV = document.getElementById('canvas-vectors');
const ctxV = canvasV.getContext('2d');

const VECTORS_LAYOUT_REF = { w: 800, h: 600, originX: 400, originY: 300, scale: 20 };

function layoutVectorsCanvas() {
    const sx = canvasV.width / VECTORS_LAYOUT_REF.w;
    const sy = canvasV.height / VECTORS_LAYOUT_REF.h;
    const s = (sx + sy) / 2;
    stateV.originX = Math.round(VECTORS_LAYOUT_REF.originX * sx);
    stateV.originY = Math.round(VECTORS_LAYOUT_REF.originY * sy);
    stateV.scale = Math.max(8, Math.round(VECTORS_LAYOUT_REF.scale * s));
}

let stateV = {
    originX: 400,
    originY: 300,
    scale: 20,
    A: { x: 5, y: -4 },
    B: { x: -3, y: -6 },
    dragging: null
};

function drawGridV() {
    ctxV.clearRect(0, 0, canvasV.width, canvasV.height);
    ctxV.strokeStyle = '#e2e8f0';
    ctxV.lineWidth = 1;
    for (let x = 0; x <= canvasV.width; x += stateV.scale) {
        ctxV.beginPath();
        ctxV.moveTo(x, 0);
        ctxV.lineTo(x, canvasV.height);
        ctxV.stroke();
    }
    for (let y = 0; y <= canvasV.height; y += stateV.scale) {
        ctxV.beginPath();
        ctxV.moveTo(0, y);
        ctxV.lineTo(canvasV.width, y);
        ctxV.stroke();
    }
    ctxV.strokeStyle = '#94a3b8';
    ctxV.lineWidth = 2;
    ctxV.beginPath();
    ctxV.moveTo(stateV.originX, 0);
    ctxV.lineTo(stateV.originX, canvasV.height);
    ctxV.stroke();
    ctxV.beginPath();
    ctxV.moveTo(0, stateV.originY);
    ctxV.lineTo(canvasV.width, stateV.originY);
    ctxV.stroke();
}

function drawArrow(ctx, fromX, fromY, toX, toY, color, label) {
    drawVectorArrow(ctx, fromX, fromY, toX, toY, color, label, false);
}

function drawProjection(ctx, tipX, tipY, ox, oy, color, prefix) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX, oy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(ox, tipY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    ctx.fillStyle = color;
    ctx.font = '11px sans-serif';
    ctx.fillText(prefix + 'x', (tipX + ox) / 2, oy + 14);
    ctx.fillText(prefix + 'y', ox - 22, (tipY + oy) / 2);
}

function formatAngle(deg) {
    if (deg < 0) deg += 360;
    return deg.toFixed(1) + '°';
}

function updateVectorMath() {
    const ax = stateV.A.x;
    const ay = -stateV.A.y;
    const bx = stateV.B.x;
    const by = -stateV.B.y;
    const rx = ax + bx;
    const ry = ay + by;

    const magA = Math.hypot(ax, ay);
    const magB = Math.hypot(bx, by);
    const magR = Math.hypot(rx, ry);
    const angA = formatAngle(Math.atan2(ay, ax) * (180 / Math.PI));
    const angB = formatAngle(Math.atan2(by, bx) * (180 / Math.PI));
    const angR = formatAngle(Math.atan2(ry, rx) * (180 / Math.PI));

    document.getElementById('vec-a-val').innerText = `${ax}i ${ay >= 0 ? '+' : '-'} ${Math.abs(ay)}j`;
    document.getElementById('vec-b-val').innerText = `${bx}i ${by >= 0 ? '+' : '-'} ${Math.abs(by)}j`;
    document.getElementById('vec-r-val').innerText = `${rx}i ${ry >= 0 ? '+' : '-'} ${Math.abs(ry)}j`;
    document.getElementById('vec-a-mag-ang').innerText = `${magA.toFixed(2)}, ${angA}`;
    document.getElementById('vec-b-mag-ang').innerText = `${magB.toFixed(2)}, ${angB}`;
    document.getElementById('vec-r-mag').innerText = magR.toFixed(2);
    document.getElementById('vec-r-ang').innerText = angR;

    setLiveText('live-vec-rx', formatSubst(
        'R_x = A_x + B_x',
        formatNum(rx),
        `${formatNum(ax)} + (${formatNum(bx)})`
    ));
    setLiveText('live-vec-ry', formatSubst(
        'R_y = A_y + B_y',
        formatNum(ry),
        `${formatNum(ay)} + (${formatNum(by)})`
    ));

    if (magA > 0.01 && magB > 0.01) {
        const dot = ax * bx + ay * by;
        const cosTheta = dot / (magA * magB);
        const clamped = Math.max(-1, Math.min(1, cosTheta));
        const thetaBetween = Math.acos(clamped) * (180 / Math.PI);
        setLiveText('live-vec-cos',
            `cos θ = (A·B)/(|A||B|) = ${formatNum(cosTheta, 3)}  →  θ ≈ ${formatNum(thetaBetween, 1)}° between A and B`
        );
    } else {
        setLiveText('live-vec-cos', 'Drag both vectors away from origin to see the angle between them.');
    }
}

function drawVectors() {
    drawGridV();

    const ox = stateV.originX;
    const oy = stateV.originY;
    const ax_px = ox + stateV.A.x * stateV.scale;
    const ay_px = oy + stateV.A.y * stateV.scale;
    const bx_px = ox + stateV.B.x * stateV.scale;
    const by_px = oy + stateV.B.y * stateV.scale;
    const rx_px = ox + (stateV.A.x + stateV.B.x) * stateV.scale;
    const ry_px = oy + (stateV.A.y + stateV.B.y) * stateV.scale;

    drawProjection(ctxV, ax_px, ay_px, ox, oy, COLOR_PRIMARY, 'A');
    drawProjection(ctxV, bx_px, by_px, ox, oy, '#dc2626', 'B');

    const showPara = document.getElementById('vec-show-parallelogram')?.checked ?? true;
    if (showPara) {
        ctxV.strokeStyle = '#cbd5e1';
        ctxV.lineWidth = 2;
        ctxV.setLineDash([5, 5]);
        ctxV.beginPath();
        ctxV.moveTo(ax_px, ay_px);
        ctxV.lineTo(rx_px, ry_px);
        ctxV.stroke();
        ctxV.beginPath();
        ctxV.moveTo(bx_px, by_px);
        ctxV.lineTo(rx_px, ry_px);
        ctxV.stroke();
        ctxV.setLineDash([]);
    }

    drawArrow(ctxV, ox, oy, ax_px, ay_px, COLOR_PRIMARY, 'A');
    drawArrow(ctxV, ox, oy, bx_px, by_px, '#dc2626', 'B');
    drawArrow(ctxV, ox, oy, rx_px, ry_px, '#16a34a', 'R');

    ctxV.fillStyle = COLOR_PRIMARY;
    ctxV.beginPath();
    ctxV.arc(ax_px, ay_px, 8, 0, Math.PI * 2);
    ctxV.fill();
    ctxV.fillStyle = '#dc2626';
    ctxV.beginPath();
    ctxV.arc(bx_px, by_px, 8, 0, Math.PI * 2);
    ctxV.fill();

    updateVectorMath();
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
    }
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function handleDown(e) {
    e.preventDefault();
    const pos = getMousePos(canvasV, e);
    const ax_px = stateV.originX + stateV.A.x * stateV.scale;
    const ay_px = stateV.originY + stateV.A.y * stateV.scale;
    const bx_px = stateV.originX + stateV.B.x * stateV.scale;
    const by_px = stateV.originY + stateV.B.y * stateV.scale;
    if (Math.hypot(pos.x - ax_px, pos.y - ay_px) < 15) stateV.dragging = 'A';
    else if (Math.hypot(pos.x - bx_px, pos.y - by_px) < 15) stateV.dragging = 'B';
}

function handleMove(e) {
    if (!stateV.dragging) return;
    e.preventDefault();
    const pos = getMousePos(canvasV, e);
    const gridX = Math.round((pos.x - stateV.originX) / stateV.scale);
    const gridY = Math.round((pos.y - stateV.originY) / stateV.scale);
    if (stateV.dragging === 'A') {
        stateV.A.x = gridX;
        stateV.A.y = gridY;
    } else if (stateV.dragging === 'B') {
        stateV.B.x = gridX;
        stateV.B.y = gridY;
    }
    drawVectors();
}

function handleUp() {
    stateV.dragging = null;
}

canvasV.addEventListener('mousedown', handleDown);
canvasV.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);
canvasV.addEventListener('touchstart', handleDown, { passive: false });
canvasV.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleUp);

if (typeof layoutVectorsCanvas === 'function') layoutVectorsCanvas();
drawVectors();
