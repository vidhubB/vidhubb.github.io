// ============================================
// VidHub - Main JavaScript File
// Handles theme, header, sidebar, and utilities
// ============================================

// ============================================
// THEME MANAGEMENT
// ============================================

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    loadHeader();
}

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

// ============================================
// AUTHENTICATION HELPERS
// ============================================

function checkAuth() {
    const userId = localStorage.getItem('userId');
    return userId !== null && userId !== 'undefined' && userId !== '';
}

async function logout() {
    try {
        await supabase.auth.signOut();
    } catch (err) {
        console.error('Sign out error:', err);
    }
    
    localStorage.removeItem('userId');
    localStorage.removeItem('channelName');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
}

async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
            localStorage.setItem('userId', session.user.id);
            localStorage.setItem('userEmail', session.user.email);
            
            const { data: profile } = await supabase
                .from('users')
                .select('channel_name')
                .eq('id', session.user.id)
                .single();
            
            if (profile) {
                localStorage.setItem('channelName', profile.channel_name);
            }
            
            return true;
        }
        return false;
    } catch (err) {
        console.error('Session check error:', err);
        return false;
    }
}

// ============================================
// HEADER LOADING
// ============================================

async function loadHeader() {
    const headerElement = document.getElementById('header');
    if (!headerElement) return;

    try {
        const response = await fetch('components/header.html');
        if (!response.ok) throw new Error('Failed to load header');
        
        const html = await response.text();
        headerElement.innerHTML = html;

        // Set theme icon
        const themeBtn = headerElement.querySelector('.theme-btn');
        if (themeBtn) {
            themeBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
        }

        // Add dynamic auth buttons
        const authDiv = document.getElementById('header-auth-buttons');
        if (authDiv) {
            const isLoggedIn = checkAuth();
            if (isLoggedIn) {
                authDiv.innerHTML = `
                    <a href="upload.html" class="upload-btn">Upload</a>
                    <a href="library.html" class="library-btn">Library</a>
                    <button class="logout-btn" onclick="logout()">Logout</button>
                `;
            } else {
                authDiv.innerHTML = `
                    <a href="login.html" class="login-btn">Login</a>
                `;
            }
        }

        // Attach search form handler
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            });
        }
    } catch (error) {
        console.error('Error loading header:', error);
        // Fallback header
        headerElement.innerHTML = `
            <header class="header">
                <div class="header-left">
                    <a href="index.html" class="logo">
                        <span>🎬</span>
                        <span>VidHub</span>
                    </a>
                </div>
                <div class="header-right">
                    <a href="login.html" class="login-btn">Login</a>
                </div>
            </header>
        `;
    }
}

// ============================================
// SIDEBAR LOADING
// ============================================

async function loadSidebar() {
    const sidebarElement = document.getElementById('sidebar');
    if (!sidebarElement) return;

    try {
        const response = await fetch('components/sidebar.html');
        if (!response.ok) throw new Error('Failed to load sidebar');
        
        const html = await response.text();
        sidebarElement.innerHTML = html;

        // Highlight active link
        const currentPath = window.location.pathname;
        const sidebarLinks = sidebarElement.querySelectorAll('.sidebar-link');
        
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.remove('active');
            
            if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '') {
                if (href === 'index.html') link.classList.add('active');
            } else if (currentPath.endsWith('library.html')) {
                if (href.includes('library.html')) link.classList.add('active');
            } else if (href.includes(currentPath.split('/').pop())) {
                link.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error loading sidebar:', error);
        // Fallback sidebar
        sidebarElement.innerHTML = `
            <aside class="sidebar">
                <a href="index.html" class="sidebar-link active">🏠 Home</a>
                <a href="index.html?trending=1" class="sidebar-link">🔥 Trending</a>
            </aside>
        `;
    }
}

// ============================================
// FORMATTING UTILITIES
// ============================================

function formatViews(views) {
    if (!views || views === 0) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return diffMinutes + ' minutes ago';
    if (diffHours < 24) return diffHours + ' hours ago';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return diffDays + ' days ago';
    if (diffDays < 30) return Math.floor(diffDays / 7) + ' weeks ago';
    if (diffDays < 365) return Math.floor(diffDays / 30) + ' months ago';
    return Math.floor(diffDays / 365) + ' years ago';
}

// ============================================
// VIDEO CARD CREATION
// ============================================

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    const thumbnailUrl = video.thumbnail_url || 'https://via.placeholder.com/320x180/00bcd4/ffffff?text=VidHub';
    const channelName = video.channel_name || video.users?.channel_name || 'Unknown Channel';
    const views = formatViews(video.views);
    const date = formatDate(video.created_at);
    
    card.innerHTML = `
        <a href="watch.html?id=${video.id}">
            <div class="thumbnail-container">
                <img src="${thumbnailUrl}" alt="${video.title}" onerror="this.src='https://via.placeholder.com/320x180/00bcd4/ffffff?text=VidHub'">
            </div>
            <div class="video-details">
                <h3>${video.title}</h3>
                <p class="channel-name">${channelName}</p>
                <p class="video-meta">${views} views • ${date}</p>
            </div>
        </a>
    `;
    
    return card;
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check session first
    await checkSession();
    
    // Load header and sidebar
    await loadHeader();
    await loadSidebar();
});
