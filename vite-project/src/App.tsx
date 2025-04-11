import { Routes, Route } from 'react-router-dom';
import './App.css';
import { Favorite } from './pages/Favorite/Favorite';
import { Trending } from './pages/Trending/Trending';
import { Player } from './pages/Player/Player';
import { Feed } from './pages/Feed/Feed';
import { Library } from './pages/Library/Library';
import Login from './pages/Auth/login';
import Sidebar from './components/sidebar/Sidebar';
import { useEffect, useState } from 'react';
import { getTokenFromUrl, setClientToken, fetchAccessToken } from './utils/spotifyAPI/spotify';

function App() {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true); 

  useEffect(() => {
    const code = getTokenFromUrl(); 
    const windowHash = window.location.hash;
    window.location.hash = ""; 

    if (code) {
      fetchAccessToken(code)
        .then(({ access_token, refresh_token, expires_in }) => {
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", refresh_token);
          setToken(access_token);
          setClientToken(access_token);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching access token:", error);
          setLoading(false);
        });
    } else {
      const savedToken = localStorage.getItem("access_token");
      if (savedToken) {
        setToken(savedToken);
        setClientToken(savedToken);
      }
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return !token ? (
    <Login />
  ) : (
    <div className='main-body'>
      <Sidebar />
      <Routes>
        <Route path='/' element={<Library />} />
        <Route path='/favorite' element={<Favorite />} />
        <Route path='/feed' element={<Feed />} />
        <Route path='/player' element={<Player />} />
        <Route path='/trending' element={<Trending />} />
      </Routes>
    </div>
  );
}

export default App;
