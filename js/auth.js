// Wait for everything to load
document.addEventListener('DOMContentLoaded', () => {
    
    // Check if supabase exists
    if (typeof supabase === 'undefined') {
        alert('ERROR: Supabase not loaded. Check if supabase.js loaded before auth.js');
        return;
    }
    
    // Check if auth exists
    if (!supabase.auth) {
        alert('ERROR: supabase.auth is undefined');
        return;
    }
    
    if (typeof supabase.auth.signUp !== 'function') {
        alert('ERROR: signUp function not found');
        return;
    }
    
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // ============================================
    // LOGIN
    // ============================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const gmail = document.getElementById('gmail').value.trim();
            const password = document.getElementById('password').value;

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: gmail,
                    password: password
                });

                if (error) {
                    alert('LOGIN ERROR: ' + error.message);
                    return;
                }

                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userEmail', data.user.email);
                
                const { data: profile } = await supabase
                    .from('users')
                    .select('channel_name')
                    .eq('id', data.user.id)
                    .single();
                
                if (profile) {
                    localStorage.setItem('channelName', profile.channel_name);
                }

                alert('Login successful!');
                window.location.href = 'index.html';

            } catch (err) {
                alert('LOGIN EXCEPTION: ' + err.message);
            }
        });
    }

    // ============================================
    // SIGNUP
    // ============================================
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const channelName = document.getElementById('channelName').value.trim();
            const gmail = document.getElementById('gmail').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters!');
                return;
            }

            try {
                alert('Step 1: Starting signup...');
                
                const { data, error } = await supabase.auth.signUp({
                    email: gmail,
                    password: password
                });

                if (error) {
                    alert('SIGNUP ERROR: ' + error.message);
                    return;
                }

                alert('Step 2: Auth created! User ID: ' + data.user.id);

                if (data.user) {
                    const { error: profileError } = await supabase
                        .from('users')
                        .insert([
                            {
                                id: data.user.id,
                                gmail: data.user.email,
                                channel_name: channelName,
                                created_at: new Date().toISOString()
                            }
                        ]);

                    if (profileError) {
                        alert('Step 3: Profile error: ' + profileError.message);
                    } else {
                        alert('Step 3: Profile created!');
                    }
                }

                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('channelName', channelName);

                alert('ACCOUNT CREATED SUCCESSFULLY!');
                window.location.href = 'index.html';

            } catch (err) {
                alert('SIGNUP EXCEPTION: ' + err.message);
            }
        });
    }
});
