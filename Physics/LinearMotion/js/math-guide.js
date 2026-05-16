// Math Guide tab — sample graphs, identification quiz, KaTeX refresh

const GUIDE_ANSWERS = { a: 'constant', b: 'linear', c: 'quadratic' };

function drawGuideSampleCurve(ctx, w, h, type) {
    const pad = { left: 32, right: 12, top: 16, bottom: 24 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const tMax = 4;

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

    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('t', pad.left + plotW / 2, h - 6);
    ctx.save();
    ctx.translate(10, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y', 0, 0);
    ctx.restore();

    let yMin = 0;
    let yMax = 1;
    const steps = 40;
    const samples = [];
    for (let i = 0; i <= steps; i++) {
        const t = (tMax * i) / steps;
        let y;
        if (type === 'constant') y = 2.5;
        else if (type === 'linear') y = 0.8 * t + 0.5;
        else y = -0.35 * t * t + 2.2 * t + 0.3;
        samples.push({ t, y });
        yMin = Math.min(yMin, y);
        yMax = Math.max(yMax, y);
    }
    const padY = 0.4;
    yMin -= padY;
    yMax += padY;

    const toX = (t) => pad.left + (t / tMax) * plotW;
    const toY = (y) => h - pad.bottom - ((y - yMin) / (yMax - yMin)) * plotH;

    const colors = { constant: '#22c55e', linear: '#ef4444', quadratic: COLOR_PRIMARY };
    ctx.strokeStyle = colors[type] || COLOR_PRIMARY;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    samples.forEach((p, i) => {
        const px = toX(p.t);
        const py = toY(p.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();
}

function drawGuideSamples() {
    const pairs = [
        ['guide-canvas-const', 'constant'],
        ['guide-canvas-linear', 'linear'],
        ['guide-canvas-quad', 'quadratic']
    ];
    for (const [id, type] of pairs) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (typeof fitCanvasToDisplay === 'function') {
            fitCanvasToDisplay(el, 220 / 140);
        }
        const ctx = el.getContext('2d');
        drawGuideSampleCurve(ctx, el.width, el.height, type);
    }
}

function resetGuideQuizBadges() {
    const map = { a: 'guide-badge-a', b: 'guide-badge-b', c: 'guide-badge-c' };
    for (const key of Object.keys(map)) {
        const el = document.getElementById(map[key]);
        if (el) {
            el.textContent = '?';
            el.className = 'eq-badge eq-badge-' + (key === 'a' ? 'constant' : key === 'b' ? 'linear' : 'quadratic');
            el.style.opacity = '0.45';
        }
    }
}

function revealGuideAnswers() {
    const labels = { a: 'Constant', b: 'Linear', c: 'Quadratic' };
    const classes = { a: 'eq-badge-constant', b: 'eq-badge-linear', c: 'eq-badge-quadratic' };
    for (const key of ['a', 'b', 'c']) {
        const el = document.getElementById('guide-badge-' + key);
        if (el) {
            el.textContent = labels[key];
            el.className = 'eq-badge ' + classes[key];
            el.style.opacity = '1';
        }
        const sel = document.getElementById('guide-quiz-' + key);
        if (sel) sel.value = GUIDE_ANSWERS[key];
    }
    checkGuideQuiz();
}

function checkGuideQuiz() {
    const fb = document.getElementById('guide-quiz-feedback');
    if (!fb) return;

    const picks = {
        a: document.getElementById('guide-quiz-a')?.value,
        b: document.getElementById('guide-quiz-b')?.value,
        c: document.getElementById('guide-quiz-c')?.value
    };

    if (!picks.a || !picks.b || !picks.c) {
        fb.textContent = 'Select a type for each sample.';
        fb.className = 'guide-quiz-feedback is-neutral';
        return;
    }

    let correct = 0;
    for (const key of ['a', 'b', 'c']) {
        if (picks[key] === GUIDE_ANSWERS[key]) correct++;
    }

    if (correct === 3) {
        fb.textContent = 'All correct! A = constant, B = linear, C = quadratic.';
        fb.className = 'guide-quiz-feedback is-success';
    } else {
        fb.textContent = `${correct}/3 correct. Reveal answers or try again — check the graph shape and highest power of t.`;
        fb.className = 'guide-quiz-feedback is-warn';
    }
}

function initGuideTocSpy() {
    const toc = document.querySelector('.guide-toc');
    if (!toc || toc.dataset.spyBound) return;
    toc.dataset.spyBound = '1';

    const links = [...toc.querySelectorAll('a[href^="#guide-"]')];
    const sections = links
        .map((a) => document.querySelector(a.getAttribute('href')))
        .filter(Boolean);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (!visible.length) return;
            const id = visible[0].target.id;
            links.forEach((a) => {
                a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
            });
        },
        { root: null, rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.25, 0.5] }
    );

    sections.forEach((s) => observer.observe(s));
}

function initMathGuideTab() {
    drawGuideSamples();
    resetGuideQuizBadges();
    initGuideTocSpy();
    const root = document.getElementById('section-guide');
    if (root && typeof renderMathInElement === 'function') {
        renderMathInElement(root);
    } else if (root && typeof renderMathIn === 'function') {
        renderMathIn(root);
    }
}
