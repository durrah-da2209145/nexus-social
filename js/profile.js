document.addEventListener("DOMContentLoaded", () => {

    // ===== GET CURRENT USER =====
    const currentUser = Storage.getCurrentUser();

    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // ===== GET PROFILE USER =====
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get("id");

    let profileUser = profileId
        ? Storage.getUserById(profileId)
        : currentUser;

    if (!profileUser) return;

    // ===== GET PROFILE USER - Helper function =====
    function getProfileUser() {
        const params = new URLSearchParams(window.location.search);
        const profileId = params.get("id");
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (profileId) {
            const users = JSON.parse(localStorage.getItem('nexus_users')) || [];
            return users.find(u => String(u.id) === String(profileId));
        }
        return currentUser;
    }

    // ===== UPDATE FOLLOW BUTTON STATE - FIXED =====
    function updateFollowButton() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const profileUser = getProfileUser();
        const btn = document.getElementById("followBtn");

        if (!btn || !currentUser || !profileUser) return;

        // Hide button if viewing your own profile
        if (currentUser.id === profileUser.id) {
            btn.style.display = "none";
            return;
        }

        btn.style.display = "block";
        
        // Initialize following array if it doesn't exist
        if (!currentUser.following) {
            currentUser.following = [];
        }
        
        const isFollowing = currentUser.following.includes(profileUser.id);
        btn.textContent = isFollowing ? "Unfollow" : "Follow";
        
        // Update button style based on state
        if (isFollowing) {
            btn.style.background = "linear-gradient(135deg, #dc3545, #c82333)";
            btn.style.border = "none";
        } else {
            btn.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
            btn.style.border = "none";
        }
    }

    // ===== UPDATE FOLLOWERS COUNT - FIXED =====
    function updateFollowersCount() {
        const users = JSON.parse(localStorage.getItem('nexus_users')) || [];
        const profileUser = getProfileUser();
        
        if (!profileUser) return;
        
        // Count how many users have this profile user in their following array
        let followersCount = 0;
        users.forEach(user => {
            if (user.following && user.following.includes(profileUser.id)) {
                followersCount++;
            }
        });
        
        // Also check if the profile user has followers array (backward compatibility)
        if (profileUser.followers) {
            followersCount = profileUser.followers.length;
        }
        
        const followersElement = document.getElementById("profileFollowersCount");
        if (followersElement) {
            followersElement.textContent = followersCount;
        }
        
        return followersCount;
    }

    // ===== UPDATE FOLLOWING COUNT - FIXED =====
    function updateFollowingCount() {
        const profileUser = getProfileUser();
        
        if (!profileUser) return;
        
        let followingCount = 0;
        if (profileUser.following) {
            followingCount = profileUser.following.length;
        }
        
        const followingElement = document.getElementById("profileFollowingCount");
        if (followingElement) {
            followingElement.textContent = followingCount;
        }
        
        return followingCount;
    }

    // ===== HANDLE FOLLOW/UNFOLLOW - FIXED =====
    function handleFollow() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const profileUser = getProfileUser();

        if (!currentUser || !profileUser) {
            console.error('Missing user data');
            return;
        }

        // Prevent self-follow
        if (currentUser.id === profileUser.id) {
            alert("You cannot follow yourself");
            return;
        }

        // Initialize following array if it doesn't exist
        if (!currentUser.following) {
            currentUser.following = [];
        }

        // Check if already following
        const isFollowing = currentUser.following.includes(profileUser.id);
        
        let users = JSON.parse(localStorage.getItem('nexus_users')) || [];

        if (isFollowing) {
            // UNFOLLOW - Remove from current user's following
            currentUser.following = currentUser.following.filter(id => id !== profileUser.id);
            
            // Also remove from profile user's followers (if exists)
            const profileUserIndex = users.findIndex(u => u.id === profileUser.id);
            if (profileUserIndex !== -1 && users[profileUserIndex].followers) {
                users[profileUserIndex].followers = users[profileUserIndex].followers.filter(id => id !== currentUser.id);
            }
            
            console.log(`Unfollowed user: ${profileUser.username}`);
        } else {
            // FOLLOW - Add to current user's following
            currentUser.following.push(profileUser.id);
            
            // Also add to profile user's followers (if exists, or create it)
            const profileUserIndex = users.findIndex(u => u.id === profileUser.id);
            if (profileUserIndex !== -1) {
                if (!users[profileUserIndex].followers) {
                    users[profileUserIndex].followers = [];
                }
                if (!users[profileUserIndex].followers.includes(currentUser.id)) {
                    users[profileUserIndex].followers.push(currentUser.id);
                }
            }
            
            console.log(`Followed user: ${profileUser.username}`);
        }

        // Update current user in users array
        const currentUserIndex = users.findIndex(u => u.id === currentUser.id);
        if (currentUserIndex !== -1) {
            users[currentUserIndex] = currentUser;
        }

        // Save everything back to localStorage
        localStorage.setItem('nexus_users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update UI
        updateFollowButton();
        updateFollowersCount();
        updateFollowingCount();
        
        // Also update sidebar if needed
        if (typeof loadSidebarData === 'function') {
            loadSidebarData();
        }
    }


    // ===== LOAD PROFILE =====
    function loadProfile() {

        document.getElementById("profileUsername").textContent = profileUser.username;
        document.getElementById("profileBio").textContent =
            profileUser.bio || "This user hasn't added a bio yet.";

        // Avatar
        const avatar = document.getElementById("profileAvatar");

        if (profileUser.profilePic) {
            avatar.style.backgroundImage = `url(${profileUser.profilePic})`;
            avatar.style.backgroundSize = "cover";
            avatar.textContent = "";
        } else {
            avatar.style.backgroundImage = "";
            avatar.textContent = profileUser.username[0].toUpperCase();
        }

        // Posts
        const posts = JSON.parse(localStorage.getItem("nexus_posts")) || [];
        const userPosts = posts.filter(p => (p.userId == profileUser.id || p.authorId == profileUser.id));

        document.getElementById("profilePostsCount").textContent = userPosts.length;

        // Populate followers/following counts
        const allUsers = JSON.parse(localStorage.getItem("nexus_users")) || [];
        const fullProfileUser = allUsers.find(u => u.id == profileUser.id);
        const following = fullProfileUser?.following || [];

        let followersCount = 0;
        allUsers.forEach(user => {
            if (user.following?.includes(profileUser.id)) {
                followersCount++;
            }
        });

        document.getElementById("profileFollowersCount").textContent = followersCount;
        document.getElementById("profileFollowingCount").textContent = following.length;

        const container = document.getElementById("userPostsContainer");
        container.innerHTML = "";

        if (userPosts.length === 0) {
            container.innerHTML = `<p style="color: gray;">No posts yet</p>`;
        } else {
            userPosts.forEach(post => {
                const date = new Date(post.createdAt);
                const formattedDate = date.toLocaleString();

                const div = document.createElement("div");
                div.className = "post";
                div.innerHTML = `
                    <p>${post.content}</p>
                    <small class="post-date">${formattedDate}</small>
                    ${currentUser.id == profileUser.id ? `<button class="delete-post-btn" data-post-id="${post.id}">Delete Post</button>` : ''}
                `;
                container.appendChild(div);
            });

            // Add delete post functionality
            document.querySelectorAll('.delete-post-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const postId = parseInt(btn.dataset.postId);
                    deletePost(postId);
                });
            });
        }

        // Buttons show/hide
        const editBtn = document.getElementById("editProfileBtn");
        const followBtn = document.getElementById("followBtn");

        if (currentUser.id == profileUser.id) {
            editBtn.style.display = "block";
            followBtn.style.display = "none";
        } else {
            editBtn.style.display = "none";
            followBtn.style.display = "block";
            updateFollowButton();
        }

        // Follow button event listener
        if (followBtn) {
            // Remove existing listener to avoid duplicates
            const newFollowBtn = followBtn.cloneNode(true);
            followBtn.parentNode.replaceChild(newFollowBtn, followBtn);
            newFollowBtn.addEventListener("click", handleFollow);
        }
    }

    // ===== DELETE POST FUNCTION =====
    function deletePost(postId) {
        if (confirm("Are you sure you want to delete this post?")) {
            let posts = JSON.parse(localStorage.getItem("nexus_posts")) || [];
            posts = posts.filter(post => post.id !== postId);
            localStorage.setItem("nexus_posts", JSON.stringify(posts));
            loadProfile(); // Reload profile to refresh posts
        }
    }

    // ===== DELETE COMMENT FUNCTION =====
    function deleteComment(postId, commentId) {
        if (confirm("Are you sure you want to delete this comment?")) {
            let posts = JSON.parse(localStorage.getItem("nexus_posts")) || [];
            const postIndex = posts.findIndex(post => post.id === postId);
            
            if (postIndex !== -1 && posts[postIndex].comments) {
                posts[postIndex].comments = posts[postIndex].comments.filter(comment => comment.id !== commentId);
                localStorage.setItem("nexus_posts", JSON.stringify(posts));
                loadProfile(); // Reload to refresh
            }
        }
    }

    // ===== CREATE POST FUNCTION =====
    function createPost(content) {
        if (!content.trim()) {
            alert("Post content cannot be empty!");
            return;
        }

        const posts = JSON.parse(localStorage.getItem("nexus_posts")) || [];
        const newPost = {
            id: Date.now(),
            content: content,
            userId: currentUser.id,
            authorId: currentUser.id,
            authorName: currentUser.username,
            createdAt: new Date().toISOString(),
            comments: [],
            likes: []
        };

        posts.unshift(newPost); // Add to beginning
        localStorage.setItem("nexus_posts", JSON.stringify(posts));
        
        // Reload profile to show new post
        loadProfile();
        
        // Also update feed if on feed page
        if (window.location.pathname.includes("feed.html")) {
            location.reload();
        }
    }

    // ===== OPEN MODAL =====
    function openEditProfile() {
        document.getElementById("editUsername").value = profileUser.username;
        document.getElementById("editBio").value = profileUser.bio || "";

        document.getElementById("editProfileModal").style.display = "flex";
    }

    // ===== SAVE EDIT =====
    function saveProfileEdit(e) {
        e.preventDefault();

        const newUsername = document.getElementById("editUsername").value;
        const newBio = document.getElementById("editBio").value;

        profileUser.username = newUsername;
        profileUser.bio = newBio;

        const uploadInput = document.getElementById("uploadProfilePic");

        // If a file is uploaded
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
        let users = Storage.getUsers();
        users = users.map(u => {
            if (u.id === updatedUser.id) {
                return updatedUser;
            }
            return u;
        });
        Storage.saveUsers(users);

        const currentUser = Storage.getCurrentUser();
        if (currentUser && currentUser.id === updatedUser.id) {
            localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        }
    }

    // ===== CLOSE MODAL =====
    function closeEditProfile() {
        document.getElementById("editProfileModal").style.display = "none";
    }

    // Add post creation UI to profile page
    function addPostCreationForm() {
        const container = document.getElementById("userPostsContainer");
        const formHTML = `
            <div class="create-post-section">
                <textarea id="newPostContent" placeholder="What's on your mind?" rows="3"></textarea>
                <button id="submitPostBtn" class="post-btn">Create Post</button>
            </div>
            <hr>
        `;
        
        // Only show post creation form on user's own profile
        if (currentUser.id === profileUser.id) {
            container.insertAdjacentHTML('beforebegin', formHTML);
            document.getElementById("submitPostBtn")?.addEventListener("click", () => {
                const content = document.getElementById("newPostContent").value;
                createPost(content);
                document.getElementById("newPostContent").value = "";
            });
        }
    }

    // Event listeners
    document.getElementById("editProfileBtn")?.addEventListener("click", openEditProfile);
    document.getElementById("saveProfileBtn")?.addEventListener("click", saveProfileEdit);
    document.getElementById("closeProfileBtn")?.addEventListener("click", closeEditProfile);

    // Run
    loadProfile();
    addPostCreationForm();

    document.getElementById("profileFollowersCount")?.addEventListener("click", () => openFollowModal("followers"));
    document.getElementById("profileFollowingCount")?.addEventListener("click", () => openFollowModal("following"));

    document.getElementById("closeFollowModal")?.addEventListener("click", () => {
        document.getElementById("followModal").style.display = "none";
    });

});

