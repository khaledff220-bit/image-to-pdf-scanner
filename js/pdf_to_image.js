document.addEventListener('DOMContentLoaded', () => {
    const pdfInput = document.getElementById('pdfInput');
    const convertPdfToImageBtn = document.getElementById('convertPdfToImageBtn');

    // تمكين الزر عند اختيار الملف
    pdfInput.addEventListener('change', () => {
        if (pdfInput.files.length > 0) {
            convertPdfToImageBtn.disabled = false;
        } else {
            convertPdfToImageBtn.disabled = true;
        }
    });

    // معالج زر التحويل
    convertPdfToImageBtn.addEventListener('click', async () => {
        if (pdfInput.files.length === 0) return;

        const pdfFile = pdfInput.files[0];
        const loadingBar = document.getElementById('loadingBar');

        loadingBar.style.width = '20%';
        loadingBar.style.display = 'block';

        // يتطلب مكتبة pdf.js (تم تضمينها في index.html)
        if (typeof pdfjsLib === 'undefined') {
            console.error("PDF.js library is not loaded.");
            alert("فشل التحويل: مكتبة PDF.js غير متوفرة.");
            loadingBar.style.display = 'none';
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = async function(e) {
            try {
                const pdfData = new Uint8Array(e.target.result);
                const loadingTask = pdfjsLib.getDocument({data: pdfData});
                const pdf = await loadingTask.promise;
                const zip = new JSZip();
                
                loadingBar.style.width = '40%';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({scale: 2.0}); // زيادة الدقة للصور
                    const canvas = document.createElement('canvas');
                    const canvasContext = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({canvasContext, viewport}).promise;

                    const imgData = canvas.toDataURL('image/jpeg', 0.9);
                    const base64Image = imgData.split(',')[1];
                    
                    zip.file(`page_${i}.jpg`, base64Image, {base64: true});

                    loadingBar.style.width = `${40 + (i / pdf.numPages) * 50}%`; 
                }
                
                // إنشاء ملف مضغوط وتحميله
                zip.generateAsync({type:"blob"})
                .then(function(content) {
                    const fileName = pdfFile.name.replace('.pdf', '') + '_images.zip';
                    saveAs(content, fileName);
                    loadingBar.style.width = '100%';
                    alert("تم التحويل بنجاح! سيتم تحميل ملف ZIP.");
                });

            } catch (error) {
                console.error("Error during PDF to Image conversion:", error);
                alert("حدث خطأ أثناء التحويل. يرجى التأكد من أن الملف سليم.");
            } finally {
                loadingBar.style.display = 'none';
                loadingBar.style.width = '0%';
            }
        };

        fileReader.readAsArrayBuffer(pdfFile);
    });
});

// Polyfill for saveAs function (ضروري لحفظ الملف)
function saveAs(blob, filename) {
    if (window.navigator.msSaveOrOpenBlob) {
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
        }, 100);
    }
}
