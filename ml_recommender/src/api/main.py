from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from model import MusicRecommender
from data_processor import DataProcessor

app = FastAPI()

class SongFeatures(BaseModel):
    spotify_id: str
    audio_features: Dict[str, float]
    lyrics: str
    release_date: str
    track_popularity: int = 0
    playlist_genre: str = ''
    playlist_subgenre: str = ''

class RecommendationRequest(BaseModel):
    songs: List[SongFeatures]
    n_recommendations: int = 5
    user_id: Optional[str] = None
    exclude_songs: Optional[List[str]] = None

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]

processor = DataProcessor('src/data/spotify_songs.csv')
recommender = MusicRecommender(processor)
recommender.prepare_data()

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    try:
        all_recommendations = {}
        
        for song in request.songs:
            song_recommendations = recommender.find_similar_songs(
                audio_features=song.audio_features,
                lyrics=song.lyrics,
                release_date=song.release_date,
                n_recommendations=request.n_recommendations * 2,  
                track_popularity=song.track_popularity,
                playlist_genre=song.playlist_genre,
                playlist_subgenre=song.playlist_subgenre,
                user_id=request.user_id,
                exclude_songs=request.exclude_songs
            )
            
            for rec in song_recommendations:
                track_id = rec['track_id']
                if track_id not in all_recommendations:
                    all_recommendations[track_id] = {
                        'track_id': track_id,
                        'track_name': rec['track_name'],
                        'track_artist': rec['track_artist'],
                        'similarity_scores': [rec['similarity_score']],  
                        'track_popularity': rec['track_popularity'],
                        'playlist_genre': rec['playlist_genre'],
                        'playlist_subgenre': rec['playlist_subgenre']
                    }
                else:
                    all_recommendations[track_id]['similarity_scores'].append(rec['similarity_score'])
        
        recommendations = []
        for track_id, rec in all_recommendations.items():
            avg_score = np.mean(rec['similarity_scores'])
            score_count = len(rec['similarity_scores'])
            
            final_rec = {
                'track_id': rec['track_id'],
                'track_name': rec['track_name'],
                'track_artist': rec['track_artist'],
                'similarity_score': float(avg_score),
                'recommendation_count': score_count,  
                'track_popularity': rec['track_popularity'],
                'playlist_genre': rec['playlist_genre'],
                'playlist_subgenre': rec['playlist_subgenre']
            }
            recommendations.append(final_rec)
        
       
        sorted_recommendations = sorted(
            recommendations,
            key=lambda x: (x['recommendation_count'], x['similarity_score'], x['track_popularity']),
            reverse=True
        )[:request.n_recommendations]
        
        for rec in sorted_recommendations:
            del rec['recommendation_count']
        
        return RecommendationResponse(recommendations=sorted_recommendations)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 