document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const gmail = document.getElementById('gmail').value;
            const password = document.getElementById('password').value;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('gmail', gmail)
                    .eq('password', password)
                    .single();

                if (error) throw error;

                if (data) {
                    localStorage.setItem('userId', data.id);
                    localStorage.setItem('channelName', data.channel_name);
                    window.location.href = 'index.html';
                }
            } catch (err) {
                alert('Invalid credentials. Please try again.');
                console.error('Login error:', err);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const channelName = document.getElementById('channelName').value;
            const gmail = document.getElementById('gmail').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
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

                if (error) throw error;

                localStorage.setItem('userId', data.id);
                localStorage.setItem('channelName', data.channel_name);
                window.location.href = 'index.html';
            } catch (err) {
                alert('Error creating account. Please try again.');
                console.error('Signup error:', err);
            }
        });
    }
});
