// accessibility.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Ayarları LocalStorage'dan al veya varsayılanları kullan
    const state = JSON.parse(localStorage.getItem('a11y_state')) || {
        fontSize: 100,
        darkMode: false,
        grayscale: false,
        highContrast: false,
        readableFont: false,
        eyeRest: false,
        colorBlindness: 'normal',
        highlightLinks: false,
        hideImages: false,
        stopAnimations: false
    };

    const applyState = () => {
        document.documentElement.style.fontSize = `${state.fontSize}%`;
        document.getElementById('a11y-font-size-text').textContent = `${state.fontSize}%`;

        document.documentElement.classList.toggle('a11y-dark-mode', state.darkMode);
        document.documentElement.classList.toggle('a11y-grayscale', state.grayscale);
        document.documentElement.classList.toggle('a11y-high-contrast', state.highContrast);
        document.documentElement.classList.toggle('a11y-eye-rest', state.eyeRest);

        document.body.classList.toggle('a11y-readable-font', state.readableFont);
        document.body.classList.toggle('a11y-highlight-links', state.highlightLinks);
        document.body.classList.toggle('a11y-hide-images', state.hideImages);
        document.body.classList.toggle('a11y-stop-animations', state.stopAnimations);

        document.documentElement.classList.remove('a11y-protanopia', 'a11y-deuteranopia', 'a11y-tritanopia');
        if (state.colorBlindness !== 'normal') {
            document.documentElement.classList.add(`a11y-${state.colorBlindness}`);
        }

        document.getElementById('cb-dark-mode').checked = state.darkMode;
        document.getElementById('cb-grayscale').checked = state.grayscale;
        document.getElementById('cb-high-contrast').checked = state.highContrast;
        document.getElementById('cb-readable-font').checked = state.readableFont;
        document.getElementById('cb-eye-rest').checked = state.eyeRest;
        document.getElementById('cb-highlight-links').checked = state.highlightLinks;
        document.getElementById('cb-hide-images').checked = state.hideImages;
        document.getElementById('cb-stop-animations').checked = state.stopAnimations;
        document.getElementById('select-color-blindness').value = state.colorBlindness;
        
        localStorage.setItem('a11y_state', JSON.stringify(state));
    };

    document.getElementById('a11y-toggle-btn').addEventListener('click', () => {
        document.getElementById('a11y-panel').classList.toggle('show');
    });

    document.getElementById('btn-font-decrease').addEventListener('click', () => {
        if (state.fontSize > 50) { state.fontSize -= 10; applyState(); }
    });
    document.getElementById('btn-font-increase').addEventListener('click', () => {
        if (state.fontSize < 200) { state.fontSize += 10; applyState(); }
    });

    const toggles = [
        { id: 'cb-dark-mode', key: 'darkMode' },
        { id: 'cb-grayscale', key: 'grayscale' },
        { id: 'cb-high-contrast', key: 'highContrast' },
        { id: 'cb-readable-font', key: 'readableFont' },
        { id: 'cb-eye-rest', key: 'eyeRest' },
        { id: 'cb-highlight-links', key: 'highlightLinks' },
        { id: 'cb-hide-images', key: 'hideImages' },
        { id: 'cb-stop-animations', key: 'stopAnimations' }
    ];

    toggles.forEach(t => {
        document.getElementById(t.id).addEventListener('change', (e) => {
            state[t.key] = e.target.checked;
            applyState();
        });
    });

    document.getElementById('select-color-blindness').addEventListener('change', (e) => {
        state.colorBlindness = e.target.value;
        applyState();
    });

    document.getElementById('a11y-reset-btn').addEventListener('click', () => {
        state.fontSize = 100;
        state.darkMode = false;
        state.grayscale = false;
        state.highContrast = false;
        state.readableFont = false;
        state.eyeRest = false;
        state.colorBlindness = 'normal';
        state.highlightLinks = false;
        state.hideImages = false;
        state.stopAnimations = false;
        applyState();
    });

    const svgFilters = `
        <svg style="display: none;" aria-hidden="true">
            <defs>
                <filter id="protanopia-filter">
                    <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0" />
                </filter>
                <filter id="deuteranopia-filter">
                    <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0" />
                </filter>
                <filter id="tritanopia-filter">
                    <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0" />
                </filter>
            </defs>
        </svg>
    `;
    document.body.insertAdjacentHTML('beforeend', svgFilters);

    applyState();

    // -- ÇIKTI AL BUTONU EKLENTİSİ --
    const panel = document.getElementById('a11y-panel');
    if (panel) {
        const header = panel.querySelector('.a11y-header');
        const printBtnHtml = `
            <button class="a11y-print-btn" onclick="window.print()">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Çıktı Al
            </button>
        `;
        if (header) {
            header.insertAdjacentHTML('afterend', printBtnHtml);
        }
    }
});
