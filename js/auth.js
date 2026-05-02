/**
 * Nexus Social - Shared Auth Functions
 */

function showError(message) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = 'alert alert-error';
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = Storage.isAuthenticated();
    
    // Redirect if trying to access protected pages
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['feed.html', 'profile.html', 'post.html'];
    
    if (protectedPages.includes(currentPage) && !isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    // FIX: Wire up the logout button (was defined in HTML but never had a listener)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            Storage.logout();
            window.location.href = 'index.html';
        });
    }
});