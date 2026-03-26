/**
 * Nexus Social - Storage Management
 */

// Define STORAGE_KEYS first (before it's used)
const STORAGE_KEYS = {
    USERS: 'nexus_users',
    CURRENT_USER: 'nexus_current_user',
    POSTS: 'nexus_posts'
};

// Initialize storage
function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([]));
    }
}

// Call initializeStorage after STORAGE_KEYS is defined
initializeStorage();

//  Add Followers/FollowingTO existing users ===== person 4
let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];

users = users.map(user => ({
    followers: [],
    following: [],
    ...user
}));////

localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
// User operations
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function createUser(userData) {
    const users = getUsers();
    
    if (users.some(u => u.email === userData.email)) {
        throw new Error('Email already registered');
    }
    
    if (users.some(u => u.username === userData.username)) {
        throw new Error('Username already taken');
    }
    
    const newUser = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        password: btoa(userData.password),
        bio: '',
        profilePic: '',
        // added by person 4
        followers: [],
        following: [], //
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

function validateUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) return null;
    if (user.password !== btoa(password)) return null;
    
    const { password: pwd, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

function findUserByEmail(email) {
    const users = getUsers();
    return users.find(u => u.email === email);
}

// Session management
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
}

function getCurrentUser() {
    const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
}

function isAuthenticated() {
    return getCurrentUser() !== null;
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}
//person 4 addition 
function getUserById(id) {
    const users = getUsers();
    return users.find(u => u.id == id);
}

function updateUser(updatedUser) {
    let users = getUsers();

    users = users.map(user => {
        if (user.id == updatedUser.id) {
            return { ...user, ...updatedUser };
        }
        return user;
    });

    saveUsers(users);
}
// POSTS OPERATIONS
function getPosts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS)) || [];
}

function savePosts(posts) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
}

function createPost(postData) {
    const posts = getPosts();
    
    const newPost = {
        id: Date.now().toString(),
        content: postData.content,
        authorId: postData.authorId,   // store user ID
        createdAt: new Date().toISOString()
    };
    
    posts.push(newPost);
    savePosts(posts);
    
    return newPost;
}

// Optional: get posts by user
function getPostsByUser(userId) {
    const posts = getPosts();
    return posts.filter(p => p.authorId === userId);
}
///
// Export
window.Storage = {
    createUser,
    validateUser,
    findUserByEmail,
    getCurrentUser,
    setCurrentUser,
    isAuthenticated,
    logout,
    getUserById,     // added by memeber 4
    updateUser,       // added ....
    getPosts,         // added ...
    savePosts,        // added ...
    createPost,       // added ...
    getPostsByUser
};