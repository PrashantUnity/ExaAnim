// --- 2D PROJECTILE ---
const canvas2D = document.getElementById('canvas-2d');
const ctx2D = canvas2D.getContext('2d');

let state2D = {
    u: 40,
    theta: 45,
    projectiles: [],
    pixelsPerMeter: 4,
    originX: 50,
    originY: 550,
    lastTime: 0,
    animationId: null,
    theoRange: 0,
    theoHeight: 0
};

function getTheoretical2D(u, thetaDeg) {
    const rad = thetaDeg * Math.PI / 180;
    return {
        tFlight: (2 * u * Math.sin(rad)) / G,
        hMax: (u * u * Math.pow(Math.sin(rad), 2)) / (2 * G),
        range: (u * u * Math.sin(2 * rad)) / G
    };
}

function update2DInputs() {
    state2D.u = parseFloat(document.getElementById('slider-2d-u').value);
    state2D.theta = parseFloat(document.getElementById('slider-2d-ang').value);
    document.getElementById('val-2d-u').innerText = state2D.u + ' m/s';
    document.getElementById('val-2d-ang').innerText = state2D.theta + '°';

    const theo = getTheoretical2D(state2D.u, state2D.theta);
    state2D.theoRange = theo.range;
    state2D.theoHeight = theo.hMax;
    document.getElementById('theo-t').innerText = theo.tFlight.toFixed(2) + ' s';
    document.getElementById('theo-h').innerText = theo.hMax.toFixed(2) + ' m';
    document.getElementById('theo-r').innerText = theo.range.toFixed(2) + ' m';

    draw2DEnvironment();
}

function drawGhostArc(ctx, ox, oy, scale, u, thetaDeg) {
    const rad = thetaDeg * Math.PI / 180;
    const ux = u * Math.cos(rad);
    const uy = u * Math.sin(rad);
    const theo = getTheoretical2D(u, thetaDeg);
    const steps = 40;

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
        const t = (theo.tFlight * i) / steps;
        const x = ux * t;
        const y = uy * t - 0.5 * G * t * t;
        const px = ox + x * scale;
        const py = oy - y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const apexX = theo.range / 2;
    const apexPx = ox + apexX * scale;
    const apexPy = oy - theo.hMax * scale;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.beginPath();
    ctx.arc(apexPx, apexPy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4338ca';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('H ≈ ' + theo.hMax.toFixed(1) + ' m', apexPx + 8, apexPy + 4);
}

function drawRangeMarker(ctx, ox, oy, scale, range) {
    const px = ox + range * scale;
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, oy - 30);
    ctx.lineTo(px, oy + 5);
    ctx.stroke();
    ctx.fillStyle = '#b45309';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R ≈ ' + range.toFixed(1) + ' m', px, oy + 18);
}

function get2DLiveSample() {
    const latest = state2D.projectiles[state2D.projectiles.length - 1];
    if (latest && (latest.active || latest.t > 0)) {
        return {
            u: latest.u,
            thetaDeg: latest.thetaDeg,
            t: latest.t,
            x: latest.x,
            y: Math.max(0, latest.y),
            vx: latest.vx,
            vy: latest.vy,
            active: latest.active,
            theoRange: latest.theoRange
        };
    }
    return {
        u: state2D.u,
        thetaDeg: state2D.theta,
        t: 0,
        x: 0,
        y: 0,
        vx: state2D.u * Math.cos(state2D.theta * Math.PI / 180),
        vy: state2D.u * Math.sin(state2D.theta * Math.PI / 180),
        active: false,
        theoRange: state2D.theoRange
    };
}

