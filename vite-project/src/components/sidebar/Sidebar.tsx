import React, { useState, useEffect } from "react";
import "./sidebar.css";
import SidebarButton from "./sidebarButton";
import { MdFavorite } from "react-icons/md";
import { FaGripfire, FaPlay } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";
import { IoLibrary } from "react-icons/io5";
import { MdSpaceDashboard } from "react-icons/md";
import { logout } from "../../utils/spotifyAPI/spotify";
import { IconContext } from "react-icons";

export default function Sidebar() {
  const [image, setImage] = useState("https://www.freeiconspng.com/uploads/am-a-19-year-old-multimedia-artist-student-from-manila--21.png");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when window is resized above mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar-container');
      const burger = document.querySelector('.burger-menu');
      if (
        isMobileMenuOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        burger &&
        !burger.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleSignOut = () => {
    logout();
  };

  return (
    <>
      {/* Burger menu button - only visible on mobile */}
      <button 
        className="burger-menu"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className="material-icons">
          {isMobileMenuOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Overlay - only visible on mobile when menu is open */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar-container ${isMobileMenuOpen ? 'open' : ''}`}>
        <img src={image} className="profile-img" alt="profile" />
        <div className="sidebar-buttons">
          <SidebarButton title="Feed" to="/feed" icon={<MdSpaceDashboard />} />
          <SidebarButton title="Explore" to="/explore" icon={<FaGripfire />} />
          <SidebarButton title="Player" to="/player" icon={<FaPlay />} />
          <SidebarButton title="Favorites" to="/favorites" icon={<MdFavorite />} />
          <SidebarButton title="Library" to="/" icon={<IoLibrary />} />
        </div>
        <div className="sidebar-footer">
          <button className="btn-body" onClick={handleSignOut}>
            <IconContext.Provider value={{ size: "24px", className: "btn-icon" }}>
              <FaSignOutAlt />
              <p className="btn-title">Sign Out</p>
            </IconContext.Provider>
          </button>
        </div>
      </div>
    </>
  );
}
