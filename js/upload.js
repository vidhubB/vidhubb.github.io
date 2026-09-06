document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const dropZone = document.getElementById('dropZone');
    const videoFile = document.getElementById('videoFile');
    const fileName = document.getElementById('fileName');
    const thumbnailInput = document.getElementById('thumbnail');
    const thumbnailPreview = document.getElementById('thumbnailPreview');

    // Check if user is logged in
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }

    // Drag and drop
    dropZone.addEventListener('click', () => {
        videoFile.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent)';
        dropZone.style.background = 'var(--hover)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'transparent';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'transparent';
        if (e.dataTransfer.files.length > 0) {
            videoFile.files = e.dataTransfer.files;
            fileName.textContent = videoFile.files[0].name;
            generateVideoThumbnail(videoFile.files[0]);
        }
    });

    videoFile.addEventListener('change', () => {
        if (videoFile.files.length > 0) {
            fileName.textContent = videoFile.files[0].name;
            generateVideoThumbnail(videoFile.files[0]);
        }
    });

    // Generate thumbnail from video
    function generateVideoThumbnail(file) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.src = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
            const seekTime = Math.min(1, video.duration * 0.25);
            video.currentTime = seekTime;
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 180;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const thumbnailFile = new File([blob], 'auto-thumbnail.jpg', { type: 'image/jpeg' });
                window.generatedThumbnail = thumbnailFile;

                if (thumbnailPreview) {
                    thumbnailPreview.src = URL.createObjectURL(blob);
                    thumbnailPreview.style.display = 'block';
                }

                URL.revokeObjectURL(video.src);
            }, 'image/jpeg', 0.8);
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
        };
    }

    // Show custom thumbnail preview
    thumbnailInput.addEventListener('change', () => {
        if (thumbnailInput.files.length > 0) {
            thumbnailPreview.src = URL.createObjectURL(thumbnailInput.files[0]);
            thumbnailPreview.style.display = 'block';
        }
    });

    // Upload form
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userId = localStorage.getItem('userId');
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const category = document.getElementById('category').value;
        const video = videoFile.files[0];

        if (!video) {
            alert('Please select a video file');
            return;
        }

        const submitBtn = document.querySelector('.publish-btn');
        submitBtn.textContent = 'Uploading...';
        submitBtn.disabled = true;

        try {
            // Upload video to Supabase Storage
            const videoName = `videos/${userId}_${Date.now()}_${video.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const { data: videoData, error: videoError } = await supabase.storage
                .from('videos')
                .upload(videoName, video);

            if (videoError) throw videoError;

            const videoUrl = supabase.storage.from('videos').getPublicUrl(videoName).data.publicUrl;

            // Upload thumbnail (custom or auto-generated)
            let thumbnailUrl = '';
            const thumbnailFile = thumbnailInput.files[0] || window.generatedThumbnail;

            if (thumbnailFile) {
                const thumbName = `thumbnails/${userId}_${Date.now()}_${thumbnailFile.name || 'thumbnail.jpg'}`;
                const { data: thumbData, error: thumbError } = await supabase.storage
                    .from('thumbnails')
                    .upload(thumbName, thumbnailFile);

                if (thumbError) throw thumbError;

                thumbnailUrl = supabase.storage.from('thumbnails').getPublicUrl(thumbName).data.publicUrl;
            }

            // Insert video metadata
            const { data, error } = await supabase
                .from('videos')
                .insert([
                    {
                        title: title,
                        description: description,
                        video_url: videoUrl,
                        thumbnail_url: thumbnailUrl,
                        user_id: userId,
                        category: category,
                        views: 0,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;

            alert('Video uploaded successfully!');
            window.location.href = 'index.html';
        } catch (err) {
            console.error('Upload error:', err);
            alert('Error uploading video. Please try again.');
            submitBtn.textContent = 'Publish';
            submitBtn.disabled = false;
        }
    });
});