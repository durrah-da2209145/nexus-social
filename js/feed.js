/**
 * Nexus Social - Feed & Posts
 */

document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'feed.html') {
        loadFeed();
        loadSidebarData();
        setupCreatePost();
    }
    else if (currentPage === 'post.html') {
        loadSinglePost();
        setupCommentForm();
    }
});

function loadFeed() {
    const container = document.getElementById("postsContainer");
    if (!container) return;

    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const users = JSON.parse(localStorage.getItem('nexus_users')) || [];
    
    // Get current user directly from localStorage
    const currentUserRaw = localStorage.getItem('currentUser');
    let currentUser = null;
    if (currentUserRaw && currentUserRaw !== 'null') {
        try {
            currentUser = JSON.parse(currentUserRaw);
        } catch(e) {}
    }
    
    console.log('Loading feed. Posts found:', posts.length);
    console.log('Current user:', currentUser?.username);
    
    // Sort by newest first
    posts.sort((a, b) => b.createdAt - a.createdAt);

    if (posts.length === 0) {
        container.innerHTML = '<p style="color: gray; text-align: center;">No posts yet. Create the first post!</p>';
        return;
    }

    let html = '';
    
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const authorId = post.userId || post.authorId;
        
        let username = post.authorName || post.username;
        if (!username || username === 'Unknown') {
            const author = users.find(u => String(u.id) === String(authorId));
            username = author ? author.username : 'User';
        }
        
        const likes = post.likes ? post.likes.length : 0;
        const comments = post.comments ? post.comments.length : 0;
        const showDelete = currentUser && String(currentUser.id) === String(authorId);
        
        let dateStr = 'Recently';
        if (post.createdAt) {
            const date = new Date(post.createdAt);
            dateStr = date.toLocaleString();
        }
        
        html += `
        <div class="post" id="post-${post.id}" style="border:1px solid #ddd; margin-bottom:20px; padding:15px; border-radius:8px; background:white;">
            <h4 style="margin:0 0 10px 0;">
                <a href="profile.html?id=${authorId}" style="text-decoration:none; color:#333;">
                    ${escapeHtml(username)}
                </a>
            </h4>
            <p style="margin:10px 0;">${escapeHtml(post.content)}</p>
            <small style="color:#666;">${dateStr}</small>
        
            <div style="margin-top:10px;">
                <button 
                    data-post-id="${post.id}" 
                    onclick="toggleLike('${post.id}')"
                    style="margin-right:10px; cursor:pointer; padding:5px 10px;">
                    ❤️ ${likes}
                </button>

                <a href="post.html?id=${post.id}" style="margin-right:10px; text-decoration:none; padding:5px 10px;">💬 ${comments}</a>
                
                ${showDelete ? `<button onclick="deletePost('${post.id}')" style="cursor:pointer; padding:5px 10px; color:red;">🗑️ Delete</button>` : ''}
            </div>
        </div>
        `;
    }
    
    container.innerHTML = html;
}

function setupCreatePost() {
    const form = document.getElementById('createPostForm');
    const textarea = document.getElementById('postContent');

    if (!form) {
        console.log('Create post form not found');
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const content = textarea ? textarea.value.trim() : '';
        if (!content) {
            alert('Please enter some content for your post.');
            return;
        }

        // DIRECT access to localStorage - NO Storage object
        const userRaw = localStorage.getItem('currentUser');
        console.log('Raw user from localStorage:', userRaw);
        
        if (!userRaw || userRaw === 'null' || userRaw === 'undefined') {
            alert('You must be logged in to post.');
            window.location.href = 'login.html';
            return;
        }
        
        let user;
        try {
            user = JSON.parse(userRaw);
        } catch (e) {
            console.error('Failed to parse user:', e);
            alert('Session error. Please log in again.');
            window.location.href = 'login.html';
            return;
        }
        
        if (!user || !user.id) {
            alert('User data is invalid. Please log in again.');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
            return;
        }

        console.log('Creating post for user:', user.username, 'ID:', user.id);

        let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
        
        const newPost = {
            id: Date.now().toString(),
            userId: user.id,
            authorId: user.id,
            username: user.username,
            authorName: user.username,
            content: content,
            createdAt: Date.now(),
            likes: [],
            comments: []
        };

        posts.unshift(newPost);
        localStorage.setItem('nexus_posts', JSON.stringify(posts));
        
        console.log('Post saved. Total posts:', posts.length);

        if (textarea) textarea.value = "";
        
        // Reload feed
        loadFeed();
        loadSidebarData();
        
        alert('Post created successfully!');
    });
}

