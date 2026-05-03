/**
 * Nexus Social - Login Logic
 */

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const forgotLink = document.getElementById('forgotPassword');
    if (forgotLink) {
        forgotLink.addEventListener('click', handleForgotPassword);
    }
    
    // Clear errors on input
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            hideFieldError('email');
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            hideFieldError('password');
        });
    }
    
    // Password toggle
    const togglePassword = document.getElementById('togglePassword');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const eyeSlash = this.querySelector('#eyeSlash');
            if (eyeSlash) {
                eyeSlash.style.display = type === 'password' ? 'none' : 'block';
            }
        });
    }
});

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;
    
    // Clear all errors
    hideFieldError('email');
    hideFieldError('password');
    
    let hasError = false;
    
    if (!email) {
        showFieldError('email', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        hasError = true;
    }
    
    if (!password) {
        showFieldError('password', 'Password is required');
        hasError = true;
    }
    
    if (hasError) return;
    
    // DIRECT access to localStorage - no Storage object
    const user = validateUserDirect(email, password);
    
    if (user) {
        // DIRECT save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log('User logged in successfully:', user.username);
        console.log('Saved to localStorage:', localStorage.getItem('currentUser'));
        
        // Redirect to feed
        window.location.href = 'feed.html';
    } else {
        showFieldError('password', 'Invalid email or password');
    }
}

// Direct validation function without using Storage object
function validateUserDirect(email, password) {
    const users = JSON.parse(localStorage.getItem('nexus_users')) || [];
    
    console.log('Looking for user with email:', email);
    console.log('Total users in system:', users.length);
    
    // Find user by email
    const user = users.find(u => u.email === email);
    
    if (!user) {
        console.log('User not found with email:', email);
        return null;
    }
    
    // Decode password (since it's stored in base64)
    let decodedPassword = user.password;
    try {
        decodedPassword = atob(user.password);
    } catch(e) {
        // If not base64, use as is
        decodedPassword = user.password;
    }
    
    console.log('Password match:', decodedPassword === password);
    
    if (decodedPassword === password) {
        // Return user without the password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    
    return null;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        
        // Add error styling to input
        const input = document.getElementById(fieldId);
        if (input) {
            input.style.borderColor = 'var(--error-red)';
        }
    }
}

function hideFieldError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.classList.add('hidden');
        
        // Remove error styling from input
        const input = document.getElementById(fieldId);
        if (input) {
            input.style.borderColor = '';
        }
    }
}

function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = prompt('Enter your email address:');
    if (!email) return;
    
    const users = JSON.parse(localStorage.getItem('nexus_users')) || [];
    const user = users.find(u => u.email === email);
    
    if (user) {
        let password = user.password;
        try {
            password = atob(user.password);
        } catch(e) {
            password = user.password;
        }
        alert(`Your password is: ${password}`);
    } else {
        alert('No account found with that email');
    }
}