document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'https://on-the-spot.onrender.com';
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('user');
    const token = localStorage.getItem('ots_jwt');
    const mainEl = document.querySelector('main');
    const itineraryList = document.querySelector('.itinerary-list');

    if (!token) {
        mainEl.innerHTML = '<section class="profile-section"><p>Please <a href="login.html">log in</a> to view your profile.</p></section>';
        return;
    }

    // Fetch all users (for connections and viewing other profiles)
    fetch(`${API_BASE}/api/users`, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => res.json())
    .then(users => {
        // If viewing another user's profile
        let user;
        if (emailParam) {
            user = users.find(u => u.email === emailParam);
            if (user) {
                renderProfile(user, users, true);
            } else {
                mainEl.innerHTML = '<section class="profile-section"><p>User not found.</p></section>';
            }
        } else {
            // Fetch current user's profile
            fetch(`${API_BASE}/api/profile`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('ots_jwt') }
            })
            .then(res => res.json())
            .then(user => {
                renderProfile(user, users, false);
                updateTrialTimer(user.trialEndsAt);
            })
            .catch(() => {
                mainEl.innerHTML = '<section class="profile-section"><p>Session expired. Please <a href="login.html">log in</a> again.</p></section>';
            });
        }
    })
    .catch(() => {
        mainEl.innerHTML = '<section class="profile-section"><p>Session expired. Please <a href="login.html">log in</a> again.</p></section>';
    });

    function renderProfile(user, users, isOtherUser) {
        const nameEl = document.getElementById('profile-name');
        const usernameEl = document.getElementById('profile-username');
        const avatarEl = document.getElementById('profile-avatar');
        const connectionsSection = document.querySelector('.connections-section');
        const postsSection = document.querySelector('.posts-section');
        const itinerarySection = document.querySelector('.itinerary-section');
        const profileActions = document.querySelector('.profile-actions');

        // Always show all sections for your own profile
        if (!isOtherUser) {
            document.querySelectorAll('.profile-actions, .connections-section, .posts-section, .itinerary-section')
                .forEach(el => { if (el) el.style.display = ''; });
        } else {
            document.querySelectorAll('.profile-actions, .connections-section, .posts-section, .itinerary-section')
                .forEach(el => { if (el) el.style.display = ''; });
        }

        // Update profile info
        if (nameEl) nameEl.textContent = user.name;
        if (usernameEl) usernameEl.textContent = '@' + (user.name || 'username');

        // Render connections for both attendees and vendors
        const connectionsList = document.querySelector('.connections-list');
        if (connectionsList) {
            const connections = Array.isArray(user.connections) ? user.connections : [];
            console.log("Connections received:", user.connections);
            if (connections.length > 0) {
                connectionsList.innerHTML = connections.map(conn => `
                    <li>
                        <span>${conn.name}</span>
                    </li>
                `).join('');
            } else {
                connectionsList.innerHTML = '<li>No connections yet.</li>';
            }
        }

        // Render itinerary items
        if (itineraryList && user.itinerary && user.itinerary.length > 0) {
            itineraryList.innerHTML = user.itinerary.map(item => `
                <li>${item.name} - ${item.time || ''} ${item.vendor ? '(' + item.vendor + ')' : ''}</li>
            `).join('');
        } else if (itineraryList) {
            itineraryList.innerHTML = '<li>No itinerary items yet.</li>';
        }

        // Render user's posts
        const postList = document.querySelector('.post-list');
        if (postList) {
            postList.innerHTML = '<li>Loading posts...</li>';
            fetch(`${API_BASE}/api/posts`)
                .then(res => res.json())
                .then(posts => {
                    // Filter posts by user name (or use user.email if you store that in posts)
                    const userPosts = posts.filter(post => post.user === user.name);
                    if (userPosts.length > 0) {
                        postList.innerHTML = userPosts.map(post => `
                            <li class="post">
                                <div>${post.content}</div>
                                <span class="post-time">${new Date(post.time).toLocaleString()}</span>
                                ${post.mediaUrl ? `<div class="feed-media"><img src="${post.mediaUrl}" alt="media" /></div>` : ''}
                            </li>
                        `).join('');
                    } else {
                        postList.innerHTML = '<li>No posts yet.</li>';
                    }
                })
                .catch(() => {
                    postList.innerHTML = '<li>Could not load posts.</li>';
                });
        }
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

    // Fetch and render itinerary
    function renderItinerary(items) {
        if (!itineraryList) return;
        if (Array.isArray(items) && items.length > 0) {
            itineraryList.innerHTML = items.map(item =>
                `<li>${item.name}${item.time ? ' - ' + item.time : ''}${item.vendor ? ' (' + item.vendor + ')' : ''}</li>`
            ).join('');
        } else {
            itineraryList.innerHTML = '<li>No itinerary items yet.</li>';
        }
    }

    // Fetch itinerary from backend
    fetch(`${API_BASE}/api/itinerary`, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => res.json())
    .then(renderItinerary)
    .catch(() => {
        if (itineraryList) itineraryList.innerHTML = '<li>Could not load itinerary.</li>';
    });
});