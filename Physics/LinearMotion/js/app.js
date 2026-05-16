// --- Tab Management ---
const VALID_TABS = ['1d', 'vectors', '2d', 'guide'];

const SECTION_TITLES = {
    '1d': '1D Motion',
    vectors: 'Vectors',
    '2d': '2D Motion',
    guide: 'Math Guide'
};

function parseTabFromHash() {
    const raw = (location.hash || '').replace(/^#/, '').toLowerCase();
    return VALID_TABS.includes(raw) ? raw : null;
}

function announceSectionChange(tabId) {
    const announcer = document.getElementById('lesson-announcer');
    if (!announcer) return;
    const title = SECTION_TITLES[tabId] || tabId;
    announcer.textContent = `Switched to ${title}`;
}

function focusSectionHeading(tabId) {
    let target = null;
    if (tabId === 'guide') {
        target = document.getElementById('guide-hero-heading');
    } else {
        const section = document.getElementById(`section-${tabId}`);
        target = section?.querySelector('.sim-sidebar .sidebar-header h2');
    }
    if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    }
}

function switchTab(tabId, options = {}) {
    if (!VALID_TABS.includes(tabId)) return;

    document.querySelectorAll('.section-container').forEach((el) => {
        el.style.display = 'none';
    });
    const targetSection = document.getElementById(`section-${tabId}`);
    if (targetSection) targetSection.style.display = 'block';

    if (typeof setFabActiveTab === 'function') setFabActiveTab(tabId);

    if (!options.skipHash) {
        const nextHash = `#${tabId}`;
        if (location.hash !== nextHash) {
            history.replaceState(null, '', nextHash);
        }
    }

    if (!options.silent) {
        announceSectionChange(tabId);
    }

    if (tabId === '1d') {
        requestAnimationFrame(() => {
            draw1D();
            draw1DGraphs();
            if (typeof update1DLiveFormulas === 'function') update1DLiveFormulas();
        });
    } else if (tabId === 'vectors') {
        requestAnimationFrame(() => {
            drawVectors();
            if (typeof updateVectorMath === 'function') updateVectorMath();
        });
    } else if (tabId === '2d') {
        requestAnimationFrame(() => {
            draw2DEnvironment();
            draw2DGraphs();
            if (typeof update2DLiveFormulas === 'function') update2DLiveFormulas();
        });
    } else if (tabId === 'guide') {
        requestAnimationFrame(() => {
            if (typeof initMathGuideTab === 'function') initMathGuideTab();
            if (typeof applyCalculusVisibility === 'function') applyCalculusVisibility();
        });
    }
    if (typeof refreshAllMathPanels === 'function') {
        requestAnimationFrame(refreshAllMathPanels);
    }

    if (!options.skipFocus) {
        requestAnimationFrame(() => focusSectionHeading(tabId));
    }

    if (typeof refitLessonCanvasesForTab === 'function') {
        refitLessonCanvasesForTab(tabId);
    }
}

function initLessonRouting() {
    const initial = parseTabFromHash() || '1d';
    switchTab(initial, { skipHash: true, silent: true, skipFocus: true });

    window.addEventListener('hashchange', () => {
        const tab = parseTabFromHash();
        if (tab) switchTab(tab, { skipHash: true });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof initLessonCanvases === 'function') initLessonCanvases();
    initLessonRouting();
    if (typeof refreshAllMathPanels === 'function') refreshAllMathPanels();
});