function update2DLiveFormulas() {
    const s = get2DLiveSample();
    const rad = s.thetaDeg * Math.PI / 180;
    const ux = s.u * Math.cos(rad);
    const uy0 = s.u * Math.sin(rad);
    const t = s.t;
    const xCalc = ux * t;
    const yCalc = uy0 * t - 0.5 * G * t * t;
    const vyCalc = uy0 - G * t;

    const label = s.active ? `At t = ${formatNum(t)} s` : (t > 0 ? `At t = ${formatNum(t)} s (landed)` : 'At t = 0.00 s (preview)');
    setLiveText('live-2d-at-t', label);
    setLiveText('live-2d-x', formatSubst(
        'x = (u cos θ)t',
        formatNum(s.x),
        `(${formatNum(ux)})(${formatNum(t)})`
    ));
    setLiveText('live-2d-y', formatSubst(
        'y = (u sin θ)t − ½gt²',
        formatNum(s.y),
        `(${formatNum(uy0)})(${formatNum(t)}) − ½(${formatNum(G)})(${formatNum(t)})²`
    ));
    setLiveText('live-2d-vy', formatSubst(
        'v_y = u sin θ − gt',
        formatNum(s.vy),
        `${formatNum(uy0)} − (${formatNum(G)})(${formatNum(t)})`
    ));

    let rangeMsg = `Theoretical range R ≈ ${formatNum(s.theoRange)} m`;
    if (!s.active && t > 0.1) {
        rangeMsg = `Landed: x ≈ ${formatNum(s.x)} m vs R ≈ ${formatNum(s.theoRange)} m`;
    } else if (s.active) {
        rangeMsg = `In flight — x = ${formatNum(s.x)} m (R ≈ ${formatNum(s.theoRange)} m at landing)`;
    }
    setLiveText('live-2d-range-check', rangeMsg);

    if (typeof isCalculusShown === 'function' && isCalculusShown()) {
        const areaY = uy0 * t - 0.5 * G * t * t;
        setLiveText('live-2d-calculus',
            `∫₀ᵗ v_y dτ ≈ ${formatNum(areaY)} m  |  y = ${formatNum(s.y)} m  |  d²y/dt² = −${formatNum(G)} m/s²`
        );
    }
}

function update2DOverlay(p) {
    const overlay = document.getElementById('overlay-2d');
    if (!p || !p.active) {
        if (overlay) overlay.classList.add('hidden');
        update2DLiveFormulas();
        return;
    }
    overlay.classList.remove('hidden');
    const vx = p.ux;
    const vy = p.uy - G * p.t;
    document.getElementById('stat-2d-t').innerText = p.t.toFixed(2);
    document.getElementById('stat-2d-x').innerText = p.x.toFixed(2);
    document.getElementById('stat-2d-y').innerText = Math.max(0, p.y).toFixed(2);
    document.getElementById('stat-2d-vx').innerText = vx.toFixed(2);
    document.getElementById('stat-2d-vy').innerText = vy.toFixed(2);
    update2DLiveFormulas();
}

class Projectile {
    constructor(u, thetaDeg) {
        this.u = u;
        this.thetaDeg = thetaDeg;
        this.rad = thetaDeg * Math.PI / 180;
        this.ux = u * Math.cos(this.rad);
        this.uy = u * Math.sin(this.rad);
        this.t = 0;
        this.x = 0;
        this.y = 0;
        this.history = [];
        this.graphHistory = [{ t: 0, x: 0, y: 0, vx: this.ux, vy: this.uy }];
        this.active = true;
        this.passedApex = false;
        this.hue = Math.floor(Math.random() * 360);
        this.color = `hsl(${this.hue}, 70%, 50%)`;
        this.trailColor = `hsla(${this.hue}, 70%, 50%, 0.5)`;
        const theo = getTheoretical2D(u, thetaDeg);
        this.theoRange = theo.range;
        this.theoHeight = theo.hMax;
        this.showMarkers = false;
    }

    get vx() {
        return this.ux;
    }

    get vy() {
        return this.uy - G * this.t;
    }

    update(dt) {
        if (!this.active) return;

        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 120) this.history.shift();

        this.t += dt;
        this.x = this.ux * this.t;
        this.y = this.uy * this.t - 0.5 * G * this.t * this.t;

