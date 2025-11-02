// نحدد رابط خط عربي مفتوح المصدر (خط Noto Sans Arabic)
const ARABIC_FONT_URL = 'https://fonts.gstatic.com/s/notosansarabic/v20/or20Q6suT_gRSD8wVlXQ-w.ttf';

document.addEventListener('DOMContentLoaded', () => {
    const watermarkPdfInput = document.getElementById('watermarkPdfInput');
    const addWatermarkBtn = document.getElementById('addWatermarkBtn');
    const watermarkTextInput = document.getElementById('watermarkTextInput');
    const loadingBar = document.getElementById('loadingBar');
    
    let uploadedPdfBytes = null;
    let arabicFontBytes = null; 

    // دالة تحميل الخط العربي (يتم استدعاؤها في البداية لتحسين الأداء)
    async function loadArabicFont() {
        if (arabicFontBytes) return true;
        try {
            const response = await fetch(ARABIC_FONT_URL);
            arabicFontBytes = await response.arrayBuffer();
            return true;
        } catch (error) {
            console.error("Failed to load Arabic font:", error);
            alert("فشل في تحميل الخط العربي اللازم للعلامة المائية.");
            return false;
        }
    }
    
    // محاولة التحميل المسبق عند تحميل الصفحة
    loadArabicFont();

    const checkWatermarkConditions = () => {
        const text = watermarkTextInput.value.trim();
        addWatermarkBtn.disabled = !(watermarkPdfInput.files.length > 0 && text.length > 0);
    };

    watermarkPdfInput.addEventListener('change', (e) => {
        checkWatermarkConditions();
        if (e.target.files.length > 0) {
            const fileReader = new FileReader();
            fileReader.onload = (ev) => {
                uploadedPdfBytes = ev.target.result;
            };
            fileReader.readAsArrayBuffer(e.target.files[0]);
        }
    });

    watermarkTextInput.addEventListener('input', checkWatermarkConditions);

    addWatermarkBtn.addEventListener('click', async () => {
        
        if (!uploadedPdfBytes) return;

        const watermarkText = watermarkTextInput.value.trim();
        if (watermarkText.length === 0) return;

        const fontLoaded = await loadArabicFont();
        if (!fontLoaded || !arabicFontBytes) {
            alert("الخط العربي غير جاهز. يرجى المحاولة مرة أخرى.");
            return;
        }

        loadingBar.style.width = '20%';
        loadingBar.style.display = 'block';

        try {
            // =================================================================
            // الحل الإجباري: تسجيل fontkit مباشرة هنا قبل الاستخدام
            // هذا يضمن أن التسجيل يتم في نفس الدورة التنفيذية
            // =================================================================
            if (typeof PDFLib !== 'undefined' && typeof fontkit !== 'undefined') {
                PDFLib.PDFDocument.registerFontkit(fontkit);
                console.log("Fontkit registered forcibly before embedFont.");
            } else {
                 throw new Error("Cannot register fontkit: PDFLib or fontkit object is missing.");
            }

            const pdfDoc = await PDFLib.PDFDocument.load(uploadedPdfBytes);
            
            // 3. تضمين الخط العربي المُحمَّل (الآن يجب أن ينجح)
            const customFont = await pdfDoc.embedFont(arabicFontBytes, { subset: true });
            
            const fontSize = 75;
            const pages = pdfDoc.getPages();
            
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();
                
                const textWidth = customFont.widthOfTextAtSize(watermarkText, fontSize);
                const rotationAngle = PDFLib.degrees(-45);
                const opacity = 0.2;
                
                const x = (width / 2) - (textWidth / 2);
                const y = (height / 2);

                page.drawText(watermarkText, {
                    x: x,
                    y: y,
                    size: fontSize,
                    font: customFont,
                    color: PDFLib.rgb(0.5, 0.5, 0.5),
                    rotate: rotationAngle,
                    opacity: opacity,
                });

                loadingBar.style.width = `${20 + (i / pages.length) * 70}%`;
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            const originalFileName = watermarkPdfInput.files[0].name.replace('.pdf', '');
            saveAs(blob, `${originalFileName}_watermarked.pdf`);
            
            loadingBar.style.width = '100%';
            alert("تم إضافة العلامة المائية بنجاح!");

        } catch (error) {
            console.error("Error during adding watermark:", error);
            alert("حدث خطأ أثناء إضافة العلامة المائية. السبب: " + error.message);
        } finally {
            loadingBar.style.display = 'none';
            loadingBar.style.width = '0%';
        }
    });

    // دالة مساعدة لحفظ الملفات (Polyfill)
    function saveAs(blob, filename) {
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            const a = document.createElement('a');
            document.body.appendChild(a);
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
        }
    }
});
