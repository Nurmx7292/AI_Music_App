import { useRef, useState, useCallback } from 'react';

interface Song {
  id: string;
  name: string;
  artist: string;
}

interface UseDragAndDropProps {
  onDrop: (song: Song) => void;
}

export const useDragAndDrop = ({ onDrop }: UseDragAndDropProps) => {
  const [isOver, setIsOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    try {
      const songData = e.dataTransfer?.getData('application/json');
      if (songData) {
        const song = JSON.parse(songData) as Song;
        onDrop(song);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [onDrop]);

  const setupDropZone = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('drop', handleDrop);
    }

    return () => {
      if (element) {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
      }
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  return {
    isOver,
    dropRef: (element: HTMLDivElement | null) => {
      dropRef.current = element;
      setupDropZone(element);
    }
  };
}; 