document.addEventListener('DOMContentLoaded', () => {
    const splitPdfInput = document.getElementById('splitPdfInput');
    const splitPdfBtn = document.getElementById('splitPdfBtn');
    const splitRangeInput = document.getElementById('splitRangeInput');
    let uploadedPdfBytes = null;

    // تمكين زر التقسيم عند اختيار الملف وإدخال النطاق
    const checkSplitConditions = () => {
        const range = splitRangeInput.value.trim();
        splitPdfBtn.disabled = !(splitPdfInput.files.length > 0 && range.length > 0);
    };

    splitPdfInput.addEventListener('change', (e) => {
        checkSplitConditions();
        if (e.target.files.length > 0) {
            const fileReader = new FileReader();
            fileReader.onload = (ev) => {
                uploadedPdfBytes = ev.target.result;
            };
            fileReader.readAsArrayBuffer(e.target.files[0]);
        }
    });

    splitRangeInput.addEventListener('input', checkSplitConditions);

    splitPdfBtn.addEventListener('click', async () => {
        if (!uploadedPdfBytes) return;

        const rangeString = splitRangeInput.value.trim();
        const loadingBar = document.getElementById('loadingBar');

        loadingBar.style.width = '20%';
        loadingBar.style.display = 'block';

        try {
            // يتطلب مكتبة PDFLib (تم تضمينها في index.html)
            const pdfDoc = await PDFLib.PDFDocument.load(uploadedPdfBytes);
            const newPdfDoc = await PDFLib.PDFDocument.create();
            const numPages = pdfDoc.getPageCount();

            const pagesToExtract = parsePageRanges(rangeString, numPages);
            
            if (pagesToExtract.length === 0) {
                alert(`عفواً! لم يتم العثور على أي صفحات صالحة ضمن النطاق المحدد (${rangeString}). عدد صفحات الملف هو ${numPages}.`);
                loadingBar.style.display = 'none';
                return;
            }

            const pageIndicesToCopy = pagesToExtract.map(p => p - 1); // تحويل رقم الصفحة إلى فهرس (index) يبدأ من 0

            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndicesToCopy);
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            loadingBar.style.width = '70%';

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            const originalFileName = splitPdfInput.files[0].name.replace('.pdf', '');
            saveAs(blob, `${originalFileName}_split.pdf`);

            loadingBar.style.width = '100%';
            alert("تم تقسيم الملف بنجاح!");

        } catch (error) {
            console.error("Error during PDF splitting:", error);
            alert(`حدث خطأ أثناء التقسيم. تأكد من أن نطاق الصفحات صحيح (مثال: 1-5, 7).`);
        } finally {
            loadingBar.style.display = 'none';
            loadingBar.style.width = '0%';
        }
    });
    
    // دالة مساعدة لتحليل نطاقات الصفحات (مثل: 1-5, 8)
    function parsePageRanges(rangeStr, maxPages) {
        const pages = [];
        const parts = rangeStr.split(',');

        for (const part of parts) {
            const trimmedPart = part.trim();
            if (trimmedPart.includes('-')) {
                const [start, end] = trimmedPart.split('-').map(Number);
                if (start >= 1 && end <= maxPages && start <= end) {
                    for (let i = start; i <= end; i++) {
                        if (!pages.includes(i)) pages.push(i);
                    }
                }
            } else {
                const pageNum = Number(trimmedPart);
                if (pageNum >= 1 && pageNum <= maxPages && !pages.includes(pageNum)) {
                    pages.push(pageNum);
                }
            }
        }
        return pages.sort((a, b) => a - b);
    }
});
