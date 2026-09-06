document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const gmail = document.getElementById('gmail').value.trim();
            const password = document.getElementById('password').value;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('gmail', gmail)
                    .eq('password', password)
                    .single();

                if (error) {
                    alert('Invalid credentials. Please try again.');
                    return;
                }

                if (data) {
                    localStorage.setItem('userId', data.id);
                    localStorage.setItem('channelName', data.channel_name);
                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.error('Login error:', err);
                alert('Error logging in. Please try again.');
            }
        });
    }

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
                alert('Password must be at least 6 characters long!');
                return;
            }

            try {
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
                    if (error.message.includes('duplicate')) {
                        alert('This Gmail is already registered. Please login.');
                    } else {
                        alert('Error creating account. Please try again.');
                    }
                    return;
                }

                localStorage.setItem('userId', data.id);
                localStorage.setItem('channelName', data.channel_name);
                window.location.href = 'index.html';
            } catch (err) {
                console.error('Signup error:', err);
                alert('Error creating account. Please try again.');
            }
        });
    }
});