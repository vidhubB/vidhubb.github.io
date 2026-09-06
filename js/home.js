document.addEventListener('DOMContentLoaded', async () => {
    const videoGrid = document.getElementById('videoGrid');
    const categoryBtns = document.querySelectorAll('.category-btn');
    let currentCategory = 'All';

    // Load all videos
    async function loadVideos(category = 'All') {
        videoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading videos...</p>';
        
        try {
            let query = supabase
                .from('videos')
                .select(`
                    *,
                    users:user_id (channel_name)
                `)
                .order('created_at', { ascending: false });

            if (category !== 'All') {
                query = query.eq('category', category);
            }

            const { data: videos, error } = await query;

            if (error) throw error;

            videoGrid.innerHTML = '';
            
            if (!videos || videos.length === 0) {
                videoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No videos found. Be the first to upload!</p>';
                return;
            }

            videos.forEach(video => {
                video.channel_name = video.users?.channel_name || 'Unknown Channel';
                videoGrid.appendChild(createVideoCard(video));
            });
        } catch (err) {
            console.error('Error loading videos:', err);
            videoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Error loading videos. Please try again.</p>';
        }
    }

    // Category filter
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            loadVideos(currentCategory);
        });
    });

    // Initial load
    loadVideos();
});