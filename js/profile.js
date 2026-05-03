/**
 * Nexus Social - Profile Page
 */

document.addEventListener("DOMContentLoaded", () => {
    // ===== GET CURRENT USER =====
    const currentUser = getCurrentUserSafe();
    
    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    // ===== LOAD PROFILE =====
    loadProfile();
    
    // ===== SETUP EVENT LISTENERS =====
    document.getElementById("editProfileBtn")?.addEventListener("click", openEditProfile);
    document.getElementById("saveProfileBtn")?.addEventListener("click", saveProfileEdit);
    document.getElementById("closeProfileBtn")?.addEventListener("click", closeEditProfile);
    document.getElementById("profileFollowersCount")?.addEventListener("click", () => openFollowModal("followers"));
    document.getElementById("profileFollowingCount")?.addEventListener("click", () => openFollowModal("following"));
    document.getElementById("closeFollowModal")?.addEventListener("click", () => {
        document.getElementById("followModal").style.display = "none";
    });
    
    // Setup post creation
    setupProfilePostCreation();
});

function getCurrentUserSafe() {
    try {
        const user = localStorage.getItem('currentUser');
        if (!user || user === 'null' || user === 'undefined') return null;
        return JSON.parse(user);
    } catch(e) {
        console.error('Error getting user:', e);
        return null;
    }
}

function getProfileUser() {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get("id");
    const currentUser = getCurrentUserSafe();
    
    if (profileId) {
        const users = JSON.parse(localStorage.getItem("nexus_users")) || [];
        const profileUser = users.find(u => String(u.id) === String(profileId));
        return profileUser || currentUser;
    }
    return currentUser;
}

function loadProfile() {
    const profileUser = getProfileUser();
    const currentUser = getCurrentUserSafe();
    
    if (!profileUser) return;

    // Update profile info
    const usernameEl = document.getElementById("profileUsername");
    const bioEl = document.getElementById("profileBio");
    const avatarEl = document.getElementById("profileAvatar");
    
    if (usernameEl) usernameEl.textContent = profileUser.username;
    if (bioEl) bioEl.textContent = profileUser.bio || "This user hasn't added a bio yet.";

    // Avatar
    if (avatarEl) {
        if (profileUser.profilePic) {
            avatarEl.style.backgroundImage = `url(${profileUser.profilePic})`;
            avatarEl.style.backgroundSize = "cover";
            avatarEl.textContent = "";
        } else {
            avatarEl.style.backgroundImage = "";
            avatarEl.textContent = profileUser.username[0].toUpperCase();
        }
    }

    // Posts
    const posts = JSON.parse(localStorage.getItem("nexus_posts")) || [];
    const userPosts = posts.filter(p => (p.userId == profileUser.id || p.authorId == profileUser.id));
    const postsCountEl = document.getElementById("profilePostsCount");
    if (postsCountEl) postsCountEl.textContent = userPosts.length;

    // Update followers count
    updateFollowersCount();
    updateFollowingCount();

    // Display posts
    const container = document.getElementById("userPostsContainer");
    if (container) {
        container.innerHTML = "";

        if (userPosts.length === 0) {
            container.innerHTML = `<p style="color: gray;">No posts yet</p>`;
        } else {
            userPosts.forEach(post => {
                const date = new Date(post.createdAt);
                const formattedDate = date.toLocaleString();
                const div = document.createElement("div");
                div.className = "profile-post-card";
                div.innerHTML = `
                    <p>${escapeHtml(post.content)}</p>
                    <small class="post-date">${formattedDate}</small>
                    ${currentUser && currentUser.id == profileUser.id ? `<button class="delete-post-btn" data-post-id="${post.id}">Delete Post</button>` : ''}
                `;
                container.appendChild(div);
            });
            
            // Delete post functionality
            document.querySelectorAll('.delete-post-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const postId = btn.getAttribute('data-post-id');
                    if (confirm('Delete this post?')) {
                        deletePost(postId);
                    }
                });
            });
        }
    }

    // Buttons show/hide
    const editBtn = document.getElementById("editProfileBtn");
    const followBtn = document.getElementById("followBtn");

    if (currentUser && currentUser.id == profileUser.id) {
        if (editBtn) editBtn.style.display = "block";
        if (followBtn) followBtn.style.display = "none";
    } else {
        if (editBtn) editBtn.style.display = "none";
        if (followBtn) {
            followBtn.style.display = "block";
            updateFollowButton();
            // Remove old listener and add new one
            const newFollowBtn = followBtn.cloneNode(true);
            followBtn.parentNode.replaceChild(newFollowBtn, followBtn);
            newFollowBtn.addEventListener("click", handleFollow);
        }
    }
}

function updateFollowersCount() {
    const users = JSON.parse(localStorage.getItem("nexus_users")) || [];
    const profileUser = getProfileUser();
    
    if (!profileUser) return;
    
    let followersCount = 0;
    users.forEach(user => {
        if (user.following && user.following.includes(profileUser.id)) {
            followersCount++;
        }
    });
    
    const followersElement = document.getElementById("profileFollowersCount");
    if (followersElement) {
        followersElement.textContent = followersCount;
    }
}

function updateFollowingCount() {
    const profileUser = getProfileUser();
    if (!profileUser) return;
    
    let followingCount = profileUser.following ? profileUser.following.length : 0;
    
    const followingElement = document.getElementById("profileFollowingCount");
    if (followingElement) {
        followingElement.textContent = followingCount;
    }
}

