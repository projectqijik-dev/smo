// notebook.js
(function() {
    const initNotebook = () => {
        // 1. Sol Menüye Buton Ekleme
        const sozlukLink = document.querySelector('a[href="sozluk.html"]');
        if (sozlukLink) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" id="open-notebook-btn"><span class="num" style="background:transparent; font-size:16px; border:none; padding:0; width:24px; box-shadow:none;">&rarr;</span><span>Notlarım</span></a>`;
            // Sözlük linkinin olduğu listeye (ol) ekle
            sozlukLink.closest('ol').appendChild(li);
        }

        // 2. CSS Stilleri
        const style = document.createElement('style');
        style.innerHTML = `
            #notebook-panel {
                position: fixed;
                top: 0;
                right: -420px; /* Kapalıyken sağda gizli */
                width: 400px;
                max-width: 90vw;
                height: 100vh;
                background: #f9fafb;
                box-shadow: -5px 0 25px rgba(0,0,0,0.1);
                z-index: 100002;
                transition: right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            #notebook-panel.open {
                right: 0;
            }
            .nb-header {
                padding: 20px;
                background: white;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .nb-header h2 {
                margin: 0;
                font-size: 18px;
                color: #1f2937;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .nb-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #9ca3af;
                cursor: pointer;
            }
            .nb-close:hover { color: #1f2937; }
            
            .nb-actions {
                padding: 12px 20px;
                background: white;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: flex-end;
            }
            .nb-print-btn {
                background: #2563eb;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: background 0.2s;
            }
            .nb-print-btn:hover { background: #1d4ed8; }
            
            .nb-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .nb-lesson-group {
                margin-bottom: 24px;
            }
            .nb-lesson-title {
                font-size: 14px;
                font-weight: 700;
                color: #4b5563;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 12px;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 4px;
            }
            
            .nb-item {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            }
            .nb-highlight-text {
                background: #fef08a;
                padding: 2px 4px;
                border-radius: 2px;
                font-size: 14px;
                color: #1f2937;
                line-height: 1.6;
                margin-bottom: 8px;
                display: inline-block;
            }
            .nb-note-text {
                background: #eff6ff;
                border-left: 3px solid #3b82f6;
                padding: 8px 12px;
                font-size: 13.5px;
                color: #1e3a8a;
                border-radius: 0 4px 4px 0;
                margin-top: 8px;
                line-height: 1.5;
            }
            .nb-empty {
                text-align: center;
                color: #6b7280;
                padding: 40px 20px;
                font-size: 15px;
            }
            
            /* Overlay */
            #nb-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.4);
                z-index: 100001;
                display: none;
                backdrop-filter: blur(2px);
                opacity: 0;
                transition: opacity 0.3s;
            }
            #nb-overlay.show {
                display: block;
                opacity: 1;
            }
        `;
        document.head.appendChild(style);

        // 3. Panel HTML'i
        const overlay = document.createElement('div');
        overlay.id = 'nb-overlay';
        document.body.appendChild(overlay);

        const panel = document.createElement('div');
        panel.id = 'notebook-panel';
        panel.innerHTML = `
            <div class="nb-header">
                <h2>Notlarım</h2>
                <button class="nb-close" id="nb-close-btn">&times;</button>
            </div>
            <div class="nb-actions">
                <button class="nb-print-btn" id="nb-print-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    PDF / Çıktı Al
                </button>
            </div>
            <div class="nb-content" id="nb-content">
                <!-- İçerik JS ile dolacak -->
            </div>
        `;
        document.body.appendChild(panel);

        // 4. Verileri Okuma ve Render Etme
        const loadNotebookData = () => {
            const content = document.getElementById('nb-content');
            content.innerHTML = '';
            
            // LocalStorage'daki tüm highlights_* keylerini bul
            let allData = {};
            let hasNotes = false;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('highlights_')) {
                    let data = JSON.parse(localStorage.getItem(key));
                    if (data && data.length > 0) {
                        const validNotes = data.filter(n => n.text && n.text.trim() !== "");
                        if (validNotes.length !== data.length) {
                            localStorage.setItem(key, JSON.stringify(validNotes));
                            data = validNotes;
                        }

                        if (data.length > 0) {
                            hasNotes = true;
                            let lessonName = key.replace('highlights_', '').replace('.html', '');
                            if (lessonName.startsWith('ders')) {
                                lessonName = "Ders 0" + lessonName.replace('ders', '');
                            } else if (lessonName === 'index') {
                                lessonName = "Ana Sayfa";
                            } else {
                                lessonName = lessonName.toUpperCase();
                            }
                            allData[lessonName] = data;
                        }
                    }
                }
            }

            if (!hasNotes) {
                content.innerHTML = '<div class="nb-empty">Henüz hiç metin vurgulamadınız veya not almadınız. Dersi okurken metinleri seçerek vurgulayabilirsiniz.</div>';
                return;
            }

            // Grupları Render Et
            Object.keys(allData).sort().forEach(lessonName => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'nb-lesson-group';
                
                const title = document.createElement('div');
                title.className = 'nb-lesson-title';
                title.textContent = lessonName;
                groupDiv.appendChild(title);

                allData[lessonName].forEach(note => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'nb-item';
                    
                    // Eğer text kaydedildiyse göster, yoksa "Vurgulanan Metin" de (Eski kayıtlar için fallback)
                    const hlText = note.text;
                    
                    let html = `<div class="nb-highlight-text">${hlText}</div>`;
                    
                    if (note.note && note.note.trim() !== "") {
                        html += `<div class="nb-note-text"><strong>Notun:</strong> ${note.note}</div>`;
                    }
                    
                    itemDiv.innerHTML = html;
                    groupDiv.appendChild(itemDiv);
                });
                
                content.appendChild(groupDiv);
            });
        };

        // 5. Etkileşimler (Aç/Kapat/Çıktı Al)
        const btnOpen = document.getElementById('open-notebook-btn');
        const btnClose = document.getElementById('nb-close-btn');
        const overlayEl = document.getElementById('nb-overlay');
        const printBtn = document.getElementById('nb-print-btn');

        if (btnOpen) {
            btnOpen.addEventListener('click', (e) => {
                e.preventDefault();
                loadNotebookData();
                overlayEl.classList.add('show');
                panel.classList.add('open');
            });
        }

        const closePanel = () => {
            panel.classList.remove('open');
            setTimeout(() => {
                overlayEl.classList.remove('show');
            }, 300); // transition bitmesini bekle
        };

        btnClose.addEventListener('click', closePanel);
        overlayEl.addEventListener('click', closePanel);
        
        // Çıktı Alma İşlemi
        printBtn.addEventListener('click', () => {
            const printContent = document.getElementById('nb-content').innerHTML;
            
            // Eğer boşsa uyarı ver
            if (printContent.includes('nb-empty')) {
                alert("Yazdırılacak not bulunamadı.");
                return;
            }

            // Yeni bir pencere aç
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Dijital Notlarım</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                        h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 30px; }
                        .nb-lesson-group { margin-bottom: 30px; }
                        .nb-lesson-title { font-size: 18px; font-weight: bold; color: #4b5563; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        .nb-item { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #eee; }
                        .nb-highlight-text { background: #fef08a; display: inline; padding: 2px 4px; font-size: 15px; }
                        .nb-note-text { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px 15px; margin-top: 10px; font-size: 14px; font-style: italic; }
                    </style>
                </head>
                <body>
                    <h1>Sosyal Medya Okuryazarlığı - Ders Notlarım</h1>
                    ${printContent}
                    <script>
                        // Yüklenince hemen yazdır
                        window.onload = function() { window.print(); }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotebook);
    } else {
        initNotebook();
    }
})();
