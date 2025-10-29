// js/pdf_to_image.js
// لتنفيذ هذه الميزة، سنحتاج إلى مكتبة PDF.js من موزيلا.
// يجب إضافة السكريبت التالي في index.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
// <script>pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';</script>

class PDFToImageConverter {
    constructor(app) {
        this.app = app;
        this.pdfFile = null;
        this.outputFormat = 'jpeg'; // يمكن تغييرها إلى 'png'
        this.init();
    }

    init() {
        // يجب إضافة عناصر واجهة المستخدم لهذه الميزة في index.html
        this.elements = {
            pdfInput: document.getElementById('pdfInput'),
            convertPdfToImageBtn: document.getElementById('convertPdfToImageBtn'),
            pdfToImageSection: document.getElementById('pdfToImageSection'),
        };

        this.bindEvents();
    }

    bindEvents() {
        this.elements.pdfInput?.addEventListener('change', (e) => this.handlePDFSelection(e));
        this.elements.convertPdfToImageBtn?.addEventListener('click', () => this.convertPDFToImage());
    }

    handlePDFSelection(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.pdfFile = file;
            this.app.showNotification(`تم اختيار ملف PDF: ${file.name}`, 'info');
            // هنا يمكن تفعيل زر التحويل
            this.elements.convertPdfToImageBtn.disabled = false;
        } else {
            this.pdfFile = null;
            this.app.showNotification('الرجاء اختيار ملف PDF صالح.', 'error');
            this.elements.convertPdfToImageBtn.disabled = true;
        }
    }

    async convertPDFToImage() {
        if (!this.pdfFile) {
            this.app.showNotification('الرجاء اختيار ملف PDF أولاً.', 'error');
            return;
        }

        this.app.showLoading('جاري تحويل PDF إلى صور...');
        this.elements.convertPdfToImageBtn.disabled = true;

        try {
            const arrayBuffer = await this.pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;
            const zip = new JSZip(); // مكتبة JSZip يجب إضافتها لضغط الصور: <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"></script>

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // يمكن تعديل المقياس
                const canvas = document.createElement('canvas');
                const canvasContext = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext, viewport }).promise;

                const imageDataURL = canvas.toDataURL(`image/${this.outputFormat}`);
                const base64Data = imageDataURL.split(',')[1];
                const fileName = `page_${i}.${this.outputFormat === 'jpeg' ? 'jpg' : 'png'}`;
                
                zip.file(fileName, base64Data, { base64: true });
                this.app.showLoading(`تم معالجة الصفحة ${i} من ${numPages}...`);
            }

            const content = await zip.generateAsync({ type: "blob" });
            const zipFileName = `${this.pdfFile.name.replace('.pdf', '')}_images.zip`;
            
            // دالة لحفظ الملف (مساعدة)
            this.saveFile(content, zipFileName, 'application/zip');
            
            this.app.showNotification(`تم تحويل ${numPages} صفحة وحفظها في ملف مضغوط.`, 'success');

        } catch (error) {
            console.error('PDF to Image conversion error:', error);
            this.app.showNotification('حدث خطأ أثناء تحويل PDF إلى صور.', 'error');
        } finally {
            this.app.hideLoading();
            this.elements.convertPdfToImageBtn.disabled = false;
        }
    }

    saveFile(blob, filename, type) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// سيتم تهيئة هذا الكلاس داخل script.js بعد إضافة الواجهة في index.html
// window.pdfToImageConverter = new PDFToImageConverter(app);
