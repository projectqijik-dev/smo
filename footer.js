// footer.js
(function() {
    const initFooter = () => {
        // En uygun yerleşimi bul (İçerik alanının en altı)
        const docElement = document.querySelector('.doc') || document.querySelector('.doc-body') || document.body;
        
        // Zaten eklendiyse (hot-reload vb.) tekrar ekleme
        if (document.querySelector('.site-custom-footer')) return;

        // Footer CSS'i
        const style = document.createElement('style');
        style.innerHTML = `
            .site-custom-footer {
                margin-top: 80px;
                margin-bottom: 20px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280; /* Yumuşak gri */
                font-size: 14.5px;
                line-height: 1.7;
                text-align: center;
                font-family: inherit;
                clear: both;
            }
            .footer-link {
                color: #111827; /* Koyu siyah */
                text-decoration: none;
                font-weight: 600;
                border-bottom: 1px solid #d1d5db; /* İnce, zarif bir alt çizgi */
                padding-bottom: 1px;
                transition: all 0.2s ease;
            }
            .footer-link:hover {
                border-bottom-color: #111827;
            }
            .footer-highlight {
                color: #111827;
                font-weight: 700; /* Sadece kalın */
                text-decoration: underline;
                text-underline-offset: 3px;
                text-decoration-thickness: 1.5px;
                background: transparent;
                padding: 0;
            }
            /* Çıktı Alınırken (PDF vb) Düzgün Görünmesi İçin */
            @media print {
                .site-custom-footer {
                    margin-top: 40px;
                    border-top: 1px solid #000;
                    color: #000;
                }
                .footer-highlight {
                    color: #000;
                }
            }
        `;
        document.head.appendChild(style);

        // Footer HTML'i
        const footer = document.createElement('footer');
        footer.className = 'site-custom-footer';
        footer.innerHTML = `
            İçerik ve tasarım <a href="mailto:murat@kirkyama.uk" class="footer-link">Murat Mutlu</a> tarafından hazırlanmıştır. // 
            Sadece <strong class="footer-highlight">eğitim amacıyla</strong> kullanmak koşuluyla serbestçe kopyalayabilir ve dağıtabilirsiniz.
        `;

        // İçerik alanının sonuna ekle
        docElement.appendChild(footer);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFooter);
    } else {
        initFooter();
    }
})();
