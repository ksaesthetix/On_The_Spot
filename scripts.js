// Dropdown toggle logic
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.profile-icon-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Close any open dropdowns first
            document.querySelectorAll('.dropdown-content.show').forEach(function(open) {
                open.classList.remove('show');
            });
            // Toggle only the dropdown next to this button
            const dropdown = btn.nextElementSibling;
            if (dropdown && dropdown.classList.contains('dropdown-content')) {
                dropdown.classList.toggle('show');
            }
        });
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', function(e) {
        document.querySelectorAll('.dropdown-content.show').forEach(function(open) {
            open.classList.remove('show');
        });
    });

    // Prevent closing when clicking inside the dropdown
    document.querySelectorAll('.dropdown-content').forEach(function(dropdown) {
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
});

// Chat popup logic        
document.addEventListener('DOMContentLoaded', function() {
    // Profile dropdown logic
    const btn = document.querySelector('.profile-icon-btn');
    const dropdown = document.querySelector('.dropdown-content');
    if (btn && dropdown) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        document.addEventListener('click', function() {
            dropdown.classList.remove('show');
        });
    }

    // Chat popup logic for user chat buttons
    const chatPopup = document.getElementById('chat-popup');
    const closeChatBtn = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatUser = document.getElementById('chat-user');
    const openChatBtn = document.getElementById('open-chat');

    // Listen for all chat buttons in the user list (network page)
    document.querySelectorAll('.chat-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const userName = btn.closest('li').querySelector('.user-name').textContent;
            if (chatUser) chatUser.textContent = `Chat with ${userName}`;
            if (chatPopup) {
                chatPopup.style.display = 'flex';
                chatInput.value = '';
                chatInput.focus();
            }
        });
    });

    // Listen for the floating chat button (all pages)
    if (openChatBtn && chatPopup) {
        openChatBtn.addEventListener('click', function() {
            if (chatUser) chatUser.textContent = 'Chat';
            chatPopup.style.display = 'flex';
            if (chatInput) chatInput.focus();
        });
    }

    if (closeChatBtn && chatPopup) {
        closeChatBtn.addEventListener('click', function() {
            chatPopup.style.display = 'none';
        });
    }

    if (chatForm && chatInput && chatMessages) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const msg = chatInput.value.trim();
            if (msg) {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'chat-message me';
                msgDiv.textContent = msg;
                chatMessages.appendChild(msgDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                chatInput.value = '';
                // Simulate a reply
                setTimeout(() => {
                    const replyDiv = document.createElement('div');
                    replyDiv.className = 'chat-message other';
                    replyDiv.textContent = "Thanks for your message!";
                    chatMessages.appendChild(replyDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 800);
            }
        });

        // Handle image upload
        const chatImageInput = document.getElementById('chat-image');
        if (chatImageInput) {
            chatImageInput.addEventListener('change', function() {
                const file = chatImageInput.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const msgDiv = document.createElement('div');
                        msgDiv.className = 'chat-message me';
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.alt = "Sent image";
                        msgDiv.appendChild(img);
                        chatMessages.appendChild(msgDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    };
                    reader.readAsDataURL(file);
                    chatImageInput.value = '';
                }
            });
        }
    }

    // Map logic (if needed)
    if (typeof L !== 'undefined' && document.getElementById('map')) {
        var map = L.map('map').setView([43.5539, 7.0170], 13); // Cannes
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

    var vendors = [
            { name: "The House of Amazon at Amazon Port", lat: 43.55110218455641, lng: 7.015049886167262, type: "Event" },
            { name: "MediaLink Beach", lat: 43.55092767110725, lng: 7.018601156770044, type: "Vendor" },
            { name: "ADWEEK House", lat: 43.551201464243, lng: 7.019769600453224, type: "Vendor"}
        ];

        vendors.forEach(function(v) {
            L.marker([v.lat, v.lng])
                .addTo(map)
                .bindPopup(`<b>${v.name}</b><br>${v.type}`);
        });

        L.marker([43.5539, 7.0170]).addTo(map).bindPopup("You are here").openPopup();
    }
});