        const last = this.graphHistory[this.graphHistory.length - 1];
        if (!last || last.t !== this.t) {
            this.graphHistory.push({
                t: this.t,
                x: this.x,
                y: Math.max(0, this.y),
                vx: this.vx,
                vy: this.vy
            });
            if (this.graphHistory.length > HISTORY_MAX) this.graphHistory.shift();
        } else {
            last.x = this.x;
            last.y = Math.max(0, this.y);
            last.vx = this.vx;
            last.vy = this.vy;
        }

        if (!this.passedApex && this.vy <= 0 && this.t > 0.05) {
            this.passedApex = true;
        }

        if (this.y < 0 && this.t > 0.1) {
            this.y = 0;
            this.active = false;
            this.showMarkers = true;
        }
    }

    draw(ctx, ox, oy, scale, isLatest) {
        if (this.history.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.trailColor;
            ctx.lineWidth = 2;
            ctx.moveTo(ox + this.history[0].x * scale, oy - this.history[0].y * scale);
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(ox + this.history[i].x * scale, oy - this.history[i].y * scale);
            }
            ctx.stroke();
        }

        const px = ox + this.x * scale;
        const py = oy - this.y * scale;

        if (this.active && isLatest) {
            const vx = this.vx;
            const vy = this.vy;
            const vmag = Math.hypot(vx, vy);
            if (vmag > 0.5) {
                const vScale = 0.35;
                drawVectorArrow(ctx, px, py, px + vx * vScale, py - vy * vScale, '#334155', null, false);
            }
            drawVectorArrow(ctx, px, py, px + vx * 0.35, py, COLOR_PRIMARY, null, true);
            drawVectorArrow(ctx, px, py, px, py - vy * 0.35, '#dc2626', null, true);
        }

        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (this.showMarkers) {
            const apexX = this.theoRange / 2;
            const apexPx = ox + apexX * scale;
            const apexPy = oy - this.theoHeight * scale;
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(apexPx, apexPy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4338ca';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('H = ' + this.theoHeight.toFixed(1) + ' m', apexPx + 8, apexPy + 4);
            drawRangeMarker(ctx, ox, oy, scale, this.theoRange);
        }
    }
}

function buildTheoretical2DHistory(u, thetaDeg) {
    const theo = getTheoretical2D(u, thetaDeg);
    const rad = thetaDeg * Math.PI / 180;
    const ux = u * Math.cos(rad);
    const uy = u * Math.sin(rad);
    const history = [{ t: 0, x: 0, y: 0, vx: ux, vy: uy }];
    const steps = 60;
    for (let i = 1; i <= steps; i++) {
        const t = (theo.tFlight * i) / steps;
        history.push({
            t,
            x: ux * t,
            y: Math.max(0, uy * t - 0.5 * G * t * t),
            vx: ux,
            vy: uy - G * t
        });
    }
    return { history, tCur: theo.tFlight };
}

function get2DGraphData() {
    const latest = state2D.projectiles[state2D.projectiles.length - 1];
    const u = latest ? latest.u : state2D.u;
    const thetaDeg = latest ? latest.thetaDeg : state2D.theta;
    const tMax = getTheoretical2D(u, thetaDeg).tFlight;

    if (latest && latest.graphHistory.length > 1) {
        return {
            history: latest.graphHistory,
            tCur: latest.active ? latest.t : latest.graphHistory[latest.graphHistory.length - 1].t,
            tMax,
            u,
            thetaDeg
        };
    }
    const built = buildTheoretical2DHistory(state2D.u, state2D.theta);
    return { ...built, tMax, u: state2D.u, thetaDeg: state2D.theta };
}

function draw2DGraphs() {
    const base = get2DGraphData();
    const u = base.u;
    const thetaDeg = base.thetaDeg;
    const tMax = base.tMax;
    const rad = thetaDeg * Math.PI / 180;
    const uy = u * Math.sin(rad);
    const showCalc = typeof isCalculusShown === 'function' && isCalculusShown();
    const graphs = [
        { id: 'graph-2d-yt', key: 'y', yLabel: 'y (m)', color: COLOR_PRIMARY, yExtents: get2DYExtents(u, thetaDeg, tMax, 'y') },
        { id: 'graph-2d-xt', key: 'x', yLabel: 'x (m)', color: '#0ea5e9', yExtents: get2DYExtents(u, thetaDeg, tMax, 'x') },
        {
            id: 'graph-2d-vyt',
            key: 'vy',
            yLabel: 'v_y (m/s)',
            color: '#ef4444',
            yExtents: get2DYExtents(u, thetaDeg, tMax, 'vy'),
            areaUnder: showCalc ? { uy, g: G } : null
        }
    ];
    for (const g of graphs) {
        const el = document.getElementById(g.id);
        if (el) drawMotionGraph(el, { ...base, ...g });
    }
}

