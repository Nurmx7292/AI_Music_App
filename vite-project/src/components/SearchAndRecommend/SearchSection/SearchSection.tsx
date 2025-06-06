import { useState, useRef, useEffect } from 'react';
import { useSearch } from '../../../hooks/useSearch';
import styles from './SearchSection.module.css';
import axios from 'axios';

interface SearchSectionProps {
  onSongSelect: (song: { id: string; name: string; artist: string }) => void;
}

export const SearchSection = ({ onSongSelect }: SearchSectionProps) => {
  const [query, setQuery] = useState('');
  const { results, isLoading, error, search } = useSearch();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [covers, setCovers] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      search(query);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, search]);

  useEffect(() => {
    const fetchCovers = async () => {
      const promises = results.map(async (song) => {
        if (!song.spotify_id) return [song.id, ''];
        try {
          const token = localStorage.getItem('access_token');
          const response = await axios.get(`https://api.spotify.com/v1/tracks/${song.spotify_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const url = response.data.album?.images?.[0]?.url || '';
          return [song.id, url];
        } catch {
          return [song.id, ''];
        }
      });
      const entries = await Promise.all(promises);
      setCovers(Object.fromEntries(entries));
    };
    if (results.length) fetchCovers();
  }, [results]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const handleDragStart = (e: React.DragEvent, song: { id: string; name: string; artist: string }) => {
    e.dataTransfer.setData('application/json', JSON.stringify(song));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <section className={styles.searchSection}>
      <h2 className={styles.title}>Search Songs</h2>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search for songs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className={styles.searchButton}>
          Search
        </button>
      </form>

      <div className={styles.results}>
        {isLoading && <div className={styles.loading}>Searching...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!isLoading && !error && results.length === 0 && (
          <div className={styles.empty}>No results found</div>
        )}
        {results.map((song, index) => (
          <div
            key={`${song.id}-${index}`}
            className={styles.songWrapper}
            draggable
            onDragStart={(e) => handleDragStart(e, song)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '18px 24px',
              borderRadius: '12px',
              background: '#f7f7fa',
              marginBottom: '18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              minHeight: 80,
              cursor: 'grab',
              transition: 'box-shadow 0.2s',
            }}
          >
            {covers[song.id] && (
              <img
                src={covers[song.id]}
                alt={`${song.name} album cover`}
                width={64}
                height={64}
                style={{ borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 4, color: '#222' }}>{song.name}</div>
              <div style={{ fontSize: '1.05rem', color: '#666' }}>{song.artist}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}; 