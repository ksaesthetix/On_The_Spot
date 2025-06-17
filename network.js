if (!localStorage.getItem('ots_jwt')) {
    window.location.href = 'login.html';
}
document.addEventListener('DOMContentLoaded', function() {
  (async function() {
    const API_BASE = 'https://on-the-spot.onrender.com';

    let attendeeConnections = [];

    // Define fetchConnections first
    async function fetchConnections(userId) {
        const token = localStorage.getItem('ots_jwt');
        const res = await fetch(`${API_BASE}/api/connections/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) return [];
        return await res.json();
    }

    // Define connect/disconnect functions first
    async function connect(userId, targetId) {
        const token = localStorage.getItem('ots_jwt');
        await fetch(`${API_BASE}/api/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ userId, targetId })
        });
    }
    async function disconnect(userId, targetId) {
        const token = localStorage.getItem('ots_jwt');
        await fetch(`${API_BASE}/api/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ userId, targetId })
        });
    }

    // --- Move fetchUsers here, before its first use ---
    async function fetchUsers() {
        const token = localStorage.getItem('ots_jwt');
        const res = await fetch(`${API_BASE}/api/users`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) {
            // If unauthorized or error, return empty array
            return [];
        }
        return await res.json();
    }

    const userList = document.querySelector('.user-list');
    const currentUser = JSON.parse(localStorage.getItem('ots_user'));
    let users = [];
    if (currentUser && currentUser._id) {
        users = await fetchUsers();
        if (!Array.isArray(users)) users = [];
    } else {
        users = JSON.parse(localStorage.getItem('ots_users') || '[]').map(u => ({
            ...u,
            type: u.type || 'Attendee'
        }));
    }
    let connections = JSON.parse(localStorage.getItem('ots_connections') || '[]');

    // Convert hosts.json to user-like objects with unique emails
    let vendors = [];
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'cannesfringeeventdata_with_coords.json', false); // synchronous
        xhr.send(null);
        if (xhr.status === 200) {
            const hosts = JSON.parse(xhr.responseText);
            vendors = hosts.map(v => {
                let type = (v.event_type && v.event_type.toLowerCase() === "event") ? "Event" : "Host";
                return {
                    ...v,
                    name: (v['host '] || v.event_name || 'Unknown Vendor'),
                    email: (v['host '] || v.event_name || 'unknown').replace(/\s+/g, '').toLowerCase() + '@vendor.com',
                    type: type
                };
            });
        }
    } catch (e) {
        console.error('Could not load hosts.json', e);
    }

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

    // Helper to get first name
    function getFirstName(name) {
        return (name || '').split(' ')[0];
    }

    function renderUserList() {
        connections = JSON.parse(localStorage.getItem('ots_connections') || '[]');
        const displayedUsers = filteredUsers.filter(user => {
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                user.name.toLowerCase().includes(search) ||
                (user.type && user.type.toLowerCase().includes(search)) ||
                (user.email && user.email.toLowerCase().includes(search));

            const matchesType = !typeFilter || (user.type && user.type === typeFilter);

            let isConnected;
            if (isAttendee(user)) {
                isConnected = attendeeConnections.some(conn => conn._id === user._id);
            } else {
                isConnected = connections.includes(user.email);
            }

            const matchesConnection =
                !connectionFilter ||
                (connectionFilter === 'connected' && isConnected) ||
                (connectionFilter === 'not_connected' && !isConnected);

            return matchesSearch && matchesType && matchesConnection;
        });

        userList.innerHTML = displayedUsers.map(user => {
            const displayName = isAttendee(user) ? getFirstName(user.name) : user.name;
            if (isAttendee(user)) {
                const isConnected = attendeeConnections.some(conn => conn._id === user._id);
                return `
                    <li>
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}" alt="${displayName}" class="user-avatar" />
                        <span class="user-name">${displayName}</span>
                        <span class="user-tag">${user.type || 'Attendee'}</span>
                        <div class="user-actions">
                            <a href="profile.html?user=${encodeURIComponent(user.email)}" class="user-btn view-profile" title="View Profile">Profile</a>
                            <button class="user-btn chat-btn" data-id="${user._id}" title="Chat">Chat</button>
                            <button class="user-btn connect-btn" data-id="${user._id}" title="${isConnected ? 'Unfollow' : 'Follow'}">
                                ${isConnected ? 'Unfollow' : 'Follow'}
                            </button>
                        </div>
                    </li>
                `;
            } else {
                const isConnected = connections.includes(user.email);
                const isVendor = user.type && user.type.toLowerCase() === "host";
                const isEvent = user.type && user.type.toLowerCase() === "event";
                const profileLink = isVendor || isEvent
                    ? `vendor.html?vendor=${encodeURIComponent(user['host '] || user.name)}`
                    : `profile.html?user=${encodeURIComponent(user.email)}`;

                return `
                    <li>
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}" alt="${displayName}" class="user-avatar" />
                        <span class="user-name">${displayName}</span>
                        <span class="user-tag">${user.type || 'Attendee'}</span>
                        <div class="user-actions">
                            <a href="${profileLink}" class="user-btn view-profile" title="View Profile">Profile</a>
                            <button class="user-btn connect-btn" data-email="${user.email}" title="${connections.includes(user.email) ? 'Unfollow' : 'Follow'}">
                                ${connections.includes(user.email) ? 'Unfollow' : 'Follow'}
                            </button>
                        </div>
                    </li>
                `;
            }
        }).join('');
    }

    // Always fetch connections from backend before rendering
    async function refreshConnectionsAndRender() {
        if (currentUser && currentUser._id) {
            attendeeConnections = await fetchConnections(currentUser._id);
        }
        renderUserList();
    }

    // Initial render
    await refreshConnectionsAndRender();

    // Handle connect/disconnect button
    userList.addEventListener('click', async function(e) {
        // Attendee connect/disconnect (backend)
        if (e.target.classList.contains('connect-btn') && e.target.hasAttribute('data-id')) {
            const targetId = e.target.getAttribute('data-id');
            const isConnected = attendeeConnections.some(conn => conn._id === targetId);
            if (isConnected) {
                await disconnect(currentUser._id, targetId);
            } else {
                await connect(currentUser._id, targetId);
            }
            await refreshConnectionsAndRender();
        }
        // Vendor connect/disconnect (local)
        if (e.target.classList.contains('connect-btn') && e.target.hasAttribute('data-email')) {
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
                localStorage.setItem('ots_chat_target', JSON.stringify(user));
                document.getElementById('chat-user').textContent = `Chat with ${user.name}`;
                document.getElementById('chat-popup').style.display = 'flex';
                document.getElementById('chat-input').focus();
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

    // Helper: is this a real attendee (from backend)?
    function isAttendee(user) {
        return !!user._id;
    }
  })();
});

// Listen for changes to connections from other tabs/pages
window.addEventListener('storage', function(e) {
    if (e.key === 'ots_connections_changed') {
        // Re-fetch connections and re-render
        const currentUser = JSON.parse(localStorage.getItem('ots_user'));
        if (currentUser && currentUser._id) {
            (async () => {
                const API_BASE = 'https://on-the-spot.onrender.com';
                async function fetchConnections(userId) {
                    const token = localStorage.getItem('ots_jwt');
                    const res = await fetch(`${API_BASE}/api/connections/${userId}`, {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (!res.ok) return [];
                    return await res.json();
                }
                let attendeeConnections = await fetchConnections(currentUser._id);
                location.reload();
            })();
        }
    }
});