function loadSinglePost() {
    const container = document.getElementById('singlePostContainer');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const post = posts.find(p => p.id === postId);
    
    console.log('Loading single post:', postId, 'Found:', !!post);

    if (!post) {
        container.innerHTML = '<p>Post not found. <a href="feed.html">Back to feed</a></p>';
        return;
    }

    const users = JSON.parse(localStorage.getItem('nexus_users')) || [];
    const authorId = post.userId || post.authorId;
    
    let username = post.authorName || post.username;
    if (!username || username === 'Unknown') {
        const author = users.find(u => String(u.id) === String(authorId));
        username = author ? author.username : 'User';
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const showDelete = currentUser && String(currentUser.id) === String(authorId);
    const likes = post.likes ? post.likes.length : 0;
    
    const dateStr = post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Recently';

    container.innerHTML = `
        <div class="post single-post" style="border:1px solid #ddd; padding:20px; border-radius:8px;">
            <h4 style="margin:0 0 10px 0;">
                <a href="profile.html?id=${authorId}">${escapeHtml(username)}</a>
            </h4>
            <p style="margin:10px 0;">${escapeHtml(post.content)}</p>
            <small>${dateStr}</small>
            <div style="margin-top:15px;">
                <button onclick="toggleLike('${post.id}')" style="margin-right:10px;">
                    ❤️ ${likes}
                </button>
                ${showDelete ? `<button onclick="deletePost('${post.id}')" style="color:red;">Delete Post</button>` : ''}
            </div>
        </div>
    `;
    
    // Load comments
    loadComments(postId);
}

function loadComments(postId) {
    const commentsContainer = document.getElementById('commentsContainer');
    if (!commentsContainer) return;

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const post = posts.find(p => p.id === postId);
    
    if (!post || !post.comments || post.comments.length === 0) {
        commentsContainer.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let commentsHtml = '';
    
    for (let i = 0; i < post.comments.length; i++) {
        const comment = post.comments[i];
        const showDelete = currentUser && (
            String(currentUser.id) === String(comment.userId) || 
            String(currentUser.id) === String(post.userId)
        );
        
        const dateStr = comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Recently';
        
        commentsHtml += `
            <div class="comment" id="comment-${comment.id}" style="border-left:3px solid #007bff; padding-left:15px; margin:15px 0;">
                <strong><a href="profile.html?id=${comment.userId}">${escapeHtml(comment.userName)}</a></strong>
                <p>${escapeHtml(comment.text)}</p>
                <small>${dateStr}</small>
                ${showDelete ? `<button onclick="deleteComment('${postId}', '${comment.id}')" style="display:block; margin-top:5px;">Delete</button>` : ''}
            </div>
        `;
    }
    
    commentsContainer.innerHTML = commentsHtml;
}

function setupCommentForm() {
    const commentForm = document.getElementById('commentForm');
    if (!commentForm) return;
    
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const commentInput = document.getElementById('commentInput');
        const commentText = commentInput ? commentInput.value.trim() : '';
        
        if (!commentText) {
            alert('Please enter a comment.');
            return;
        }
        
        const params = new URLSearchParams(window.location.search);
        const postId = params.get('id');
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('You must be logged in to comment.');
            window.location.href = 'login.html';
            return;
        }
        
        let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) {
            alert('Post not found.');
            return;
        }
        
        if (!posts[postIndex].comments) posts[postIndex].comments = [];
        
        const newComment = {
            id: Date.now().toString(),
            text: commentText,
            userId: currentUser.id,
            userName: currentUser.username,
            createdAt: Date.now()
        };
        
        posts[postIndex].comments.push(newComment);
        localStorage.setItem('nexus_posts', JSON.stringify(posts));
        
        if (commentInput) commentInput.value = '';
        loadComments(postId);
    });
}

function deleteComment(postId, commentId) {
    if (!confirm('Delete this comment?')) return;
    
    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1 && posts[postIndex].comments) {
        posts[postIndex].comments = posts[postIndex].comments.filter(c => c.id !== commentId);
        localStorage.setItem('nexus_posts', JSON.stringify(posts));
        loadComments(postId);
    }
}

function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem('nexus_posts', JSON.stringify(posts));

    if (window.location.pathname.includes('feed.html')) {
        loadFeed();
    } else if (window.location.pathname.includes('post.html')) {
        window.location.href = 'feed.html';
    }
}

function toggleLike(postId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please login to like posts');
        return;
    }
    
    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        if (!posts[postIndex].likes) posts[postIndex].likes = [];
        
        const likeIndex = posts[postIndex].likes.indexOf(currentUser.id);
        
        if (likeIndex === -1) {
            posts[postIndex].likes.push(currentUser.id);
        } else {
            posts[postIndex].likes.splice(likeIndex, 1);
        }
        
        localStorage.setItem('nexus_posts', JSON.stringify(posts));
        
        // Reload the feed or post page
        if (window.location.pathname.includes('feed.html')) {
            loadFeed();
        } else if (window.location.pathname.includes('post.html')) {
            loadSinglePost();
        }
    }
}

function loadSidebarData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const users = JSON.parse(localStorage.getItem('nexus_users')) || [];
    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const otherUsers = users.filter(user => user.id !== currentUser.id);

    const followingCount = currentUser.following ? currentUser.following.length : 0;
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
        trendingList.innerHTML = '<li>#Nexus</li><li>#Social</li><li>#Updates</li><li>#Connect</li>';
    }

    const onlineList = document.getElementById('onlineList');
    if (onlineList) {
        onlineList.innerHTML = otherUsers.slice(0, 4).map(user => `
            <li><span class="online-dot"></span>${escapeHtml(user.username)}</li>
        `).join('') || '<li>No users online</li>';
    }

    const suggestionsList = document.getElementById('suggestionsList');
    if (suggestionsList) {
        const nonFollowingUsers = otherUsers.filter(user => !currentUser.following?.includes(user.id));
        suggestionsList.innerHTML = nonFollowingUsers.slice(0, 3).map(user => `
            <li class="suggest-item">
                <div>
                    <strong>${escapeHtml(user.username)}</strong>
                    <small>@${escapeHtml(user.username.toLowerCase())}</small>
                </div>
                <button class="btn btn-secondary" type="button" onclick="followUser(${user.id})">Follow</button>
            </li>
        `).join('') || '<li>No suggestions available</li>';
    }
}

function followUser(userId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    if (!currentUser.following) currentUser.following = [];
    
    if (!currentUser.following.includes(userId)) {
        currentUser.following.push(userId);
        
        let users = JSON.parse(localStorage.getItem('nexus_users')) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('nexus_users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loadSidebarData();
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}