function openFollowModal(type) {
    const users = JSON.parse(localStorage.getItem("nexus_users")) || [];
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get("id");
    const currentUser = Storage.getCurrentUser();

    const profileUser = profileId
        ? Storage.getUserById(profileId)
        : currentUser;

    const modal = document.getElementById("followModal");
    const list = document.getElementById("followModalList");
    const title = document.getElementById("followModalTitle");

    list.innerHTML = "";

    if (type === "following") {
        title.textContent = "Following";
        (profileUser.following || []).forEach(id => {
            const user = users.find(u => String(u.id) === String(id));
            if (user) {
                const li = document.createElement("li");
                li.innerHTML = `
                    <span>${user.username}</span>
                    <button class="view-profile-btn" data-user-id="${user.id}">View Profile</button>
                `;
                list.appendChild(li);
            }
        });
    }

    if (type === "followers") {
        title.textContent = "Followers";
        users.forEach(user => {
            if (user.following?.map(String).includes(String(profileUser.id))) {
                const li = document.createElement("li");
                li.innerHTML = `
                    <span>${user.username}</span>
                    <button class="view-profile-btn" data-user-id="${user.id}">View Profile</button>
                `;
                list.appendChild(li);
            }
        });
    }

    // Add click handlers for view profile buttons
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.userId;
            window.location.href = `profile.html?id=${userId}`;
        });
    });

    modal.style.display = "flex";
}

if (typeof Storage === 'undefined') {
    window.Storage = {
        getCurrentUser: () => JSON.parse(localStorage.getItem("currentUser")),
        getUserById: (id) => {
            const users = JSON.parse(localStorage.getItem("nexus_users")) || [];
            return users.find(u => String(u.id) === String(id));
        },
        getUsers: () => JSON.parse(localStorage.getItem("nexus_users")) || [],
        saveUsers: (users) => localStorage.setItem("nexus_users", JSON.stringify(users)),
        updateUser: (updatedUser) => {
            let users = JSON.parse(localStorage.getItem("nexus_users")) || [];
            users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
            localStorage.setItem("nexus_users", JSON.stringify(users));
            if (Storage.getCurrentUser()?.id === updatedUser.id) {
                localStorage.setItem("currentUser", JSON.stringify(updatedUser));
            }
        }
    };
}