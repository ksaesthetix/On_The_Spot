document.addEventListener('DOMContentLoaded', function() {
    // --- Chat Popup Logic ---
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
});