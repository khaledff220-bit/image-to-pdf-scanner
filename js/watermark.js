document.addEventListener('DOMContentLoaded', () => {
    const watermarkPdfInput = document.getElementById('watermarkPdfInput');
    const addWatermarkBtn = document.getElementById('addWatermarkBtn');
    const watermarkTextInput = document.getElementById('watermarkTextInput');
    let uploadedPdfBytes = null;

    // تمكين زر العلامة المائية عند اختيار الملف وإدخال النص
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

        const loadingBar = document.getElementById('loadingBar');
        loadingBar.style.width = '20%';
        loadingBar.style.display = 'block';

        try {
            // يتطلب مكتبة PDFLib (تم تضمينها في index.html)
            const pdfDoc = await PDFLib.PDFDocument.load(uploadedPdfBytes);
            const { width, height } = pdfDoc.getPage(0).getSize();
            
            // تهيئة الخط (استخدام خط مدمج بسيط)
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            const fontSize = 75;
            const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
            
            // حساب زاوية الميلان (45 درجة) والشفافية
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
                    font: font,
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
            alert("حدث خطأ أثناء إضافة العلامة المائية. تأكد من أن الملف سليم.");
        } finally {
            loadingBar.style.display = 'none';
            loadingBar.style.width = '0%';
        }
    });
});
