// Math pedagogy helpers — calculus toggle, live substitution, KaTeX refresh

const CALCULUS_STORAGE_KEY = 'exaanim-linear-motion-calculus';

let showCalculus = false;

function formatNum(n, decimals = 2) {
    if (!Number.isFinite(n)) return '—';
    const rounded = Number(n.toFixed(decimals));
    if (Object.is(rounded, -0)) return '0';
    return String(rounded);
}

/** Plain-text substitution line (monospace live panel). */
function formatSubst(equation, result, steps) {
    return `${equation} → ${result} = ${steps}`;
}

function initCalculusToggle() {
    const stored = sessionStorage.getItem(CALCULUS_STORAGE_KEY);
    showCalculus = stored === '1';
    const toggle = document.getElementById('toggle-calculus');
    if (toggle) {
        toggle.checked = showCalculus;
        toggle.addEventListener('change', () => {
            showCalculus = toggle.checked;
            sessionStorage.setItem(CALCULUS_STORAGE_KEY, showCalculus ? '1' : '0');
            applyCalculusVisibility();
            refreshAllMathPanels();
            refreshGraphOverlays();
            if (typeof syncFabCalculusState === 'function') syncFabCalculusState();
        });
    }
    applyCalculusVisibility();
    if (typeof syncFabCalculusState === 'function') syncFabCalculusState();
}

function applyCalculusVisibility() {
    document.querySelectorAll('.calculus-layer').forEach(el => {
        el.classList.toggle('calculus-hidden', !showCalculus);
    });
}

function isCalculusShown() {
    return showCalculus;
}

/** Re-render $...$ inside optional root (defaults to whole body). */
function renderMathIn(root) {
    const el = root || document.body;
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(el, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ],
            throwOnError: false
        });
    }
}

function setLiveText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setLiveHtml(id, html) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
    renderMathIn(el);
}

function refreshAllMathPanels() {
    if (typeof update1DLiveFormulas === 'function') update1DLiveFormulas();
    if (typeof update2DLiveFormulas === 'function') update2DLiveFormulas();
    if (typeof updateVectorMath === 'function') updateVectorMath();
    document.querySelectorAll('.math-map[data-static-math]').forEach(el => renderMathIn(el));
    document.querySelectorAll('.calculus-layer:not(.calculus-hidden)').forEach(el => renderMathIn(el));
    const guide = document.getElementById('section-guide');
    if (guide && guide.style.display !== 'none') renderMathIn(guide);
}

function refreshGraphOverlays() {
    if (typeof draw1DGraphs === 'function') draw1DGraphs();
    if (typeof draw2DGraphs === 'function') draw2DGraphs();
}

function initCalculusToggleOnReady() {
    initCalculusToggle();
    refreshAllMathPanels();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculusToggleOnReady);
} else {
    initCalculusToggleOnReady();
}
