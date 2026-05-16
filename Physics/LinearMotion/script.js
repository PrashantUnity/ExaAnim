// Global Constants
const G = 9.81; // Gravity m/s^2

// --- Tab Management ---
function switchTab(tabId) {
    // Hide all sections securely
    document.querySelectorAll('.section-container').forEach(el => {
        el.style.display = 'none';
    });
    // Remove active state from all tabs
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(`section-${tabId}`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Add active state to the clicked tab
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Force redraw of canvases to fix any potential glitches from being hidden
    if (tabId === 'vectors' && typeof drawVectors === 'function') {
        requestAnimationFrame(drawVectors);
    } else if (tabId === '2d' && typeof draw2DEnvironment === 'function') {
        requestAnimationFrame(draw2DEnvironment);
    }
}

// --- 1D MOTION LOGIC ---
const canvas1D = document.getElementById('canvas-1d');
const ctx1D = canvas1D.getContext('2d');
let state1D = {
    u: 0, a: 2, t: 0,
    x: 0, v: 0,
    isRunning: false,
    lastTimestamp: 0,
    pixelsPerMeter: 10,
    offsetX: 400 // Center start
};

function update1DInputs() {
    state1D.u = parseFloat(document.getElementById('slider-1d-u').value);
    state1D.a = parseFloat(document.getElementById('slider-1d-a').value);
    document.getElementById('val-1d-u').innerText = state1D.u + " m/s";
    document.getElementById('val-1d-a').innerText = state1D.a + " m/s²";
    
    if(!state1D.isRunning) {
        // reset visually but keep new params
        state1D.t = 0; state1D.x = 0; state1D.v = state1D.u;
        draw1D();
    }
}

function start1D() {
    if(state1D.isRunning) return;
    state1D.t = 0;
    state1D.x = 0;
    state1D.v = state1D.u;
    state1D.isRunning = true;
    state1D.lastTimestamp = performance.now();
    requestAnimationFrame(loop1D);
}

function reset1D() {
    state1D.isRunning = false;
    state1D.t = 0;
    state1D.x = 0;
    state1D.v = state1D.u;
    draw1D();
}

function draw1D() {
    ctx1D.clearRect(0, 0, canvas1D.width, canvas1D.height);
    
    // Draw Road
    ctx1D.fillStyle = '#334155'; // slate-700
    ctx1D.fillRect(0, canvas1D.height/2 + 20, canvas1D.width, canvas1D.height/2);
    
    // Draw grid lines on road
    ctx1D.strokeStyle = '#475569';
    ctx1D.lineWidth = 2;
    for(let i = 0; i < canvas1D.width; i += 50) {
        ctx1D.beginPath();
        // Move with camera slightly if needed, but keeping it fixed relative to canvas is easier to see motion
        let lineX = (i - (state1D.x * state1D.pixelsPerMeter) % 50); 
        ctx1D.moveTo(lineX, canvas1D.height/2 + 20);
        ctx1D.lineTo(lineX, canvas1D.height/2 + 40);
        ctx1D.stroke();
    }

    // Draw Box (Car)
    // Fix position at center and move the background, or move the box? Let's move the box to see origin clearly.
    // If it goes off-screen, wrap it or move camera. Let's move camera so box stays in view.
    
    let boxDrawX = state1D.offsetX + (state1D.x * state1D.pixelsPerMeter);
    
    // Auto camera follow if it goes too far right/left
    if (boxDrawX > canvas1D.width - 100) state1D.offsetX -= (boxDrawX - (canvas1D.width - 100));
    if (boxDrawX < 100) state1D.offsetX += (100 - boxDrawX);
    
    boxDrawX = state1D.offsetX + (state1D.x * state1D.pixelsPerMeter);

    // Draw Origin Marker
    ctx1D.fillStyle = '#ef4444'; // red
    ctx1D.fillRect(state1D.offsetX - 2, canvas1D.height/2, 4, 30);
    ctx1D.fillStyle = '#fff';
    ctx1D.font = "14px monospace";
    ctx1D.fillText("x=0", state1D.offsetX - 10, canvas1D.height/2 - 10);

    // The Car
    ctx1D.fillStyle = '#3b82f6'; // blue
    ctx1D.fillRect(boxDrawX - 25, canvas1D.height/2 - 30, 50, 50);
    
    // Wheels
    ctx1D.fillStyle = '#0f172a';
    ctx1D.beginPath(); ctx1D.arc(boxDrawX - 15, canvas1D.height/2 + 20, 8, 0, Math.PI*2); ctx1D.fill();
    ctx1D.beginPath(); ctx1D.arc(boxDrawX + 15, canvas1D.height/2 + 20, 8, 0, Math.PI*2); ctx1D.fill();

    // Vector arrow for velocity
    if (Math.abs(state1D.v) > 0.1) {
        ctx1D.strokeStyle = '#ef4444';
        ctx1D.lineWidth = 3;
        ctx1D.beginPath();
        let vScale = state1D.v * 3;
        ctx1D.moveTo(boxDrawX, canvas1D.height/2 - 15);
        ctx1D.lineTo(boxDrawX + vScale, canvas1D.height/2 - 15);
        ctx1D.stroke();
        
        // Arrowhead
        ctx1D.beginPath();
        ctx1D.moveTo(boxDrawX + vScale, canvas1D.height/2 - 15);
        let dir = state1D.v > 0 ? -1 : 1;
        ctx1D.lineTo(boxDrawX + vScale + (dir*10), canvas1D.height/2 - 20);
        ctx1D.lineTo(boxDrawX + vScale + (dir*10), canvas1D.height/2 - 10);
        ctx1D.fillStyle = '#ef4444';
        ctx1D.fill();
    }

    // Update DOM stats
    document.getElementById('stat-1d-t').innerText = state1D.t.toFixed(2);
    document.getElementById('stat-1d-s').innerText = state1D.x.toFixed(2);
    document.getElementById('stat-1d-v').innerText = state1D.v.toFixed(2);
}

function loop1D(timestamp) {
    if(!state1D.isRunning) return;
    
    let dt = (timestamp - state1D.lastTimestamp) / 1000; // seconds
    if(dt < 0) dt = 0; // Prevent negative dt
    // Clamp dt to avoid huge jumps if tab was inactive
    if(dt > 0.1) dt = 0.1;
    state1D.lastTimestamp = timestamp;

    state1D.t += dt;
    // Equations of motion
    state1D.x = (state1D.u * state1D.t) + (0.5 * state1D.a * state1D.t * state1D.t);
    state1D.v = state1D.u + (state1D.a * state1D.t);

    draw1D();

    // Stop condition (e.g., if it runs for a long time)
    if(state1D.t < 20) {
        requestAnimationFrame(loop1D);
    } else {
        state1D.isRunning = false;
    }
}

// Initialize 1D
update1DInputs();

// --- VECTORS LOGIC ---
const canvasV = document.getElementById('canvas-vectors');
const ctxV = canvasV.getContext('2d');

let stateV = {
    originX: 400, originY: 300,
    scale: 20, // pixels per unit
    A: { x: 5, y: -4 },  // Note: Y is flipped in canvas
    B: { x: -3, y: -6 },
    dragging: null
};

function drawGridV() {
    ctxV.clearRect(0, 0, canvasV.width, canvasV.height);
    ctxV.strokeStyle = '#e2e8f0';
    ctxV.lineWidth = 1;
    
    // Vertical lines
    for(let x = 0; x <= canvasV.width; x += stateV.scale) {
        ctxV.beginPath(); ctxV.moveTo(x, 0); ctxV.lineTo(x, canvasV.height); ctxV.stroke();
    }
    // Horizontal lines
    for(let y = 0; y <= canvasV.height; y += stateV.scale) {
        ctxV.beginPath(); ctxV.moveTo(0, y); ctxV.lineTo(canvasV.width, y); ctxV.stroke();
    }

    // Axes
    ctxV.strokeStyle = '#94a3b8'; ctxV.lineWidth = 2;
    ctxV.beginPath(); ctxV.moveTo(stateV.originX, 0); ctxV.lineTo(stateV.originX, canvasV.height); ctxV.stroke();
    ctxV.beginPath(); ctxV.moveTo(0, stateV.originY); ctxV.lineTo(canvasV.width, stateV.originY); ctxV.stroke();
}

function drawArrow(ctx, fromX, fromY, toX, toY, color, label) {
    const headlen = 15;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI/6), toY - headlen * Math.sin(angle - Math.PI/6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI/6), toY - headlen * Math.sin(angle + Math.PI/6));
    ctx.fillStyle = color;
    ctx.fill();

    // Label
    ctx.fillStyle = color;
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(label, toX + 10, toY + 10);
}

