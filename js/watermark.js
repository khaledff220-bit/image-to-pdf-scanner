// نحدد رابط خط عربي مفتوح المصدر
const ARABIC_FONT_URL = 'https://fonts.gstatic.com/s/notosansarabic/v20/or20Q6suT_gRSD8wVlXQ-w.ttf';

document.addEventListener('DOMContentLoaded', () => {
    const watermarkPdfInput = document.getElementById('watermarkPdfInput');
    const addWatermarkBtn = document.getElementById('addWatermarkBtn');
    const watermarkTextInput = document.getElementById('watermarkTextInput');
    let uploadedPdfBytes = null;
    let arabicFontBytes = null; // سيتم تحميله عند الحاجة أو عند النقر الأول

    // دالة تحميل الخط العربي (ستُستدعى فقط عند الحاجة)
    async function loadArabicFont() {
        if (arabicFontBytes) {
            return true; // تم التحميل مسبقاً
        }
        try {
            const response = await fetch(ARABIC_FONT_URL);
            arabicFontBytes = await response.arrayBuffer();
            console.log("Arabic font loaded successfully from external URL.");
            return true;
        } catch (error) {
            console.error("Failed to load Arabic font:", error);
            alert("فشل في تحميل الخط العربي اللازم للعلامة المائية.");
            return false;
        }
    }

    const checkWatermarkConditions = () => {
        const text = watermarkTextInput.value.trim();
        // لن نقوم بتعطيل الزر بناءً على تحميل الخط، بل سنتحقق عند النقر.
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
        const loadingBar = document.getElementById('loadingBar');
        
        if (!uploadedPdfBytes) return;

        const watermarkText = watermarkTextInput.value.trim();
        if (watermarkText.length === 0) return;

        // 1. محاولة تحميل الخط (إذا لم يكن مُحملاً بعد)
        const fontLoaded = await loadArabicFont();
        if (!fontLoaded) return; // توقف إذا فشل تحميل الخط

        // إظهار شريط التحميل
        loadingBar.style.width = '20%';
        loadingBar.style.display = 'block';

        try {
            // 2. التحقق مرة أخرى من أن fontkit تم تسجيله في index.html
            if (typeof PDFLib.PDFDocument.registerFontkit === 'undefined') {
                 throw new Error("PDFLib is not fully initialized. fontkit registration failed.");
            }

            const pdfDoc = await PDFLib.PDFDocument.load(uploadedPdfBytes);
            
            // 3. تضمين الخط (نحن واثقون الآن من أن fontkit مُسجَّل)
            const customFont = await pdfDoc.embedFont(arabicFontBytes, { subset: true });
            
            const fontSize = 75;
            // حل مشكلة RTL: عكس النص
            // لا نحتاج لعكس النص هنا. مكتبة pdf-lib تتعامل مع اليونيكود بشكل أفضل
            // لكن سنبقي على النص الأصلي لترك مهمة embedFont للخط نفسه.
            
            const pages = pdfDoc.getPages();
            
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();
                
                // حساب العرض بعد التضمين
                const textWidth = customFont.widthOfTextAtSize(watermarkText, fontSize);
                const rotationAngle = PDFLib.degrees(-45);
                const opacity = 0.2;
                
                // حساب مكان وضع العلامة المائية في المنتصف مع ميلان
                const x = (width / 2) - (textWidth / 2);
                const y = (height / 2); // في المنتصف عمودياً

                page.drawText(watermarkText, {
                    x: x,
                    y: y,
                    size: fontSize,
                    font: customFont,
                    color: PDFLib.rgb(0.5, 0.5, 0.5), // لون رمادي
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
            // إخفاء شريط التحميل
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
