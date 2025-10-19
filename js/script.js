// js/script.js - الإصدار المجاني بالكامل (يستخدم PDF.js لاستخراج النص)

// ===========================================
// PWA: تسجيل العامل الخدمي (Service Worker)
// ===========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('❌ SW registration failed: ', registrationError);
            });
    });
}

// ===========================================
// AdSense & API Settings (تم إزالة CloudConvert)
// ===========================================
const INTERSTITIAL_FREQUENCY = 3;
let conversionCount = 0;
const AD_CLIENT = "ca-pub-6516738542213361";
const AD_SLOT = "8064067747"; 

// دالة للإعلانات (تم تعديلها لتجنب خطأ .catch)
function showInterstitialAd() {
    conversionCount++;

    if (conversionCount % INTERSTITIAL_FREQUENCY === 0) {
        if (typeof adsbygoogle !== 'undefined') {
            console.log(`Conversion count: ${conversionCount}. Attempting to show interstitial ad.`);
            
            // تم التعديل: استخدام try/catch بدلاً من .catch() على push
            try {
                adsbygoogle.push({
                    google_ad_client: AD_CLIENT,
                    enable_page_level_ads: true,
                    overlays: {
                        interstitial: {
                            google_ad_slot: AD_SLOT
                        }
                    }
                });
            } catch (error) {
                console.warn("Ad push error:", error);
            }
        } else {
            console.warn("AdSense library not fully loaded yet.");
        }
    } else {
        console.log(`Conversion count: ${conversionCount}. Skipping interstitial ad.`);
    }
}


// ===========================================
// الكلاس الرئيسي للمحول (ImageToPDFConverter)
// ===========================================
class ImageToPDFConverter {
    constructor() {
        this.selectedImages = [];
        this.currentImage = null;
        this.selectedPdfFile = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.showLoadingBar();
        console.log('✅ تم تهيئة محول PDF');
    }

    bindEvents() {
        this.elements = {
            // عناصر تحويل الصور إلى PDF
            uploadBox: document.getElementById('uploadBox'),
            imageInput: document.getElementById('imageInput'),
            cameraBtn: document.getElementById('cameraBtn'),
            galleryBtn: document.getElementById('galleryBtn'),
            previewSection: document.getElementById('previewSection'),
            previewImage: document.getElementById('previewImage'),
            selectedImagesSection: document.getElementById('selectedImagesSection'),
            imagesGrid: document.getElementById('imagesGrid'),
            imagesCount: document.getElementById('imagesCount'),
            convertBtn: document.getElementById('convertBtn'),
            convertAllBtn: document.getElementById('convertAllBtn'),
            removeAllBtn: document.getElementById('removeAllBtn'),
            rotateBtn: document.getElementById('rotateBtn'),

            // عناصر تحويل PDF إلى Word
            pdfUploadBox: document.getElementById('pdfUploadBox'),
            pdfInput: document.getElementById('pdfInput'),
            pdfActionsSection: document.getElementById('pdfActionsSection'),
            pdfFileName: document.getElementById('pdfFileName'),
            convertPdfToWordBtn: document.getElementById('convertPdfToWordBtn')
        };

        // ربط أحداث الصور
        this.elements.uploadBox?.addEventListener('click', () => this.openImagePicker());
        this.elements.cameraBtn?.addEventListener('click', () => this.openCamera());
        this.elements.galleryBtn?.addEventListener('click', () => this.openGallery());
        this.elements.imageInput?.addEventListener('change', (e) => this.handleImageSelection(e));
        this.elements.convertBtn?.addEventListener('click', () => this.convertAllToPDF()); 
        this.elements.convertAllBtn?.addEventListener('click', () => this.convertAllToPDF());
        this.elements.removeAllBtn?.addEventListener('click', () => this.removeAllImages());
        this.elements.rotateBtn?.addEventListener('click', () => this.rotateImage());

        // ربط أحداث تحويل PDF إلى Word
        this.elements.pdfUploadBox?.addEventListener('click', () => this.elements.pdfInput?.click());
        this.elements.pdfInput?.addEventListener('change', (e) => this.handlePdfSelection(e));
        // تم تغيير الدالة لتنفيذ التحويل المجاني
        this.elements.convertPdfToWordBtn?.addEventListener('click', () => this.convertPdfToWord());

        this.initDragAndDrop();
    }

