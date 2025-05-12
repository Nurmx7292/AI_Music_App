import axios from "axios";
import pkceChallenge from "pkce-challenge";

const authEndpoint = "https://accounts.spotify.com/authorize?";
const tokenEndpoint = "https://accounts.spotify.com/api/token";

const clientId = "6f0df02af022441694897307f72963b8"; 
const redirectUri = "http://127.0.0.1:5173"; // 

const scopes = [
  "user-library-read",
  "playlist-read-private",
  "user-read-playback-state", 
  "user-modify-playback-state",
  "user-follow-read",
  "streaming",
  "user-read-email",
  "user-read-private"
];

export const generatePKCE = async () => {
  const { code_verifier, code_challenge } = await pkceChallenge();
  localStorage.setItem("spotify_code_verifier", code_verifier); 
  localStorage.setItem("code_challenge", code_challenge)
  return code_challenge;
};

export const loginEndpoint = async () => {
  const code_challenge = await generatePKCE(); 

  const loginUrl = `${authEndpoint}client_id=${clientId}` +
                   `&redirect_uri=${redirectUri}` +
                   `&scope=${scopes.join('%20')}` +
                   `&response_type=code` + 
                   `&code_challenge_method=S256` +
                   `&code_challenge=${code_challenge}` +
                   `&show_dialog=true`;

  window.location.href = loginUrl;
};

export const getTokenFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code) {
    return code;
  }
  return null;
};

let codeChallenge = localStorage.getItem("code_challenge")


export const fetchAccessToken = async (authorizationCode: string) => {
  const code_verifier = localStorage.getItem("spotify_code_verifier"); 

  if (!code_verifier) {
    throw new Error("code_verifier not found in localStorage");
  }

  const response = await axios.post(
    tokenEndpoint,
    new URLSearchParams({
      client_id: clientId,
      code: authorizationCode,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier, 
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const { access_token, refresh_token, expires_in } = response.data;
  return { access_token, refresh_token, expires_in };
};

const apiClient = axios.create({
  baseURL: "https://api.spotify.com/v1/",
});

export const setClientToken = (token: string) => {
  apiClient.interceptors.request.use(function (config) {
    config.headers.Authorization = "Bearer " + token;
    return config;
  });
};

const backendClient = axios.create({
  baseURL: "http://localhost:3001/api/",
});

export const getPreviewUrl = async (songName: string) => {
  try {
    const response = await backendClient.get(`preview/${encodeURIComponent(songName)}`);
    return response.data;
  } catch (error) {
    console.error('Error getting preview URL:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('spotify_code_verifier');
  localStorage.removeItem('code_challenge');
  window.location.href = '/';
};

export default apiClient;

// Web Playback SDK
let player: Spotify.Player | null = null;
let deviceId: string | null = null;

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => Spotify.Player;
    };
  }
}

export const initializePlayer = async (token: string): Promise<void> => {
  if (player) return;

  // Wait for the SDK to be ready
  if (!window.Spotify) {
    await new Promise<void>((resolve) => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        resolve();
      };
    });
  }

  try {
    player = new window.Spotify.Player({
      name: 'Web Playback SDK',
      getOAuthToken: cb => { cb(token); },
      volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
      console.error('Failed to initialize:', message);
    });

    player.addListener('authentication_error', ({ message }) => {
      console.error('Failed to authenticate:', message);
    });

    player.addListener('account_error', ({ message }) => {
      console.error('Failed to validate Spotify account:', message);
    });

    player.addListener('playback_error', ({ message }) => {
      console.error('Failed to perform playback:', message);
    });

    // Playback status updates
    player.addListener('player_state_changed', state => {
      console.log('Player state changed:', state);
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      deviceId = device_id;
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    const connected = await player.connect();
    if (connected) {
      console.log('The Web Playback SDK successfully connected to Spotify!');
    }
  } catch (error) {
    console.error('Error initializing Spotify player:', error);
    throw error;
  }
};

export const playTrack = async (trackUri: string): Promise<void> => {
  if (!player || !deviceId) {
    console.error('Player not initialized or device ID not available');
    return;
  }

  try {
    // First, transfer playback to our device
    await apiClient.put('me/player', {
      device_ids: [deviceId],
      play: false
    });

    // Then start playback
    await apiClient.put('me/player/play', {
      uris: [trackUri]
    });
  } catch (error) {
    console.error('Error playing track:', error);
    throw error;
  }
};

export const pauseTrack = async (): Promise<void> => {
  if (!player) {
    console.error('Player not initialized');
    return;
  }

  try {
    await player.pause();
  } catch (error) {
    console.error('Error pausing track:', error);
  }
};

export const resumeTrack = async (): Promise<void> => {
  if (!player) {
    console.error('Player not initialized');
    return;
  }

  try {
    await player.resume();
  } catch (error) {
    console.error('Error resuming track:', error);
  }
};

export const getCurrentState = async (): Promise<Spotify.PlaybackState | null> => {
  if (!player) {
    console.error('Player not initialized');
    return null;
  }

  try {
    return await player.getCurrentState();
  } catch (error) {
    console.error('Error getting current state:', error);
    return null;
  }
};

export const seek = async (position_ms: number): Promise<void> => {
  if (!player) {
    console.error('Player not initialized');
    return;
  }

  try {
    await player.seek(position_ms);
  } catch (error) {
    console.error('Error seeking:', error);
  }
};

export const setVolume = async (volume: number): Promise<void> => {
  if (!player) {
    console.error('Player not initialized');
    return;
  }

  try {
    await player.setVolume(volume);
  } catch (error) {
    console.error('Error setting volume:', error);
  }
};

export const disconnectPlayer = async (): Promise<void> => {
  if (player) {
    await player.disconnect();
    player = null;
    deviceId = null;
  }
};
