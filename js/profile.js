/**
 * Nexus Social - Profile Management
 * MEMBER 4: Implement all profile functionality
 * 
 * TODO:
 * - Display user profile
 * - Edit profile (bio, profile pic)
 * - Show user's posts
 * - Handle follow button (integrate with Member 3)
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('MEMBER 4: Implement profile.js');

    //member 3 follow button
    const followBtn = document.getElementById("followBtn");

    const params = new URLSearchParams(window.location.search);
    const profileUserId = params.get("id");

    const currentUser = Storage.getCurrentUser();

    if (!followBtn) return;

    // Hide follow button if viewing own profile or no profile ID
    if (!profileUserId || profileUserId === currentUser.id) {
        followBtn.style.display = "none";
    } else {
        followBtn.style.display = "inline-block";

        updateFollowButton(profileUserId);

        followBtn.onclick = () => toggleFollow(profileUserId);
    }
});