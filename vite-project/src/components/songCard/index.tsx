import React, { useState, useEffect } from "react";
import { FaSpotify, FaMicrophoneAlt } from "react-icons/fa";
import "./songCard.css";

function cleanString(str: string) {
  return str
    .replace(/\([^)]*\)/g, "") 
    .replace(/\[[^\]]*\]/g, "") 
    .replace(/[^a-zA-Zа-яА-Я0-9\s]/g, "")
    .replace(/\s+/g, " ") 
    .trim();
}

async function fetchLyricsUniversal(artist: string, title: string): Promise<string | null> {
  try {
    const res = await fetch(`https://some-random-api.ml/lyrics?title=${encodeURIComponent(artist + ' ' + title)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.lyrics) return data.lyrics;
    }
  } catch {}
  const variants = [
    { a: artist, t: title },
    { a: artist, t: title.split(" ")[0] },
    { a: cleanString(artist), t: cleanString(title) },
    { a: cleanString(artist), t: cleanString(title).split(" ")[0] },
  ];
  for (const v of variants) {
    try {
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(v.a)}/${encodeURIComponent(v.t)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.lyrics) return data.lyrics;
    } catch {}
  }
  return null;
}

export default function SongCard({ album, track }: { album: any, track?: any }) {
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);

  const artists = album?.artists?.map((a: any) => a.name).join(", ") || "";
  const albumName = album?.name || "";
  const releaseYear = album?.release_date ? album.release_date.slice(0, 4) : "";
  const totalTracks = album?.total_tracks || "";
  const label = album?.label || "";
  const spotifyUrl = album?.external_urls?.spotify;
  const trackTitle = track?.name || album?.name || "";

  useEffect(() => {
    setShowLyrics(false);
    setLyrics(null);
    setLyricsError(null);
    setLoading(false);
  }, [album, trackTitle]);

  const handleLyricsClick = async () => {
    setShowLyrics((prev) => !prev);
    if (!lyrics && !lyricsError && !loading && album?.artists?.[0]?.name && trackTitle) {
      setLoading(true);
      setLyricsError(null);
      const lyricText = await fetchLyricsUniversal(album.artists[0].name, trackTitle);
      if (lyricText) {
        setLyrics(lyricText);
      } else {
        setLyricsError("Текст не найден или недоступен для этого трека.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="songCard-arch-body">
      <div className="songCard-arch-cover">
        <img src={album?.images?.[0]?.url} alt="album art" />
      </div>
      <div className="songCard-arch-info">
        <div className="songCard-arch-title">{albumName}</div>
        <div className="songCard-arch-artist">{artists}</div>
        <div className="songCard-arch-meta">
          <span>{releaseYear}</span>
          {album?.album_type && <span>• {album.album_type}</span>}
          {totalTracks && <span>• {totalTracks} треков</span>}
          {label && <span>• {label}</span>}
        </div>
        <div className="songCard-arch-actions">
          {spotifyUrl && (
            <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="songCard-arch-spotify">
              <FaSpotify /> Открыть в Spotify
            </a>
          )}
          <button className="songCard-arch-lyrics" onClick={handleLyricsClick} title="Показать текст песни">
            <FaMicrophoneAlt /> Lyrics
          </button>
        </div>
        {showLyrics && (
          <div className="songCard-arch-lyrics-modal">
            {loading && <div className="songCard-arch-lyrics-loading">Загрузка текста...</div>}
            {lyrics && <pre className="songCard-arch-lyrics-text">{lyrics}</pre>}
            {lyricsError && <div className="songCard-arch-lyrics-error">{lyricsError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
