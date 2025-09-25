// js/script.js - توجيه للاشتراك بالمحفظة أو الفيزا
document.addEventListener('DOMContentLoaded', function() {
    const premiumWalletBtn = document.getElementById('premiumWalletBtn');
    const annualWalletBtn = document.getElementById('annualWalletBtn');

    if (premiumWalletBtn) {
        premiumWalletBtn.addEventListener('click', function() {
            if (confirm('سيتم الانتقال إلى صفحة الدفع للاشتراك الشهري بـ 100 جنيه عبر المحفظة. المتابعة؟')) {
                window.location.href = 'paymob_wallet.php?plan=monthly';
            }
        });
    }

    if (annualWalletBtn) {
        annualWalletBtn.addEventListener('click', function() {
            if (confirm('سيتم الانتقال إلى صفحة الدفع للاشتراك السنوي بـ 500 جنيه عبر المحفظة. المتابعة؟')) {
                window.location.href = 'paymob_wallet.php?plan=annual';
            }
        });
    }
});
