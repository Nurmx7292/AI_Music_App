import React from "react";
import "./widgetCard.css";
import WidgetEntry from "./widgetEntry";
import { IconContext } from "react-icons";
import { FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface WidgetCardProps {
  title: string;
  similar?: any[];
  featured?: any[];
  newRelease?: any[];
}

export default function WidgetCard({ title, similar, featured, newRelease }: WidgetCardProps) {
  const items = similar || featured || newRelease || [];
  const navigate = useNavigate();

  const handleAlbumClick = (album: any) => {
    if (newRelease) {
      console.log('Album clicked:', album.id);
      navigate("/player", { state: { id: album.id, type: 'album' } });
      localStorage.setItem('last_playlist_id', album.id);
      localStorage.setItem('last_playlist_type', 'album');
    }
  };

  return (
    <div className="widgetcard-body">
      <p className="widget-title">{title}</p>
      <div className="widget-content">
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="widget-item"
            onClick={newRelease ? () => handleAlbumClick(item) : undefined}
            tabIndex={newRelease ? 0 : undefined}
            role={newRelease ? 'button' : undefined}
            style={newRelease ? { cursor: 'pointer' } : {}}
          >
            <img
              src={item.images?.[0]?.url || null}
              alt={item.name}
              className="widget-image"
            />
            <p className="widget-name">{item.name}</p>
          </div>
        ))}
      </div>
      <div className="widget-fade"></div>
    </div>
  );
}
