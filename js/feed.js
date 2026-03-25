/**
 * Nexus Social - Feed & Posts
 * MEMBER 2: Implement ALL post-related functionality
 * 
 * This file handles:
 * ✅ Creating new posts
 * ✅ Displaying posts in feed
 * ✅ Deleting own posts
 * ✅ Single post view (post.html)
 * 
 * TODO: Implement these functions
 */

document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'feed.html') {
        loadFeed();
        setupCreatePost();
    }
    else if (currentPage === 'post.html') {
        loadSinglePost();
    }
});

function loadFeed() {
    const container = document.getElementById("postsContainer");
    if (!container) return;

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];

    container.innerHTML = posts.map(post => `
        <div class="post">
            <h4>
            <a href="profile.html?id=${post.userId}" class="username-link">
                ${post.username}
            </a>
            </h4>
            <p>${post.content}</p>
            <small>${new Date(post.createdAt).toLocaleString()}</small>
        
            <button 
                data-post-id="${post.id}" 
                onclick="Interactions.toggleLike('${post.id}')">
                ❤️ ${post.likes ? post.likes.length : 0}
            </button>

            <a href="post.html?id=${post.id}">View</a>
        </div>
    `).join('');

}

function setupCreatePost() {
    const form = document.getElementById('createPostForm');
    const textarea = document.getElementById('postContent');

    if (!form || !textarea) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const content = textarea.value.trim();
        if (!content) return;

        const user = Storage.getCurrentUser();
        if (!user) return;

        let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];

        posts.push({
            id: Date.now().toString(),
            userId: user.id,
            username: user.username,
            content: content,
            createdAt: Date.now()
        });

        localStorage.setItem('nexus_posts', JSON.stringify(posts));

        textarea.value = "";
        loadFeed();
    });
}

function loadingSinglePost() {
    const container = document.getElementById('singlePostContainer');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const post = posts.find(p => p.id === postId);

    // No post
    if (!post) {
        container.innerHTML = "<p>No post found.</p>";
        return;
    }

    // STEP 1: FORCE REMOVE SPINNER
    const spinner = container.querySelector('.loading-spinner');
    if (spinner) spinner.remove();

    // STEP 2: CLEAR ANY LEFTOVER CONTENT
    container.innerHTML = "";

    // STEP 3: ADD POST
    const postDiv = document.createElement("div");
    postDiv.className = "post";

    postDiv.innerHTML = `
        <h3>${post.username}</h3>
        <p>${post.content}</p>
        <small>${new Date(post.createdAt).toLocaleString()}</small>
    `;

    container.appendChild(postDiv);
}

function setupCreatePost() {
    const form = document.getElementById('createPostForm');
    const textarea = document.getElementById('postContent');

    if (!form || !textarea) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const content = textarea.value.trim();
        if (!content) return;

        const user = Storage.getCurrentUser();
        if (!user) return;

        let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];

        posts.push({
            id: Date.now().toString(),
            userId: user.id,
            username: user.username,
            content: content,
            createdAt: Date.now()
        });

        localStorage.setItem('nexus_posts', JSON.stringify(posts));

        textarea.value = "";
        loadFeed();
    });
}

// Convert a post object to HTML
function postToHTML(post) {
    const currentUser = Storage.getCurrentUser();
    const showDelete = currentUser && currentUser.id === post.userId;
    return `
        <div class="post" id="post-${post.id}">
            <h4>${post.username}</h4>
            <p>${post.content}</p>
            <div class="post-actions">
                ${showDelete ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ''}
                <a href="post.html?id=${post.id}">View</a>
            </div>
        </div>
    `;
}

function deletePost(postId) {
    // MEMBER 2: Delete post
    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem('nexus_posts', JSON.stringify(posts));

    if (window.location.pathname.includes('feed.html')) {
        loadFeed();
    }
    else {
        window.location.href = 'feed.html';
    }
}