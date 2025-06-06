const express = require('express');
const router = express.Router();
const SongService = require('../services/songService');
const { body, param, query } = require('express-validator');

router.get('/search',
    query('q').notEmpty().trim().escape(),
    async (req, res) => {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ error: 'Query parameter is required' });
            }
            const songs = await SongService.searchSongs(q);
            res.json(songs);
        } catch (error) {
            console.error('Error searching songs:', error);
            res.status(500).json({ error: 'Error searching songs' });
        }
    }
);

router.get('/:id',
    param('id').isInt(),
    async (req, res) => {
        try {
            const song = await SongService.getSongById(req.params.id);
            res.json(song);
        } catch (error) {
            res.status(404).json({ error: 'Song not found' });
        }
    }
);

router.post('/recommendations',
    body('spotifyIds').isArray().notEmpty(),
    async (req, res) => {
        try {
            const { spotifyIds } = req.body;
            if (!spotifyIds || !Array.isArray(spotifyIds) || spotifyIds.length === 0) {
                return res.status(400).json({ error: 'spotifyIds array is required' });
            }
            const recommendations = await SongService.getRecommendations(spotifyIds);
            res.json(recommendations);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({ error: error.message || 'Error getting recommendations' });
        }
    }
);

module.exports = router; 