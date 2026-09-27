// highlighter.js
(function() {
    const initHighlighter = () => {
        const docBody = document.querySelector('.doc-body');
        if (!docBody) return;

        // 1. Gerekli CSS Stilleri
        const style = document.createElement('style');
        style.innerHTML = `
            .student-highlight {
                background-color: #fef08a; 
                color: inherit;
                border-radius: 2px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .student-highlight:hover {
                background-color: #fde047;
            }
            .student-highlight.has-note {
                border-bottom: 2px dashed #ca8a04; /* Not varsa altı kesik çizgili */
            }
            #hl-popover {
                position: absolute;
                background: #1f2937;
                color: white;
                padding: 4px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                z-index: 100000;
                display: none;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                transform: translate(-50%, -100%);
                margin-top: -10px;
                align-items: center;
                gap: 2px;
                user-select: none;
            }
            #hl-popover::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -6px;
                border-width: 6px;
                border-style: solid;
                border-color: #1f2937 transparent transparent transparent;
            }
            .hl-btn {
                background: transparent;
                border: none;
                color: white;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                font-weight: 500;
                transition: background 0.2s;
                font-family: inherit;
            }
            .hl-btn:hover { background: #374151; }
            .hl-btn.danger:hover { background: #ef4444; }
            
            #hl-note-modal {
                position: absolute;
                z-index: 100001;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                width: 300px;
                padding: 16px;
                border: 1px solid #e5e7eb;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: none;
                transform: translate(-50%, 12px);
            }
            #hl-note-modal::before {
                content: '';
                position: absolute;
                bottom: 100%;
                left: 50%;
                margin-left: -8px;
                border-width: 8px;
                border-style: solid;
                border-color: transparent transparent white transparent;
            }
            #hl-note-text {
                width: 100%;
                height: 90px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 10px;
                font-size: 14px;
                resize: none;
                outline: none;
                margin-bottom: 12px;
                font-family: inherit;
                color: #1f2937;
                background: #f9fafb;
                transition: border-color 0.2s, background 0.2s;
            }
            #hl-note-text:focus {
                border-color: #3b82f6;
                background: #fff;
            }
        `;
        document.head.appendChild(style);

        // 2. DOM Elemanları (Popover ve Modal)
        const popover = document.createElement('div');
        popover.id = 'hl-popover';
        document.body.appendChild(popover);

        const noteModal = document.createElement('div');
        noteModal.id = 'hl-note-modal';
        noteModal.innerHTML = `
            <div style="font-weight:600; font-size:14px; color:#374151; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                Ders Notun
            </div>
            <textarea id="hl-note-text" placeholder="Bu kısım için düşüncelerini veya öğrenmen gerekenleri yaz..."></textarea>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button id="hl-note-cancel" style="background:#f3f4f6; color:#4b5563; border:none; padding:8px 14px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; transition:background 0.2s;">İptal</button>
                <button id="hl-note-save" style="background:#3b82f6; color:white; border:none; padding:8px 14px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; transition:background 0.2s;">Kaydet</button>
            </div>
        `;
        document.body.appendChild(noteModal);

        const noteInput = document.getElementById('hl-note-text');
        const noteSave = document.getElementById('hl-note-save');
        const noteCancel = document.getElementById('hl-note-cancel');

        const getPath = () => {
            const path = window.location.pathname;
            const f = path.substring(path.lastIndexOf('/') + 1);
            return f === "" ? "index.html" : f;
        };

        const pageKey = 'highlights_' + getPath();
        let currentSelectionRange = null;
        let activeNoteId = null;

        // Offset to Range
        const restoreRange = (startChars, endChars) => {
            let charIndex = 0;
            let range = document.createRange();
            let startNode = null, endNode = null;
            let startOffset = 0, endOffset = 0;
            
            let nodeStack = [docBody];
            let node, foundStart = false, stop = false;

            while (!stop && (node = nodeStack.pop())) {
                if (node.nodeType === 3) {
                    let nextCharIndex = charIndex + node.length;
                    if (!foundStart && startChars >= charIndex && startChars <= nextCharIndex) {
                        startNode = node;
                        startOffset = startChars - charIndex;
                        foundStart = true;
                    }
                    if (foundStart && endChars >= charIndex && endChars <= nextCharIndex) {
                        endNode = node;
                        endOffset = endChars - charIndex;
                        stop = true;
                    }
                    charIndex = nextCharIndex;
                } else {
                    let i = node.childNodes.length;
                    while (i--) {
                        nodeStack.push(node.childNodes[i]);
                    }
                }
            }

            if (startNode && endNode) {
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);
                return range;
            }
            return null;
        };

        // Range to Offset
        const getOffsets = (range) => {
            let preRange = document.createRange();
            preRange.selectNodeContents(docBody);
            preRange.setEnd(range.startContainer, range.startOffset);
            let start = preRange.toString().length;
            
            preRange.setEnd(range.endContainer, range.endOffset);
            let end = preRange.toString().length;
            
            return { start, end };
        };

        const saveHighlights = (highlights) => {
            localStorage.setItem(pageKey, JSON.stringify(highlights));
        };

        const getHighlights = () => JSON.parse(localStorage.getItem(pageKey)) || [];

        const loadHighlights = () => {
            const hls = getHighlights();
            hls.sort((a, b) => b.start - a.start).forEach(hl => {
                const range = restoreRange(hl.start, hl.end);
                if (range) {
                    applyHighlightToRange(range, hl.id, hl.note);
                }
            });
        };

        const applyHighlightToRange = (range, id, noteText = "") => {
            const mark = document.createElement('mark');
            mark.className = 'student-highlight';
            mark.setAttribute('data-hl-id', id);
            
            // Eğer daha önceden yazılmış bir not varsa belirteç ekle
            if (noteText && noteText.trim() !== "") {
                mark.classList.add('has-note');
                mark.title = "Notunuz: " + noteText;
            }
            
            try {
                range.surroundContents(mark);
            } catch (e) {
                const frag = range.extractContents();
                mark.appendChild(frag);
                range.insertNode(mark);
            }
        };

        // SVG İkonlar
        const iconHighlight = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fde047" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
        const iconNote = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        const iconTrash = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

        const checkSelection = () => {
            const sel = window.getSelection();
            if (!sel.isCollapsed && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                if (docBody.contains(range.commonAncestorContainer) && range.toString().trim().length > 0) {
                    const rect = range.getBoundingClientRect();
                    // Mobilde daha iyi görünmesi için hesaplama
                    popover.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
                    popover.style.top = Math.max(0, rect.top + window.scrollY) + 'px';
                    popover.style.display = 'flex';
                    currentSelectionRange = range;
                    
                    popover.innerHTML = `
                        <button class="hl-btn" id="btn-highlight-only">${iconHighlight} Vurgula</button>
                        <div style="width:1px; height:16px; background:#4b5563; margin:0 2px;"></div>
                        <button class="hl-btn" id="btn-highlight-note">${iconNote} Not Ekle</button>
                    `;

                    // Mobilde seçimin kaybolmasını önlemek için pointerdown kullanıyoruz
                    const btnOnly = document.getElementById('btn-highlight-only');
                    const btnNote = document.getElementById('btn-highlight-note');
                    
                    btnOnly.addEventListener('pointerdown', (e) => { e.preventDefault(); createHighlight(false); });
                    btnNote.addEventListener('pointerdown', (e) => { e.preventDefault(); createHighlight(true); });
                } else {
                    popover.style.display = 'none';
                }
            } else {
                setTimeout(() => {
                    if (window.getSelection().isCollapsed && !popover.dataset.editMode) {
                        popover.style.display = 'none';
                    }
                }, 50);
            }
        };

        document.addEventListener('selectionchange', checkSelection);
        document.addEventListener('touchend', () => setTimeout(checkSelection, 100));
        document.addEventListener('mouseup', () => setTimeout(checkSelection, 50));

        const createHighlight = (openNote) => {
            if (currentSelectionRange) {
                const offsets = getOffsets(currentSelectionRange);
                const id = Date.now().toString();
                
                // Metni DOM bozulmadan önce kaydet
                const highlightedText = currentSelectionRange.toString().trim();
                
                applyHighlightToRange(currentSelectionRange, id);
                
                const hls = getHighlights();
                hls.push({ id, start: offsets.start, end: offsets.end, note: "", text: highlightedText });
                saveHighlights(hls);
                
                window.getSelection().removeAllRanges();
                popover.style.display = 'none';

                if (openNote) {
                    const newMark = document.querySelector(`mark[data-hl-id="${id}"]`);
                    if(newMark) openNoteModal(id, newMark);
                }
            }
        };

        const openNoteModal = (id, markElement) => {
            activeNoteId = id;
            const hls = getHighlights();
            const hlData = hls.find(h => h.id === id);
            
            noteInput.value = hlData && hlData.note ? hlData.note : "";
            
            const rect = markElement.getBoundingClientRect();
            noteModal.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
            noteModal.style.top = (rect.bottom + window.scrollY) + 'px'; // Highlight'ın altına açılır
            noteModal.style.display = 'block';
            
            setTimeout(() => noteInput.focus(), 50);
        };

        // Notu Kaydet
        noteSave.onclick = () => {
            if (activeNoteId) {
                const hls = getHighlights();
                const index = hls.findIndex(h => h.id === activeNoteId);
                if (index > -1) {
                    hls[index].note = noteInput.value.trim();
                    saveHighlights(hls);
                    
                    const mark = document.querySelector(`mark[data-hl-id="${activeNoteId}"]`);
                    if (mark) {
                        if (hls[index].note) {
                            mark.classList.add('has-note');
                            mark.title = "Notunuz: " + hls[index].note; // Tarayıcı ipucu (tooltip)
                        } else {
                            mark.classList.remove('has-note');
                            mark.removeAttribute('title');
                        }
                    }
                }
            }
            noteModal.style.display = 'none';
            activeNoteId = null;
        };

        // Notu İptal
        noteCancel.onclick = () => {
            noteModal.style.display = 'none';
            activeNoteId = null;
        };

        // Vurguya Tıklama İşlemleri (Silme veya Not Görüntüleme/Düzenleme)
        document.addEventListener('click', (e) => {
            let mark = e.target.closest('mark.student-highlight');
            
            // Eğer Not kutusuna tıklanıyorsa kapanmasını engelle
            if (e.target.closest('#hl-note-modal')) return;

            if (mark) {
                if (window.getSelection().isCollapsed) {
                    const id = mark.getAttribute('data-hl-id');
                    const hls = getHighlights();
                    const hlData = hls.find(h => h.id === id);
                    const hasNoteText = hlData && hlData.note ? "Notu Düzenle" : "Not Ekle";

                    const rect = mark.getBoundingClientRect();
                    popover.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
                    popover.style.top = (rect.top + window.scrollY) + 'px';
                    popover.style.display = 'flex';
                    popover.dataset.editMode = 'true';
                    
                    popover.innerHTML = `
                        <button class="hl-btn" id="btn-edit-note">${iconNote} ${hasNoteText}</button>
                        <div style="width:1px; height:16px; background:#4b5563; margin:0 2px;"></div>
                        <button class="hl-btn danger" id="btn-delete-hl">${iconTrash} Sil</button>
                    `;
                    
                    const btnEdit = document.getElementById('btn-edit-note');
                    const btnDelete = document.getElementById('btn-delete-hl');
                    
                    btnEdit.addEventListener('pointerdown', (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        popover.style.display = 'none';
                        popover.dataset.editMode = '';
                        openNoteModal(id, mark);
                    });

                    btnDelete.addEventListener('pointerdown', (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        const parent = mark.parentNode;
                        while(mark.firstChild) {
                            parent.insertBefore(mark.firstChild, mark);
                        }
                        parent.removeChild(mark);
                        parent.normalize();
                        
                        let newHls = hls.filter(h => h.id !== id);
                        saveHighlights(newHls);
                        
                        popover.style.display = 'none';
                        popover.dataset.editMode = '';
                    });
                    
                    e.stopPropagation();
                }
            } else if (e.target !== popover && !e.target.closest('#hl-popover')) {
                if (popover.dataset.editMode) {
                    popover.style.display = 'none';
                    popover.dataset.editMode = '';
                }
                if (noteModal.style.display === 'block') {
                    noteModal.style.display = 'none';
                }
            }
        });

        setTimeout(loadHighlights, 300);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHighlighter);
    } else {
        initHighlighter();
    }
})();
