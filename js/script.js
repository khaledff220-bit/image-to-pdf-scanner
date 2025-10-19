// js/script.js - الإصدار الكامل والمصحح (شامل PWA، AdSense، ومنطق التحويل الحقيقي)

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
// AdSense & CloudConvert API Settings
// ===========================================
const INTERSTITIAL_FREQUENCY = 3;
let conversionCount = 0;
const AD_CLIENT = "ca-pub-6516738542213361";
const AD_SLOT = "8064067747"; 

// 🛑 المفتاح السري لـ CloudConvert API (مهم) 🛑
const CLOUDCONVERT_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZjU1NTNjNmFlNDhhNDg4NjNkYWQzZDZlMDY1YmEzNTkxYTBkZjc2NTdmNzljNjk5OGMxNWFmZGU2MTEwNzAzMGRiOThiMTIyNDgzYmZjY2MiLCJpYXQiOjE3NjA4NzQwNDQuMDA3OTM5LCJuYmYiOjE3NjA4NzQwNDQuMDA3OTQxLCJleHAiOjQ5MTY1NDc2NDMuOTg5OCwic3ViIjoiNzMyMjg2MjkiLCJzY29wZXMiOlsidGFzay5yZWFkIiwidGFzay53cml0ZSJdfQ.dWhjE_YrgWcYUTvfD9YypDQ9s-FnFovmU2HehcrRRD5mfMeFk4-EdzNgllX1WazEOa-k0YT_3vaaHnBDjDpXqcGwUPBccxLHHOhKATu5LkTxlAYvCcGAtDePc37yGxW71UIYIeY815-OD38dVeMg_7Gvb_AHrNqdAko2Wd3LcoTUKKQyyy0UEwjutr6HjGgvDZjasCDVki3t--xIxbgQQS7oy_rJBSci6CymgHcHBlHSWQmwaZE7ZrSHHgDbrBIJVvyVnwJmECznFNCvxYHiH6HTioLFO6uyKScxbK7sAfijuKifu6UTtFX_OSs2lHxWBf5mjSarbiAqjuneeBmYE1l_JXq-l8dw9LhdtTbP1Y6r1XaVUQI-vt6Ybd0KknfqcldDlbbloLtVptvWldTm-4VgZrc2Zj4lMCM98FM7WxpKCdliCCXMnUVw9mECUBQJ9NNuSxW3phd01g3h-DBWhHVEULUk9xg_MxHz8S7wApYdBrGobfTSuf1t2WCKbjPgfMskC8A-uuwBGPUS6n7Q06jVDePjamfIlK3JKklDrEKrHHEndmQkYvf6WaJsgfI2ultrVlIFtkw35cXsM_lOINact92XDysg1B54qYL-98syiNmPjlTOw9Qw41FJoudUdTnTS_hI6XWaouN1F64Li-MUEMrJ0noVyLcFLTLPukE"; 
const CLOUDCONVERT_ENDPOINT = "https://api.cloudconvert.com/v2/jobs";

