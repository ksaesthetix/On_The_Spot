document.addEventListener('DOMContentLoaded', function() {
    const userList = document.querySelector('.user-list');
    const currentUser = JSON.parse(localStorage.getItem('ots_user'));
    const users = JSON.parse(localStorage.getItem('ots_users') || '[]').map(u => ({
        ...u,
        type: u.type || 'Attendee'
    }));
    let connections = JSON.parse(localStorage.getItem('ots_connections') || '[]');

    // Convert vendors to user-like objects with unique emails
    const vendors = [
        { name: "The House of Amazon at Amazon Port", type: "Event" },
        { name: "MediaLink Beach", type: "Vendor" },
        { name: "ADWEEK House", type: "Vendor" },
        { name: "Campaign HOUSE", type: "Vendor" },
        { name: "FreeWheel Beach", type: "Vendor" },
        { name: "SPORT BEACH", type: "Vendor" },
        { name: "Quintal of Brazilian", type: "Vendor" },
        { name: "World Woman Foundation", type: "Vendor" },
        { name: "LWS at Cannes", type: "Vendor" },
        { name: "Kantar", type: "Vendor" },
        { name: "The Wall Street Journal", type: "Vendor" },
        { name: "Ad Age", type: "Vendor" },
        { name: "Pinterest", type: "Vendor" },
        { name: "RTL Beach", type: "Vendor" },
        { name: "GWI at Cannes Lions", type: "Vendor" },
        { name: "GWI Spark Stadium", type: "Vendor" },
        { name: "Nielsen", type: "Vendor" },
        { name: "Snowflake", type: "Vendor" },
        { name: "Brands&Culture", type: "Vendor" },
        { name: "InMobi", type: "Vendor" },
        { name: "CULTURE MIX", type: "Vendor" },
        { name: "72Point", type: "Vendor" },
        { name: "GALA", type: "Vendor" },
        { name: "TikTok", type: "Vendor" },
        { name: "The Female Quotient", type: "Vendor" },
        { name: "Little Black Book", type: "Vendor" },
        { name: "Captiv8", type: "Vendor" },
        { name: "Basis Technologies", type: "Vendor" },
        { name: "Brand Innovators", type: "Vendor" },
        { name: "Braze", type: "Vendor" },
        { name: "Experian", type: "Vendor" },
        { name: "IAS", type: "Vendor" },
        { name: "Business Insider", type: "Vendor" },
        { name: "VIOOH, JCDecaux and Displayce", type: "Vendor" },
        { name: "3C Ventures", type: "Vendor" },
        { name: "Fortune", type: "Vendor" },
        { name: "Microsoft", type: "Vendor" },
        { name: "Yahoo", type: "Vendor" },
        { name: "Financial Times", type: "Vendor" },
        { name: "Bloomberg Media", type: "Vendor" },
        { name: "MiQ", type: "Vendor" },
        { name: "Blutui", type: "Vendor" },
        { name: "VaynerX", type: "Vendor" },
        { name: "Tubi", type: "Vendor" },
        { name: "Meta Beach", type: "Vendor" },
        { name: "Advertising Week powered by PRODU", type: "Vendor" },
        { name: "Monks", type: "Vendor" },
        { name: "Inkwell Beach", type: "Vendor" },
        { name: "IInfluential Beach", type: "Vendor" },
        { name: "Spotify", type: "Vendor" },
        { name: "Ogury", type: "Vendor" },
        { name: "GumGum", type: "Vendor" },
        { name: "iHeartMedia", type: "Vendor" },
        { name: "LinkedIn", type: "Vendor" },
        { name: "Insights LIghthouse", type: "Vendor" },
        { name: "MMA", type: "Vendor" },
        { name: "OpenX", type: "Vendor" },
        { name: "Omnicom", type: "Vendor" },
        { name: "The Weather Company", type: "Vendor" },
        { name: "The Washington Post", type: "Vendor" },
        { name: "Criteo", type: "Vendor" },
        { name: "Human", type: "Vendor" },
        { name: "Bain", type: "Vendor" },
        { name: "Transmission", type: "Vendor" },
        { name: "BCG - Boston Consulting Group", type: "Vendor" },
        { name: "Canva", type: "Vendor" },
        { name: "Havas", type: "Vendor" },
        { name: "Infillion", type: "Vendor" },
        { name: "Monks", type: "Vendor" },
        { name: "Empower Café", type: "Vendor" },
        { name: "The Room", type: "Vendor" },
        { name: "The Media Trust", type: "Vendor" },
        { name: "The SH Collective", type: "Vendor" },
        { name: "Chase Media Solutions", type: "Vendor" },
        { name: "Taboola", type: "Vendor" },
        { name: "Videoamp", type: "Vendor" },
        { name: "StackAdapt", type: "Vendor" },
        { name: "Chez Verve", type: "Vendor" },
        { name: "Viant", type: "Vendor" },
        { name: "Advertising Association - UK Advertising", type: "Vendor" },
        { name: "Alkimiads", type: "Vendor" },
        { name: "Givsly", type: "Vendor" },
        { name: "Adform", type: "Vendor" },
        { name: "Spectrum Reach", type: "Vendor" },
        { name: "Pickaxe Foundry", type: "Vendor" },
        { name: "Pantone", type: "Vendor" },
        { name: "VCCP", type: "Vendor" },
        { name: "Deep Blue Sports + Entertainment", type: "Vendor" },
        { name: "BeReal", type: "Vendor" },
        { name: "Snowflake", type: "Vendor" }
    ].map(v => ({
        ...v,
        email: v.name.replace(/\s+/g, '').toLowerCase() + '@vendor.com'
    }));

    // Merge users and vendors for the list
    const allPeople = [
        ...users,
        ...vendors
    ];

    // Remove current user from the list
    const filteredUsers = allPeople.filter(u => u.email !== (currentUser && currentUser.email));

    let searchTerm = '';
    let typeFilter = '';
    let connectionFilter = '';

    function renderUserList() {
        connections = JSON.parse(localStorage.getItem('ots_connections') || '[]');
        // Filter users/vendors by search term
        const displayedUsers = filteredUsers.filter(user => {
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                user.name.toLowerCase().includes(search) ||
                (user.type && user.type.toLowerCase().includes(search)) ||
                (user.email && user.email.toLowerCase().includes(search));

            const matchesType = !typeFilter || (user.type && user.type === typeFilter);
            const isConnected = connections.includes(user.email);
            const matchesConnection =
                !connectionFilter ||
                (connectionFilter === 'connected' && isConnected) ||
                (connectionFilter === 'not_connected' && !isConnected);

            return matchesSearch && matchesType && matchesConnection;
        });
        userList.innerHTML = displayedUsers.map(user => `
            <li>
                <img src="avatar.png" alt="${user.name}" class="user-avatar" />
                <span class="user-name">${user.name}</span>
                <span class="user-tag">${user.type || 'Attendee'}</span>
                <div class="user-actions">
                    <a href="profile.html?user=${encodeURIComponent(user.email)}" class="user-btn view-profile" title="View Profile">Profile</a>
                    <button class="user-btn chat-btn" data-email="${user.email}" title="Chat">Chat</button>
                    <button class="user-btn connect-btn" data-email="${user.email}" title="${connections.includes(user.email) ? 'Disconnect' : 'Add Connection'}">
                        ${connections.includes(user.email) ? 'Disconnect' : 'Connect'}
                    </button>
                </div>
            </li>
        `).join('');
    }

    renderUserList();

    // Handle connect/disconnect button
    userList.addEventListener('click', function(e) {
        if (e.target.classList.contains('connect-btn')) {
            const email = e.target.getAttribute('data-email');
            let connections = JSON.parse(localStorage.getItem('ots_connections') || '[]');
            if (connections.includes(email)) {
                // Disconnect
                connections = connections.filter(conn => conn !== email);
            } else {
                // Connect
                connections.push(email);
            }
            localStorage.setItem('ots_connections', JSON.stringify(connections));
            renderUserList();
        }
    });

    // Handle chat button (open chat popup with user)
    userList.addEventListener('click', function(e) {
        if (e.target.classList.contains('chat-btn')) {
            const email = e.target.getAttribute('data-email');
            const user = allPeople.find(u => u.email === email);
            if (user) {
                // Store chat target for chat.js to use
                localStorage.setItem('ots_chat_target', JSON.stringify(user));
                document.getElementById('chat-user').textContent = `Chat with ${user.name}`;
                document.getElementById('chat-popup').style.display = 'flex';
                document.getElementById('chat-input').focus();
                // Optionally, load chat history for this user
            }
        }
    });

    // Search functionality
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchTerm = e.target.value;
            renderUserList();
        });
    }
    const typeSelect = document.getElementById('type-filter');
    if (typeSelect) {
        typeSelect.addEventListener('change', function(e) {
            typeFilter = e.target.value;
            renderUserList();
        });
    }
    const connectionSelect = document.getElementById('connection-filter');
    if (connectionSelect) {
        connectionSelect.addEventListener('change', function(e) {
            connectionFilter = e.target.value;
            renderUserList();
        });
    }

    function updateTrialTimer(trialEndsAt) {
        const timerDiv = document.getElementById('trial-timer');
        if (!trialEndsAt || !timerDiv) return;

        function render() {
            const now = new Date();
            const end = new Date(trialEndsAt);
            const diff = end - now;
            if (diff <= 0) {
                timerDiv.textContent = "Your free trial has ended.";
                clearInterval(interval);
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            timerDiv.textContent = `Trial time left: ${hours}h ${minutes}m ${seconds}s`;
        }

        render();
        const interval = setInterval(render, 1000);
    }

    updateTrialTimer(user.trialEndsAt);
});