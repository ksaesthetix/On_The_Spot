document.addEventListener('DOMContentLoaded', function() {
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