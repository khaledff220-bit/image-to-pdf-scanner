// js/script.js - الإصدار المصحح

class ImageToPDFConverter {
    constructor() {
        this.selectedImages = [];
        this.currentImage = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.showLoadingBar();
        console.log('✅ تم تهيئة محول PDF');
    }

    bindEvents() {
        // العناصر الأساسية
        this.elements = {
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
            rotateBtn: document.getElementById('rotateBtn')
        };

        // ربط الأحداث
        this.elements.uploadBox?.addEventListener('click', () => this.openImagePicker());
        this.elements.cameraBtn?.addEventListener('click', () => this.openCamera());
        this.elements.galleryBtn?.addEventListener('click', () => this.openGallery());
        this.elements.imageInput?.addEventListener('change', (e) => this.handleImageSelection(e));
        this.elements.convertBtn?.addEventListener('click', () => this.convertToPDF());
        this.elements.convertAllBtn?.addEventListener('click', () => this.convertAllToPDF());
        this.elements.removeAllBtn?.addEventListener('click', () => this.removeAllImages());
        this.elements.rotateBtn?.addEventListener('click', () => this.rotateImage());

        this.initDragAndDrop();
    }

    initDragAndDrop() {
        this.elements.uploadBox?.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadBox.style.background = '#e0e7ff';
        });

        this.elements.uploadBox?.addEventListener('dragleave', () => {
            this.elements.uploadBox.style.background = '';
        });

        this.elements.uploadBox?.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadBox.style.background = '';
            this.handleDroppedFiles(e.dataTransfer.files);
        });
    }

    openImagePicker() {
        this.elements.imageInput?.click();
    }

    openCamera() {
        if (this.elements.imageInput) {
            this.elements.imageInput.setAttribute('capture', 'camera');
            this.elements.imageInput.removeAttribute('multiple');
            this.elements.imageInput.click();
            
            setTimeout(() => {
                this.elements.imageInput.removeAttribute('capture');
                this.elements.imageInput.setAttribute('multiple', 'multiple');
            }, 1000);
        }
    }

    openGallery() {
        if (this.elements.imageInput) {
            this.elements.imageInput.removeAttribute('capture');
            this.elements.imageInput.setAttribute('multiple', 'multiple');
            this.elements.imageInput.click();
        }
    }

    handleImageSelection(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            this.processImageFiles(Array.from(files));
        }
        event.target.value = '';
    }

    handleDroppedFiles(files) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            this.processImageFiles(imageFiles);
        }
    }

    processImageFiles(files) {
        files.forEach((file, index) => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageData = {
                    id: Date.now() + index,
                    src: e.target.result,
                    name: file.name,
                    file: file
                };

                this.selectedImages.push(imageData);
                
                if (this.selectedImages.length === 1) {
                    this.showPreview(imageData);
                }
                
                this.updateSelectedImagesUI();
                this.showNotification(`تم إضافة: ${file.name}`, 'success');
            };

            reader.readAsDataURL(file);
        });
    }

    showPreview(imageData) {
        this.currentImage = imageData;
        if (this.elements.previewImage && this.elements.previewSection) {
            this.elements.previewImage.src = imageData.src;
            this.elements.previewSection.classList.remove('hidden');
            
            // Scroll to preview
            setTimeout(() => {
                this.elements.previewSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 300);
        }
    }

    updateSelectedImagesUI() {
        if (this.elements.imagesGrid && this.elements.imagesCount && this.elements.selectedImagesSection) {
            this.elements.imagesGrid.innerHTML = '';
            this.elements.imagesCount.textContent = this.selectedImages.length;

            if (this.selectedImages.length > 0) {
                this.elements.selectedImagesSection.classList.remove('hidden');
                
                this.selectedImages.forEach((image, index) => {
                    const imageItem = this.createImageItem(image, index);
                    this.elements.imagesGrid.appendChild(imageItem);
                });
            } else {
                this.elements.selectedImagesSection.classList.add('hidden');
            }
        }
    }

    createImageItem(image, index) {
        const item = document.createElement('div');
        item.className = 'image-item';
        
        item.innerHTML = `
            <img src="${image.src}" alt="صورة ${index + 1}">
            <div class="image-overlay">
                <span>${image.name.length > 15 ? image.name.substring(0, 15) + '...' : image.name}</span>
                <button class="remove-btn" onclick="app.removeSingleImage(${image.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        item.querySelector('img').addEventListener('click', () => {
            this.showPreview(image);
        });

        return item;
    }

    removeSingleImage(imageId) {
        this.selectedImages = this.selectedImages.filter(img => img.id !== imageId);
        
        if (this.currentImage && this.currentImage.id === imageId) {
            if (this.selectedImages.length > 0) {
                this.showPreview(this.selectedImages[0]);
            } else {
                this.elements.previewSection?.classList.add('hidden');
                this.currentImage = null;
            }
        }
        
        this.updateSelectedImagesUI();
        this.showNotification('تم حذف الصورة', 'success');
    }

    removeAllImages() {
        if (this.selectedImages.length === 0) return;
        
        if (confirm(`هل تريد حذف جميع الصور (${this.selectedImages.length} صورة)?`)) {
            this.selectedImages = [];
            this.currentImage = null;
            this.elements.previewSection?.classList.add('hidden');
            this.updateSelectedImagesUI();
            this.showNotification('تم حذف جميع الصور', 'success');
        }
    }

    rotateImage() {
        if (!this.currentImage || !this.elements.previewImage) return;
        
        const currentTransform = this.elements.previewImage.style.transform || 'rotate(0deg)';
        const newTransform = currentTransform === 'rotate(0deg)' ? 'rotate(90deg)' : 'rotate(0deg)';
        this.elements.previewImage.style.transform = newTransform;
        
        this.showNotification('تم تدوير الصورة', 'success');
    }

    // إصلاح مشكلة التحويل إلى PDF
    convertToPDF() {
        if (!this.currentImage) {
            this.showNotification('يرجى اختيار صورة أولاً', 'error');
            return;
        }

        this.showLoading('جاري التحويل...');
        
        setTimeout(() => {
            try {
                // التأكد من وجود مكتبة jsPDF
                if (typeof window.jspdf === 'undefined') {
                    this.showNotification('خطأ في تحميل مكتبة PDF', 'error');
                    return;
                }

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // إضافة الصورة إلى PDF
                doc.addImage(this.currentImage.src, 'JPEG', 10, 10, 190, 0);
                
                // حفظ الملف
                doc.save('document.pdf');
                
                this.showNotification('تم التحويل بنجاح!', 'success');
            } catch (error) {
                console.error('خطأ في التحويل:', error);
                this.showNotification('حدث خطأ أثناء التحويل', 'error');
            }
        }, 1000);
    }

    convertAllToPDF() {
        if (this.selectedImages.length === 0) {
            this.showNotification('يرجى اختيار صورة واحدة على الأقل', 'error');
            return;
        }

        this.showLoading(`جاري تحويل ${this.selectedImages.length} صورة...`);
        
        setTimeout(() => {
            try {
                if (typeof window.jspdf === 'undefined') {
                    this.showNotification('خطأ في تحميل مكتبة PDF', 'error');
                    return;
                }

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                this.selectedImages.forEach((image, index) => {
                    if (index > 0) doc.addPage();
                    doc.addImage(image.src, 'JPEG', 10, 10, 190, 0);
                });
                
                doc.save('documents.pdf');
                this.showNotification(`تم تحويل ${this.selectedImages.length} صورة بنجاح!`, 'success');
            } catch (error) {
                console.error('خطأ في التحويل:', error);
                this.showNotification('حدث خطأ أثناء التحويل', 'error');
            }
        }, 1500);
    }

    showLoading(message) {
        const loading = document.createElement('div');
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-size: 1.2rem;
        `;
        loading.innerHTML = `
            <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
            <p>${message}</p>
        `;
        
        document.body.appendChild(loading);
        
        setTimeout(() => {
            if (loading.parentNode) {
                loading.remove();
            }
        }, 3000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#667eea'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    showLoadingBar() {
        const loadingBar = document.getElementById('loadingBar');
        if (loadingBar) {
            loadingBar.style.width = '100%';
            setTimeout(() => loadingBar.style.width = '0%', 1000);
        }
    }
}

// تهيئة التطبيق
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new ImageToPDFConverter();
    
    // إضافة أنماط CSS للرسوم المتحركة
    const styles = document.createElement('style');
    styles.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .remove-btn {
            background: rgba(239, 68, 68, 0.8);
            border: none;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 0.8rem;
        }
    `;
    document.head.appendChild(styles);
});

// جعل الدالة متاحة globally للإزالة الفردية
window.app = app;
