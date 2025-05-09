import React, { useState, useRef, useEffect } from "react";
import "./audioPlayer.css";
import { getPreviewUrl } from "../../utils/spotifyAPI/spotify";
import ArchitectPlayerCard from "./ArchitectPlayerCard";

export default function AudioPLayer({
  currentTrack,
  currentIndex,
  setCurrentIndex,
  total,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const audioRef = useRef(new Audio());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isReady = useRef(false);

  const { duration } = audioRef.current;
  const currentPercentage = duration ? (trackProgress / duration) * 100 : 0;

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (audioRef.current.ended) {
        handleNext();
      } else {
        setTrackProgress(audioRef.current.currentTime);
      }
    }, 1000);
  };

  // Fetch preview URL when current track changes
  useEffect(() => {
    const fetchPreviewUrl = async () => {
      if (currentTrack?.name) {
        try {
          const result = await getPreviewUrl(currentTrack.name);
          if (result.success && result.results.length > 0) {
            console.log(result)
            setPreviewUrl(result.results[0].previewUrls[0]);
          } else {
            console.warn("No preview URL found for:", currentTrack.name);
            setPreviewUrl(null);
          }
        } catch (error) {
          console.error("Error fetching preview URL:", error);
          setPreviewUrl(null);
        }
      }
    };

    fetchPreviewUrl();
  }, [currentTrack]);

  useEffect(() => {
    if (previewUrl) {
      if (isPlaying) {
        audioRef.current.src = previewUrl;
        audioRef.current.play()
          .then(() => {
            console.log("Audio playback started successfully");
            startTimer();
          })
          .catch((err) => {
            console.error("Playback error:", err);
            console.error("Audio source:", previewUrl);
            console.error("Audio element state:", {
              readyState: audioRef.current.readyState,
              networkState: audioRef.current.networkState,
              error: audioRef.current.error
            });
          });
      } else {
        clearInterval(intervalRef.current as NodeJS.Timeout);
        audioRef.current.pause();
      }
    } else {
      console.warn("No preview URL available",previewUrl);
    }
  }, [isPlaying, previewUrl]);

  useEffect(() => {
    return () => {
      audioRef.current.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleNext = () => {
    if (currentIndex < total.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex - 1 < 0) setCurrentIndex(total.length - 1);
    else setCurrentIndex(currentIndex - 1);
  };

  const addZero = (n: number) => {
    return n > 9 ? "" + n : "0" + n;
  };

  const artists = [];
  currentTrack?.album?.artists.forEach((artist) => {
    artists.push(artist.name);
  });

  return (
    <div className="player-body flex">
      <div className="player-right-body flex">
        <ArchitectPlayerCard
          percentage={currentPercentage}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onNext={handleNext}
          onPrev={handlePrev}
          track={currentTrack}
          progress={trackProgress}
          duration={duration || 30}
        />
      </div>
    </div>
  );
}
