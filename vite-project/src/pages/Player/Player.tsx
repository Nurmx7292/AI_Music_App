import React, { useEffect, useState } from "react";
import "./player.css";
import { useLocation } from "react-router-dom";
import apiClient from "../../utils/spotifyAPI/spotify";
import SongCard from "../../components/songCard/index";
import Queue from "../../components/queue/index";
import AudioPLayer from "../../components/audioPlayer";
import Widgets from "../../components/widgets/index";
import { log } from "console";

export const Player = () => {
  const location = useLocation();
  const [tracks, setTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    console.log(location.state)
    if (location.state) {
      apiClient
        .get("playlists/" + location.state?.id + "/tracks")
        .then((res) => {
          const items = res.data.items.map((item: any) => ({
            ...item.track,
            uri: item.track.uri
          }));
          setTracks(items);
          setCurrentTrack(items[0]);
        });
    }
  }, [location.state]);

  useEffect(() => {
    setCurrentTrack(tracks[currentIndex]);
  }, [currentIndex, tracks]);

  return (
    <div className="screen-container flex">
      <div className="left-player-body">
        <AudioPLayer
          currentTrack={currentTrack}
          total={tracks}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
        <Widgets artistID={currentTrack?.album?.artists[0]?.id} />
      </div>
      <div className="right-player-body">
        <SongCard album={currentTrack?.album} track={currentTrack} />
        <Queue tracks={tracks} setCurrentIndex={setCurrentIndex} />
      </div>
    </div>
  );
}