function draw2DEnvironment() {
    ctx2D.clearRect(0, 0, canvas2D.width, canvas2D.height);

    ctx2D.fillStyle = '#bae6fd';
    ctx2D.fillRect(0, 0, canvas2D.width, state2D.originY);
    ctx2D.fillStyle = '#4ade80';
    ctx2D.fillRect(0, state2D.originY, canvas2D.width, canvas2D.height - state2D.originY);
    ctx2D.fillStyle = '#166534';
    ctx2D.fillRect(0, state2D.originY + 10, canvas2D.width, canvas2D.height - state2D.originY - 10);

    ctx2D.fillStyle = '#fff';
    ctx2D.font = '12px sans-serif';
    ctx2D.textAlign = 'center';
    for (let d = 0; d <= 200; d += 25) {
        const px = state2D.originX + d * state2D.pixelsPerMeter;
        if (px > canvas2D.width) break;
        ctx2D.fillRect(px - 1, state2D.originY, 2, 5);
        ctx2D.fillText(d + 'm', px, state2D.originY + 20);
    }

    const hasActive = state2D.projectiles.some(p => p.active);
    if (!hasActive) {
        drawGhostArc(ctx2D, state2D.originX, state2D.originY, state2D.pixelsPerMeter, state2D.u, state2D.theta);
    }

    const rad = state2D.theta * Math.PI / 180;
    const barrelL = 30;
    const bx = state2D.originX + barrelL * Math.cos(rad);
    const by = state2D.originY - barrelL * Math.sin(rad);
    ctx2D.strokeStyle = '#334155';
    ctx2D.lineWidth = 12;
    ctx2D.lineCap = 'round';
    ctx2D.beginPath();
    ctx2D.moveTo(state2D.originX, state2D.originY);
    ctx2D.lineTo(bx, by);
    ctx2D.stroke();
    ctx2D.fillStyle = '#0f172a';
    ctx2D.beginPath();
    ctx2D.arc(state2D.originX, state2D.originY, 15, 0, Math.PI * 2);
    ctx2D.fill();

    const latest = state2D.projectiles[state2D.projectiles.length - 1];
    for (let i = 0; i < state2D.projectiles.length; i++) {
        const p = state2D.projectiles[i];
        p.draw(ctx2D, state2D.originX, state2D.originY, state2D.pixelsPerMeter, p === latest);
    }

    if (latest && latest.active) update2DOverlay(latest);
    else update2DOverlay(null);

    draw2DGraphs();
    update2DLiveFormulas();
}

function fireProjectile() {
    const p = new Projectile(state2D.u, state2D.theta);
    state2D.projectiles.push(p);
    if (!state2D.animationId) {
        state2D.lastTime = performance.now();
        state2D.animationId = requestAnimationFrame(loop2D);
    }
}

function clearProjectiles() {
    state2D.projectiles = [];
    draw2DEnvironment();
}

function loop2D(timestamp) {
    let dt = (timestamp - state2D.lastTime) / 1000;
    if (dt < 0) dt = 0;
    if (dt > 0.1) dt = 0.1;
    state2D.lastTime = timestamp;

    let anyActive = false;
    for (const p of state2D.projectiles) {
        p.update(dt);
        if (p.active) anyActive = true;
    }

    draw2DEnvironment();

    if (anyActive) {
        state2D.animationId = requestAnimationFrame(loop2D);
    } else {
        state2D.animationId = null;
    }
}

update2DInputs();
update2DLiveFormulas();
