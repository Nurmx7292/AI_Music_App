import { useState } from 'react';
import { SearchSection } from './SearchSection/SearchSection';
import { RecommendationsSection } from './RecommendationsSection/RecommendationsSection';
import styles from './SearchAndRecommend.module.css';

interface Song {
  id: string;
  name: string;
  artist: string;
}

export const SearchAndRecommend = () => {
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);

  const handleSongSelect = (song: Song) => {
    setSelectedSongs(prev => {
      if (prev.some(s => s.id === song.id)) return prev;
      return [...prev, song];
    });
  };

  const handleSongRemove = (songId: string) => {
    setSelectedSongs(prev => prev.filter(song => song.id !== songId));
  };

  return (
    <div className={styles.container}>
      <SearchSection onSongSelect={handleSongSelect} />
      <RecommendationsSection
        selectedSongs={selectedSongs}
        onSongRemove={handleSongRemove}
        onSongAdd={handleSongSelect}
      />
    </div>
  );
}; 