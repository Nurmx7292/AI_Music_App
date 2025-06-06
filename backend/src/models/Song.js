const db = require('../config/database');

class Song {
    static async createTable() {
        return db.none(`
            CREATE TABLE IF NOT EXISTS songs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                artist VARCHAR(255) NOT NULL,
                album VARCHAR(255),
                spotify_id VARCHAR(255) NOT NULL,
                release_date DATE,
                danceability FLOAT,
                energy FLOAT,
                loudness FLOAT,
                speechiness FLOAT,
                acousticness FLOAT,
                instrumentalness FLOAT,
                liveness FLOAT,
                valence FLOAT,
                tempo FLOAT,
                lyrics TEXT,
                track_popularity INTEGER,
                playlist_genre VARCHAR(255),
                playlist_subgenre VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_songs_search 
            ON songs USING GIN (to_tsvector('english', name || ' ' || artist || ' ' || COALESCE(album, '')));
        `);
    }

    static async search(query) {
        // Convert the search query to proper tsquery format
        const formattedQuery = query
            .trim()
            .split(/\s+/)
            .map(term => `${term}:*`)
            .join(' & ');

        return db.any(`
            SELECT id, name, artist, album, spotify_id, release_date
            FROM songs 
            WHERE to_tsvector('english', name || ' ' || artist || ' ' || COALESCE(album, '')) @@ to_tsquery('english', $1)
            LIMIT 20
        `, formattedQuery);
    }

    static async findById(id) {
        console.log(id)
        return db.one('SELECT * FROM songs WHERE spotify_id = $1', id);
    }

    static async findBySpotifyIds(spotifyIds) {
        return db.any('SELECT * FROM songs WHERE spotify_id = ANY($1)', [spotifyIds]);
    }

    static async create(songData) {
        return db.one(`
            INSERT INTO songs (
                name, artist, album, spotify_id, release_date,
                danceability, energy, loudness, speechiness,
                acousticness, instrumentalness, liveness,
                valence, tempo, lyrics,
                track_popularity, playlist_genre, playlist_subgenre
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *
        `, [
            songData.name,
            songData.artist,
            songData.album,
            songData.spotify_id,
            songData.release_date,
            songData.danceability,
            songData.energy,
            songData.loudness,
            songData.speechiness,
            songData.acousticness,
            songData.instrumentalness,
            songData.liveness,
            songData.valence,
            songData.tempo,
            songData.lyrics,
            songData.track_popularity,
            songData.playlist_genre,
            songData.playlist_subgenre
        ]);
    }
}

module.exports = Song; 