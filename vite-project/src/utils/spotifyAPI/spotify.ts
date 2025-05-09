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
  "user-follow-read"
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
