document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'https://on-the-spot.onrender.com';
    const form = document.querySelector('.signup-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    let messageDiv = document.getElementById('signup-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'signup-message';
        form.parentNode.insertBefore(messageDiv, form.nextSibling);
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Basic validation
        if (!name || !email || !password || !confirmPassword) {
            messageDiv.textContent = "Please fill in all fields.";
            messageDiv.style.color = "red";
            return;
        }
        if (password.length < 6) {
            messageDiv.textContent = "Password must be at least 6 characters.";
            messageDiv.style.color = "red";
            return;
        }
        if (password !== confirmPassword) {
            messageDiv.textContent = "Passwords do not match.";
            messageDiv.style.color = "red";
            return;
        }

        fetch(`${API_BASE}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Auto-login after signup to get JWT
                fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                .then(res => res.json())
                .then(loginData => {
                    if (loginData.success && loginData.token) {
                        localStorage.setItem('ots_jwt', loginData.token);
                        localStorage.setItem('ots_user', JSON.stringify(loginData.user));
                        // Redirect to profile (not paywall)
                        window.location.href = 'profile.html';
                    } else {
                        messageDiv.textContent = "Signup succeeded, but login failed. Please try logging in.";
                        messageDiv.style.color = "red";
                    }
                });
            } else {
                messageDiv.textContent = data.message || "Signup failed.";
                messageDiv.style.color = "red";
            }
        })
        .catch(() => {
            messageDiv.textContent = "An error occurred. Please try again.";
            messageDiv.style.color = "red";
        });
    });
});