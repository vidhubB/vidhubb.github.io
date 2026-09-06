// ============================================
// VidHub - Authentication JavaScript
// Handles Login and Signup
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

            // Validate inputs
            if (!gmail || !password) {
                alert('Please fill in all fields');
                return;
            }

            // Show loading state
            const loginBtn = loginForm.querySelector('.auth-btn');
            loginBtn.textContent = 'Logging in...';
            loginBtn.disabled = true;

            try {
                console.log('Attempting login with:', gmail);

                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('gmail', gmail)
                    .eq('password', password)
                    .single();

                if (error) {
                    console.error('Login error:', error);
                    
                    if (error.message.includes('does not exist') || error.message.includes('relation')) {
                        alert('Database not set up. Please run the SQL setup in Supabase.');
                    } else {
                        alert('Invalid credentials. Please check your Gmail and password.');
                    }
                    return;
                }

                if (data) {
                    console.log('Login successful:', data);
                    
                    // Save user data to localStorage
                    localStorage.setItem('userId', data.id);
                    localStorage.setItem('channelName', data.channel_name);
                    
                    // Redirect to home page
                    window.location.href = 'index.html';
                } else {
                    alert('No account found with these credentials.');
                }
            } catch (err) {
                console.error('Login exception:', err);
                alert('Error: ' + err.message);
            } finally {
                loginBtn.textContent = 'Login';
                loginBtn.disabled = false;
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

            console.log('Signup attempt:', { channelName, gmail });

            // Validate inputs
            if (!channelName || !gmail || !password || !confirmPassword) {
                alert('Please fill in all fields');
                return;
            }

            if (channelName.length < 3) {
                alert('Channel name must be at least 3 characters');
                return;
            }

            if (!gmail.includes('@') || !gmail.includes('.')) {
                alert('Please enter a valid Gmail address');
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

            // Show loading state
            const signupBtn = signupForm.querySelector('.auth-btn');
            signupBtn.textContent = 'Creating account...';
            signupBtn.disabled = true;

            try {
                // Check if Supabase is initialized
                if (!supabase) {
                    alert('Supabase not initialized. Check js/supabase.js');
                    return;
                }

                // Step 1: Test table access
                console.log('Testing users table...');
                const { data: testData, error: testError } = await supabase
                    .from('users')
                    .select('id')
                    .limit(1);

                if (testError) {
                    console.error('Table test failed:', testError);
                    
                    if (testError.message.includes('does not exist') || testError.message.includes('relation')) {
                        alert('The users table does not exist. Please run the SQL setup in Supabase SQL Editor.');
                    } else if (testError.message.includes('permission') || testError.message.includes('policy') || testError.message.includes('RLS')) {
                        alert('Permission denied. Run this SQL: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
                    } else if (testError.message.includes('Invalid API key')) {
                        alert('Invalid API key. Check your Supabase anon key.');
                    } else if (testError.message.includes('Failed to fetch')) {
                        alert('Cannot connect to Supabase. Check your internet connection and Supabase URL.');
                    } else {
                        alert('Table Error: ' + testError.message);
                    }
                    return;
                }
                console.log('Table test passed');

                // Step 2: Check if Gmail already exists
                console.log('Checking for duplicate Gmail...');
                const { data: existingUser, error: checkError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('gmail', gmail)
                    .single();

                if (existingUser) {
                    alert('This Gmail is already registered. Please login instead.');
                    window.location.href = 'login.html';
                    return;
                }

                // Step 3: Insert new user
                console.log('Inserting new user...');
                const { data, error } = await supabase
                    .from('users')
                    .insert([
                        {
                            channel_name: channelName,
                            gmail: gmail,
                            password: password,
                            created_at: new Date().toISOString()
                        }
                    ])
                    .select()
                    .single();

                if (error) {
                    console.error('Insert error:', error);
                    
                    if (error.message.includes('duplicate')) {
                        alert('This Gmail is already registered. Please login.');
                        window.location.href = 'login.html';
                    } else if (error.message.includes('permission') || error.message.includes('policy') || error.message.includes('RLS')) {
                        alert('Insert permission denied. Run: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
                    } else if (error.message.includes('violates')) {
                        alert('Data validation error: ' + error.message);
                    } else {
                        alert('Insert Error: ' + error.message);
                    }
                    return;
                }

                // Success
                console.log('Signup successful:', data);
                alert('Account created successfully! Welcome to VidHub!');
                
                // Save user data
                localStorage.setItem('userId', data.id);
                localStorage.setItem('channelName', data.channel_name);
                
                // Redirect to home
                window.location.href = 'index.html';
                
            } catch (err) {
                console.error('Signup exception:', err);
                alert('Exception: ' + err.message);
            } finally {
                signupBtn.textContent = 'Sign Up';
                signupBtn.disabled = false;
            }
        });
    }
});
