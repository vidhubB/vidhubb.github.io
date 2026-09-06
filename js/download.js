// Standalone download function for VidHub
// Can be used on any page with a download button

async function downloadVideo(videoUrl, videoTitle, videoId = null) {
    try {
        // Record download in database if user is logged in and videoId provided
        const userId = localStorage.getItem('userId');
        if (userId && videoId) {
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

        // Trigger the download
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = videoTitle.replace(/[^a-z0-9]/gi, '_') + '.mp4';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return { success: true };
    } catch (error) {
        console.error('Download error:', error);
        return { success: false, error };
    }
}

// If you want a global download button handler
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const videoUrl = downloadBtn.dataset.videoUrl;
            const videoTitle = downloadBtn.dataset.videoTitle;
            const videoId = downloadBtn.dataset.videoId;
            
            if (videoUrl) {
                await downloadVideo(videoUrl, videoTitle, videoId);
            }
        });
    }
});