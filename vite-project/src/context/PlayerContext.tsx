import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PlayerSource = 'feed' | 'explore';

export interface PlayerTrack {
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

interface PlayerContextType {
  currentTrack: PlayerTrack | null;
  trackList: PlayerTrack[];
  currentIndex: number;
  isPlaying: boolean;
  source: PlayerSource | null;
  setPlayer: (tracks: PlayerTrack[], index: number, source: PlayerSource) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [trackList, setTrackList] = useState<PlayerTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [source, setSource] = useState<PlayerSource | null>(null);

  const setPlayer = (tracks: PlayerTrack[], index: number, src: PlayerSource) => {
    setTrackList(tracks);
    setCurrentIndex(index);
    setCurrentTrack(tracks[index] || null);
    setIsPlaying(true);
    setSource(src);
  };

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const stop = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentIndex(-1);
    setTrackList([]);
    setSource(null);
  };
  const next = () => {
    if (trackList.length > 0 && currentIndex < trackList.length - 1) {
      setCurrentIndex(i => {
        const ni = i + 1;
        setCurrentTrack(trackList[ni]);
        return ni;
      });
    }
  };
  const prev = () => {
    if (trackList.length > 0 && currentIndex > 0) {
      setCurrentIndex(i => {
        const ni = i - 1;
        setCurrentTrack(trackList[ni]);
        return ni;
      });
    }
  };

  return (
    <PlayerContext.Provider value={{ currentTrack, trackList, currentIndex, isPlaying, source, setPlayer, play, pause, next, prev, stop }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}; 