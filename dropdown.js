document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('ots_user') || 'null');
    const profileLink = document.querySelector('.dropdown-content a[href="profile.html"]');
    const signInLink = document.querySelector('.dropdown-content a[href="login.html"]');
    const signUpLink = document.querySelector('.dropdown-content a[href="signup.html"]');
    const logoutLink = document.getElementById('logout-link');

    if (user && user.email && profileLink) {
        profileLink.href = `profile.html?user=${encodeURIComponent(user.email)}`;
        profileLink.textContent = user.name ? `@${user.name}` : "My Profile";
        profileLink.style.display = "";
        if (signInLink) signInLink.style.display = "none";
        if (signUpLink) signUpLink.style.display = "none";
        if (logoutLink) logoutLink.style.display = "";
    } else if (profileLink) {
        profileLink.href = "login.html";
        profileLink.textContent = "Sign In";
        profileLink.style.display = "";
        if (signInLink) signInLink.style.display = "";
        if (signUpLink) signUpLink.style.display = "";
        if (logoutLink) logoutLink.style.display = "none";
    }

    if (logoutLink) {
        logoutLink.onclick = function(e) {
            e.preventDefault();
            localStorage.removeItem('ots_jwt');
            localStorage.removeItem('ots_user');
            window.location.href = "login.html";
        };
    }

    document.querySelectorAll('.profile-icon-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-content.show').forEach(function(open) {
                if (open !== btn.nextElementSibling) open.classList.remove('show');
            });
            const dropdown = btn.nextElementSibling;
            if (dropdown && dropdown.classList.contains('dropdown-content')) {
                dropdown.classList.toggle('show');
            }
        });
    });

    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-content.show').forEach(function(open) {
            open.classList.remove('show');
        });
    });

    document.querySelectorAll('.dropdown-content').forEach(function(dropdown) {
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
});