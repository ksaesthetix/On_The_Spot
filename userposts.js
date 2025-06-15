const API_BASE = 'https://on-the-spot.onrender.com';
// Simple in-memory posts array (replace with backend fetch/save for production)
let posts = [];

function fetchPosts() {
    fetch(`${API_BASE}/api/posts`)
        .then(res => res.json())
        .then(data => {
            posts = data;
            renderFeed();
        });
}

document.getElementById('post-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const content = document.getElementById('post-content').value.trim();
    const mediaInput = document.getElementById('post-media');
    const formData = new FormData();
    formData.append('content', content);

    // For demo: use localStorage user or "Guest"
    let user = "Guest";
    try {
        const u = JSON.parse(localStorage.getItem('ots_user'));
        if (u && u.name) user = u.name;
    } catch {}
    formData.append('user', user);

    if (mediaInput.files && mediaInput.files[0]) {
        formData.append('media', mediaInput.files[0]);
    }

    fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById('post-content').value = "";
            mediaInput.value = "";
            fetchPosts();
        }
    });
});

function renderFeed() {
    const feed = document.getElementById('feed');
    if (!posts.length) {
        feed.innerHTML = "<p>No posts yet. Be the first to share something!</p>";
        return;
    }
    const currentUser = JSON.parse(localStorage.getItem('ots_user'));
    feed.innerHTML = posts.map(post => `
        <div class="feed-post" style="background:#f8fafc;border-radius:10px;padding:1rem;margin-bottom:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
            <div style="font-weight:bold;color:var(--color-primary);">${post.user}</div>
            <div style="margin:0.5rem 0;">${post.content ? post.content : ""}</div>
            ${post.mediaUrl && post.mediaType === 'image' ? `<img class="feed-media" src="${post.mediaUrl}" alt="post image" style="max-width:100%;border-radius:8px;">` : ""}
            ${post.mediaUrl && post.mediaType === 'video' ? `<video class="feed-media" controls src="${post.mediaUrl}" style="max-width:100%;border-radius:8px;"></video>` : ""}
            <div style="font-size:0.9em;color:#888;">${post.time}</div>
            <button class="like-btn" data-id="${post._id}">
                ❤️ ${post.likes ? post.likes.length : 0}
            </button>
            <div class="comments">
                <ul>
                    ${(post.comments || []).map(c => `<li><b>${c.user}:</b> ${c.text}</li>`).join('')}
                </ul>
                <form class="comment-form" data-id="${post._id}">
                    <input type="text" placeholder="Add a comment..." required>
                    <button type="submit">Comment</button>
                </form>
            </div>
        </div>
    `).join('');
}

const feed = document.getElementById('feed');

feed.addEventListener('click', function(e) {
    if (e.target.classList.contains('like-btn')) {
        const postId = e.target.getAttribute('data-id');
        const token = localStorage.getItem('ots_jwt');
        if (!token) {
            alert("Please log in to like posts.");
            return;
        }
        fetch(`${API_BASE}/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(res => res.json())
        .then(() => fetchPosts());
    }
});

feed.addEventListener('submit', function(e) {
    if (e.target.classList.contains('comment-form')) {
        e.preventDefault();
        const postId = e.target.getAttribute('data-id');
        const input = e.target.querySelector('input');
        const text = input.value.trim();
        if (!text) return;
        const token = localStorage.getItem('ots_jwt');
        fetch(`${API_BASE}/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ text })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                input.value = '';
                fetchPosts();
            } else {
                alert(data.message || "Could not add comment.");
            }
        })
        .catch(() => alert("Network error."));
    }
});

// Initial fetch
fetchPosts();