function updateVectorMath() {
    // Actual math coordinates (Y up)
    let ax = stateV.A.x, ay = -stateV.A.y; 
    let bx = stateV.B.x, by = -stateV.B.y;
    let rx = ax + bx, ry = ay + by;
    
    let magR = Math.sqrt(rx*rx + ry*ry);
    let angR = Math.atan2(ry, rx) * (180 / Math.PI);
    if(angR < 0) angR += 360;

    document.getElementById('vec-a-val').innerText = `${ax}i ${ay >= 0 ? '+' : '-'} ${Math.abs(ay)}j`;
    document.getElementById('vec-b-val').innerText = `${bx}i ${by >= 0 ? '+' : '-'} ${Math.abs(by)}j`;
    document.getElementById('vec-r-val').innerText = `${rx}i ${ry >= 0 ? '+' : '-'} ${Math.abs(ry)}j`;
    document.getElementById('vec-r-mag').innerText = magR.toFixed(2);
    document.getElementById('vec-r-ang').innerText = angR.toFixed(1) + "°";
}

function drawVectors() {
    drawGridV();
    
    let ax_px = stateV.originX + stateV.A.x * stateV.scale;
    let ay_px = stateV.originY + stateV.A.y * stateV.scale;
    
    let bx_px = stateV.originX + stateV.B.x * stateV.scale;
    let by_px = stateV.originY + stateV.B.y * stateV.scale;
    
    let rx_px = stateV.originX + (stateV.A.x + stateV.B.x) * stateV.scale;
    let ry_px = stateV.originY + (stateV.A.y + stateV.B.y) * stateV.scale;

    // Parallelogram completion (dashed lines)
    ctxV.strokeStyle = '#cbd5e1'; ctxV.lineWidth = 2; ctxV.setLineDash([5, 5]);
    ctxV.beginPath(); ctxV.moveTo(ax_px, ay_px); ctxV.lineTo(rx_px, ry_px); ctxV.stroke();
    ctxV.beginPath(); ctxV.moveTo(bx_px, by_px); ctxV.lineTo(rx_px, ry_px); ctxV.stroke();
    ctxV.setLineDash([]); // reset

    drawArrow(ctxV, stateV.originX, stateV.originY, ax_px, ay_px, '#2563eb', 'A'); // Blue
    drawArrow(ctxV, stateV.originX, stateV.originY, bx_px, by_px, '#dc2626', 'B'); // Red
    drawArrow(ctxV, stateV.originX, stateV.originY, rx_px, ry_px, '#16a34a', 'R'); // Green

    // Draw draggable handle points
    ctxV.fillStyle = '#2563eb'; ctxV.beginPath(); ctxV.arc(ax_px, ay_px, 8, 0, Math.PI*2); ctxV.fill();
    ctxV.fillStyle = '#dc2626'; ctxV.beginPath(); ctxV.arc(bx_px, by_px, 8, 0, Math.PI*2); ctxV.fill();

    updateVectorMath();
}

