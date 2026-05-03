/**
 * Nexus Social - Login Logic (FINAL FIXED)
 */

document.addEventListener('DOMContentLoaded', function () {
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
        emailInput.addEventListener('input', () => hideFieldError('email'));
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => hideFieldError('password'));
    }

    // Toggle password
    const togglePassword = document.getElementById('togglePassword');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type =
                passwordInput.getAttribute('type') === 'password'
                    ? 'text'
                    : 'password';

            passwordInput.setAttribute('type', type);

            const eyeSlash = this.querySelector('#eyeSlash');
            if (eyeSlash) {
                eyeSlash.style.display = type === 'password' ? 'none' : 'block';
            }
        });
    }
});


// ✅ MAIN LOGIN FUNCTION (API VERSION)
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    hideFieldError('email');
    hideFieldError('password');

    let hasError = false;

    if (!email) {
        showFieldError('email', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showFieldError('email', 'Invalid email');
        hasError = true;
    }

    if (!password) {
        showFieldError('password', 'Password is required');
        hasError = true;
    }

    if (hasError) return;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showFieldError('password', data.error || 'Login failed');
            return;
        }

        // ✅ Save user
        localStorage.setItem('currentUser', JSON.stringify(data));

        // ✅ Redirect
        window.location.href = 'feed.html';

    } catch (error) {
        console.error('Login error:', error);
        alert('Something went wrong');
    }
}


// ❌ REMOVED localStorage validation completely
// NO validateUserDirect
// NO users array
// NO atob


function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function showFieldError(fieldId, message) {
    const error = document.getElementById(fieldId + 'Error');
    if (error) {
        error.textContent = message;
        error.classList.remove('hidden');
    }
}


function hideFieldError(fieldId) {
    const error = document.getElementById(fieldId + 'Error');
    if (error) {
        error.classList.add('hidden');
    }
}


// ⚠️ Optional (can keep simple)
function handleForgotPassword(e) {
    e.preventDefault();
    alert('Contact admin to reset password');
}