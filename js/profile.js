document.addEventListener("DOMContentLoaded", () => {

    // ===== GET CURRENT USER =====
    const currentUser = Storage.getCurrentUser();

    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // ===== GET PROFILE USER ===
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get("id");

    let profileUser = profileId
        ? Storage.getUserById(profileId)
        : currentUser;

    if (!profileUser) return;

    // Helper function to get current profile user
    function getProfileUser() {
        const params = new URLSearchParams(window.location.search);
        const profileId = params.get("id");
        return profileId ? Storage.getUserById(profileId) : Storage.getCurrentUser();
    }

    // ===== UPDATE FOLLOW BUTTON STATE =====
    function updateFollowButton() {
        const currentUser = Storage.getCurrentUser();
        const profileUser = getProfileUser();
        const btn = document.getElementById("followBtn");

        if (!btn || !currentUser || !profileUser) return;

        // Hide button if viewing your own profile
        if (currentUser.id === profileUser.id) {
            btn.style.display = "none";
            return;
        }

        btn.style.display = "block";
        const isFollowing = currentUser.following?.includes(profileUser.id);
        btn.textContent = isFollowing ? "Unfollow" : "Follow";
    }

    // ===== UPDATE FOLLOWERS COUNT =====
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

    // ===== HANDLE FOLLOW/UNFOLLOW =====
    function handleFollow() {
        const currentUser = Storage.getCurrentUser();
        const profileUser = getProfileUser();

        if (!currentUser || !profileUser) return;

        // Prevent self-follow
        if (currentUser.id === profileUser.id) {
            alert("You cannot follow yourself");
            return;
        }

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
        updateFollowButton();
        updateFollowersCount();
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
       const res = await fetch(`/api/posts?userId=${profileUser.id}`);
       const userPosts = await res.json();
        document.getElementById("profilePostsCount").textContent = userPosts.length;

        // FIX: Populate followers/following counts (elements exist in HTML but were never filled)
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
                    let users = JSON.parse(localStorage.getItem("nexus_users")) || [];
                    let currentUser = Storage.getCurrentUser();

                    if (!currentUser.following) currentUser.following = [];

                    const index = currentUser.following.indexOf(profileUser.id);

                    if (index === -1) {
                        currentUser.following.push(profileUser.id);
                    } else {
                        currentUser.following.splice(index, 1);
                    }

                    //  SAVE PROPERLY
                    users = users.map(u => {
                        if (String(u.id) === String(currentUser.id)) {
                            return currentUser;
                        }
                        return u;
                    });

                    localStorage.setItem("nexus_users", JSON.stringify(users));
                    localStorage.setItem("currentUser", JSON.stringify(currentUser));

                    loadProfile();
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

    //  OPEN MODAL 
    function openEditProfile() {
        document.getElementById("editUsername").value = profileUser.username;
        document.getElementById("editBio").value = profileUser.bio || "";

        document.getElementById("editProfileModal").style.display = "flex";
    }

  // SAVE EDIT 
    function saveProfileEdit(e) {
        e.preventDefault(); // prevent form submission reload

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

                let users = Storage.getUsers();

                users = users.map(u => {
                    if (u.id === profileUser.id) {
                        return profileUser; // keep full object
                    }
                    return u;
                });

                Storage.saveUsers(users);

                const currentUser = Storage.getCurrentUser();

                if (currentUser && currentUser.id === profileUser.id) {
                    localStorage.setItem("currentUser", JSON.stringify(profileUser));
                }

                document.getElementById("editProfileModal").style.display = "none";
                loadProfile();
            }
            reader.readAsDataURL(uploadInput.files[0]);
        } else {
            let users = Storage.getUsers();

            users = users.map(u => {
                if (u.id === profileUser.id) {
                    return profileUser; // keep full object
                }
                return u;
            });

            Storage.saveUsers(users);

            const currentUser = Storage.getCurrentUser();

            if (currentUser && currentUser.id === profileUser.id) {
                localStorage.setItem("currentUser", JSON.stringify(profileUser));
            }

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

    //  CLOSE MODAL =
    function closeEditProfile() {
        document.getElementById("editProfileModal").style.display = "none";
    }
    
    document.getElementById("editProfileBtn")
        ?.addEventListener("click", openEditProfile);

    document.getElementById("saveProfileBtn")
        ?.addEventListener("click", saveProfileEdit);

    document.getElementById("closeProfileBtn")
        ?.addEventListener("click", closeEditProfile);

    // RUN 
    loadProfile();

    document.getElementById("profileFollowersCount")
        ?.addEventListener("click", () => openFollowModal("followers"));

    document.getElementById("profileFollowingCount")
        ?.addEventListener("click", () => openFollowModal("following"));

    document.getElementById("closeFollowModal")
        ?.addEventListener("click", () => {
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

    console.log("PROFILE USER:", profileUser);
    console.log("FOLLOWING:", profileUser.following);
    console.log("ALL USERS:", users);

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
                li.textContent = user.username;
                list.appendChild(li);
            }
        });
    }

    if (type === "followers") {
        title.textContent = "Followers";

        users.forEach(user => {
            if (user.following?.map(String).includes(String(profileUser.id))) {
                const li = document.createElement("li");
                li.textContent = user.username;
                list.appendChild(li);
            }
        });
    }

    modal.style.display = "flex";
}