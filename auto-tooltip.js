// auto-tooltip.js
(function() {
    const initAutoTooltip = () => {
        const docBody = document.querySelector('.doc-body');
        if (!docBody || typeof GLOSSARY_TERMS === 'undefined') return;

        // 1. CSS Stilleri (Tooltip ve Vurgulanan Kelime)
        const style = document.createElement('style');
        style.innerHTML = `
            .auto-glossary-term {
                border-bottom: 2px dotted #9ca3af;
                cursor: help;
                transition: border-color 0.2s, background-color 0.2s;
                position: relative;
            }
            .auto-glossary-term:hover {
                border-bottom-color: #3b82f6;
                background-color: #eff6ff;
                color: #1d4ed8;
            }
            
            #global-glossary-tooltip {
                position: absolute;
                z-index: 100005;
                background: #1f2937;
                color: white;
                padding: 10px 14px;
                border-radius: 8px;
                font-size: 13px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.5;
                width: max-content;
                max-width: 280px;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
                pointer-events: none;
                opacity: 0;
                transform: translateY(10px) translateX(-50%);
                transition: opacity 0.2s, transform 0.2s;
                display: none;
            }
            #global-glossary-tooltip.show {
                opacity: 1;
                transform: translateY(0) translateX(-50%);
            }
            #global-glossary-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -6px;
                border-width: 6px;
                border-style: solid;
                border-color: #1f2937 transparent transparent transparent;
            }
            #global-glossary-tooltip .gg-term {
                font-weight: 700;
                color: #60a5fa;
                margin-bottom: 4px;
                display: block;
                font-size: 14px;
                border-bottom: 1px solid #374151;
                padding-bottom: 4px;
            }
        `;
        document.head.appendChild(style);

        // 2. Global Tooltip Elementi
        const tooltip = document.createElement('div');
        tooltip.id = 'global-glossary-tooltip';
        document.body.appendChild(tooltip);

        // 3. Kelimeleri Tarama ve İşaretleme
        const applyGlossaryHighlight = () => {
            // Kelimeleri uzunluğa göre azalan şekilde sırala (Örn: "Mesafeli sözleşme" önce çalışsın, "sözleşme" bozmasın)
            GLOSSARY_TERMS.sort((a, b) => b.term.length - a.term.length);

            // Kolay arama için sözlük oluştur
            const termDict = {};
            GLOSSARY_TERMS.forEach(t => {
                termDict[t.term.toLocaleLowerCase('tr-TR')] = t;
            });

            // Metin düğümlerini bul (NodeFilter)
            const walker = document.createTreeWalker(docBody, NodeFilter.SHOW_TEXT, null, false);
            const textNodes = [];
            
            while (walker.nextNode()) {
                const node = walker.currentNode;
                const parentTag = node.parentNode.tagName.toLowerCase();
                // Değiştirilmemesi gereken etiketler (Başlıklar, butonlar, mevcut vurgular)
                const excludedTags = ['h1', 'h2', 'h3', 'a', 'button', 'script', 'style', 'mark', 'span', 'code'];
                
                if (!excludedTags.includes(parentTag) && node.nodeValue.trim().length > 2) {
                    textNodes.push(node);
                }
            }

            const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const termsRegexStr = GLOSSARY_TERMS.map(t => escapeRegExp(t.term)).join('|');
            
            // Türkçe karakter uyumlu kelime sınırı regex'i
            const boundaryPrefix = '(^|[^a-zA-ZçğıöşüÇĞİÖŞÜ0-9])';
            const boundarySuffix = '(?=[^a-zA-ZçğıöşüÇĞİÖŞÜ0-9]|$)';
            const regex = new RegExp(boundaryPrefix + '(' + termsRegexStr + ')' + boundarySuffix, 'gi');

            textNodes.forEach(node => {
                const text = node.nodeValue;
                
                // Hiç eşleşme yoksa hızlıca geç
                if (!regex.test(text)) {
                    regex.lastIndex = 0;
                    return;
                }
                regex.lastIndex = 0;

                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let match;
                let hasMatch = false;

                while ((match = regex.exec(text)) !== null) {
                    hasMatch = true;
                    const prefix = match[1];
                    const termMatch = match[2];
                    
                    const matchStart = match.index;
                    const termStart = matchStart + prefix.length;
                    
                    if (termStart > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, termStart)));
                    }
                    
                    const span = document.createElement('span');
                    span.className = 'auto-glossary-term';
                    span.textContent = termMatch;
                    
                    const normalizedTerm = termMatch.toLocaleLowerCase('tr-TR');
                    const dictItem = termDict[normalizedTerm];
                    
                    if (dictItem) {
                        span.setAttribute('data-term', dictItem.term);
                        span.setAttribute('data-def', dictItem.def);
                        fragment.appendChild(span);
                    } else {
                        // Eğer sözlükte bulunamazsa normal metin olarak ekle
                        fragment.appendChild(document.createTextNode(termMatch));
                    }
                    
                    lastIndex = termStart + termMatch.length;
                }
                
                if (hasMatch) {
                    if (lastIndex < text.length) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                    }
                    node.parentNode.replaceChild(fragment, node);
                }
            });
        };

        // DOM tam hazır olunca çalıştır (sayfa hafif kasmasın diye ufak gecikme)
        setTimeout(applyGlossaryHighlight, 600);

        // 4. Tooltip Etkileşimi (Event Delegation)
        let hideTimeout;
        
        document.body.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('auto-glossary-term')) {
                clearTimeout(hideTimeout);
                
                const term = e.target.getAttribute('data-term');
                const def = e.target.getAttribute('data-def');
                
                tooltip.innerHTML = `<span class="gg-term">${term}</span>${def}`;
                tooltip.style.display = 'block';
                
                // Konumlandırma
                const rect = e.target.getBoundingClientRect();
                
                // Üstünde göster
                tooltip.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
                tooltip.style.top = (rect.top + window.scrollY - 10) + 'px';
                
                // Animasyon tetikleme
                setTimeout(() => tooltip.classList.add('show'), 10);
            }
        });

        document.body.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('auto-glossary-term')) {
                hideTimeout = setTimeout(() => {
                    tooltip.classList.remove('show');
                    setTimeout(() => {
                        if (!tooltip.classList.contains('show')) tooltip.style.display = 'none';
                    }, 200);
                }, 100); // Fare çıkınca hemen kaybolmasın, 100ms tolerans
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoTooltip);
    } else {
        initAutoTooltip();
    }
})();
