// progress.js
(function() {
    const initProgress = () => {
        // Zaten yüklendiyse tekrar yükleme
        if (document.getElementById('progress-toast-style')) return;

        // --- 1. CSS Enjeksiyonu ---
        const style = document.createElement('style');
        style.id = 'progress-toast-style';
        style.innerHTML = `
            #progress-toast {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1), 0 2px 5px rgba(0,0,0,0.05);
                padding: 12px 16px;
                z-index: 99998;
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 260px; /* Daha küçük */
                border-left: 3px solid #2563eb;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                transform: translateX(-120%); /* Ekran dışından */
                opacity: 0;
                transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease; /* Daha yavaş ve yumuşak */
            }
            #progress-toast.show {
                transform: translateX(0);
                opacity: 1;
            }
            .progress-toast-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #4b5563;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .progress-toast-close {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                font-size: 16px;
                padding: 0;
                line-height: 1;
            }
            .progress-toast-close:hover {
                color: #1f2937;
            }
            .progress-toast-body {
                font-size: 13px; /* Daha küçük yazı */
                color: #1f2937;
                line-height: 1.4;
            }
            .progress-toast-body strong {
                color: #2563eb;
            }
            .progress-toast-btn {
                background-color: #f3f4f6;
                color: #2563eb;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 6px 10px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
                text-decoration: none;
                display: block;
                margin-top: 4px;
            }
            .progress-toast-btn:hover {
                background-color: #e5e7eb;
            }
            .lesson-completed-icon {
                color: #10b981;
                margin-left: auto;
                font-size: 14px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);

        // --- 2. HTML Toast Enjeksiyonu ---
        const toastHtml = `
            <div id="progress-toast">
                <div class="progress-toast-header">
                    <span style="display:flex; align-items:center; gap:4px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Okuma İlerlemen
                    </span>
                    <button class="progress-toast-close" id="pt-close">&times;</button>
                </div>
                <div class="progress-toast-body" id="pt-body">
                    En son <strong>Ders</strong> bölümünde kaldın.
                </div>
                <a href="#" class="progress-toast-btn" id="pt-btn">Kaldığın Yerden Devam Et &rarr;</a>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHtml);

        // --- Yardımcı Fonksiyonlar ---
        const getFilename = () => {
            const path = window.location.pathname;
            const filename = path.substring(path.lastIndexOf('/') + 1);
            return filename === "" ? "index.html" : filename;
        };

        // --- 3. Veri Yönetimi ---
        let completedLessons = JSON.parse(localStorage.getItem('completed_lessons')) || [];
        
        // Sol menüdeki tamamlanmış derslere tik ekle
        const updateCheckmarks = () => {
            document.querySelectorAll('.rail-nav:not(.rail-sub) a').forEach(a => {
                const href = a.getAttribute('href');
                if (completedLessons.includes(href) && !a.querySelector('.lesson-completed-icon')) {
                    a.insertAdjacentHTML('beforeend', '<span class="lesson-completed-icon" title="Bu dersi tamamladın">✓</span>');
                    a.style.display = 'flex';
                    a.style.alignItems = 'center';
                }
            });
        };
        updateCheckmarks();

        // --- 4. İlerlemeyi Kaydetme ---
        const saveProgress = () => {
            const currentFilename = getFilename();
            if (!currentFilename.includes('ders')) return; // Sadece ders sayfalarını kaydet

            const activeSub = document.querySelector('.rail-sub a.active');
            let hash = window.location.hash;
            let sectionTitle = "";

            if (activeSub) {
                hash = activeSub.getAttribute('href');
                sectionTitle = activeSub.querySelector('span:nth-child(2)').textContent;
            }

            const eyebrow = document.querySelector('.doc-eyebrow');
            let lessonTitle = eyebrow ? eyebrow.textContent.trim() : document.title;

            const progress = {
                path: currentFilename,
                hash: hash || "",
                lessonTitle: lessonTitle,
                sectionTitle: sectionTitle
            };

            localStorage.setItem('reading_progress', JSON.stringify(progress));

            // Sayfanın en altına gelindiyse tamamlandı olarak işaretle
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
                if (!completedLessons.includes(currentFilename)) {
                    completedLessons.push(currentFilename);
                    localStorage.setItem('completed_lessons', JSON.stringify(completedLessons));
                    updateCheckmarks();
                }
            }
        };

        let isScrolling;
        window.addEventListener('scroll', () => {
            window.clearTimeout(isScrolling);
            isScrolling = setTimeout(() => {
                saveProgress();
                // Kullanıcı manuel okumaya başladığında bildirimi gizle
                const toast = document.getElementById('progress-toast');
                if(toast && toast.classList.contains('show')){
                    toast.classList.remove('show');
                }
            }, 500);
        });

        // --- 5. Bildirimi Gösterme (Sadece Anasayfada veya Sadece 1 Kere) ---
        const savedProgress = JSON.parse(localStorage.getItem('reading_progress'));
        const currentFilename = getFilename();
        
        // Sadece oturum boyunca 1 kere göstermek için sessionStorage kontrolü
        const toastAlreadyShown = sessionStorage.getItem('toast_shown');
        
        if (savedProgress && !toastAlreadyShown) {
            const isSamePage = savedProgress.path === currentFilename;
            const isSameHash = savedProgress.hash === window.location.hash;
            
            if (!isSamePage || !isSameHash) {
                sessionStorage.setItem('toast_shown', 'true'); // Bu oturumda bir daha çıkmayacak
                
                setTimeout(() => {
                    const toast = document.getElementById('progress-toast');
                    const ptBody = document.getElementById('pt-body');
                    const ptBtn = document.getElementById('pt-btn');
                    
                    if(!toast || !ptBody || !ptBtn) return;

                    let targetUrl = savedProgress.path + savedProgress.hash;
                    
                    let text = `En son <strong>${savedProgress.lessonTitle}</strong> dersinde kaldın.`;
                    if (savedProgress.sectionTitle) {
                        text = `En son <strong>${savedProgress.lessonTitle}</strong> içerisindeki <strong>${savedProgress.sectionTitle}</strong> bölümünde kaldın.`;
                    }
                    
                    ptBody.innerHTML = text;
                    ptBtn.setAttribute('href', targetUrl);
                    toast.classList.add('show');
                }, 1500); // 1.5 sn gecikmeli (daha yavaş gelsin diye)
            }
        }

        // Kapatma butonu
        const closeBtn = document.getElementById('pt-close');
        if(closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('progress-toast').classList.remove('show');
            });
        }
        
        // Tıklandığında bildirimi kapat
        const ptBtn = document.getElementById('pt-btn');
        if(ptBtn) {
            ptBtn.addEventListener('click', () => {
                document.getElementById('progress-toast').classList.remove('show');
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProgress);
    } else {
        initProgress();
    }
})();
