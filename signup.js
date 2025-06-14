document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.signup-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Create a message element if it doesn't exist
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

        // Simulate saving user (for demo, use localStorage)
        let users = JSON.parse(localStorage.getItem('ots_users') || '[]');
        if (users.some(u => u.email === email)) {
            messageDiv.textContent = "An account with this email already exists.";
            messageDiv.style.color = "red";
            return;
        }
        users.push({ name, email, password });
        localStorage.setItem('ots_users', JSON.stringify(users));

        fetch('https://ideal-adventure-gpx467pq6v6f94p6-5000.app.github.dev/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        })

        messageDiv.textContent = "Sign up successful! You can now log in.";
        messageDiv.style.color = "green";
        form.reset();
    });
});