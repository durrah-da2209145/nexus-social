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

document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'feed.html') {
        loadFeed();
        setupCreatePost();
    } else if (currentPage === 'post.html') {
        loadSinglePost();
    }
});

function loadFeed() {
    // MEMBER 2: Load and display all posts in feed
    const container = document.querySelector(".feed-container") || document.querySelector("#postsContainer");
    if (!container) return;

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    posts.sort((a,b) => b.createdAt - a.createdAt);

    container.innerHTML = posts.map(post => `
        <div class="post" id="post-${post.id}">
            <h4>${post.username}</h4>
            <p>${post.content}</p>
            <div class="post-actions">
                ${Storage.getCurrentUser()?.id === post.userId ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ''}
                <a href="post.html?id=${post.id}">View</a>
            </div>
        </div>
    `).join('');
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

function loadSinglePost() {
    // MEMBER 2: Load and display single post
    // Get post ID from URL: post.html?id=123
     const container = document.getElementById('singlePostContainer');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const post = posts.find(p => p.id === postId);

    if (!post) {
        container.innerHTML = "<p>Post not found</p>";
        return;
    }

    container.innerHTML = `
        <h3>${post.username}</h3>
        <p>${post.content}</p>
        <small>Posted on ${new Date(post.createdAt).toLocaleString()}</small>
        ${Storage.getCurrentUser()?.id === post.userId ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ''}
    `;
}

function setupCreatePost() {
    // MEMBER 2: Handle post creation form
    const form = document.getElementById('createPostForm');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();
        if (!content) return alert("Post cannot be empty");

        const currentUser = Storage.getCurrentUser();
        if (!currentUser) return alert("You must be logged in");

        const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
        posts.push({
            id: Date.now().toString(),
            userId: currentUser.id,
            username: currentUser.username,
            content,
            createdAt: Date.now()
        });

        localStorage.setItem('nexus_posts', JSON.stringify(posts));
        textarea.value = '';
        loadFeed();
    });
}

function deletePost(postId) {
    // MEMBER 2: Delete post
    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem('nexus_posts', JSON.stringify(posts));

    if (window.location.pathname.includes('feed.html')) {
        loadFeed();
    } else {
        window.location.href = 'feed.html';
    }
}