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
     const feedContainer = document.querySelector('#feedContainer');
    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const currentUser = Storage.getCurrentUser();

    if (!feedContainer) return;

    if (posts.length === 0) {
        feedContainer.innerHTML = '<p>No posts yet.</p>';
        return;
    }

    // Use map + join to render posts
    feedContainer.innerHTML = posts.map(post => {
        const ownPost = currentUser && post.authorId === currentUser.id;
        return `
            <div class="post" id="post-${post.id}">
                <p>${post.content}</p>
                <small>${new Date(post.createdAt).toLocaleString()}</small>
                <div>
                    <a href="post.html?id=${post.id}">View</a>
                    ${ownPost ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function loadSinglePost() {
    // MEMBER 2: Load and display single post
    // Get post ID from URL: post.html?id=123
     const container = document.querySelector('#singlePostContainer');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const post = posts.find(p => p.id === postId);

    if (!post) {
        container.innerHTML = '<p>Post not found.</p>';
        return;
    }

    const currentUser = Storage.getCurrentUser();
    const ownPost = currentUser && post.authorId === currentUser.id;

    container.innerHTML = `
        <div class="post" id="post-${post.id}">
            <p>${post.content}</p>
            <small>${new Date(post.createdAt).toLocaleString()}</small>
            ${ownPost ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ''}
        </div>
    `;
}

function setupCreatePost() {
    // MEMBER 2: Handle post creation form
    const postForm = document.querySelector('#createPostForm');
    if (!postForm) return;

    postForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const contentInput = document.querySelector('#postContent');
        const currentUser = Storage.getCurrentUser();
        if (!currentUser || !contentInput.value.trim()) return;

        const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
        const newPost = {
            id: Date.now().toString(),
            authorId: currentUser.id,
            content: contentInput.value.trim(),
            createdAt: new Date().toISOString()
        };

        posts.push(newPost);
        localStorage.setItem('nexus_posts', JSON.stringify(posts));

        contentInput.value = '';
        loadFeed();
    });
}

function deletePost(postId) {
    // MEMBER 2: Delete post
    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    posts = posts.filter(post => post.id !== postId);
    localStorage.setItem('nexus_posts', JSON.stringify(posts));
    loadFeed();
}