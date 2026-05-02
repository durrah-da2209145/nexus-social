/**
 * Nexus Social - Interactions (Likes, Comments, Follows)
 * MEMBER 3: FULL IMPLEMENTATION
**/

document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.includes('post.html')) {
        setupComments();
        loadComments();
    }
});

// Helpers

function getPosts() {
    return JSON.parse(localStorage.getItem('nexus_posts')) || [];
}

function savePosts(posts) {
    localStorage.setItem('nexus_posts', JSON.stringify(posts));
}

function getUsers() {
    return JSON.parse(localStorage.getItem('nexus_users')) || [];
}

function saveUsers(users) {
    localStorage.setItem('nexus_users', JSON.stringify(users));
}

//Likes

function toggleLike(postId) {
    const user = Storage.getCurrentUser();
    if (!user) return;

    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const post = posts.find(p => p.id === postId);

    if (!post) return;
    if (!post.likes) post.likes = [];

    const index = post.likes.indexOf(user.id);

    if (index > -1) {
        post.likes.splice(index, 1); // unlike
    }
    else {
        post.likes.push(user.id); // like
    }

    localStorage.setItem('nexus_posts', JSON.stringify(posts));

    if (typeof loadFeed === "function") loadFeed();
    if (typeof loadSinglePost === "function") loadSinglePost();
}

function updateLikeUI(postId, count) {
    const btn = document.querySelector(`[data-post-id="${postId}"]`);
    if (btn) {
        btn.innerHTML = `❤️ ${count}`;
    }
}

// Comments

function setupComments() {
    const btn = document.getElementById('submitComment');
    if (!btn) return;

    btn.addEventListener('click', addComment);
}

function addComment() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();

    if (!text) return;

    const user = Storage.getCurrentUser();
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const post = posts.find(p => p.id === postId);

    if (!post) return;

    if (!post.comments) post.comments = [];

    post.comments.push({
        postId,
        userId: user.id,
        username: user.username,
        content: text,
        createdAt: Date.now()
    });

    localStorage.setItem('nexus_posts', JSON.stringify(posts));

    input.value = "";
    loadComments();
}

function loadComments() {
    const list = document.getElementById('commentsList');
    const section = document.getElementById('commentsSection');
    const noPost = document.getElementById('noPostMessage');

    if (!list || !section || !noPost) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    const posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    const users = JSON.parse(localStorage.getItem('nexus_users')) || [];

    const post = posts.find(p => p.id === postId);

    if (!post) {
        section.style.display = 'none';
        noPost.style.display = 'block';
        return;
    }

    section.style.display = 'block';
    noPost.style.display = 'none';

    if (!post.comments || post.comments.length === 0) {
        list.innerHTML = "<p>No comments yet.</p>";
        return;
    }

    list.innerHTML = "";

    let updated = false;
    post.comments.forEach((c, index) => {

        if (!c.createdAt) {
            c.createdAt = Date.now();
            updated = true;
        }

        const user = users.find(u => u.id === c.userId);
        const currentUser = Storage.getCurrentUser();
        // FIX: Show delete button if this comment belongs to the current user
        const canDelete = currentUser && currentUser.id === c.userId;

        list.innerHTML += `
            <div class="comment-item" id="comment-${index}">
                <strong><a href="profile.html?id=${user ? user.id : ''}" class="username-link">${user ? user.username : "User"}</a></strong>
                <p>${c.content}</p>
                <small>${new Date(c.createdAt).toLocaleString()}</small>
                ${canDelete ? `<button class="delete-comment-btn" onclick="deleteComment(${index})">Delete</button>` : ''}
            </div>
        `;
    });

    if (updated) {
        localStorage.setItem('nexus_posts', JSON.stringify(posts));
    }
}

// FIX: Delete comment function — was missing entirely
function deleteComment(commentIndex) {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) return;

    const currentUser = Storage.getCurrentUser();
    if (!currentUser) return;

    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];

    const postIdNum = Number(postId);
    const post = posts.find(p => p.id === postIdNum);

    if (!post || !post.comments) return;

    const comment = post.comments[commentIndex];

    if (!comment) {
        alert("Comment not found");
        return;
    }

    if (comment.userId !== currentUser.id) {
        alert("You can only delete your own comments");
        return;
    }

    post.comments.splice(commentIndex, 1);
    localStorage.setItem('nexus_posts', JSON.stringify(posts));
    loadComments();
}

// Follow/Unfollow

function setupFollowButton() {
    const btn = document.getElementById('followBtn');
    if (!btn) return;

    const currentUser = Storage.getCurrentUser();
    if (!currentUser) return;

    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('id');

    if (!profileId || profileId === currentUser.id) return;

    btn.style.display = 'block';

    let users = JSON.parse(localStorage.getItem('nexus_users')) || [];
    const user = users.find(u => u.id === currentUser.id);

    if (!user.following) user.following = [];

    updateFollowUI(btn, user.following.includes(profileId));

    btn.addEventListener('click', () => {
        const index = user.following.indexOf(profileId);

        if (index > -1) {
            user.following.splice(index, 1);
            // also remove from target's followers
            const target = users.find(u => u.id === profileId);
            if (target && target.followers) {
                target.followers = target.followers.filter(id => id !== currentUser.id);
            }
        }
        else {
            user.following.push(profileId);
            // also add to target's followers
            const target = users.find(u => u.id === profileId);
            if (target) {
                if (!target.followers) target.followers = [];
                target.followers.push(currentUser.id);
            }
        }

        localStorage.setItem('nexus_users', JSON.stringify(users));
        updateFollowUI(btn, user.following.includes(profileId));

        // FIX: Update the follower count shown on the profile page immediately
        const followerCountEl = document.getElementById('profileFollowersCount');
        if (followerCountEl) {
            const updatedTarget = users.find(u => u.id === profileId);
            followerCountEl.textContent = (updatedTarget?.followers || []).length;
        }
    });
}


function updateFollowUI(btn, isFollowing) {
    btn.textContent = isFollowing ? "Unfollow" : "Follow";
}

function toggleFollow(profileUserId) {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) return;

    let users = JSON.parse(localStorage.getItem('nexus_users')) || [];

    const current = users.find(u => u.id === currentUser.id);
    const target = users.find(u => u.id === profileUserId);

    if (!current.following) current.following = [];
    if (!target.followers) target.followers = [];

    const isFollowing = current.following.includes(profileUserId);

    if (isFollowing) {
        // unfollow
        current.following = current.following.filter(id => id !== profileUserId);
        target.followers = target.followers.filter(id => id !== currentUser.id);
    } else {
        // follow
        current.following.push(profileUserId);
        target.followers.push(currentUser.id);
    }

    localStorage.setItem('nexus_users', JSON.stringify(users));

    // update button instantly
    updateFollowButton(profileUserId);
}

function updateFollowButton(profileUserId) {
    const btn = document.getElementById('followBtn');
    const currentUser = Storage.getCurrentUser();

    let users = JSON.parse(localStorage.getItem('nexus_users')) || [];
    const current = users.find(u => u.id === currentUser.id);

    if (!current || !btn) return;

    const isFollowing = current.following?.includes(profileUserId);

    btn.textContent = isFollowing ? "Unfollow" : "Follow";
}

// Export (for feed.js use)
window.Interactions = {
    toggleLike
};