function showInterstitialAd() {
    conversionCount++;

    if (conversionCount % INTERSTITIAL_FREQUENCY === 0) {
        if (typeof adsbygoogle !== 'undefined') {
            console.log(`Conversion count: ${conversionCount}. Attempting to show interstitial ad.`);

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
        this.elements.convertBtn?.addEventListener('click', () => this.convertAllToPDF()); 
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
        this.elements.imagesCount.textContent = count;

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
             document.getElementById('loadingBar').style.width = '0%';
        }
    }


    // ===========================================
    // 💥 دوال تحويل PDF إلى Word (تحويل حقيقي عبر CloudConvert API) 💥
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
    
    // 🌟 الدالة الرئيسية الجديدة: تحويل PDF إلى Word (تستخدم CloudConvert) 🌟
    async convertPdfToWord() {
        if (!this.selectedPdfFile) {
            this.showNotification('يرجى اختيار ملف PDF أولاً', 'error');
            return;
        }
        
        this.showLoading('جاري بدء مهمة التحويل (CloudConvert)...');

        try {
            const fileName = this.selectedPdfFile.name;
            
            // 1. بدء مهمة التحويل على CloudConvert
            const job = await this.startCloudConvertJob(this.selectedPdfFile);

            if (job && job.id) {
                this.showLoading('جاري التحويل (قد يستغرق بعض الوقت)...');
                
                // 2. انتظار انتهاء المهمة (Polling)
                let resultUrl = await this.pollJobStatus(job.id); 

                if (resultUrl) {
                    // 3. تنزيل الملف المحول
                    this.downloadFile(resultUrl, fileName.replace('.pdf', '.docx'));
                    
                    this.showNotification('تم التحويل إلى Word بنجاح!', 'success');
                    showInterstitialAd();
                    this.selectedPdfFile = null;
                    this.elements.pdfActionsSection?.classList.add('hidden');
                } else {
                    this.showNotification('فشل التحويل. يرجى المحاولة مرة أخرى.', 'error');
                }
            } else {
                 // إذا فشل startCloudConvertJob سيظهر إشعار الخطأ بداخله
                 // ونتأكد هنا فقط من مسح الشريط
            }

        } catch (error) {
            console.error('خطأ في تحويل PDF إلى Word:', error);
            this.showNotification('حدث خطأ أثناء تحويل PDF إلى Word', 'error');
        } finally {
            document.getElementById('loadingBar').style.width = '0%';
        }
    }


    // 🌟 دالة مساعدة: بدء مهمة CloudConvert مبسطة (للتطبيق المتصفح) 🌟
    async startCloudConvertJob(file) {
        // الخطوة 1: إنشاء المهمة (Job) والحصول على رابط الرفع
        const jobResponse = await fetch(CLOUDCONVERT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "tasks": {
                    "upload-file": {
                        "operation": "import/upload"
                    },
                    "convert-to-docx": {
                        "operation": "convert",
                        "input": "upload-file",
                        "output_format": "docx",
                        "engine": "office" 
                    },
                    "export-word": {
                        "operation": "export/url",
                        "input": "convert-to-docx"
                    }
                }
            })
        });

        // 💥 تحسين معالجة الأخطاء 💥 (فشل إنشاء المهمة: مفتاح API أو مشكلة في JSON)
        if (!jobResponse.ok) {
            const errorText = await jobResponse.text();
            this.showNotification(`فشل إنشاء مهمة CloudConvert. (الرمز: ${jobResponse.status})`, 'error');
            console.error("CloudConvert Job Creation Error:", errorText);
            return null;
        }

        const job = await jobResponse.json();
        
        if (job.data && job.data.id) {
            const uploadTask = job.data.tasks.find(t => t.operation === 'import/upload');
            
            // الخطوة 2: رفع الملف فعلياً باستخدام النموذج (FormData)
            const formData = new FormData();
            Object.entries(uploadTask.result.form.parameters).forEach(([key, value]) => {
                formData.append(key, value);
            });
            formData.append('file', file);

            const uploadResponse = await fetch(uploadTask.result.form.url, {
                method: 'POST',
                body: formData
            });
            
            // 💥 تحسين معالجة الأخطاء 💥 (فشل الرفع: مشكلة في الاتصال/الصلاحيات)
            if (uploadResponse.ok) {
                 return job.data;
            } else {
                 const errorText = await uploadResponse.text();
                 this.showNotification(`فشل رفع الملف إلى CloudConvert. (الرمز: ${uploadResponse.status})`, 'error');
                 console.error("CloudConvert Upload Error:", errorText);
                 return null;
            }
        }
        return null;
    }


    // 🌟 دالة مساعدة: انتظار انتهاء مهمة CloudConvert (Polling)
    async pollJobStatus(jobId) {
        let maxAttempts = 40; 
        let delay = 3000; 

        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, delay));
            
            this.showLoading(`جاري التحقق من حالة التحويل... (${i + 1}/${maxAttempts})`);

            const statusResponse = await fetch(`${CLOUDCONVERT_ENDPOINT}/${jobId}`, {
                headers: { 'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}` }
            });
            const status = await statusResponse.json();

            if (status.data.status === 'finished') {
                const exportTask = status.data.tasks.find(t => t.operation === 'export/url');
                return exportTask?.result?.files[0]?.url; 
            } else if (status.data.status === 'error') {
                throw new Error("حدث خطأ في CloudConvert: " + status.data.message);
            }
        }
        return null; 
    }

    // 🌟 دالة مساعدة: تنزيل ملف من رابط
    downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
            alert(`خطأ: ${message}`); // إضافة تنبيه (Alert) للمستخدمين على الهاتف
        } else {
            console.log(`💡 إشعار: ${message}`);
        }
        // إيقاف شريط التحميل بعد الإشعار
        if (type !== 'info') {
             document.getElementById('loadingBar').style.width = '0%';
        }
    }

    showLoadingBar() {
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
