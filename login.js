document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    let messageDiv = document.getElementById('login-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'login-message';
        form.parentNode.insertBefore(messageDiv, form.nextSibling);
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Log the user's login details (for debugging; remove in production)
        console.log("Login attempt:", { email, password });

        messageDiv.textContent = "Signing in...";
        messageDiv.style.color = "black";

        fetch('https://on-the-spot.onrender.com/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.token && data.email) {
                localStorage.setItem('ots_jwt', data.token);
                localStorage.setItem('ots_user', JSON.stringify({
                    name: data.name,
                    email: data.email,
                    type: data.type
                }));
                messageDiv.textContent = "Login successful! Redirecting...";
                messageDiv.style.color = "green";
                setTimeout(() => {
                    window.location.href = `profile.html?user=${encodeURIComponent(data.email)}`;
                }, 1200);
            } else {
                messageDiv.textContent = data.message || "Login failed.";
                messageDiv.style.color = "red";
            }
        })
        .catch(() => {
            messageDiv.textContent = "An error occurred. Please try again.";
            messageDiv.style.color = "red";
        });
    });
});