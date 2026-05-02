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
        loadSidebarData();
        setupCreatePost();
    }
    else if (currentPage === 'post.html') {
        loadSinglePost();  // FIX: this now correctly calls the function below
    }
});

function loadFeed() {
    const container = document.getElementById("postsContainer");
    if (!container) return;

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];

    container.innerHTML = posts.map(post => {
        const authorId = post.userId || post.authorId;
        const username = post.username || 'Unknown';
        const likes = Array.isArray(post.likes) ? post.likes.length : 0;

        return `
        <div class="post">
            <h4>
            <a href="profile.html?id=${authorId}" class="username-link">
                ${username}
            </a>
            </h4>
            <p>${post.content}</p>
            <small>${new Date(post.createdAt).toLocaleString()}</small>
        
            <button 
                data-post-id="${post.id}" 
                onclick="Interactions.toggleLike('${post.id}')">
                ❤️ ${likes}
            </button>

            <a href="post.html?id=${post.id}">View</a>
        </div>
    `;
    }).join('');

    loadSidebarData();
}

function getTrendingHashtags(posts) {
    const hashtagCounts = {};
    const regex = /#(\w+)/g;

    posts.forEach(post => {
        let match;
        while ((match = regex.exec(post.content))) {
            const tag = `#${match[1]}`;
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
        }
    });

    const sortedHashtags = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag);

    return sortedHashtags.length ? sortedHashtags.slice(0, 4) : ['#Nexus', '#Social', '#Updates', '#Connect'];
}

function loadSidebarData() {
    const currentUser = Storage.getCurrentUser() || {};
    const users = Storage.getUsers();
    const posts = Storage.getPosts();
    const otherUsers = users.filter(user => user.id !== currentUser.id);

    const followingCount = currentUser.following?.length ?? otherUsers.length;
    const followersCount = currentUser.followers?.length ?? 0;
    const onlineCount = otherUsers.length;

    const sidebarSummary = document.getElementById('sidebarSummary');
    if (sidebarSummary) {
        sidebarSummary.innerHTML = `
            <h3>Welcome back${currentUser.username ? ', ' + currentUser.username : ''}</h3>
            <p>See what friends are sharing and stay connected with live activity.</p>
            <div class="sidebar-meta">
                <div><strong>${followingCount}</strong> Following</div>
                <div><strong>${onlineCount}</strong> Online</div>
            </div>
        `;
    }

    const trendingList = document.getElementById('trendingList');
    if (trendingList) {
        const hashtags = getTrendingHashtags(posts);
        trendingList.innerHTML = hashtags.map(tag => `<li>${tag}</li>`).join('');
    }

    const onlineList = document.getElementById('onlineList');
    if (onlineList) {
        onlineList.innerHTML = otherUsers.slice(0, 4).map(user => `
            <li><span class="online-dot"></span>${user.username}</li>
        `).join('') || '<li>No users online</li>';
    }

    const suggestionsList = document.getElementById('suggestionsList');
    if (suggestionsList) {
        suggestionsList.innerHTML = otherUsers.slice(0, 3).map(user => `
            <li class="suggest-item">
                <div>
                    <strong>${user.username}</strong>
                    <small>@${user.username.toLowerCase()}</small>
                </div>
                <button class="btn btn-secondary" type="button">Follow</button>
            </li>
        `).join('') || '<li>No suggestions available</li>';
    }
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

// FIX: Renamed from loadingSinglePost (typo) to loadSinglePost, and wired up post rendering
function loadSinglePost() {
    const container = document.getElementById('singlePostContainer');
    const commentsSection = document.getElementById('commentsSection');
    const noPost = document.getElementById('noPostMessage');

    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const post = posts.find(p => p.id === postId);

    // No post found
    if (!post) {
        container.innerHTML = '';
        if (noPost) noPost.style.display = 'block';
        if (commentsSection) commentsSection.style.display = 'none';
        return;
    }

    // Show the post itself
    if (noPost) noPost.style.display = 'none';
    if (commentsSection) commentsSection.style.display = 'block';

    const currentUser = Storage.getCurrentUser();
    const authorId = post.userId || post.authorId;
    const username = post.username || 'Unknown';
    const showDelete = currentUser && currentUser.id === authorId;

    container.innerHTML = `
        <div class="post single-post">
            <h4>
                <a href="profile.html?id=${authorId}" class="username-link">
                    ${username}
                </a>
            </h4>
            <p>${post.content}</p>
            <small>${new Date(post.createdAt).toLocaleString()}</small>
            <div class="post-actions">
                <button
                    data-post-id="${post.id}"
                    onclick="Interactions.toggleLike('${post.id}')">
                    ❤️ ${post.likes ? post.likes.length : 0}
                </button>
                ${showDelete ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ''}
            </div>
        </div>
    `;
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
    const authorId = post.userId || post.authorId;
    const username = post.username || 'Unknown';
    const showDelete = currentUser && currentUser.id === authorId;
    return `
        <div class="post" id="post-${post.id}">
            <h4>${username}</h4>
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