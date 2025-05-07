import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import apiClient from '../../utils/spotifyAPI/spotify';
import './Feed.css';

interface Post {
  id: string;
  baseId: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
}

export const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ref, inView } = useInView();

  const fetchPosts = useCallback(async () => {
    if (!hasMore || loading) {
      console.log('Skipping fetch - hasMore:', hasMore, 'loading:', loading);
      return;
    }
    
    console.log('Starting fetch...');
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      console.log('Token:', token ? 'exists' : 'not found');
      
      if (!token) {
        throw new Error('No access token found');
      }

      console.log('Fetching followed artists...');
      const followedArtists = await apiClient.get('me/following?type=artist&limit=50');
      console.log('Followed artists response:', JSON.stringify(followedArtists.data, null, 2));
      
      if (!followedArtists.data.artists?.items) {
        console.log('No artists found in response');
        throw new Error('No artists found');
      }

      console.log('Processing artists...');
      const artistPromises = followedArtists.data.artists.items.map(async (artist: any) => {
        console.log('Fetching albums for artist:', artist.name);
        const albums = await apiClient.get(`artists/${artist.id}/albums?limit=5`);
        console.log(`Albums for ${artist.name}:`, JSON.stringify(albums.data, null, 2));
        
        return albums.data.items.map((album: any) => ({
          id: `${artist.id}_${album.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          baseId: `${artist.id}_${album.id}`, // Keep track of the base ID for deduplication
          author: {
            name: artist.name,
            avatar: artist.images[0]?.url || 'https://via.placeholder.com/150'
          },
          content: `New album: ${album.name}`,
          likes: Math.floor(Math.random() * 1000),
          comments: Math.floor(Math.random() * 100),
          timestamp: album.release_date || new Date().toISOString()
        }));
      });

      const albumArrays = await Promise.all(artistPromises);
      const newPosts = albumArrays.flat();
      console.log('New posts fetched:', newPosts.length);
      
      if (newPosts.length === 0) {
        console.log('No new posts, setting hasMore to false');
        setHasMore(false);
      } else {
        // Use a Set to track existing base IDs and filter out duplicates
        setPosts(prevPosts => {
          const existingBaseIds = new Set(prevPosts.map(post => post.baseId));
          const uniqueNewPosts = newPosts.filter(post => !existingBaseIds.has(post.baseId));
          console.log('Unique new posts:', uniqueNewPosts.length);
          
          // If there are no unique posts, stop loading more
          if (uniqueNewPosts.length === 0) {
            console.log('No unique posts found, stopping infinite scroll');
            setHasMore(false);
            return prevPosts;
          }
          
          return [...prevPosts, ...uniqueNewPosts];
        });
        setPage(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.error?.message || error.message || 'Failed to fetch posts');
      setHasMore(false);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    console.log('Initial fetch');
    fetchPosts();
  }, []);

  useEffect(() => {
    console.log('InView effect - inView:', inView, 'loading:', loading, 'error:', error);
    if (inView && !loading && !error) {
      fetchPosts();
    }
  }, [inView, loading, error, fetchPosts]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !post.isLiked
          };
        }
        return post;
      })
    );
  };

  const handleComment = (postId: string) => {
    // In a real app, this would open a comment modal or navigate to a comment section
    console.log('Comment clicked for post:', postId);
  };

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>Your Feed</h1>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="posts-container">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <img 
                src={post.author.avatar} 
                alt={post.author.name} 
                className="author-avatar"
              />
              <div className="post-author-info">
                <span className="author-name">{post.author.name}</span>
                <span className="post-timestamp">{formatTimestamp(post.timestamp)}</span>
              </div>
            </div>
            
            <div className="post-content">
              {post.content}
            </div>
            
            <div className="post-actions">
              <button 
                className={`action-button ${post.isLiked ? 'active' : ''}`}
                onClick={() => handleLike(post.id)}
              >
                <span className="material-icons">
                  {post.isLiked ? 'favorite' : 'favorite_border'}
                </span>
                <span>{post.likes}</span>
              </button>
              <button 
                className="action-button"
                onClick={() => handleComment(post.id)}
              >
                <span className="material-icons">chat_bubble_outline</span>
                <span>{post.comments}</span>
              </button>
            </div>
          </div>
        ))}
        
        <div ref={ref} className="load-more-trigger">
          {loading && <div className="loading-spinner">Loading...</div>}
        </div>
      </div>
    </div>
  );
};
