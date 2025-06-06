import { useDragAndDrop } from '../../../hooks/useDragAndDrop';
import styles from './RecommendationsSection.module.css';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Song {
  id: string;
  name: string;
  artist: string;
  spotify_id?: string;
}

interface RecommendedSong {
  track_id: string;
  track_name: string;
  track_artist: string;
  similarity_score: number;
}

interface RecommendationsSectionProps {
  selectedSongs: Song[];
  onSongRemove: (songId: string) => void;
  onSongAdd: (song: Song) => void;
}

export const RecommendationsSection = ({
  selectedSongs,
  onSongRemove,
  onSongAdd,
}: RecommendationsSectionProps) => {
  const { isOver, dropRef } = useDragAndDrop({
    onDrop: (song) => {
      const isDuplicate = selectedSongs.some(s => s.id === song.id);
      if (!isDuplicate) {
        onSongAdd(song);
      }
    }
  });

  const [covers, setCovers] = useState<{ [id: string]: string }>({});
  const [recommendations, setRecommendations] = useState<RecommendedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCovers = async () => {
      const promises = selectedSongs.map(async (song) => {
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
    if (selectedSongs.length) fetchCovers();
  }, [selectedSongs]);

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const spotifyIds = selectedSongs.map(song => song.spotify_id).filter(Boolean);
      console.log(spotifyIds)
      const response = await axios.post('http://localhost:3001/api/songs/recommendations', {
        spotifyIds
      });
      setRecommendations(response.data);
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
      console.error('Error getting recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={styles.recommendationsSection}>
      <h2 className={styles.title}>Recommendations</h2>
      <h3 className={styles.subtitle}>Selected Songs</h3>

      <div
        ref={dropRef}
        className={`${styles.dropZone} ${isOver ? styles.isOver : ''}`}
      >
        {selectedSongs.length === 0 ? (
          <p className={styles.dropText}>
            Drag and drop songs here or use the search to add them
          </p>
        ) : (
          <div className={styles.selectedSongs}>
            {selectedSongs.map((song) => (
              <div
                key={song.id}
                className={styles.songCard}
              >
                {covers[song.id] && (
                  <img
                    src={covers[song.id]}
                    alt={`${song.name} album cover`}
                    width={64}
                    height={64}
                    className={styles.songCardImage}
                  />
                )}
                <div className={styles.songCardContent}>
                  <div className={styles.songCardName}>{song.name}</div>
                  <div className={styles.songCardArtist}>{song.artist}</div>
                </div>
                <button
                  onClick={() => onSongRemove(song.id)}
                  className={`${styles.removeButton}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className={styles.recommendButton}
        disabled={selectedSongs.length === 0 || isLoading}
        onClick={handleGetRecommendations}
      >
        {isLoading ? 'Getting Recommendations...' : 'Get Recommendations'}
      </button>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className={styles.recommendations}>
          <h3 className={styles.subtitle}>Recommended Songs</h3>
          {recommendations.map((song) => (
            <div
              key={song.track_id}
              className={`${styles.songCard} ${styles.songCardClickable}`}
            >
              <div className={styles.songCardContent}>
                <div className={styles.songCardName}>{song.track_name}</div>
                <div className={styles.songCardArtist}>{song.track_artist}</div>
              </div>
              <div className={styles.songCardSimilarity}>
                Similarity: {(song.similarity_score * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