    // ===========================================
    // الدوال الأساسية للصور والمساعدات
    // ===========================================

    initDragAndDrop() {
        const box = this.elements.uploadBox;
        if (!box) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            box.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        box.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            this.handleDroppedFiles(dt.files);
        }, false);
    }

    handleDroppedFiles(files) {
        this.processImageFiles(files);
    }

    openImagePicker() {
        this.elements.imageInput.setAttribute('accept', 'image/*');
        this.elements.imageInput.removeAttribute('capture');
        this.elements.imageInput?.click();
    }

    openCamera() {
        this.elements.imageInput.setAttribute('capture', 'camera');
        this.elements.imageInput.setAttribute('accept', 'image/*');
        this.elements.imageInput?.click();
    }

    openGallery() {
        this.elements.imageInput.setAttribute('accept', 'image/*');
        this.elements.imageInput.removeAttribute('capture');
        this.elements.imageInput?.click();
    }

    handleImageSelection(event) {
        const files = event.target.files;
        this.processImageFiles(files);
        event.target.value = ''; 
    }

    processImageFiles(files) {
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageObj = {
                        id: Date.now() + Math.random(),
                        src: e.target.result,
                        name: file.name
                    };
                    this.selectedImages.push(imageObj);
                    this.updateSelectedImagesUI();
                };
                reader.readAsDataURL(file);
            } else {
                this.showNotification(`الملف ${file.name} ليس صورة مدعومة.`, 'error');
            }
        });
    }

    updateSelectedImagesUI() {
        const count = this.selectedImages.length;
        // التحقق من وجود العنصر قبل الوصول إليه
        if (this.elements.imagesCount) this.elements.imagesCount.textContent = count;

        if (count > 0) {
            this.elements.selectedImagesSection?.classList.remove('hidden');
            this.elements.imagesGrid.innerHTML = ''; 

            this.selectedImages.forEach(image => {
                const item = this.createImageItem(image);
                this.elements.imagesGrid.appendChild(item);
            });
        } else {
            this.elements.selectedImagesSection?.classList.add('hidden');
        }

        this.elements.previewSection?.classList.add('hidden');
    }

    createImageItem(image) {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.dataset.id = image.id;
        div.innerHTML = `
            <img src="${image.src}" alt="${image.name}">
            <span class="remove-btn" data-id="${image.id}"><i class="fas fa-times"></i></span>
        `;

        div.querySelector('.remove-btn')?.addEventListener('click', (e) => {
            this.removeSingleImage(image.id);
            e.stopPropagation();
        });

        return div;
    }

    removeSingleImage(idToRemove) {
        this.selectedImages = this.selectedImages.filter(img => img.id !== idToRemove);
        this.updateSelectedImagesUI();
    }

    removeAllImages() {
        this.selectedImages = [];
        this.updateSelectedImagesUI();
        this.showNotification('تم مسح جميع الصور.', 'info');
    }

    rotateImage() {
        this.showNotification('ميزة تدوير الصورة قيد التطوير.', 'info');
    }

    // ===========================================
    // 🌟 دالة تحويل الصور إلى PDF
    // ===========================================

    async convertAllToPDF() {
        if (this.selectedImages.length === 0) {
            this.showNotification('يرجى اختيار صورة واحدة على الأقل', 'error');
            return;
        }

        this.showLoading(`جاري تحويل ${this.selectedImages.length} صورة...`);

        try {
            // تحسين: فحص وجود المكتبة بشكل أفضل
            if (!window.jspdf || !window.jspdf.jsPDF) {
                this.showNotification('خطأ في تحميل مكتبة PDF.jsPDF', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');

            const loadImage = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

            const imagesToProcess = this.selectedImages.map(image => loadImage(image.src));
            const loadedImages = await Promise.all(imagesToProcess);

            loadedImages.forEach((img, index) => {
                if (index > 0) doc.addPage();

                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();

                const imgWidth = img.width;
                const imgHeight = img.height;

                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const finalWidth = imgWidth * ratio * 0.9; 
                const finalHeight = imgHeight * ratio * 0.9;

                const x = (pdfWidth - finalWidth) / 2;
                const y = (pdfHeight - finalHeight) / 2;

                doc.addImage(img, 'JPEG', x, y, finalWidth, finalHeight);
            });

            doc.save('ScannerX_Converted.pdf');

            this.showNotification(`تم تحويل ${this.selectedImages.length} صورة بنجاح!`, 'success');
            showInterstitialAd();
            this.removeAllImages();

        } catch (error) {
            console.error('خطأ في التحويل:', error);
            this.showNotification('حدث خطأ أثناء التحويل', 'error');
        } finally {
             this.hideLoading();
        }
    }


    // ===========================================
    // 🌟 دالة تحويل PDF إلى Word (مجاني: استخراج النص) 🌟
    // ===========================================

    handlePdfSelection(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.selectedPdfFile = file;
            if (this.elements.pdfFileName) this.elements.pdfFileName.textContent = file.name;
            this.elements.pdfActionsSection?.classList.remove('hidden');
            this.showNotification(`تم تحديد ملف: ${file.name}`, 'info');
        } else if (file) {
            this.selectedPdfFile = null;
            this.elements.pdfActionsSection?.classList.add('hidden');
            this.showNotification('الرجاء اختيار ملف PDF صالح', 'error');
        }
        event.target.value = '';
    }
    
    // دالة التحويل المجانية: تستخرج النص وتحفظه كملف TXT
    async convertPdfToWord() {
        if (!this.selectedPdfFile) {
            this.showNotification('يرجى اختيار ملف PDF أولاً', 'error');
            return;
        }
        
        // التحقق من تحميل المكتبة المجانية (PDF.js)
        if (!window.pdfjsLib) {
             this.showNotification('خطأ: لم يتم تحميل مكتبة PDF.js لإجراء التحويل المجاني.', 'error');
             return;
        }

        this.showLoading('جاري استخراج النص محلياً...');
        
        try {
            const fileName = this.selectedPdfFile.name;
            
            // (1) قراءة الملف كـ ArrayBuffer (مطلوب بواسطة مكتبة PDF.js)
            const arrayBuffer = await this.fileToArrayBuffer(this.selectedPdfFile);

            // (2) استخراج النص
            const pdfjsLib = window.pdfjsLib;
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n' + '-------------------- صفحة ' + i + ' --------------------' + '\n\n';
            }
            
            // (3) تنزيل الملف كنص (TXT)
            const blob = new Blob([fullText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            this.downloadFile(url, fileName.replace('.pdf', '_Extracted.txt'));

            this.showNotification('تم استخراج النص بنجاح! (تم حفظه كملف TXT)', 'success');
            showInterstitialAd();
            this.selectedPdfFile = null;
            this.elements.pdfActionsSection?.classList.add('hidden');

        } catch (error) {
            console.error('خطأ في تحويل PDF المحلي:', error);
            this.showNotification('فشل التحويل المحلي. (قد يكون ملف PDF غير نصي).', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // دالة مساعدة لقراءة الملف
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    // 🌟 دالة مساعدة: تنزيل ملف من رابط (مستخدمة في PDF.js و jsPDF)
    downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // تحرير الذاكرة
    }
    
    // ===========================================
    // دوال الإشعارات والتحميل (تم تحسينها)
    // ===========================================
    showLoading(message = 'جاري المعالجة...') {
        const bar = document.getElementById('loadingBar');
        if (bar) bar.style.width = '100%';
        console.log(message);
    }
    
    hideLoading() {
        const bar = document.getElementById('loadingBar');
        if (bar) bar.style.width = '0%';
    }

    showNotification(message, type) {
        if (type === 'error') {
            console.error(`❌ إشعار خطأ: ${message}`);
            alert(`خطأ: ${message}`); 
        } else {
            console.log(`💡 إشعار: ${message}`);
        }
        // إخفاء شريط التحميل بعد الإشعار
        if (type !== 'info') {
             this.hideLoading();
        }
    }

    showLoadingBar() {
        const bar = document.getElementById('loadingBar');
        if (!bar) return;
        
        bar.style.width = '50%';
        setTimeout(() => {
            bar.style.width = '100%';
            setTimeout(() => {
                bar.style.width = '0%';
            }, 300);
        }, 500);
    }
}

// تهيئة التطبيق
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new ImageToPDFConverter();
});

window.adsbygoogle = window.adsbygoogle || [];
