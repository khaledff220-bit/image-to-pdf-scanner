const addWatermarkBtn = document.getElementById('addWatermarkBtn');
const watermarkPdfInput = document.getElementById('watermarkPdfInput');
const watermarkTextInput = document.getElementById('watermarkTextInput');

watermarkPdfInput.addEventListener('change', () => {
    addWatermarkBtn.disabled = !watermarkPdfInput.files.length || watermarkTextInput.value.trim() === '';
});

watermarkTextInput.addEventListener('input', () => {
    addWatermarkBtn.disabled = !watermarkPdfInput.files.length || watermarkTextInput.value.trim() === '';
});

addWatermarkBtn.addEventListener('click', async () => {
    const file = watermarkPdfInput.files[0];
    const watermarkText = watermarkTextInput.value.trim();

    if (!file || !watermarkText) return;

    // Show loading bar
    showLoading();

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

        const arabicFont = await loadArabicFont(pdfDoc);

        const pages = pdfDoc.getPages();
        const fontSize = 70;
        const opacity = 0.3;

        for (const page of pages) {
            const { width, height } = page.getSize();
            const textWidth = arabicFont.widthOfTextAtSize(watermarkText, fontSize);
            const textHeight = arabicFont.heightAtSize(fontSize);

            // Calculate center position
            const centerX = width / 2 - textWidth / 2;
            const centerY = height / 2 + textHeight / 2;

            page.drawText(watermarkText, {
                x: centerX,
                y: centerY,
                size: fontSize,
                font: arabicFont,
                color: PDFLib.rgb(0.5, 0.5, 0.5), // Grey color
                opacity: opacity,
                rotate: PDFLib.degrees(-45), // Rotate 45 degrees for better watermark effect
            });
        }

        const pdfBytes = await pdfDoc.save();
        downloadPDF(pdfBytes, 'watermarked_' + file.name);

    } catch (error) {
        console.error('Error adding watermark:', error);
        alert(`حدث خطأ أثناء إضافة العلامة المائية. السبب: ${error.message}`);
    } finally {
        // Hide loading bar
        hideLoading();
    }
});

// دالة تحميل الخط العربي (التعديل الرئيسي هنا)
async function loadArabicFont(pdfDoc) {
    // خطوة حاسمة: ضمان تسجيل fontkit قبل محاولة استخدام الخطوط المخصصة
    if (typeof PDFLib !== 'undefined' && typeof fontkit !== 'undefined') {
        PDFLib.PDFDocument.registerFontkit(fontkit);
        console.log("Fontkit registered locally in watermark.js.");
    }
    
    // تحميل خط يدعم اللغة العربية (هذا ملف الخط الذي يجب أن يكون موجوداً)
    const fontUrl = 'assets/fonts/Amiri-Regular.ttf';
    
    // تأكد من وجود ملف الخط في المسار: assets/fonts/Amiri-Regular.ttf
    // إذا لم يكن موجودًا، سيظهر خطأ 404
    const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
    
    return pdfDoc.embedFont(fontBytes);
}


function downloadPDF(pdfBytes, fileName) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
