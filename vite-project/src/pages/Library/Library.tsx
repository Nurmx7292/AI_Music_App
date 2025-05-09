import React, { useState, useEffect } from "react";
import APIKit from "../../utils/spotifyAPI/spotify";
import { IconContext } from "react-icons";
import { FaPlay } from "react-icons/fa";
import "./library.css";
import { useNavigate } from "react-router-dom";

export const Library = () => {
  const [playlists, setPlaylists] = useState<any[]|null>(null);

  useEffect(() => {
    APIKit.get("me/playlists").then(function (response) {
      setPlaylists(response.data.items);
    });
  }, []);

  const navigate = useNavigate();

  const playPlaylist = (id:any) => {
    navigate("/player", { state: { id: id } });
  };

  return (
    <div className="screen-container">
      <div className="library-body">
        {playlists && playlists!.map((playlist:any) => (
          <div
            className="playlist-card"
            key={playlist.id}
            onClick={() => playPlaylist(playlist.id)}
          >
            <img
              src={playlist.images[0].url}
              className="playlist-image"
              alt="Playlist-Art"
            />
            <p className="playlist-title">{playlist.name}</p>
            <p className="playlist-subtitle">{playlist.tracks.total} Songs</p>
            <div className="playlist-fade">
              <button className="playlist-start-btn" onClick={e => {e.stopPropagation(); playPlaylist(playlist.id);}}>
                <IconContext.Provider value={{ size: "20px", color: "var(--text-main)" }}>
                  <FaPlay />
                </IconContext.Provider>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
