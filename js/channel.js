document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('id') || localStorage.getItem('userId');

    if (!channelId) {
        window.location.href = 'login.html';
        return;
    }

    const channelNameEl = document.getElementById('channelName');
    const channelSubs = document.getElementById('channelSubs');
    const channelAvatar = document.getElementById('channelAvatar');
    const channelVideos = document.getElementById('channelVideos');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const channelCreated = document.getElementById('channelCreated');
    const tabBtns = document.querySelectorAll('.tab-btn');

    try {
        // Load channel info
        const { data: channel, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', channelId)
            .single();

        if (error) throw error;

        channelNameEl.textContent = channel.channel_name;
        channelCreated.textContent = formatDate(channel.created_at);

        // Get subscriber count
        const { count: subCount } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channelId);

        channelSubs.textContent = `${subCount || 0} subscribers`;

        // Check if viewing own channel
        const userId = localStorage.getItem('userId');
        if (userId === channelId) {
            subscribeBtn.style.display = 'none';
        } else {
            // Check subscription status
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('subscriber_id', userId)
                .eq('channel_id', channelId)
                .single();

            if (sub) {
                subscribeBtn.textContent = 'Subscribed ✓';
                subscribeBtn.classList.add('subscribed');
            }
        }

        // Subscribe button
        subscribeBtn.addEventListener('click', async () => {
            if (!userId) {
                window.location.href = 'login.html';
                return;
            }

            if (subscribeBtn.classList.contains('subscribed')) {
                await supabase
                    .from('subscriptions')
                    .delete()
                    .eq('subscriber_id', userId)
                    .eq('channel_id', channelId);
                subscribeBtn.textContent = 'Subscribe';
                subscribeBtn.classList.remove('subscribed');
            } else {
                await supabase
                    .from('subscriptions')
                    .insert([
                        {
                            subscriber_id: userId,
                            channel_id: channelId,
                            created_at: new Date().toISOString()
                        }
                    ]);
                subscribeBtn.textContent = 'Subscribed ✓';
                subscribeBtn.classList.add('subscribed');
            }
        });

        // Load channel videos
        const { data: videos, error: videosError } = await supabase
            .from('videos')
            .select(`
                *,
                users:user_id (channel_name)
            `)
            .eq('user_id', channelId)
            .order('created_at', { ascending: false });

        if (videosError) throw videosError;

        channelVideos.innerHTML = '';
        if (!videos || videos.length === 0) {
            channelVideos.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No videos uploaded yet.</p>';
        } else {
            videos.forEach(video => {
                video.channel_name = video.users?.channel_name || 'Unknown Channel';
                channelVideos.appendChild(createVideoCard(video));
            });
        }

        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tab = btn.dataset.tab;
                document.getElementById('channelVideos').style.display = tab === 'videos' ? 'grid' : 'none';
                document.getElementById('channelPlaylists').style.display = tab === 'playlists' ? 'grid' : 'none';
                document.getElementById('channelAbout').style.display = tab === 'about' ? 'block' : 'none';
            });
        });

    } catch (err) {
        console.error('Error loading channel:', err);
        channelNameEl.textContent = 'Error loading channel';
    }
});