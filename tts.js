// tts.js
(function() {
    const initTTS = () => {
        const docHead = document.querySelector('.doc-head');
        const docBody = document.querySelector('.doc-body');
        
        // Sadece içeriği ve başlığı olan ders sayfalarında çalışsın
        if (!docHead || !docBody) return;

        // 1. Zarif CSS Stilleri
        const style = document.createElement('style');
        style.innerHTML = `
            .tts-container {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-top: 20px;
                margin-bottom: -10px;
            }
            .tts-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background-color: #f8fafc; /* Çok hafif, zarif gri/beyaz */
                border: 1px solid #e2e8f0;
                color: #64748b; /* Yumuşak füme */
                padding: 6px 14px;
                border-radius: 20px; /* Hap şeklinde modern tasarım */
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 1px 2px rgba(0,0,0,0.03);
                font-family: inherit;
            }
            .tts-btn:hover {
                background-color: #f1f5f9;
                border-color: #cbd5e1;
                color: #334155;
            }
            .tts-btn.active {
                background-color: #eff6ff; /* Hafif mavi arka plan */
                border-color: #bfdbfe;
                color: #2563eb;
            }
            .tts-btn svg {
                width: 14px;
                height: 14px;
            }
            .tts-reading-highlight {
                background-color: rgba(59, 130, 246, 0.1) !important; /* Okunan metni çok hafif maviyle vurgula */
                border-radius: 4px;
                transition: background-color 0.3s ease;
            }
        `;
        document.head.appendChild(style);

        // 2. İkonlar ve Butonların Eklenmesi
        const iconPlay = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
        const iconPause = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        const iconStop = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>`;

        const ttsContainer = document.createElement('div');
        ttsContainer.className = 'tts-container';
        ttsContainer.innerHTML = `
            <button id="tts-play" class="tts-btn" title="Dersi Sesli Dinle">${iconPlay} <span>Dersi Dinle</span></button>
            <button id="tts-stop" class="tts-btn" style="display:none;" title="Dinlemeyi Kapat">${iconStop}</button>
        `;
        
        // Butonu sayfa başlığının altına, içeriğin hemen üstüne ekliyoruz
        docHead.appendChild(ttsContainer);

        const btnPlay = document.getElementById('tts-play');
        const btnStop = document.getElementById('tts-stop');
        const btnText = btnPlay.querySelector('span');

        let chunks = [];
        let currentIndex = 0;
        let isPlaying = false;
        let isPaused = false;
        let currentUtterance = null;

        // 3. İçeriği Akıllıca Parçalara Ayırma
        const prepareChunks = () => {
            chunks = [];
            // Yalnızca anlamlı blokları (başlıklar, paragraflar, maddeler) seç
            const elements = docBody.querySelectorAll('h1, h2, h3, p, li');
            elements.forEach(el => {
                // Görünmez olanları veya diğer eklentilere ait olanları yoksay
                if (el.offsetParent === null) return;
                if (el.closest('.tts-container') || el.closest('#hl-note-modal') || el.closest('#progress-toast') || el.closest('.a11y-panel')) return;
                
                const text = el.innerText.trim();
                if (text.length > 0) {
                    chunks.push({ el, text });
                }
            });
        };

        const clearHighlights = () => {
            chunks.forEach(c => c.el.classList.remove('tts-reading-highlight'));
        };

        const resetTTS = () => {
            window.speechSynthesis.cancel();
            isPlaying = false;
            isPaused = false;
            currentIndex = 0;
            btnPlay.innerHTML = `${iconPlay} <span>Dersi Dinle</span>`;
            btnPlay.classList.remove('active');
            btnStop.style.display = 'none';
            clearHighlights();
        };

        // Sıradaki metni okuma motoruna gönder
        const playNextChunk = () => {
            if (currentIndex >= chunks.length) {
                resetTTS();
                return;
            }

            clearHighlights();
            
            const chunk = chunks[currentIndex];
            chunk.el.classList.add('tts-reading-highlight');
            
            // Okunan metin ekrandan çıktıysa sayfayı yavaşça oraya kaydır
            const rect = chunk.el.getBoundingClientRect();
            if (rect.top < 80 || rect.bottom > window.innerHeight) {
                window.scrollBy({ top: rect.top - 120, behavior: 'smooth' });
            }

            currentUtterance = new SpeechSynthesisUtterance(chunk.text);
            currentUtterance.lang = 'tr-TR';
            currentUtterance.rate = 1.0;
            
            currentUtterance.onend = () => {
                if (isPlaying && !isPaused) {
                    currentIndex++;
                    playNextChunk();
                }
            };
            
            currentUtterance.onerror = (e) => {
                if (e.error !== 'interrupted' && e.error !== 'canceled') {
                    console.warn("TTS Error:", e);
                }
            };

            window.speechSynthesis.speak(currentUtterance);
        };

        // 4. Olay Dinleyicileri (Event Listeners)
        btnPlay.addEventListener('click', () => {
            if (!isPlaying) {
                // Sesi Başlat
                prepareChunks();
                if (chunks.length === 0) return;
                
                isPlaying = true;
                btnPlay.innerHTML = `${iconPause} <span>Duraklat</span>`;
                btnPlay.classList.add('active');
                btnStop.style.display = 'inline-flex';
                playNextChunk();
            } else {
                if (isPaused) {
                    // Duraklatılan sesi devam ettir
                    isPaused = false;
                    window.speechSynthesis.resume();
                    btnPlay.innerHTML = `${iconPause} <span>Duraklat</span>`;
                } else {
                    // Sesi duraklat
                    isPaused = true;
                    window.speechSynthesis.pause();
                    btnPlay.innerHTML = `${iconPlay} <span>Devam Et</span>`;
                }
            }
        });

        btnStop.addEventListener('click', resetTTS);

        // Başka bir sayfaya geçilirse veya sayfa kapanırsa sesi kesinlikle kes
        window.addEventListener('beforeunload', () => {
            window.speechSynthesis.cancel();
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTTS);
    } else {
        initTTS();
    }
})();
