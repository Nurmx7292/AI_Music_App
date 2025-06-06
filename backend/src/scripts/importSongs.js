require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parse');
const Song = require('../models/Song');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../../../ml_recommender/src/data/spotify_songs.csv');

function normalizeDate(dateStr) {
    if (!dateStr) return null;
    if (/^\d{4}$/.test(dateStr)) return dateStr + '-01-01';
    if (/^\d{4}-\d{2}$/.test(dateStr)) return dateStr + '-01';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    return null;
}

async function importSongs() {
    try {
        await Song.createTable();
        console.log('Table created successfully');

        const parser = fs
            .createReadStream(CSV_PATH)
            .pipe(csv.parse({
                columns: true,
                skip_empty_lines: true
            }));

        let count = 0;
        let batch = [];
        const BATCH_SIZE = 1000;

        for await (const record of parser) {
            const songData = {
                name: record.track_name || '',
                artist: record.track_artist || '',
                album: record.track_album_name || '',
                spotify_id: record.track_id || '',
                release_date: normalizeDate(record.track_album_release_date),
                danceability: parseFloat(record.danceability) || 0,
                energy: parseFloat(record.energy) || 0,
                loudness: parseFloat(record.loudness) || 0,
                speechiness: parseFloat(record.speechiness) || 0,
                acousticness: parseFloat(record.acousticness) || 0,
                instrumentalness: parseFloat(record.instrumentalness) || 0,
                liveness: parseFloat(record.liveness) || 0,
                valence: parseFloat(record.valence) || 0,
                tempo: parseFloat(record.tempo) || 0,
                lyrics: record.lyrics || '',
                track_popularity: parseInt(record.track_popularity) || 0,
                playlist_genre: record.playlist_genre || '',
                playlist_subgenre: record.playlist_subgenre || ''
            };

            batch.push(songData);
            count++;

            if (batch.length >= BATCH_SIZE) {
                await Promise.all(batch.map(song => Song.create(song)));
                console.log(`Imported ${count} songs`);
                batch = [];
            }
        }

        if (batch.length > 0) {
            await Promise.all(batch.map(song => Song.create(song)));
            console.log(`Imported ${count} songs`);
        }

        console.log('Import completed successfully');
    } catch (error) {
        console.error('Error importing songs:', error);
        process.exit(1);
    }
}

importSongs(); 