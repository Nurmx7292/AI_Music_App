import React, { useEffect, useState } from "react";
import "./player.css";
import { useLocation } from "react-router-dom";
import apiClient from "../../utils/spotifyAPI/spotify";
import SongCard from "../../components/songCard/index";
import Queue from "../../components/queue/index";
import AudioPLayer from "../../components/audioPlayer";
import Widgets from "../../components/widgets/index";
import { log } from "console";
import { usePlayer } from "../../context/PlayerContext";

export const Player = () => {
  const location = useLocation();
  const [tracks, setTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let playlistId = location.state?.id;
    let playlistType = location.state?.type;
    if (!playlistId) {
      playlistId = localStorage.getItem('last_playlist_id');
      playlistType = localStorage.getItem('last_playlist_type');
    }

    const fetchAndSetRandomPlaylist = async () => {
      try {
        const res = await apiClient.get("me/playlists");
        const playlists = res.data.items;
        if (playlists.length > 0) {
          const random = playlists[Math.floor(Math.random() * playlists.length)];
          playlistId = random.id;
          playlistType = undefined;
          localStorage.setItem('last_playlist_id', playlistId);
          localStorage.removeItem('last_playlist_type');
          await fetchTracks(playlistId, playlistType);
        }
      } catch (e) {
        // fallback: можно попробовать featured playlists или new releases
        const featuredRes = await apiClient.get('browse/featured-playlists');
        const featured = featuredRes.data.playlists.items;
        if (featured.length > 0) {
          const random = featured[Math.floor(Math.random() * featured.length)];
          playlistId = random.id;
          playlistType = undefined;
          localStorage.setItem('last_playlist_id', playlistId);
          localStorage.removeItem('last_playlist_type');
          await fetchTracks(playlistId, playlistType);
        }
      }
    };

    const fetchTracks = async (id: string, type?: string) => {
      let res;
      if (type === 'album') {
        res = await apiClient.get("albums/" + id + "/tracks");
        const albumRes = await apiClient.get("albums/" + id);
        const albumData = albumRes.data;
        const items = res.data.items.map((item: any) => ({
          ...item,
          uri: item.uri,
          album: albumData
        }));
        setTracks(items);
        setCurrentTrack(items[0]);
      } else {
        res = await apiClient.get("playlists/" + id + "/tracks");
        const items = res.data.items.map((item: any) => ({
          ...item.track,
          uri: item.track.uri
        }));
        setTracks(items);
        setCurrentTrack(items[0]);
      }
    };

    if (playlistId) {
      fetchTracks(playlistId, playlistType);
    } else {
      fetchAndSetRandomPlaylist();
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

