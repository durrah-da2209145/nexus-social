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

        // FIX: Populate followers/following counts (elements exist in HTML but were never filled)
        const allUsers = JSON.parse(localStorage.getItem("nexus_users")) || [];
        const fullProfileUser = allUsers.find(u => u.id == profileUser.id);
        const followers = fullProfileUser?.followers || [];
        const following = fullProfileUser?.following || [];
        document.getElementById("profileFollowersCount").textContent = followers.length;
        document.getElementById("profileFollowingCount").textContent = following.length;

        const container = document.getElementById("userPostsContainer");
        container.innerHTML = "";

        if (userPosts.length === 0) {
            container.innerHTML = `<p style="color: gray;">No posts yet</p>`;
        } else {
            userPosts.forEach(post => {
                const date = new Date(post.createdAt);
                const formattedDate = date.toLocaleString(); // e.g., "3/26/2026, 4:15 PM"

                const div = document.createElement("div");
                div.className = "post";
                div.innerHTML = `
                    <p>${post.content}</p>
                 <small class="post-date">${formattedDate}</small>
                    
                `;
                container.appendChild(div);
            });
        }

        // Buttons show/hide
        const editBtn = document.getElementById("editProfileBtn");

        // FOLLOW BUTTON
        const followBtn = document.getElementById("followBtn");

        if (followBtn) {
            followBtn.addEventListener("click", () => {
                const currentUser = Storage.getCurrentUser();
                const profileUser = getProfileUser();

                if (!currentUser || !profileUser) return;

                // prevent self-follow
                if (currentUser.id === profileUser.id) {
                    alert("You cannot follow yourself");
                    return;
                }

                if (!currentUser.following) currentUser.following = [];

                const index = currentUser.following.indexOf(profileUser.id);

                if (index === -1) {
                    // FOLLOW
                    currentUser.following.push(profileUser.id);
                } else {
                    // UNFOLLOW
                    currentUser.following.splice(index, 1);
                }

                // update user in storage
                Storage.updateUser(currentUser);

                // IMPORTANT: also update currentUser in localStorage
                localStorage.setItem("currentUser", JSON.stringify(currentUser));

                updateFollowButton();
                updateFollowersCount();
            });
        }

        if (currentUser.id == profileUser.id) {
            editBtn.style.display = "block";
            followBtn.style.display = "none";
        } else {
            editBtn.style.display = "none";
            followBtn.style.display = "block";
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
        e.preventDefault(); // prevent form submission reload

        profileUser.username = document.getElementById("editUsername").value;
        profileUser.bio = document.getElementById("editBio").value;

        const uploadInput = document.getElementById("uploadProfilePic");

        // If a file is uploaded
        if (uploadInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                profileUser.profilePic = event.target.result; // Base64 image
                Storage.updateUser(profileUser);
                Storage.setCurrentUser(profileUser);

                document.getElementById("editProfileModal").style.display = "none";
                loadProfile();
            }
            reader.readAsDataURL(uploadInput.files[0]);
        } else {
            // No new image uploaded, just save username/bio
            Storage.updateUser(profileUser);
            Storage.setCurrentUser(profileUser);

            document.getElementById("editProfileModal").style.display = "none";
            loadProfile();
        }
    }

    function handleFollow() {
        const currentUser = Storage.getCurrentUser();
        const profileUser = getProfileUser(); // function you already use

        if (!currentUser || !profileUser) return;

        if (!currentUser.following) currentUser.following = [];

        const isFollowing = currentUser.following.includes(profileUser.id);

        if (isFollowing) {
            // UNFOLLOW
            currentUser.following = currentUser.following.filter(id => id !== profileUser.id);
        } else {
            // FOLLOW
            currentUser.following.push(profileUser.id);
        }

        // Save updated user
        Storage.updateUser(currentUser);

        // Update UI
        function updateFollowButton() {
            const currentUser = Storage.getCurrentUser();
            const profileUser = getProfileUser();
            const btn = document.getElementById("followBtn");

            if (!btn || !currentUser || !profileUser) return;

            // ❗ hide button if viewing your own profile
            if (currentUser.id === profileUser.id) {
                btn.style.display = "none";
                return;
            }

            const isFollowing = currentUser.following?.includes(profileUser.id);

            btn.textContent = isFollowing ? "Unfollow" : "Follow";
        }

        function updateFollowersCount() {
            const users = Storage.getUsers();
            const profileUser = getProfileUser();

            let count = 0;

            users.forEach(user => {
                if (user.following?.includes(profileUser.id)) {
                    count++;
                }
            });

            document.getElementById("profileFollowersCount").textContent = count;
        }
    }

    // ===== CLOSE MODAL =====
    function closeEditProfile() {
        document.getElementById("editProfileModal").style.display = "none";
    }

    // ===== BUTTON EVENTS =====
    document.addEventListener("DOMContentLoaded", () => {
        updateFollowButton();
        updateFollowersCount();
    });
    
    document.getElementById("editProfileBtn")
        ?.addEventListener("click", openEditProfile);

    document.getElementById("saveProfileBtn")
        ?.addEventListener("click", saveProfileEdit);

    document.getElementById("closeProfileBtn")
        ?.addEventListener("click", closeEditProfile);

    // ===== RUN =====
    loadProfile();

    // FIX: Wire up the follow button (setupFollowButton was defined but never called)
    setupFollowButton();
    
});