// ============================================
// VidHub - Authentication with Supabase Auth
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // ============================================
    // LOGIN HANDLER
    // ============================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const gmail = document.getElementById('gmail').value.trim();
            const password = document.getElementById('password').value;

            try {
                // Use Supabase Auth to sign in
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: gmail,
                    password: password
                });

                if (error) {
                    console.error('Login error:', error);
                    alert('Invalid credentials. Please try again.');
                    return;
                }

                // Get user profile from users table
                const { data: profileData, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    console.error('Profile error:', profileError);
                }

                // Save user data
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('channelName', profileData?.channel_name || 'User');
                localStorage.setItem('userEmail', data.user.email);

                console.log('Login successful:', data.user);
                window.location.href = 'index.html';

            } catch (err) {
                console.error('Login exception:', err);
                alert('Error: ' + err.message);
            }
        });
    }

    // ============================================
    // SIGNUP HANDLER
    // ============================================
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const channelName = document.getElementById('channelName').value.trim();
            const gmail = document.getElementById('gmail').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validate inputs
            if (!channelName || !gmail || !password || !confirmPassword) {
                alert('Please fill in all fields');
                return;
            }

            if (channelName.length < 3) {
                alert('Channel name must be at least 3 characters');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters long!');
                return;
            }

            try {
                // Use Supabase Auth to sign up
                const { data, error } = await supabase.auth.signUp({
                    email: gmail,
                    password: password
                });

                if (error) {
                    console.error('Signup error:', error);
                    
                    if (error.message.includes('already registered')) {
                        alert('This email is already registered. Please login.');
                        window.location.href = 'login.html';
                    } else {
                        alert('Signup error: ' + error.message);
                    }
                    return;
                }

                // Create user profile in users table
                if (data.user) {
                    const { error: profileError } = await supabase
                        .from('users')
                        .insert([
                            {
                                id: data.user.id,  // Use the auth user's ID
                                gmail: data.user.email,
                                channel_name: channelName,
                                created_at: new Date().toISOString()
                            }
                        ]);

                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                    }
                }

                // Save user data
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('channelName', channelName);
                localStorage.setItem('userEmail', data.user.email);

                console.log('Signup successful:', data.user);
                alert('Account created successfully! Welcome to VidHub!');
                window.location.href = 'index.html';

            } catch (err) {
                console.error('Signup exception:', err);
                alert('Error: ' + err.message);
            }
        });
    }
});

// ============================================
// LOGOUT FUNCTION
// ============================================
async function logoutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('userId');
        localStorage.removeItem('channelName');
        localStorage.removeItem('userEmail');
        
        window.location.href = 'login.html';
    } catch (err) {
        console.error('Logout error:', err);
        alert('Error logging out: ' + err.message);
    }
}

// ============================================
// CHECK SESSION ON PAGE LOAD
// ============================================
async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
            localStorage.setItem('userId', session.user.id);
            localStorage.setItem('userEmail', session.user.email);
            
            // Get channel name from users table
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

// Run session check on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkSession();
});