// Mouse/Touch Events for Canvas Vectors
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    // Scale mouse coordinates to match internal canvas resolution
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    
    if(evt.touches && evt.touches.length > 0) {
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
    let pos = getMousePos(canvasV, e);
    let ax_px = stateV.originX + stateV.A.x * stateV.scale;
    let ay_px = stateV.originY + stateV.A.y * stateV.scale;
    let bx_px = stateV.originX + stateV.B.x * stateV.scale;
    let by_px = stateV.originY + stateV.B.y * stateV.scale;

    // Check if clicking near A
    if(Math.hypot(pos.x - ax_px, pos.y - ay_px) < 15) stateV.dragging = 'A';
    else if(Math.hypot(pos.x - bx_px, pos.y - by_px) < 15) stateV.dragging = 'B';
}

function handleMove(e) {
    if(!stateV.dragging) return;
    e.preventDefault();
    let pos = getMousePos(canvasV, e);
    // Snap to grid integers for cleaner math
    let gridX = Math.round((pos.x - stateV.originX) / stateV.scale);
    let gridY = Math.round((pos.y - stateV.originY) / stateV.scale);

    if(stateV.dragging === 'A') {
        stateV.A.x = gridX; stateV.A.y = gridY;
    } else if(stateV.dragging === 'B') {
        stateV.B.x = gridX; stateV.B.y = gridY;
    }
    drawVectors();
}

