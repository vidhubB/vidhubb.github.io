document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    const historySection = document.getElementById('historySection');
    const playlistsSection = document.getElementById('playlistsSection');
    const downloadsSection = document.getElementById('downloadsSection');
    const historyVideos = document.getElementById('historyVideos');
    const downloadsVideos = document.getElementById('downloadsVideos');
    const playlistsGrid = document.getElementById('playlistsGrid');
    const createPlaylistBtn = document.getElementById('createPlaylist');

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            historySection.style.display = tab === 'history' ? 'block' : 'none';
            playlistsSection.style.display = tab === 'playlists' ? 'block' : 'none';
            downloadsSection.style.display = tab === 'downloads' ? 'block' : 'none';
        });
    });

    // Load history
    async function loadHistory() {
        historyVideos.innerHTML = '<p>Loading...</p>';
        
        const { data: history, error } = await supabase
            .from('history')
            .select(`
                video_id,
                videos:video_id (*, users:user_id (channel_name))
            `)
            .eq('user_id', userId)
            .order('watched_at', { ascending: false });

        if (error) {
            console.error('Error loading history:', error);
            historyVideos.innerHTML = '<p>Error loading history.</p>';
            return;
        }

        historyVideos.innerHTML = '';
        if (!history || history.length === 0) {
            historyVideos.innerHTML = '<p>No watch history yet.</p>';
            return;
        }

        history.forEach(item => {
            const video = item.videos;
            video.channel_name = video.users?.channel_name || 'Unknown Channel';
            historyVideos.appendChild(createVideoCard(video));
        });
    }

    // Load downloads
    async function loadDownloads() {
        downloadsVideos.innerHTML = '<p>Loading...</p>';
        
        const { data: downloads, error } = await supabase
            .from('downloads')
            .select(`
                video_id,
                videos:video_id (*, users:user_id (channel_name))
            `)
            .eq('user_id', userId)
            .order('downloaded_at', { ascending: false });

        if (error) {
            console.error('Error loading downloads:', error);
            downloadsVideos.innerHTML = '<p>Error loading downloads.</p>';
            return;
        }

        downloadsVideos.innerHTML = '';
        if (!downloads || downloads.length === 0) {
            downloadsVideos.innerHTML = '<p>No downloads yet.</p>';
            return;
        }

        downloads.forEach(item => {
            const video = item.videos;
            video.channel_name = video.users?.channel_name || 'Unknown Channel';
            downloadsVideos.appendChild(createVideoCard(video));
        });
    }

    // Load playlists
    async function loadPlaylists() {
        playlistsGrid.innerHTML = '<p>Loading...</p>';
        
        const { data: playlists, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error loading playlists:', error);
            playlistsGrid.innerHTML = '<p>Error loading playlists.</p>';
            return;
        }

        playlistsGrid.innerHTML = '';
        if (!playlists || playlists.length === 0) {
            playlistsGrid.innerHTML = '<p>No playlists yet. Create one!</p>';
            return;
        }

        playlists.forEach(playlist => {
            const div = document.createElement('div');
            div.className = 'playlist-card';
            div.innerHTML = `<h3>📋 ${playlist.name}</h3><p style="color: var(--text-secondary); font-size: 12px; margin-top: 5px;">${formatDate(playlist.created_at)}</p>`;
            playlistsGrid.appendChild(div);
        });
    }

    // Create playlist
    if (createPlaylistBtn) {
        createPlaylistBtn.addEventListener('click', async () => {
            const name = prompt('Enter playlist name:');
            if (!name || !name.trim()) return;

            const { error } = await supabase
                .from('playlists')
                .insert([
                    {
                        user_id: userId,
                        name: name.trim(),
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                alert('Error creating playlist');
                return;
            }

            loadPlaylists();
        });
    }

    // Load everything
    loadHistory();
    loadDownloads();
    loadPlaylists();
});