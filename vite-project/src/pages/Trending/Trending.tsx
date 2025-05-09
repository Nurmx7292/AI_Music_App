import { useState, useEffect, useCallback, useRef } from 'react';
import spotifyApi, { setClientToken, getPreviewUrl as getSpotifyPreviewUrl } from '../../utils/spotifyAPI/spotify';
import './Trending.css';

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  preview_url?: string | null;
  duration_ms: number;
}

export const Trending = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const audioRef = useRef(new Audio());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set the access token from localStorage when component mounts
    const token = localStorage.getItem('access_token');
    if (token) {
      setClientToken(token);
    } else {
      setError('Please log in to access Spotify features');
      return;
    }
    
    fetchTrendingTracks();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (audioRef.current.ended) {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
        setTrackProgress(0);
      } else {
        setTrackProgress(audioRef.current.currentTime);
      }
    }, 1000);
  };

  const fetchTrendingTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get new releases instead of featured playlists as it's more reliable
      const newReleasesResponse = await spotifyApi.get('browse/new-releases', {
        params: {
          limit: 20,
          country: 'US'
        }
      });
      
      console.log('New releases response:', newReleasesResponse.data);
      
      if (!newReleasesResponse.data.albums?.items?.length) {
        setTracks([]);
        setError('No tracks found.');
        return;
      }

      const newTracks = await Promise.all(
        newReleasesResponse.data.albums.items.map(async (album: any) => {
          // Get the first track of each album
          const trackResponse = await spotifyApi.get(`albums/${album.id}/tracks`, {
            params: { limit: 1 }
          });
          
          const track = trackResponse.data.items[0];
          return {
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: {
              name: album.name,
              images: album.images
            },
            preview_url: track.preview_url,
            duration_ms: track.duration_ms
          };
        })
      );

      setTracks(newTracks);
    } catch (err: any) {
      console.error('Error fetching trending tracks:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load trending tracks. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchTrendingTracks();
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
      
      console.log('Search response:', response.data);
      
      if (!response.data.tracks?.items?.length) {
        setTracks([]);
        setError('No tracks found. Try a different search term.');
        return;
      }

      const searchResults = response.data.tracks.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: {
          name: track.album.name,
          images: track.album.images
        },
        preview_url: `http://localhost:3001/preview/${track.id}`,
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

  // Debounced search handler
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
      // If clicking the same track that's playing, toggle play/pause
      if (currentlyPlaying === track.id) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
        return;
      }

      // If switching to a new track
      if (audioRef.current) {
        audioRef.current.pause();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }

      // Reset states for new track
      setTrackProgress(0);
      setIsPlaying(true);
      setCurrentlyPlaying(track.id);

      // First try to use Spotify's preview URL
      let previewUrl = track.preview_url;
      
      // If no Spotify preview URL, try our backend
      if (!previewUrl) {
        try {
          const response = await getSpotifyPreviewUrl(track.name);
          if (response.success && response.results.length > 0) {
            previewUrl = response.results[0].previewUrls[0];
          }
        } catch (error) {
          console.error('Error getting preview URL:', error);
        }
      }

      if (!previewUrl) {
        console.error('No preview URL available for:', track.name);
        setError(`No preview available for "${track.name}"`);
        setCurrentlyPlaying(null);
        setIsPlaying(false);
        return;
      }

      // Set up new audio
      audioRef.current.src = previewUrl;
      
      // Add event listeners
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
        setTrackProgress(0);
      });

      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setCurrentlyPlaying(null);
        setError(`Failed to play preview for "${track.name}"`);
      });

      audioRef.current.addEventListener('playing', () => {
        setIsPlaying(true);
        setError(null);
        startTimer();
      });

      // Start playback
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Playback failed:', error);
        setIsPlaying(false);
        setCurrentlyPlaying(null);
        setError(`Failed to play preview for "${track.name}"`);
      }
    } catch (error) {
      console.error('Error playing track:', error);
      setIsPlaying(false);
      setCurrentlyPlaying(null);
      setError('An error occurred while trying to play the preview');
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatProgress = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="trending-container">
      <div className="trending-header">
        <h1>Global Top Tracks</h1>
        <div className="search-container">
          <div className="search-bar">
            <span className="material-icons search-icon">search</span>
            <input
              type="text"
              placeholder="Search for songs..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
              autoComplete="off"
            />
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={() => {
                  setSearchQuery('');
                  fetchTrendingTracks();
                }}
              >
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
          {loading && <div className="search-loading">Searching...</div>}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="material-icons">error_outline</span>
          {error}
        </div>
      )}

      <div className="tracks-container">
        {!loading && tracks.length === 0 && !error && (
          <div className="no-results">
            <span className="material-icons">music_off</span>
            <p>No tracks found. Try a different search.</p>
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
              {currentlyPlaying === track.id && (
                <div className="track-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(trackProgress / 30) * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-time">{formatProgress(trackProgress)}</span>
                </div>
              )}
            </div>
            <div className="track-controls">
              <span className="track-duration">{formatDuration(track.duration_ms)}</span>
              <button 
                className={`play-button ${currentlyPlaying === track.id ? 'playing' : ''}`}
                onClick={() => handlePlay(track)}
                title={currentlyPlaying === track.id ? 'Pause' : 'Play preview'}
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
