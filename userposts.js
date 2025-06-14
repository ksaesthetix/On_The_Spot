// Simple in-memory posts array (replace with backend fetch/save for production)
let posts = [];

function fetchPosts() {
    fetch('https://on-the-spot.onrender.com/api/posts')
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

    fetch('https://on-the-spot.onrender.com/api/posts', {
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
    feed.innerHTML = posts.map(post => `
        <div class="feed-post" style="background:#f8fafc;border-radius:10px;padding:1rem;margin-bottom:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
            <div style="font-weight:bold;color:var(--color-primary);">${post.user}</div>
            <div style="margin:0.5rem 0;">${post.content ? post.content : ""}</div>
            ${post.mediaUrl && post.mediaType === 'image' ? `<img class="feed-media" src="${post.mediaUrl}" alt="post image" style="max-width:100%;border-radius:8px;">` : ""}
            ${post.mediaUrl && post.mediaType === 'video' ? `<video class="feed-media" controls src="${post.mediaUrl}" style="max-width:100%;border-radius:8px;"></video>` : ""}
            <div style="font-size:0.9em;color:#888;">${post.time}</div>
        </div>
    `).join('');
}

// Initial fetch
fetchPosts();