function handleUp(e) {
    stateV.dragging = null;
}

canvasV.addEventListener('mousedown', handleDown);
canvasV.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp); // window level to catch releases outside
canvasV.addEventListener('touchstart', handleDown, {passive: false});
canvasV.addEventListener('touchmove', handleMove, {passive: false});
window.addEventListener('touchend', handleUp);

drawVectors();

// --- 2D PROJECTILE LOGIC ---
const canvas2D = document.getElementById('canvas-2d');
const ctx2D = canvas2D.getContext('2d');

let state2D = {
    u: 40, theta: 45, // theta in degrees
    projectiles: [], // Array to hold multiple shots for trailing
    pixelsPerMeter: 4, // Scale
    originX: 50,
    originY: 550, // Bottom leftish
    lastTime: 0,
    animationId: null
};

function update2DInputs() {
    state2D.u = parseFloat(document.getElementById('slider-2d-u').value);
    state2D.theta = parseFloat(document.getElementById('slider-2d-ang').value);
    document.getElementById('val-2d-u').innerText = state2D.u + " m/s";
    document.getElementById('val-2d-ang').innerText = state2D.theta + "°";
    
    // Calculate theoreticals
    let rad = state2D.theta * Math.PI / 180;
    let tFlight = (2 * state2D.u * Math.sin(rad)) / G;
    let hMax = (state2D.u * state2D.u * Math.pow(Math.sin(rad), 2)) / (2 * G);
    let range = (state2D.u * state2D.u * Math.sin(2 * rad)) / G;

    document.getElementById('theo-t').innerText = tFlight.toFixed(2) + " s";
    document.getElementById('theo-h').innerText = hMax.toFixed(2) + " m";
    document.getElementById('theo-r').innerText = range.toFixed(2) + " m";
    
    draw2DEnvironment(); // Draw cannon preview
}

class Projectile {
    constructor(u, theta) {
        this.u = u;
        this.rad = theta * Math.PI / 180;
        this.ux = u * Math.cos(this.rad);
        this.uy = u * Math.sin(this.rad);
        this.t = 0;
        this.x = 0;
        this.y = 0;
        this.history = []; // For trail
        this.active = true;
        this.hue = Math.floor(Math.random() * 360);
        this.color = `hsl(${this.hue}, 70%, 50%)`;
        this.trailColor = `hsla(${this.hue}, 70%, 50%, 0.5)`;
    }
    
