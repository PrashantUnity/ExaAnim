// --- Tab Management ---
function switchTab(tabId) {
    document.querySelectorAll('.section-container').forEach(el => {
        el.style.display = 'none';
    });
    const targetSection = document.getElementById(`section-${tabId}`);
    if (targetSection) targetSection.style.display = 'block';

    if (typeof setFabActiveTab === 'function') setFabActiveTab(tabId);

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
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof refreshAllMathPanels === 'function') refreshAllMathPanels();
});