function updateFollowButton() {
    const currentUser = getCurrentUserSafe();
    const profileUser = getProfileUser();
    const btn = document.getElementById("followBtn");

    if (!btn || !currentUser || !profileUser) return;

    if (currentUser.id === profileUser.id) {
        btn.style.display = "none";
        return;
    }

    btn.style.display = "block";
    const isFollowing = currentUser.following?.includes(profileUser.id);
    btn.textContent = isFollowing ? "Unfollow" : "Follow";
}

function handleFollow() {
    const currentUser = getCurrentUserSafe();
    const profileUser = getProfileUser();

    if (!currentUser || !profileUser) return;
    
    if (currentUser.id === profileUser.id) {
        alert("You cannot follow yourself");
        return;
    }

    if (!currentUser.following) currentUser.following = [];

    const isFollowing = currentUser.following.includes(profileUser.id);
    
    if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id !== profileUser.id);
    } else {
        currentUser.following.push(profileUser.id);
    }

    // Update users array
    let users = JSON.parse(localStorage.getItem("nexus_users")) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
    }

    localStorage.setItem("nexus_users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    updateFollowButton();
    updateFollowersCount();
    updateFollowingCount();
}

function setupProfilePostCreation() {
    const submitBtn = document.getElementById('submitPostBtn');
    const textarea = document.getElementById('newPostContent');
    
    if (!submitBtn || !textarea) return;
    
    // Remove existing listeners to avoid duplicates
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    newSubmitBtn.addEventListener('click', function() {
        const content = textarea.value.trim();
        
        if (!content) {
            alert('Please enter some content for your post.');
            return;
        }
        
        const currentUser = getCurrentUserSafe();
        if (!currentUser) {
            alert('You must be logged in to post.');
            window.location.href = 'index.html';
            return;
        }
        
        let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
        
        const newPost = {
            id: Date.now().toString(),
            userId: currentUser.id,
            authorId: currentUser.id,
            username: currentUser.username,
            authorName: currentUser.username,
            content: content,
            createdAt: Date.now(),
            likes: [],
            comments: []
        };
        
        posts.unshift(newPost);
        localStorage.setItem('nexus_posts', JSON.stringify(posts));
        
        textarea.value = '';
        loadProfile();
        alert('Post created successfully!');
    });
}

function deletePost(postId) {
    let posts = JSON.parse(localStorage.getItem('nexus_posts')) || [];
    posts = posts.filter(p => p.id != postId);
    localStorage.setItem('nexus_posts', JSON.stringify(posts));
    loadProfile();
}

function openEditProfile() {
    const profileUser = getProfileUser();
    document.getElementById("editUsername").value = profileUser.username;
    document.getElementById("editBio").value = profileUser.bio || "";
    document.getElementById("editProfileModal").style.display = "flex";
}

function saveProfileEdit(e) {
    e.preventDefault();
    
    const profileUser = getProfileUser();
    const newUsername = document.getElementById("editUsername").value;
    const newBio = document.getElementById("editBio").value;
    
    profileUser.username = newUsername;
    profileUser.bio = newBio;
    
    const uploadInput = document.getElementById("uploadProfilePic");

    if (uploadInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            profileUser.profilePic = event.target.result;
            saveUserAndUpdate(profileUser);
            document.getElementById("editProfileModal").style.display = "none";
            loadProfile();
        }
        reader.readAsDataURL(uploadInput.files[0]);
    } else {
        saveUserAndUpdate(profileUser);
        document.getElementById("editProfileModal").style.display = "none";
        loadProfile();
    }
}

function saveUserAndUpdate(updatedUser) {
    let users = JSON.parse(localStorage.getItem('nexus_users')) || [];
    users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem('nexus_users', JSON.stringify(users));

    const currentUser = getCurrentUserSafe();
    if (currentUser && currentUser.id === updatedUser.id) {
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    }
}

function closeEditProfile() {
    document.getElementById("editProfileModal").style.display = "none";
}

function openFollowModal(type) {
    const users = JSON.parse(localStorage.getItem("nexus_users")) || [];
    const profileUser = getProfileUser();
    const currentUser = getCurrentUserSafe();

    const modal = document.getElementById("followModal");
    const list = document.getElementById("followModalList");
    const title = document.getElementById("followModalTitle");

    if (!modal || !list) return;

    list.innerHTML = "";

    if (type === "following") {
        if (title) title.textContent = "Following";
        const followingIds = profileUser.following || [];
        
        if (followingIds.length === 0) {
            list.innerHTML = '<li style="color: gray;">Not following anyone yet</li>';
        } else {
            followingIds.forEach(id => {
                const user = users.find(u => String(u.id) === String(id));
                if (user) {
                    const li = document.createElement("li");
                    li.style.padding = "10px";
                    li.style.borderBottom = "1px solid var(--border-color)";
                    li.innerHTML = `<strong>${escapeHtml(user.username)}</strong>`;
                    list.appendChild(li);
                }
            });
        }
    }

    if (type === "followers") {
        if (title) title.textContent = "Followers";
        const followers = users.filter(user => user.following && user.following.includes(profileUser.id));
        
        if (followers.length === 0) {
            list.innerHTML = '<li style="color: gray;">No followers yet</li>';
        } else {
            followers.forEach(user => {
                const li = document.createElement("li");
                li.style.padding = "10px";
                li.style.borderBottom = "1px solid var(--border-color)";
                li.innerHTML = `<strong>${escapeHtml(user.username)}</strong>`;
                list.appendChild(li);
            });
        }
    }

    modal.style.display = "flex";
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