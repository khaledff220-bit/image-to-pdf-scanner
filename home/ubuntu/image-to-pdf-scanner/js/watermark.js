// js/watermark.js
// يتطلب مكتبة jspdf.umd.min.js

class WatermarkPDF {
    constructor(app) {
        this.app = app;
        this.pdfFile = null;
        this.init();
    }

    init() {
        // يجب إضافة عناصر واجهة المستخدم لهذه الميزة في index.html
        this.elements = {
            watermarkPdfInput: document.getElementById('watermarkPdfInput'),
            watermarkTextInput: document.getElementById('watermarkTextInput'),
            addWatermarkBtn: document.getElementById('addWatermarkBtn'),
        };

        this.bindEvents();
    }

    bindEvents() {
        this.elements.watermarkPdfInput?.addEventListener('change', (e) => this.handlePDFSelection(e));
        this.elements.addWatermarkBtn?.addEventListener('click', () => this.addWatermark());
        this.elements.watermarkTextInput?.addEventListener('input', () => this.checkInputs());
    }

    handlePDFSelection(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.pdfFile = file;
            this.app.showNotification(`تم اختيار ملف PDF لإضافة علامة مائية: ${file.name}`, 'info');
        } else {
            this.pdfFile = null;
            this.app.showNotification('الرجاء اختيار ملف PDF صالح.', 'error');
        }
        this.checkInputs();
    }

    checkInputs() {
        const text = this.elements.watermarkTextInput.value.trim();
        this.elements.addWatermarkBtn.disabled = !(this.pdfFile && text.length > 0);
    }

    async addWatermark() {
        if (!this.pdfFile) {
            this.app.showNotification('الرجاء اختيار ملف PDF أولاً.', 'error');
            return;
        }
        const watermarkText = this.elements.watermarkTextInput.value.trim();
        if (!watermarkText) {
            this.app.showNotification('الرجاء إدخال نص العلامة المائية.', 'error');
            return;
        }

        this.app.showLoading('جاري إضافة العلامة المائية...');
        this.elements.addWatermarkBtn.disabled = true;

        try {
            const arrayBuffer = await this.pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;

            const { jsPDF } = window.jspdf;
            const outputDoc = new jsPDF('p', 'mm', 'a4');
            outputDoc.deletePage(1); // حذف الصفحة الافتراضية

            for (let i = 1; i <= numPages; i++) {
                this.app.showLoading(`جاري معالجة الصفحة ${i} من ${numPages}...`);
                
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.0 });
                
                // إضافة صفحة جديدة بنفس مقاسات الصفحة الأصلية
                outputDoc.addPage([viewport.width, viewport.height], viewport.width > viewport.height ? 'l' : 'p');
                
                const canvas = document.createElement('canvas');
                const canvasContext = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext, viewport }).promise;

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                
                // إضافة الصورة كخلفية للصفحة الجديدة
                outputDoc.addImage(imgData, 'JPEG', 0, 0, outputDoc.internal.pageSize.getWidth(), outputDoc.internal.pageSize.getHeight());
                
                // إضافة العلامة المائية
                const pdfWidth = outputDoc.internal.pageSize.getWidth();
                const pdfHeight = outputDoc.internal.pageSize.getHeight();
                
                outputDoc.setFontSize(40);
                outputDoc.setTextColor(0, 0, 0, 0.2); // لون رمادي خفيف وشفافية
                outputDoc.text(watermarkText, pdfWidth / 2, pdfHeight / 2, { 
                    align: 'center', 
                    angle: -45 // زاوية ميلان
                });
            }

            const fileName = `${this.pdfFile.name.replace('.pdf', '')}_watermarked.pdf`;
            outputDoc.save(fileName);

            this.app.showNotification(`تم إضافة العلامة المائية بنجاح إلى ${numPages} صفحة.`, 'success');

        } catch (error) {
            console.error('Watermark PDF error:', error);
            this.app.showNotification('حدث خطأ أثناء إضافة العلامة المائية.', 'error');
        } finally {
            this.app.hideLoading();
            this.elements.addWatermarkBtn.disabled = false;
        }
    }
}

// سيتم تهيئة هذا الكلاس داخل script.js بعد إضافة الواجهة في index.html
// window.watermarkPDF = new WatermarkPDF(app);
