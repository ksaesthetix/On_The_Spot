(function() {
    const API_BASE = 'https://on-the-spot.onrender.com';
    const token = localStorage.getItem('ots_jwt');

    // Only run if logged in
    if (!token) return;

    fetch(`${API_BASE}/api/profile`, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success || !data.user) return;
        const user = data.user;
        // If user has not paid and trial has ended
        if (user.hasPaid === false && user.trialEndsAt && new Date(user.trialEndsAt) < new Date()) {
            showPaywallPopup();
        }
    })
    .catch(() => {});

    function showPaywallPopup() {
        // Prevent multiple popups
        if (document.getElementById('paywall-popup-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'paywall-popup-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.zIndex = 99999;
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        const popup = document.createElement('div');
        popup.style.background = '#fff';
        popup.style.padding = '2em';
        popup.style.borderRadius = '16px';
        popup.style.boxShadow = '0 4px 32px rgba(0,0,0,0.15)';
        popup.style.maxWidth = '90vw';
        popup.style.textAlign = 'center';

        popup.innerHTML = `
            <img src="images/On_The_Spot_logo3.png" alt="Logo" style="width:80px;margin-bottom:1em;">
            <h2>Trial Ended</h2>
            <p>Your free trial has expired.<br><strong>To continue using On The Spot, please complete your payment.</strong></p>
            <button id="paywall-pay-btn" style="padding:0.7em 2em;font-size:1.1em;background:#FF5E5B;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-top:1em;">Pay Now</button>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        document.getElementById('paywall-pay-btn').onclick = function() {
            window.location.href = 'https://buy.stripe.com/test_3cI6oAcZB4It3O9alvcbC00';
        };

        // Prevent closing the popup by clicking outside or pressing Esc
        overlay.addEventListener('click', e => e.stopPropagation());
        document.addEventListener('keydown', function blockEsc(e) {
            if (e.key === "Escape") e.preventDefault();
        }, true);
    }
})();