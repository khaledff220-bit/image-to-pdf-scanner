document.addEventListener('DOMContentLoaded', () => {
    // نحدد رابط خط عربي مفتوح المصدر (مثل Noto Sans Arabic)
    // لاحظ: يجب أن يكون الخط متوفراً عبر رابط HTTPS
    const ARABIC_FONT_URL = 'https://fonts.gstatic.com/s/notosansarabic/v20/or20Q6suT_gRSD8wVlXQ-w.ttf';
    
    const watermarkPdfInput = document.getElementById('watermarkPdfInput' );
    const addWatermarkBtn = document.getElementById('addWatermarkBtn');
    const watermarkTextInput = document.getElementById('watermarkTextInput');
    let uploadedPdfBytes = null;
    let arabicFontBytes = null;

    // تحميل الخط العربي مرة واحدة عند تحميل الصفحة
    async function loadArabicFont() {
        try {
            const response = await fetch(ARABIC_FONT_URL);
            arabicFontBytes = await response.arrayBuffer();
            
            // =================================================================
            // التعديل الأول (حل مشكلة fontkit):
            // تسجيل fontkit هنا لضمان وجود المكتبة بعد تحميل الخط وقبل الاستخدام.
            // =================================================================
            if (typeof PDFLib !== 'undefined' && typeof fontkit !== 'undefined') {
                PDFLib.PDFDocument.registerFontkit(fontkit);
                console.log("Fontkit registered with PDFLib inside loadArabicFont.");
            }
            
            console.log("Arabic font loaded successfully.");
        } catch (error) {
            console.error("Failed to load Arabic font:", error);
            alert("فشل في تحميل الخط العربي اللازم للعلامة المائية.");
        }
    }

    loadArabicFont();

    const checkWatermarkConditions = () => {
        const text = watermarkTextInput.value.trim();
        addWatermarkBtn.disabled = !(watermarkPdfInput.files.length > 0 && text.length > 0 && arabicFontBytes !== null);
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
        if (!uploadedPdfBytes || !arabicFontBytes) return;

        const watermarkText = watermarkTextInput.value.trim();
        if (watermarkText.length === 0) return;

        const loadingBar = document.getElementById('loadingBar');
        loadingBar.style.width = '20%';
        loadingBar.style.display = 'block';

        try {
            const pdfDoc = await PDFLib.PDFDocument.load(uploadedPdfBytes);
            const { width, height } = pdfDoc.getPage(0).getSize();
            
            // تضمين الخط العربي المُحمَّل
            const customFont = await pdfDoc.embedFont(arabicFontBytes, { subset: true });
            
            const fontSize = 75;
            // PDF-LIB لا تدعم RTL مباشرة، لذلك نستخدم طريقة عكس النص
            // هذه الطريقة لا تحل مشكلة التشكيل/الربط لكنها أفضل حل دون مكتبة إضافية
            const reversedText = watermarkText.split('').reverse().join(''); 
            
            const textWidth = customFont.widthOfTextAtSize(watermarkText, fontSize);
            const rotationAngle = PDFLib.degrees(-45);
            const opacity = 0.2; 
            
            const pages = pdfDoc.getPages();
            
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                
                // حساب مكان وضع العلامة المائية في المنتصف مع ميلان
                const x = (width / 2) - (textWidth / 2);
                const y = (height / 2) - (fontSize / 2); 

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
            // إظهار رسالة الخطأ الأعمق للمطور
            alert("حدث خطأ أثناء إضافة العلامة المائية. السبب: " + error.message);
        } finally {
            loadingBar.style.display = 'none';
            loadingBar.style.width = '0%';
        }
    });
});

// =================================================================
// التعديل الثاني (حل مشكلة saveAs):
// إضافة دالة مساعدة لحفظ الملفات (Polyfill) لضمان عمل التحميل في جميع المتصفحات.
// =================================================================
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
