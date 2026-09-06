# 🎬 VidHub

VidHub is a video-sharing website and social media platform where users can watch, upload, subscribe, share, create playlists, and download videos.

## ✨ Features

- 📺 Watch videos on any topic
- 📤 Upload your own videos
- 🔔 Subscribe to channels
- 🔗 Share videos
- 📋 Create playlists
- ⬇️ Download videos for offline viewing
- 🌓 Dark/Light mode toggle
- 🔐 Login with Gmail + password

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Supabase (Database + Storage)
- **Hosting:** GitHub Pages

## 🚀 Setup

1. Clone this repository
2. Create a Supabase project
3. Run the SQL setup (see `database.sql`)
4. Create storage buckets: `videos` and `thumbnails`
5. Update `js/supabase.js` with your Supabase URL and key
6. Deploy to GitHub Pages

## 📁 Database Structure

- `users` - User accounts
- `videos` - Video metadata
- `subscriptions` - Channel subscriptions
- `playlists` - User playlists
- `playlist_videos` - Videos in playlists
- `downloads` - Download history
- `history` - Watch history
- `categories` - Video categories
- `admins` - Admin users

## 🌐 Live Demo

Visit: `https://vidhubb.github.io`

## 📄 License

MIT License