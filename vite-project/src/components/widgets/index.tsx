import React, { useEffect, useState } from "react";
import "./widgets.css";
import WidgetCard from "./widgetCard";
import apiClient from "../../utils/spotifyAPI/spotify";

export default function Widgets({ artistID }: { artistID?: string }) {
  const [similar, setSimilar] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [newRelease, setNewRelease] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (artistID) {
          const response = await apiClient.get(`artists/${artistID}/related-artists`);
          setSimilar(response.data.artists);
        }

        try {
          const featuredResponse = await apiClient.get('browse/featured-playlists');
          setFeatured(featuredResponse.data.playlists.items);
        } catch (error) {
          console.warn('Failed to fetch featured playlists:', error);
          setFeatured([]);
        }

        try {
          const newReleaseResponse = await apiClient.get('browse/new-releases');
          setNewRelease(newReleaseResponse.data.albums.items);
        } catch (error) {
          console.warn('Failed to fetch new releases:', error);
          setNewRelease([]);
        }
      } catch (error) {
        console.error('Error fetching widget data:', error);
      }
    };

    fetchData();
  }, [artistID]);

  return (
    <div className="widgets-body">
      {similar.length > 0 && (
        <WidgetCard title="Similar Artists" similar={similar} />
      )}
      {featured.length > 0 && (
        <WidgetCard title="Featured Playlists" featured={featured} />
      )}
      {newRelease.length > 0 && (
        <WidgetCard title="New Releases" newRelease={newRelease} />
      )}
    </div>
  );
}