    update(dt) {
        if(!this.active) return;
        
        this.history.push({x: this.x, y: this.y});
        if(this.history.length > 100) this.history.shift(); // Limit trail length

        this.t += dt;
        this.x = this.ux * this.t;
        this.y = (this.uy * this.t) - (0.5 * G * this.t * this.t);
        
        // Add this.t > 0.1 check to prevent float precision instant-death at t=0
        if(this.y < 0 && this.t > 0.1) {
            this.y = 0;
            this.active = false; // Hit ground
        }
    }

    draw(ctx, ox, oy, scale) {
        let px = ox + this.x * scale;
        let py = oy - this.y * scale; // invert Y for canvas
        
        // Trail
        if(this.history.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.trailColor; // 50% opacity fixed
            ctx.lineWidth = 2;
            ctx.moveTo(ox + this.history[0].x * scale, oy - this.history[0].y * scale);
            for(let i=1; i<this.history.length; i++){
                ctx.lineTo(ox + this.history[i].x * scale, oy - this.history[i].y * scale);
            }
            ctx.stroke();
        }

        // Ball
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI*2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function draw2DEnvironment() {
    ctx2D.clearRect(0, 0, canvas2D.width, canvas2D.height);
    
    // Draw Ground
    ctx2D.fillStyle = '#4ade80'; // green-400
    ctx2D.fillRect(0, state2D.originY, canvas2D.width, canvas2D.height - state2D.originY);
    ctx2D.fillStyle = '#166534'; // green-800
    ctx2D.fillRect(0, state2D.originY+10, canvas2D.width, canvas2D.height - state2D.originY - 10);

    // Draw Distance Markers on ground
    ctx2D.fillStyle = '#fff';
    ctx2D.font = "12px sans-serif";
    ctx2D.textAlign = "center";
    for(let d=0; d<=200; d+=25) {
        let px = state2D.originX + (d * state2D.pixelsPerMeter);
        if(px > canvas2D.width) break;
        ctx2D.fillRect(px - 1, state2D.originY, 2, 5);
        ctx2D.fillText(d+"m", px, state2D.originY + 20);
    }

    // Draw Cannon Base & Barrel (Previewing angle)
    let rad = state2D.theta * Math.PI / 180;
    let barrelL = 30;
    let bx = state2D.originX + barrelL * Math.cos(rad);
    let by = state2D.originY - barrelL * Math.sin(rad);

    ctx2D.strokeStyle = '#334155';
    ctx2D.lineWidth = 12;
    ctx2D.lineCap = 'round';
    ctx2D.beginPath();
    ctx2D.moveTo(state2D.originX, state2D.originY);
    ctx2D.lineTo(bx, by);
    ctx2D.stroke();

    // Cannon wheel
    ctx2D.fillStyle = '#0f172a';
    ctx2D.beginPath();
    ctx2D.arc(state2D.originX, state2D.originY, 15, 0, Math.PI*2);
    ctx2D.fill();
    
    // Draw all projectiles
    for(let p of state2D.projectiles) {
        p.draw(ctx2D, state2D.originX, state2D.originY, state2D.pixelsPerMeter);
    }
}

function fireProjectile() {
    let p = new Projectile(state2D.u, state2D.theta);
    state2D.projectiles.push(p);
    
    if(!state2D.animationId) {
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
    if(dt < 0) dt = 0; // Prevent negative dt ending simulation instantly
    if(dt > 0.1) dt = 0.1; // clamp
    state2D.lastTime = timestamp;

    let anyActive = false;
    for(let p of state2D.projectiles) {
        p.update(dt);
        if(p.active) anyActive = true;
    }

    draw2DEnvironment();

    if(anyActive) {
        state2D.animationId = requestAnimationFrame(loop2D);
    } else {
        state2D.animationId = null; // Stop looping if everything landed
    }
}

// Initialize 2D
update2DInputs();

// Handle window resize dynamically to adjust CSS scaling internally if needed,
// but fixed resolution logic keeps physics easy.
