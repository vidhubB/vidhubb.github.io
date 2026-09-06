document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');

    if (!videoId) {
        window.location.href = 'index.html';
        return;
    }

    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const channelName = document.getElementById('channelName');
    const subscriberCount = document.getElementById('subscriberCount');
    const descriptionBox = document.getElementById('descriptionBox');
    const videoViews = document.getElementById('videoViews');
    const relatedVideos = document.getElementById('relatedVideos');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');

    try {
        // Load video
        const { data: video, error } = await supabase
            .from('videos')
            .select(`
                *,
                users:user_id (channel_name, id)
            `)
            .eq('id', videoId)
            .single();

        if (error) throw error;

        videoPlayer.src = video.video_url;
        videoTitle.textContent = video.title;
        channelName.textContent = video.users?.channel_name || 'Unknown Channel';
        descriptionBox.textContent = video.description || 'No description';
        videoViews.textContent = `${formatViews(video.views)} views • ${formatDate(video.created_at)}`;

        // Get subscriber count
        const { count: subCount } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', video.user_id);

        subscriberCount.textContent = `${subCount || 0} subscribers`;

        // Increment view count
        await supabase
            .from('videos')
            .update({ views: (video.views || 0) + 1 })
            .eq('id', videoId);

        // Check subscription status
        const userId = localStorage.getItem('userId');
        if (userId && userId !== video.user_id) {
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('subscriber_id', userId)
                .eq('channel_id', video.user_id)
                .single();

            if (sub) {
                subscribeBtn.textContent = 'Subscribed ✓';
                subscribeBtn.classList.add('subscribed');
            }
        } else if (userId === video.user_id) {
            subscribeBtn.style.display = 'none';
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
                    .eq('channel_id', video.user_id);
                subscribeBtn.textContent = 'Subscribe';
                subscribeBtn.classList.remove('subscribed');
            } else {
                await supabase
                    .from('subscriptions')
                    .insert([
                        {
                            subscriber_id: userId,
                            channel_id: video.user_id,
                            created_at: new Date().toISOString()
                        }
                    ]);
                subscribeBtn.textContent = 'Subscribed ✓';
                subscribeBtn.classList.add('subscribed');
            }
        });

        // Download button
        downloadBtn.addEventListener('click', async () => {
            if (userId) {
                await supabase
                    .from('downloads')
                    .insert([
                        {
                            user_id: userId,
                            video_id: videoId,
                            downloaded_at: new Date().toISOString()
                        }
                    ]);
            }

            const a = document.createElement('a');
            a.href = video.video_url;
            a.download = video.title + '.mp4';
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        // Share button
        shareBtn.addEventListener('click', () => {
            const shareUrl = window.location.href;
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link copied to clipboard!');
            }).catch(() => {
                prompt('Copy this link:', shareUrl);
            });
        });

        // Record history
        if (userId) {
            await supabase
                .from('history')
                .insert([
                    {
                        user_id: userId,
                        video_id: videoId,
                        watched_at: new Date().toISOString()
                    }
                ]);
        }

        // Load related videos
        const { data: related, error: relatedError } = await supabase
            .from('videos')
            .select(`
                *,
                users:user_id (channel_name)
            `)
            .neq('id', videoId)
            .eq('category', video.category)
            .limit(10);

        if (!relatedError && related && related.length > 0) {
            related.forEach(v => {
                v.channel_name = v.users?.channel_name || 'Unknown Channel';
                relatedVideos.appendChild(createVideoCard(v));
            });
        } else {
            relatedVideos.innerHTML += '<p>No related videos.</p>';
        }

    } catch (err) {
        console.error('Error loading video:', err);
        videoTitle.textContent = 'Error loading video';
    }
});