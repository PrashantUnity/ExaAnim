// Floating radial menu — lesson tab navigation

const FAB_LABELS = {
    '1d': '1D',
    vectors: 'Vec',
    '2d': '2D',
    guide: 'Guide'
};

let fabMenuOpen = false;

function initFabNav() {
    const hub = document.getElementById('fab-hub');
    const menu = document.getElementById('fab-menu');
    const backdrop = document.getElementById('fab-backdrop');
    const calcBtn = document.getElementById('fab-calculus');

    if (!hub || !menu) return;

    hub.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFabMenu();
    });

    if (backdrop) {
        backdrop.addEventListener('click', () => toggleFabMenu(false));
    }

    menu.querySelectorAll('.fab-item[data-tab]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const tabId = btn.getAttribute('data-tab');
            if (tabId && typeof switchTab === 'function') {
                switchTab(tabId);
            }
            toggleFabMenu(false);
        });
    });

    if (calcBtn) {
        calcBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof toggleCalculusFromFab === 'function') {
                toggleCalculusFromFab();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && fabMenuOpen) toggleFabMenu(false);
    });

    setFabActiveTab('1d');
    syncFabCalculusState();
}

function toggleFabMenu(forceOpen) {
    const hub = document.getElementById('fab-hub');
    const menu = document.getElementById('fab-menu');
    const backdrop = document.getElementById('fab-backdrop');
    const nav = document.getElementById('fab-nav');

    if (!hub || !menu) return;

    fabMenuOpen = typeof forceOpen === 'boolean' ? forceOpen : !fabMenuOpen;

    hub.setAttribute('aria-expanded', fabMenuOpen ? 'true' : 'false');
    menu.classList.toggle('is-open', fabMenuOpen);
    menu.setAttribute('aria-hidden', fabMenuOpen ? 'false' : 'true');

    if (backdrop) {
        backdrop.classList.toggle('is-visible', fabMenuOpen);
        backdrop.setAttribute('aria-hidden', fabMenuOpen ? 'false' : 'true');
    }
    if (nav) nav.classList.toggle('is-open', fabMenuOpen);
}

function setFabActiveTab(tabId) {
    const label = FAB_LABELS[tabId] || tabId;
    const hubLabel = document.getElementById('fab-hub-label');
    if (hubLabel) hubLabel.textContent = label;

    document.querySelectorAll('.fab-item[data-tab]').forEach((btn) => {
        const active = btn.getAttribute('data-tab') === tabId;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-current', active ? 'true' : 'false');
    });
}

function syncFabCalculusState() {
    const calcBtn = document.getElementById('fab-calculus');
    const toggle = document.getElementById('toggle-calculus');
    const on = typeof isCalculusShown === 'function' ? isCalculusShown() : false;
    if (calcBtn) {
        calcBtn.classList.toggle('is-active', on);
        calcBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (toggle) toggle.checked = on;
}

function toggleCalculusFromFab() {
    const toggle = document.getElementById('toggle-calculus');
    if (toggle) {
        toggle.checked = !toggle.checked;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (typeof isCalculusShown === 'function') {
        const next = !isCalculusShown();
        sessionStorage.setItem('exaanim-linear-motion-calculus', next ? '1' : '0');
        if (typeof applyCalculusVisibility === 'function') applyCalculusVisibility();
        if (typeof refreshAllMathPanels === 'function') refreshAllMathPanels();
        if (typeof refreshGraphOverlays === 'function') refreshGraphOverlays();
    }
    syncFabCalculusState();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFabNav);
} else {
    initFabNav();
}
