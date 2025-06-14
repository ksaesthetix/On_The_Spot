document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('user');
    const token = localStorage.getItem('ots_jwt');
    const mainEl = document.querySelector('main');

    if (!token) {
        mainEl.innerHTML = '<section class="profile-section"><p>Please <a href="login.html">log in</a> to view your profile.</p></section>';
        return;
    }

    // Fetch all users (for connections and viewing other profiles)
    fetch('https://on-the-spot.onrender.com/api/users', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => res.json())
    .then(users => {
        // If viewing another user's profile
        let user;
        if (emailParam) {
            user = users.find(u => u.email === emailParam);
        } else {
            // Fetch current user's profile
            return fetch('https://on-the-spot.onrender.com/api/profile', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(res => res.json())
            .then(profile => {
                user = profile;
                renderProfile(user, users, false);
            });
        }
        if (user) {
            renderProfile(user, users, !!emailParam);
        } else {
            mainEl.innerHTML = '<section class="profile-section"><p>User not found.</p></section>';
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
        const connectionsList = document.querySelector('.connections-list');

        // Update profile info
        nameEl.textContent = user.name;
        usernameEl.textContent = '@' + (user.email ? user.email.split('@')[0] : 'username');
        // Optionally, set a user-specific avatar if you have one
        // avatarEl.src = user.avatarUrl || 'avatar.png';

        // If viewing another user's profile, hide actions, connections, posts, itinerary
        if (isOtherUser) {
            if (profileActions) profileActions.style.display = 'none';
            if (connectionsSection) connectionsSection.style.display = 'none';
            if (postsSection) postsSection.style.display = 'none';
            if (itinerarySection) itinerarySection.style.display = 'none';
        } else {
            // Show connections for the logged-in user only
            if (connectionsList && user.connections) {
                connectionsList.innerHTML = user.connections.map(connId => {
                    const u = users.find(user => user._id === connId);
                    if (!u) return '';
                    return `<li>
                        <img src="avatar.png" alt="${u.name}" class="connection-avatar" />
                        <span>${u.name}</span>
                    </li>`;
                }).join('') || '<li>No connections yet.</li>';
            }
        }
    }
});