import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/spotifyAPI/spotify';
import './Feed.css';

interface Track {
  id: string;
  name: string;
  uri: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
}

interface Category {
  id: string;
  name: string;
  icons: Array<{ url: string }>;
}

export const Feed = () => {
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have a token
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('No access token found. Please log in.');
          return;
        }

        // Get user's top tracks
        const topTracksResponse = await apiClient.get('me/top/tracks', {
          params: {
            limit: 20,
            time_range: 'short_term'
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const trendingTracksData = topTracksResponse.data.items.map((track: any) => ({
          id: track.id,
          name: track.name,
          uri: track.uri,
          artists: track.artists,
          album: {
            name: track.album.name,
            images: track.album.images
          }
        }));
        setTrendingTracks(trendingTracksData);

        // Get categories
        const categoriesResponse = await apiClient.get('browse/categories', {
          params: { limit: 20 },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Categories response:', categoriesResponse.data);

        const categoriesData = categoriesResponse.data.categories.items.map((category: any) => ({
          id: category.id,
          name: category.name,
          icons: category.icons
        }));
        setCategories(categoriesData);

      } catch (error: any) {
        console.error('Error fetching feed data:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
          console.error('Error headers:', error.response.headers);
        }
        setError('Failed to load feed data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlay = async (uri: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await apiClient.put('me/player/play', 
        { uris: [uri] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>Your Feed</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="feed-content">
          {/* Categories Section */}
          <section className="feed-section categories-section">
            <h2>Browse Categories</h2>
            <div className="categories-list">
              {categories.map((category) => (
                <div key={category.id} className="category-item">
                  <img 
                    src={category.icons[0]?.url} 
                    alt={category.name}
                    className="category-icon"
                  />
                  <span className="category-name">{category.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Trending Tracks Section */}
          <section className="feed-section">
            <h2>Your Top Tracks</h2>
            <div className="tracks-grid">
              {trendingTracks.map((track) => (
                <div key={track.id} className="track-card" onClick={() => handlePlay(track.uri)}>
                  <img 
                    src={track.album.images[0]?.url} 
                    alt={track.album.name}
                    className="track-image"
                  />
                  <div className="track-info">
                    <h3>{track.name}</h3>
                    <p>{track.artists.map(a => a.name).join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
