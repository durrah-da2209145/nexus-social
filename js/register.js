/**
 * Nexus Social - Registration Logic
 * Real-time validation with immediate feedback
 */

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const submitBtn = document.getElementById('submitBtn');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Real-time validation with debounce
    if (usernameInput) {
        usernameInput.addEventListener('input', debounce(function() {
            validateUsername();
            validateForm();
        }, 300));
        usernameInput.addEventListener('blur', validateUsername);
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', debounce(function() {
            validateEmail();
            validateForm();
        }, 500));
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordConditions();
            validatePasswordMatch();
            validateForm();
        });
    }
    
    if (confirmInput) {
        confirmInput.addEventListener('input', function() {
            validatePasswordMatch();
            validateForm();
        });
    }
    
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', validateForm);
    }
    
    // Password toggles
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirm = document.getElementById('toggleConfirmPassword');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }
    
    if (toggleConfirm && confirmInput) {
        toggleConfirm.addEventListener('click', function() {
            const type = confirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmInput.setAttribute('type', type);
        });
    }
});

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function validateUsername() {
    const username = document.getElementById('username').value.trim();
    
    if (username.length === 0) {
        hideFieldError('username');
        return false;
    }
    
    if (username.length < 3) {
        showFieldError('username', 'Username must be at least 3 characters');
        return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showFieldError('username', 'Only letters, numbers, and underscores');
        return false;
    }
    
    // Check if username exists in storage
    const users = getUsers();
    if (users.some(u => u.username === username)) {
        showFieldError('username', 'Username already taken');
        return false;
    }
    
    hideFieldError('username');
    return true;
}

function validateEmail() {
    const email = document.getElementById('email').value.trim();
    
    if (email.length === 0) {
        hideFieldError('email');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showFieldError('email', 'Please enter a valid email address');
        return false;
    }
    
    // Check if email exists in storage
    const users = getUsers();
    if (users.some(u => u.email === email)) {
        showFieldError('email', 'Email already registered');
        return false;
    }
    
    hideFieldError('email');
    return true;
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (confirmPassword.length === 0) {
        hideFieldError('confirm');
        return false;
    }
    
    if (password !== confirmPassword) {
        showFieldError('confirm', 'Passwords do not match');
        return false;
    }
    
    hideFieldError('confirm');
    return true;
}

function checkPasswordConditions() {
    const password = document.getElementById('password').value;
    
    const conditions = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Update condition checkmarks
    updateCondition('condLength', conditions.length);
    updateCondition('condUppercase', conditions.uppercase);
    updateCondition('condNumber', conditions.number);
    updateCondition('condSpecial', conditions.special);
    
    return Object.values(conditions).every(Boolean);
}

function updateCondition(elementId, isMet) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const checkSpan = element.querySelector('.condition-check');
    
    if (isMet) {
        element.classList.add('met');
        if (checkSpan) checkSpan.classList.add('met');
    } else {
        element.classList.remove('met');
        if (checkSpan) checkSpan.classList.remove('met');
    }
}

function validateForm() {
    const usernameValid = validateUsername();
    const emailValid = validateEmail();
    const passwordValid = checkPasswordConditions();
    const passwordsMatch = validatePasswordMatch();
    const termsChecked = document.getElementById('termsCheckbox').checked;
    const submitBtn = document.getElementById('submitBtn');
    
    // Enable button only if all conditions met
    if (usernameValid && emailValid && passwordValid && passwordsMatch && termsChecked) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Double-check all validations
    if (!validateUsername() || !validateEmail() || !checkPasswordConditions() || !validatePasswordMatch()) {
        alert('Please fix all validation errors before submitting.');
        return;
    }
    
    if (!document.getElementById('termsCheckbox').checked) {
        alert('You must agree to the Terms of Service');
        return;
    }
    
    try {
        // DIRECT creation - no Storage object
        const users = getUsers();
        
        // Double check for duplicates
        if (users.some(u => u.email === email)) {
            showFieldError('email', 'Email already registered');
            return;
        }
        
        if (users.some(u => u.username === username)) {
            showFieldError('username', 'Username already taken');
            return;
        }
        
        // Create new user object
        const newUser = {
            id: Date.now(),
            username: username,
            email: email,
            password: btoa(password), // Store in base64
            bio: '',
            profilePic: null,
            following: [],
            followers: [],
            createdAt: new Date().toISOString()
        };
        
        // Save to users array
        users.push(newUser);
        localStorage.setItem('nexus_users', JSON.stringify(users));
        
        // Create user object without password for current session
        const { password: _, ...userWithoutPassword } = newUser;
        
        // Save as current user
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        console.log('User registered successfully:', username);
        console.log('Saved to localStorage:', localStorage.getItem('currentUser'));
        
        // Redirect to feed
        window.location.href = 'feed.html';
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
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

// Helper function to get users
function getUsers() {
    return JSON.parse(localStorage.getItem('nexus_users')) || [];
}