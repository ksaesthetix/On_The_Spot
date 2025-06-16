document.addEventListener('DOMContentLoaded', function() {
    const timerDiv = document.getElementById('trial-timer');
    if (!timerDiv) return;

    // Always get the latest user from localStorage
    function getUser() {
        return JSON.parse(localStorage.getItem('ots_user') || 'null');
    }

    function render() {
        const user = getUser();
        if (!user || !user.trialEndsAt) {
            timerDiv.textContent = "";
            return;
        }
        const now = new Date();
        const end = new Date(user.trialEndsAt);
        const diff = end - now;
        if (diff <= 0) {
            timerDiv.textContent = "Your free trial has ended.";
            clearInterval(interval);
            // Show paywall popup if not paid
            if (user.hasPaid === false && typeof window.showPaywallPopup === "function") {
                window.showPaywallPopup();
            }
            return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        timerDiv.textContent = `Trial time left: ${hours}h ${minutes}m ${seconds}s`;
    }

    render();
    const interval = setInterval(render, 1000);
});