import { useState, useEffect, useCallback } from 'react';
import spotifyApi, { setClientToken, playTrack, pauseTrack, resumeTrack } from '../../utils/spotifyAPI/spotify';
import './Explore.css';

interface Track {
  id: string;
  name: string;
  uri: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
}

export const Explore = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setClientToken(token);
    } else {
      setError('Please log in to access Spotify features');
    }
  }, []);

  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTracks([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await spotifyApi.get('search', {
        params: {
          q: query,
          type: 'track',
          limit: 20,
          market: 'US'
        }
      });
      
      if (!response.data.tracks?.items?.length) {
        setTracks([]);
        setError('No tracks found. Try a different search term.');
        return;
      }

      const searchResults = response.data.tracks.items.map((track: any) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        artists: track.artists,
        album: {
          name: track.album.name,
          images: track.album.images
        },
        duration_ms: track.duration_ms
      }));
      setTracks(searchResults);
    } catch (err: any) {
      console.error('Error searching tracks:', err);
      setError('Failed to search tracks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      searchTracks(query);
    }, 500);

    setSearchTimeout(timeoutId);
  };

  const handlePlay = async (track: Track) => {
    try {
      if (currentlyPlaying === track.id) {
        if (isPlaying) {
          await pauseTrack();
        } else {
          await resumeTrack();
        }
        setIsPlaying(!isPlaying);
      } else {
        await playTrack(track.uri);
        setCurrentlyPlaying(track.id);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing track:', error);
      setError('Failed to play track. Please try again.');
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="explore-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search for tracks..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {loading && (
        <div className="loading-spinner">
          <span className="material-icons">sync</span>
          Loading...
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <div className="tracks-container">
        {!loading && tracks.length === 0 && !error && (
          <div className="no-results">
            <span className="material-icons">music_off</span>
            <p>Search for tracks to get started</p>
          </div>
        )}
        
        {tracks.map((track) => (
          <div key={track.id} className="track-card">
            <img 
              src={track.album.images[0]?.url || '/default-album-art.jpg'} 
              alt={`${track.album.name} cover`}
              className="track-image"
            />
            <div className="track-info">
              <h3 className="track-name">{track.name}</h3>
              <p className="track-artist">{track.artists.map(a => a.name).join(', ')}</p>
              <p className="track-album">{track.album.name}</p>
            </div>
            <div className="track-controls">
              <span className="track-duration">{formatDuration(track.duration_ms)}</span>
              <button 
                className={`play-button ${currentlyPlaying === track.id ? 'playing' : ''}`}
                onClick={() => handlePlay(track)}
                title={currentlyPlaying === track.id ? (isPlaying ? 'Pause' : 'Play') : 'Play'}
              >
                <span className="material-icons">
                  {currentlyPlaying === track.id && isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
