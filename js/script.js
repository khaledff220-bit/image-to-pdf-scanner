// js/script.js - الإصدار الكامل والمصحح (شامل PWA، AdSense، ومنطق التحويل)

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
// AdSense: منطق الإعلانات البينية (Interstitial Ad Logic)
// ===========================================
const INTERSTITIAL_FREQUENCY = 3;
let conversionCount = 0;
const AD_CLIENT = "ca-pub-6516738542213361";
// استخدم شفرة الإعلان الخاصة بك هنا إذا كانت مختلفة عن التلقائية
const AD_SLOT = "8064067747"; 

function showInterstitialAd() {
    conversionCount++;

    if (conversionCount % INTERSTITIAL_FREQUENCY === 0) {
        if (typeof adsbygoogle !== 'undefined') {
            console.log(`Conversion count: ${conversionCount}. Attempting to show interstitial ad.`);

            // ملاحظة: هذا المنطق مخصص للإعلانات البينية التي تعتمد على حدث (Event-based)
            (adsbygoogle.push({
                google_ad_client: AD_CLIENT,
                enable_page_level_ads: true,
                overlays: {
                    interstitial: {
                        google_ad_slot: AD_SLOT
                    }
                }
            })).catch(error => {
                console.warn("Ad push error: ", error);
            });
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
        this.elements.convertBtn?.addEventListener('click', () => this.convertAllToPDF()); // تم توحيدها
        this.elements.convertAllBtn?.addEventListener('click', () => this.convertAllToPDF());
        this.elements.removeAllBtn?.addEventListener('click', () => this.removeAllImages());
        this.elements.rotateBtn?.addEventListener('click', () => this.rotateImage());

        // ربط أحداث تحويل PDF إلى Word
        this.elements.pdfUploadBox?.addEventListener('click', () => this.elements.pdfInput?.click());
        this.elements.pdfInput?.addEventListener('change', (e) => this.handlePdfSelection(e));
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
        // نستخدم هذا لفتح الملفات من الجهاز
        this.elements.imageInput.setAttribute('accept', 'image/*');
        this.elements.imageInput.removeAttribute('capture');
        this.elements.imageInput?.click();
    }

    openCamera() {
        // محاكاة لفتح الكاميرا
        this.elements.imageInput.setAttribute('capture', 'camera');
        this.elements.imageInput.setAttribute('accept', 'image/*');
        this.elements.imageInput?.click();
    }

    openGallery() {
        // فتح المعرض
        this.elements.imageInput.setAttribute('accept', 'image/*');
        this.elements.imageInput.removeAttribute('capture');
        this.elements.imageInput?.click();
    }

    handleImageSelection(event) {
        const files = event.target.files;
        this.processImageFiles(files);
        event.target.value = ''; // مسح قيمة المدخل لمنع التخزين المؤقت
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
        this.elements.imagesCount.textContent = count;

        if (count > 0) {
            this.elements.selectedImagesSection?.classList.remove('hidden');
            this.elements.imagesGrid.innerHTML = ''; // مسح القديم

            this.selectedImages.forEach(image => {
                const item = this.createImageItem(image);
                this.elements.imagesGrid.appendChild(item);
            });
        } else {
            this.elements.selectedImagesSection?.classList.add('hidden');
        }

        // إخفاء المعاينة الفردية (لأنه تم التوحيد على وضع الصور المتعددة)
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
        // هذه الدالة تتطلب المزيد من العمل لتدوير الصورة في الـ Array قبل التحويل
        this.showNotification('ميزة تدوير الصورة قيد التطوير.', 'info');
    }

    // ===========================================
    // 🌟 دالة تحويل الصور إلى PDF (المنطق الصحيح) 🌟
    // ===========================================

    async convertAllToPDF() {
        if (this.selectedImages.length === 0) {
            this.showNotification('يرجى اختيار صورة واحدة على الأقل', 'error');
            return;
        }

        this.showLoading(`جاري تحويل ${this.selectedImages.length} صورة...`);

        try {
            if (typeof window.jspdf === 'undefined') {
                this.showNotification('خطأ في تحميل مكتبة PDF', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            // تعيين الأبعاد على A4 قياسي
            const doc = new jsPDF('p', 'mm', 'a4'); 

            // دالة مساعدة لتحميل الصورة والحصول على أبعادها
            const loadImage = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

            // تحميل جميع الصور بشكل غير متزامن
            const imagesToProcess = this.selectedImages.map(image => loadImage(image.src));
            const loadedImages = await Promise.all(imagesToProcess);
            
            loadedImages.forEach((img, index) => {
                // إضافة صفحة جديدة لكل صورة بعد الصورة الأولى
                if (index > 0) doc.addPage();
                
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();
                
                const imgWidth = img.width;
                const imgHeight = img.height;
                
                // حساب الأبعاد الجديدة لـ احتواء الصورة في الصفحة
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const finalWidth = imgWidth * ratio * 0.9; // 90% للحصول على هامش
                const finalHeight = imgHeight * ratio * 0.9;

                // إضافة الصورة إلى PDF في منتصف الصفحة
                const x = (pdfWidth - finalWidth) / 2;
                const y = (pdfHeight - finalHeight) / 2;
                
                doc.addImage(img, 'JPEG', x, y, finalWidth, finalHeight);
            });

            // أمر التنزيل (يجبر التنزيل إلى مجلد Downloads)
            doc.save('ScannerX_Converted.pdf'); 
            
            this.showNotification(`تم تحويل ${this.selectedImages.length} صورة بنجاح!`, 'success');
            showInterstitialAd();
            this.removeAllImages();

        } catch (error) {
            console.error('خطأ في التحويل:', error);
            this.showNotification('حدث خطأ أثناء التحويل', 'error');
        } finally {
             document.getElementById('loadingBar').style.width = '0%';
        }
    }


    // ===========================================
    // دوال تحويل PDF إلى Word (وهمي)
    // ===========================================

    handlePdfSelection(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.selectedPdfFile = file;
            this.elements.pdfFileName.textContent = file.name;
            this.elements.pdfActionsSection?.classList.remove('hidden');
            this.showNotification(`تم تحديد ملف: ${file.name}`, 'info');
        } else if (file) {
            this.selectedPdfFile = null;
            this.elements.pdfActionsSection?.classList.add('hidden');
            this.showNotification('الرجاء اختيار ملف PDF صالح', 'error');
        }
        event.target.value = '';
    }

    convertPdfToWord() {
        if (!this.selectedPdfFile) {
            this.showNotification('يرجى اختيار ملف PDF أولاً', 'error');
            return;
        }

        this.showLoading('جاري تحويل PDF إلى Word...');

        setTimeout(() => {
            try {
                // محاكاة لعملية تحويل ناجحة (تحويل حقيقي يتطلب خادم)
                const wordFileName = this.selectedPdfFile.name.replace('.pdf', '.docx');

                // تنزيل ملف DOCX وهمي
                const dummyBlob = new Blob(["محتوى ملف وورد وهمي"], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                const url = URL.createObjectURL(dummyBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = wordFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.showNotification('تم التحويل إلى Word بنجاح!', 'success');
                showInterstitialAd();
                this.selectedPdfFile = null; // مسح الملف المحدد
                this.elements.pdfActionsSection?.classList.add('hidden');

            } catch (error) {
                console.error('خطأ في تحويل PDF إلى Word:', error);
                this.showNotification('حدث خطأ أثناء تحويل PDF إلى Word', 'error');
            }
        }, 3000);
    }


    // ===========================================
    // دوال الإشعارات والتحميل (مساعدات)
    // ===========================================
    showLoading(message = 'جاري المعالجة...') {
        document.getElementById('loadingBar').style.width = '100%';
        console.log(message);
    }

    showNotification(message, type) {
        // يمكن تطويرها لعرض الإشعارات على واجهة المستخدم
        if (type === 'error') {
            console.error(`❌ إشعار خطأ: ${message}`);
        } else {
            console.log(`💡 إشعار: ${message}`);
        }
        // إيقاف شريط التحميل بعد الإشعار
        if (type !== 'info') {
             document.getElementById('loadingBar').style.width = '0%';
        }
    }

    showLoadingBar() {
        // محاكاة سريعة لتحميل التطبيق عند التهيئة
        document.getElementById('loadingBar').style.width = '50%';
        setTimeout(() => {
            document.getElementById('loadingBar').style.width = '100%';
            setTimeout(() => {
                document.getElementById('loadingBar').style.width = '0%';
            }, 300);
        }, 500);
    }
}

// تهيئة التطبيق
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new ImageToPDFConverter();
});

// جعل الدالة متاحة globally للإزالة الفردية
window.adsbygoogle = window.adsbygoogle || [];
