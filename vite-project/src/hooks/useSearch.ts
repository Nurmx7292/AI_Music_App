import { useState, useCallback } from 'react';
import axios from 'axios';

interface Song {
  id: string;
  name: string;
  artist: string;
  album?: string;
  spotify_id?: string;
  release_date?: string;
}

export const useSearch = () => {
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:3001/api/songs/search', {
        params: { q: query }
      });
      if (!response.data.length) {
        setResults([]);
        setError('No songs found. Try a different search term.');
        return;
      }
      setResults(response.data);
      console.log('Search results:', response.data);
    } catch (err) {
      console.error('Error searching songs:', err);
      setError('Failed to search songs. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    search
  };
}; 