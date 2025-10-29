// js/split_pdf.js
// يتطلب مكتبتي pdf.js و jspdf.umd.min.js

class SplitPDF {
    constructor(app) {
        this.app = app;
        this.pdfFile = null;
        this.init();
    }

    init() {
        // يجب إضافة عناصر واجهة المستخدم لهذه الميزة في index.html
        this.elements = {
            splitPdfInput: document.getElementById('splitPdfInput'),
            splitRangeInput: document.getElementById('splitRangeInput'), // مثال: 1-5, 8, 10-
            splitPdfBtn: document.getElementById('splitPdfBtn'),
        };

        this.bindEvents();
    }

    bindEvents() {
        this.elements.splitPdfInput?.addEventListener('change', (e) => this.handlePDFSelection(e));
        this.elements.splitPdfBtn?.addEventListener('click', () => this.splitPDF());
    }

    handlePDFSelection(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.pdfFile = file;
            this.app.showNotification(`تم اختيار ملف PDF للتقسيم: ${file.name}`, 'info');
            this.elements.splitPdfBtn.disabled = false;
        } else {
            this.pdfFile = null;
            this.app.showNotification('الرجاء اختيار ملف PDF صالح للتقسيم.', 'error');
            this.elements.splitPdfBtn.disabled = true;
        }
    }

    // دالة تحليل نطاق الصفحات (مثال: "1-3, 5, 7-9")
    parsePageRanges(rangeString, maxPages) {
        const ranges = [];
        const parts = rangeString.split(',').map(p => p.trim()).filter(p => p.length > 0);

        for (const part of parts) {
            const match = part.match(/^(\d+)-?(\d*)$/);
            if (match) {
                let start = parseInt(match[1]);
                let end = match[2] ? parseInt(match[2]) : start;

                if (match[2] === '') { // نطاق مفتوح مثل "10-"
                    end = maxPages;
                }

                start = Math.max(1, start);
                end = Math.min(maxPages, end);

                if (start > end) {
                    this.app.showNotification(`نطاق غير صالح: ${part}`, 'error');
                    return null;
                }

                for (let i = start; i <= end; i++) {
                    if (!ranges.includes(i)) {
                        ranges.push(i);
                    }
                }
            } else if (part.match(/^\d+$/)) {
                const pageNum = parseInt(part);
                if (pageNum >= 1 && pageNum <= maxPages && !ranges.includes(pageNum)) {
                    ranges.push(pageNum);
                }
            } else {
                this.app.showNotification(`صيغة نطاق غير صالحة: ${part}`, 'error');
                return null;
            }
        }
        return ranges.sort((a, b) => a - b);
    }

    async splitPDF() {
        if (!this.pdfFile) {
            this.app.showNotification('الرجاء اختيار ملف PDF أولاً.', 'error');
            return;
        }

        const rangeString = this.elements.splitRangeInput.value;
        if (!rangeString) {
            this.app.showNotification('الرجاء إدخال نطاق الصفحات للتقسيم.', 'error');
            return;
        }

        this.app.showLoading('جاري تحليل ملف PDF...');
        this.elements.splitPdfBtn.disabled = true;

        try {
            const arrayBuffer = await this.pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;

            const pagesToExtract = this.parsePageRanges(rangeString, numPages);
            if (!pagesToExtract || pagesToExtract.length === 0) {
                this.app.showNotification('لم يتم تحديد أي صفحات صالحة للتقسيم.', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const outputDoc = new jsPDF('p', 'mm', 'a4');
            outputDoc.deletePage(1); // حذف الصفحة الافتراضية

            for (let i = 0; i < pagesToExtract.length; i++) {
                const pageNum = pagesToExtract[i];
                this.app.showLoading(`جاري استخراج الصفحة ${pageNum}...`);
                
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.0 });
                
                // إنشاء صفحة جديدة في مستند jsPDF
                outputDoc.addPage([viewport.width, viewport.height], viewport.width > viewport.height ? 'l' : 'p');
                
                const canvas = document.createElement('canvas');
                const canvasContext = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext, viewport }).promise;

                const imgData = canvas.toDataURL('image/jpeg', 1.0); // تحويل الصفحة إلى صورة
                
                // إضافة الصورة إلى صفحة jsPDF
                outputDoc.addImage(imgData, 'JPEG', 0, 0, outputDoc.internal.pageSize.getWidth(), outputDoc.internal.pageSize.getHeight());
            }

            const fileName = `${this.pdfFile.name.replace('.pdf', '')}_split.pdf`;
            outputDoc.save(fileName);

            this.app.showNotification(`تم تقسيم الملف بنجاح. تم استخراج ${pagesToExtract.length} صفحة.`, 'success');

        } catch (error) {
            console.error('Split PDF error:', error);
            this.app.showNotification('حدث خطأ أثناء تقسيم ملف PDF.', 'error');
        } finally {
            this.app.hideLoading();
            this.elements.splitPdfBtn.disabled = false;
        }
    }
}

// سيتم تهيئة هذا الكلاس داخل script.js بعد إضافة الواجهة في index.html
// window.splitPDF = new SplitPDF(app);
