/**
 * watermark.js
 * إضافة علامة مائية نصية (عربية) إلى ملف PDF باستخدام PDF-LIB و fontkit (إذا متوفر)
 * يدعم: تحميل خط محلي من images/fonts/، fallback إلى CDN.
 */

document.addEventListener('DOMContentLoaded', () => {
  const LOCAL_FONT_PATH = 'images/fonts/NotoSansArabic-Regular.ttf'; // لو حطيت خط محلي ضعه هنا
  const CDN_FONT_URL = 'https://fonts.gstatic.com/s/notosansarabic/v20/or20Q6suT_gRSD8wVlXQ-w.ttf';

  const watermarkPdfInput = document.getElementById('watermarkPdfInput');
  const addWatermarkBtn = document.getElementById('addWatermarkBtn');
  const watermarkTextInput = document.getElementById('watermarkTextInput');
  const loadingBar = document.getElementById('loadingBar');

  if (!watermarkPdfInput || !addWatermarkBtn || !watermarkTextInput) {
    console.error('watermark.js: DOM elements missing.');
    return;
  }

  let uploadedPdfBytes = null;
  let fontBytes = null;
  let fontLoaded = false;

  // محاولة تحميل خط من المسار المحلي أولاً، ثم CDN كـ fallback
  async function loadFont() {
    // حاول تحميل الخط المحلي
    try {
      const localResp = await fetch(LOCAL_FONT_PATH);
      if (localResp.ok) {
        fontBytes = await localResp.arrayBuffer();
        fontLoaded = true;
        console.log('Arabic font loaded from local path:', LOCAL_FONT_PATH);
        return;
      }
      console.info('Local font not found or not reachable, will try CDN.');
    } catch (e) {
      console.info('Local font fetch failed, will try CDN.', e);
    }

    // fallback to CDN
    try {
      const cdnResp = await fetch(CDN_FONT_URL);
      if (!cdnResp.ok) throw new Error('CDN font fetch failed: ' + cdnResp.status);
      fontBytes = await cdnResp.arrayBuffer();
      fontLoaded = true;
      console.log('Arabic font loaded from CDN.');
    } catch (e) {
      fontLoaded = false;
      console.warn('Failed to load Arabic font from CDN as well:', e);
    }
  }

  // ابدأ تحميل الخط في الخلفية
  loadFont();

  function updateButtonState() {
    const isPdf = uploadedPdfBytes !== null;
    const hasText = watermarkTextInput.value.trim().length > 0;
    addWatermarkBtn.disabled = !(isPdf && hasText);
  }

  watermarkPdfInput.addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    try {
      uploadedPdfBytes = await file.arrayBuffer();
      console.log('PDF loaded, size:', uploadedPdfBytes.byteLength);
    } catch (e) {
      uploadedPdfBytes = null;
      console.error('Failed reading PDF file:', e);
      alert('فشل في قراءة ملف الـPDF المحدد.');
    }
    updateButtonState();
  });

  watermarkTextInput.addEventListener('input', updateButtonState);

  addWatermarkBtn.addEventListener('click', async () => {
    if (!uploadedPdfBytes || watermarkTextInput.value.trim().length === 0) {
      alert('الرجاء اختيار ملف PDF وكتابة نص العلامة المائية.');
      return;
    }

    addWatermarkBtn.disabled = true;
    if (loadingBar) { loadingBar.style.display = 'block'; loadingBar.style.width = '5%'; }

    try {
      if (!window.PDFLib) throw new Error('PDFLib غير محمّل. تأكد من تحميل مكتبة pdf-lib قبل هذا السكربت.');
      const pdfDoc = await PDFLib.PDFDocument.load(uploadedPdfBytes);

      // محاولة تضمين الخط (إذا كان متاحاً)
      let embeddedFont = null;
      if (fontLoaded && fontBytes) {
        try {
          embeddedFont = await pdfDoc.embedFont(new Uint8Array(fontBytes));
          console.log('Embedded custom Arabic font.');
        } catch (e) {
          console.warn('Embedding custom font failed, fallback to built-in fonts:', e);
          embeddedFont = null;
        }
      } else {
        console.warn('No custom font available; will use fallback font (may not support Arabic ligatures).');
      }

      const pages = pdfDoc.getPages();
      const watermarkText = watermarkTextInput.value.trim();
      const fontSize = 72;
      const opacity = 0.14;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // حساب عرض النص
        let textWidth = watermarkText.length * (fontSize * 0.6); // تقدير افتراضي
        if (embeddedFont) {
          try {
            textWidth = embeddedFont.widthOfTextAtSize(watermarkText, fontSize);
          } catch (e) {
            console.warn('widthOfTextAtSize failed, using estimate.', e);
          }
        }

        const x = (width / 2) - (textWidth / 2);
        const y = (height / 2) - (fontSize / 2);

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font: embeddedFont || undefined,
          color: PDFLib.rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: PDFLib.degrees(-45),
        });

        if (loadingBar) {
          const pct = Math.min(90, Math.round(((i + 1) / pages.length) * 80) + 10);
          loadingBar.style.width = pct + '%';
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `ScannerX_Watermarked_${Date.now()}.pdf`);

      alert('تمت إضافة العلامة المائية بنجاح!');
    } catch (err) {
      console.error('watermark error:', err);
      alert('حدث خطأ أثناء إضافة العلامة المائية: ' + (err && err.message ? err.message : err));
    } finally {
      if (loadingBar) {
        loadingBar.style.width = '100%';
        setTimeout(() => { loadingBar.style.display = 'none'; loadingBar.style.width = '0%'; }, 350);
      }
      updateButtonState();
    }
  });

  // دالة حفظ الملف (saveAs)
  function saveAs(blob, filename) {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
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
      }, 150);
    }
  }
});
