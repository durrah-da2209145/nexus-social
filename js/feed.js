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
        loadSinglePost();  // FIX: now uses API instead of localStorage
    }
});

/**
 * LOAD FEED
 * FIX: Now fetching posts from API instead of localStorage
 */
// async function loadFeed() {
//     const container = document.getElementById("postsContainer");
//     if (!container) return;

//     try {
//         const res = await fetch('/api/posts');
//         const posts = await res.json(); // phase 2 fix 

//         container.innerHTML = posts.map(post => {
//             const authorId = post.author?.id;
//             const username = post.author?.username || 'Unknown';
//             const likes = post._count?.likedBy || 0;

//             return `
//         <div class="post">
//             <h4>
//             <a href="profile.html?id=${authorId}" class="username-link">
//                 ${username}
//             </a>
//             </h4>
//             <p>${post.content}</p>
//             <small>${new Date(post.createdAt).toLocaleString()}</small>
        
//             <button 
//                 data-post-id="${post.id}" 
//                 onclick="toggleLike('${post.id}')">
//                 ❤️ ${likes}
//             </button>

//             <a href="post.html?id=${post.id}">View</a>
//         </div>
//     `;
//         }).join('');

//         loadSidebarData();

//     } catch (err) {
//         console.error("Error loading feed:", err);
//     } }
async function loadFeed() {
    const container = document.getElementById("postsContainer");
    if (!container) return;

    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();

        container.innerHTML = posts.map(post => {
            const username = post.author?.username || "Unknown";
            const likes = post._count?.likes || 0;

            return `
                <div class="post">
                    <h4>${username}</h4>
                    <p>${post.content}</p>
                    <small>${new Date(post.createdAt).toLocaleString()}</small>

                    <button onclick="toggleLike('${post.id}')">
                        ❤️ ${likes}
                    </button>

                    <a href="post.html?id=${post.id}">View</a>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Feed error:", err);
    }
}

/**
 * KEEP: Hashtag logic (allowed as UI feature)
 */
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

/**
 * Sidebar (still uses Storage for users - acceptable)
 */
function loadSidebarData() {
    const currentUser = Storage.getCurrentUser() || {};
    const users = Storage.getUsers();
    const posts = []; // FIX: no longer using localStorage posts

    const otherUsers = users.filter(user => user.id !== currentUser.id);

    const followingCount = currentUser.following?.length ?? otherUsers.length;
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
}

/**
 * CREATE POST
 * FIX: replaced localStorage with API call
 */
function setupCreatePost() {
    const form = document.getElementById('createPostForm');
    const textarea = document.getElementById('postContent');

    if (!form || !textarea) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const content = textarea.value.trim();
        if (!content) return;

        const user = Storage.getCurrentUser();
        if (!user) return;

        await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authorId: user.id,
                content
            })
        });

        textarea.value = "";
        loadFeed();
    });
}

/**
 * SINGLE POST VIEW
 * FIX: now uses API instead of localStorage
 */
async function loadSinglePost() {
    const container = document.getElementById('singlePostContainer');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    try {
        const res = await fetch(`/api/posts/${postId}`);
        const post = await res.json();

        if (!post) {
            container.innerHTML = "<p>Post not found</p>";
            return;
        }

        const currentUser = Storage.getCurrentUser();
        const authorId = post.author?.id;
        const username = post.author?.username || 'Unknown';
        const likes = post._count?.likedBy || 0;

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
                <button onclick="toggleLike('${post.id}')">
                    ❤️ ${likes}
                </button>
                ${showDelete ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ''}
            </div>
        </div>
    `;

    } catch (err) {
        console.error("Error loading post:", err);
    }
}

// /**
//  * LIKE POST
//  * FIX: now uses API instead of localStorage
//  */
// async function toggleLike(postId) {
//     const user = Storage.getCurrentUser();
//     if (!user) return;

//     await fetch(`/api/posts/${postId}/like`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userId: user.id })
//     });

//     loadFeed();
//     loadSinglePost();
// }

async function toggleLike(postId) {
    const user = Storage.getCurrentUser();
    if (!user) return;

    await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
    });

    loadFeed();
    if (typeof loadSinglePost === "function") loadSinglePost();
}

/**
 * DELETE POST
 * FIX: now uses API instead of localStorage
 */
async function deletePost(postId) {
    await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
    });

    if (window.location.pathname.includes('feed.html')) {
        loadFeed();
    }
    else {
        window.location.href = 'feed.html';
    }
}