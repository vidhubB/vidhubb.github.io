document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    
    const searchHeading = document.getElementById('searchHeading');
    const searchResults = document.getElementById('searchResults');

    searchHeading.innerHTML = `Search Results for "<span>${query}</span>"`;

    if (!query) {
        searchResults.innerHTML = '<p>Please enter a search query.</p>';
        return;
    }

    searchResults.innerHTML = '<p>Searching...</p>';

    try {
        const { data: videos, error } = await supabase
            .from('videos')
            .select(`
                *,
                users:user_id (channel_name)
            `)
            .ilike('title', `%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        searchResults.innerHTML = '';

        if (!videos || videos.length === 0) {
            searchResults.innerHTML = '<p>No videos found matching your search.</p>';
            return;
        }

        videos.forEach(video => {
            video.channel_name = video.users?.channel_name || 'Unknown Channel';
            searchResults.appendChild(createVideoCard(video));
        });
    } catch (err) {
        console.error('Search error:', err);
        searchResults.innerHTML = '<p>Error searching videos.</p>';
    }
});