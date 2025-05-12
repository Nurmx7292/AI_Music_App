import React from "react";
import "./widgetCard.css";
import WidgetEntry from "./widgetEntry";
import { IconContext } from "react-icons";
import { FiChevronRight } from "react-icons/fi";

interface WidgetCardProps {
  title: string;
  similar?: any[];
  featured?: any[];
  newRelease?: any[];
}

export default function WidgetCard({ title, similar, featured, newRelease }: WidgetCardProps) {
  const items = similar || featured || newRelease || [];
  
  return (
    <div className="widgetcard-body">
      <p className="widget-title">{title}</p>
      <div className="widget-content">
        {items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="widget-item">
            <img
              src={item.images?.[0]?.url || null}
              alt={item.name}
              className="widget-image"
            />
            <p className="widget-name">{item.name}</p>
          </div>
        ))}
      </div>
      <div className="widget-fade">
        <div className="fade-button">
          <IconContext.Provider value={{ size: "24px", color: "#c4d0e3" }}>
            <FiChevronRight />
          </IconContext.Provider>
        </div>
      </div>
    </div>
  );
}
