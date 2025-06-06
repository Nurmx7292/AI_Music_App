require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Song = require('./models/Song');
const songsRouter = require('./routes/songs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/songs', songsRouter);

const initializeDatabase = async () => {
    try {
        await Song.createTable();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Server running on port ${PORT}`);
}); 