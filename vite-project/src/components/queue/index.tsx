import React from "react";
import "./queue.css";
import { FaPlay } from "react-icons/fa";

interface QueueProps {
  tracks: Array<{
    id: string;
    name: string;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
    artists: Array<{ name: string }>;
  }>;
  setCurrentIndex: (index: number) => void;
}

export default function Queue({ tracks, setCurrentIndex }: QueueProps) {
  return (
    <div className="queue-container flex">
      <div className="queue flex">
        <p className="upNext">Up Next</p>
        <div className="queue-list">
          {tracks.map((track, index) => (
            <div
              className="queue-item flex"
              onClick={() => setCurrentIndex(index)}
              key={`${track.id}-${index}`}
            >
              <p className="track-name">{track.name}</p>
              <p className="track-artist">{track.artists.map(artist => artist.name).join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
