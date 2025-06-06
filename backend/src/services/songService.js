const Song = require('../models/Song');
const axios = require('axios');

class SongService {
    static async searchSongs(query) {
        return Song.search(query);
    }

    static async getSongById(id) {
        return Song.findById(id);
    }

    static async createSong(songData) {
        return Song.create(songData);
    }

    static async getRecommendations(spotifyIds) {
        try {
            const songs = await Song.findBySpotifyIds(spotifyIds);
            
            if (!songs || songs.length === 0) {
                throw new Error('No songs found with provided spotify IDs');
            }

            const songsData = songs.map(song => ({
                spotify_id: song.spotify_id,
                audio_features: {
                    danceability: parseFloat(song.danceability) || 0,
                    energy: parseFloat(song.energy) || 0,
                    loudness: parseFloat(song.loudness) || 0,
                    speechiness: parseFloat(song.speechiness) || 0,
                    acousticness: parseFloat(song.acousticness) || 0,
                    instrumentalness: parseFloat(song.instrumentalness) || 0,
                    liveness: parseFloat(song.liveness) || 0,
                    valence: parseFloat(song.valence) || 0,
                    tempo: parseFloat(song.tempo) || 0
                },
                lyrics: song.lyrics || '',
                release_date: song.release_date ? new Date(song.release_date).toISOString().split('T')[0] : null,
                track_popularity: song.track_popularity || 0,
                playlist_genre: song.playlist_genre || '',
                playlist_subgenre: song.playlist_subgenre || ''
            }));

            console.log('Sending data to recommendation service:', JSON.stringify(songsData, null, 2));

            const response = await axios.post('http://localhost:5000/recommend', {
                songs: songsData,
                n_recommendations: 5
            });
            
            return response.data.recommendations;
        } catch (error) {
            console.error('Error in getRecommendations:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            throw error;
        }
    }
}

module.exports = SongService; 