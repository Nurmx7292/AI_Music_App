require('dotenv').config();
const express = require('express');
const cors = require('cors');
const spotifyPreviewFinder = require('spotify-preview-finder');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Get preview URL for a song
app.get('/api/preview/:songName', async (req, res) => {
  try {
    const songName = decodeURIComponent(req.params.songName);
    const limit = parseInt(req.query.limit) || 1; // Default to 1 result if limit not specified

    const result = await spotifyPreviewFinder(songName, limit);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json({ error: result.error || 'No preview URL found' });
    }
  } catch (error) {
    console.error('Error getting preview URL:', error);
    res.status(500).json({ error: 'Failed to get preview URL' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 