// search.js
(function() {
    const initSearch = () => {
        // Zaten yüklendiyse çık
        if (document.getElementById('site-search-btn')) return;

        // 1. Arama Butonunu Sol Menüye (Rail) Ekle
        // '.rail-brand' bulamazsa direkt '.rail' içine, onu da bulamazsa 'body'ye ekle
        let targetElement = document.querySelector('.rail-brand');
        let placement = 'afterend';
        
        if (!targetElement) {
            targetElement = document.getElementById('rail');
            placement = 'afterbegin';
        }
        if (!targetElement) {
            targetElement = document.body;
            placement = 'afterbegin';
        }

        const searchBtnHtml = `
            <div style="padding: 16px 24px 8px 24px;">
                <button id="site-search-btn" style="width: 100%; display: flex; align-items: center; gap: 8px; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 10px 16px; border-radius: 8px; color: #4b5563; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    Derslerde Ara...
                </button>
            </div>
        `;
        targetElement.insertAdjacentHTML(placement, searchBtnHtml);

        // Hover efekti (JS ile)
        const sBtn = document.getElementById('site-search-btn');
        if (sBtn) {
            sBtn.addEventListener('mouseenter', () => sBtn.style.background = '#e5e7eb');
            sBtn.addEventListener('mouseleave', () => sBtn.style.background = '#f3f4f6');
        }

        // 2. Arama Modalını Sayfaya Ekle
        const modalHtml = `
            <div id="search-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 100000; align-items: flex-start; justify-content: center; padding-top: 10vh; backdrop-filter: blur(4px);">
                <div style="background: #fff; width: 90%; max-width: 650px; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; display: flex; flex-direction: column; max-height: 80vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    
                    <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 12px; background: #fff;">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" id="search-input" placeholder="Ne öğrenmek istiyorsun? (Örn: cayma hakkı)" style="flex: 1; border: none; outline: none; font-size: 17px; background: transparent; color: #1f2937; box-shadow: none;">
                        <button id="search-close-btn" style="background: none; border: none; font-size: 28px; color: #9ca3af; cursor: pointer; padding: 0 4px; line-height: 1;">&times;</button>
                    </div>
                    
                    <div id="search-results" style="overflow-y: auto; padding: 0; margin: 0; list-style: none; flex: 1; background: #f9fafb;">
                        <div style="padding: 40px 20px; text-align: center; color: #6b7280; font-size: 15px;">
                            Aramaya başlamak için bir şeyler yazın.
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 3. Arama Olayları
        const searchModal = document.getElementById('search-modal');
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        const searchCloseBtn = document.getElementById('search-close-btn');

        if (sBtn) {
            sBtn.addEventListener('click', () => {
                searchModal.style.display = 'flex';
                setTimeout(() => searchInput.focus(), 50);
            });
        }

        searchCloseBtn.addEventListener('click', () => {
            searchModal.style.display = 'none';
        });

        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                searchModal.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchModal.style.display === 'flex') {
                searchModal.style.display = 'none';
            }
        });

        // Metin vurgulama (Güvenli Regex)
        const highlightText = (text, query) => {
            if (!query) return text;
            const safeQuery = query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
            const regex = new RegExp(`(${safeQuery})`, 'gi');
            return text.replace(regex, '<mark style="background: #fef08a; color: #000; padding: 0 2px; border-radius: 2px;">$1</mark>');
        };

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchResults.innerHTML = '';

            if (query.length < 2) {
                searchResults.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #6b7280; font-size: 15px;">Aramaya başlamak için en az 2 karakter yazın.</div>';
                return;
            }

            if (typeof SEARCH_DATA === 'undefined') {
                searchResults.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #ef4444; font-size: 15px;">Arama veritabanı (search-data.js) yüklenemedi.</div>';
                return;
            }

            const results = SEARCH_DATA.filter(item => {
                return item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query);
            });

            if (results.length === 0) {
                searchResults.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #6b7280; font-size: 15px;">Sonuç bulunamadı. Lütfen başka kelimelerle deneyin.</div>';
                return;
            }

            results.forEach(item => {
                let snippet = item.content;
                const matchIndex = snippet.toLowerCase().indexOf(query);
                if (matchIndex > -1) {
                    const start = Math.max(0, matchIndex - 50);
                    const end = Math.min(snippet.length, matchIndex + query.length + 50);
                    snippet = (start > 0 ? "..." : "") + snippet.substring(start, end) + (end < snippet.length ? "..." : "");
                } else {
                    snippet = snippet.substring(0, 100) + "...";
                }

                const highlightedTitle = highlightText(item.title, query);
                const highlightedSnippet = highlightText(snippet, query);

                const resultHtml = `
                    <a href="${item.url}" class="search-result-item" style="display: block; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; text-decoration: none; background: #fff; cursor: pointer;">
                        <div style="font-weight: 600; color: #2563eb; font-size: 15px; margin-bottom: 6px;">${highlightedTitle}</div>
                        <div style="color: #4b5563; font-size: 14px; line-height: 1.5;">${highlightedSnippet}</div>
                    </a>
                `;
                searchResults.insertAdjacentHTML('beforeend', resultHtml);
            });

            // Sonuçlara tıklandığında popup'ı kapat ve hover efekti ekle
            document.querySelectorAll('.search-result-item').forEach(el => {
                el.addEventListener('mouseenter', () => el.style.background = '#f3f4f6');
                el.addEventListener('mouseleave', () => el.style.background = '#fff');
                el.addEventListener('click', () => {
                    searchModal.style.display = 'none';
                });
            });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
})();
