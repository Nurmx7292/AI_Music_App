import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import List, Dict, Any, Tuple
import logging
from sklearn.metrics import ndcg_score
import random
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)

class MusicRecommender:
    def __init__(self, data_processor):
        self.data_processor = data_processor
        self.features = None
        self.df = None
        self.clusters = None
        self.history = {}  # user_id -> list of recommended songs
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
    def prepare_data(self):
        self.features, self.df = self.data_processor.prepare_features()
        
        if 'processed_lyrics' in self.df.columns:
            lyrics_matrix = self.tfidf_vectorizer.fit_transform(self.df['processed_lyrics'])
            lyrics_features = lyrics_matrix.toarray()
            
            row_norms = np.linalg.norm(lyrics_features, axis=1, keepdims=True)
            row_norms[row_norms == 0] = 1
            lyrics_features = lyrics_features / row_norms
            
            self.features = np.hstack([self.features, lyrics_features])
        
        row_norms = np.linalg.norm(self.features, axis=1, keepdims=True)
        row_norms[row_norms == 0] = 1
        self.features = self.features / row_norms
        self.features = np.nan_to_num(self.features, nan=0.0)
        
        # Add clustering for diversity
        kmeans = KMeans(n_clusters=50, random_state=42)
        self.clusters = kmeans.fit_predict(self.features)
        
        return self.features

    def calculate_feature_weights(self, 
                                audio_features: Dict[str, float],
                                lyrics: str = None,
                                release_date: str = None) -> Dict[str, float]:
        weights = {
            'audio': 0.6,  # Main weight for audio features
            'lyrics': 0.2,  # Weight for lyrics
            'year': 0.1,   # Weight for year
            'genre': 0.1   # Small weight for genre
        }
        return weights

    def calculate_genre_bonus(self, target_genre, target_subgenre, df):
        genre_bonus = np.zeros(len(df))
        
        # Base bonus for genre match
        genre_match = df['playlist_genre'] == target_genre
        genre_bonus[genre_match] += 0.1
        
        # Additional bonus for subgenre match
        subgenre_match = df['playlist_subgenre'] == target_subgenre
        genre_bonus[subgenre_match] += 0.05
        
        return genre_bonus

    def adjust_by_popularity(self, similarity_scores, df):
        # Normalize popularity
        popularity = df['track_popularity'].values / 100.0
        
        # Combine similarity and popularity
        adjusted_scores = 0.7 * similarity_scores + 0.3 * popularity
        
        return adjusted_scores

    def find_similar_songs(self, 
                          audio_features: Dict[str, float],
                          lyrics: str = None,
                          release_date: str = None,
                          n_recommendations: int = 5,
                          track_popularity: int = 0,
                          playlist_genre: str = '',
                          playlist_subgenre: str = '',
                          user_id: str = None,
                          exclude_songs: List[str] = None) -> List[Dict[str, Any]]:
        if self.features is None:
            self.prepare_data()

        filtered_df = self.df
        filtered_features = self.features
        filtered_clusters = self.clusters

        # Exclude already recommended songs
        if exclude_songs:
            mask = ~filtered_df['track_id'].isin(exclude_songs)
            filtered_df = filtered_df[mask]
            filtered_features = filtered_features[mask]
            filtered_clusters = filtered_clusters[mask]

        # Get user history
        if user_id:
            user_history = self.history.get(user_id, [])
            mask = ~filtered_df['track_id'].isin(user_history)
            filtered_df = filtered_df[mask]
            filtered_features = filtered_features[mask]
            filtered_clusters = filtered_clusters[mask]

        year_weight = 3.0
        year_range = 5
        if release_date:
            release_year = pd.to_datetime(release_date).year
            if 'release_date' in self.df.columns:
                mask = (self.df['release_date'].dt.year >= release_year - year_range) & \
                       (self.df['release_date'].dt.year <= release_year + year_range)
                if mask.any():
                    filtered_df = self.df[mask]
                    filtered_features = self.features[mask.values]
                    filtered_clusters = self.clusters[mask.values]

        # Get weights
        weights = self.calculate_feature_weights(audio_features, lyrics, release_date)

        input_features = []
        audio_feature_names = [
            'danceability', 'energy', 'loudness', 
            'speechiness', 'acousticness', 'instrumentalness',
            'liveness', 'valence', 'tempo'
        ]
        audio_values = [audio_features.get(f, 0.5) for f in audio_feature_names]
        input_features.extend(audio_values)

        if release_date:
            release_date_dt = pd.to_datetime(release_date)
            year = (release_date_dt.year - self.df['release_date'].dt.year.min()) / \
                   (self.df['release_date'].dt.year.max() - self.df['release_date'].dt.year.min())
            month = (release_date_dt.month - 1) / 11
            input_features.extend([year * year_weight, month])
        else:
            input_features.extend([0.5 * year_weight, 0.5])

        if lyrics and 'processed_lyrics' in self.df.columns:
            processed_lyrics = self.data_processor.preprocess_lyrics(lyrics)
            lyrics_features = self.tfidf_vectorizer.transform([processed_lyrics]).toarray()
            lyrics_features = lyrics_features / np.linalg.norm(lyrics_features, axis=1, keepdims=True)
            input_features.extend(lyrics_features[0])

        input_features = np.array(input_features)
        input_features = input_features / np.linalg.norm(input_features)
        input_features = np.nan_to_num(input_features, nan=0.0)

        # Calculate similarity with weights
        similarity_scores = cosine_similarity([input_features], filtered_features)[0] * weights['audio']

        # Add genre bonus
        genre_bonus = self.calculate_genre_bonus(playlist_genre, playlist_subgenre, filtered_df)
        similarity_scores = similarity_scores + genre_bonus * weights['genre']

        # Add diversity through clusters
        cluster_diversity = np.zeros(len(filtered_df))
        target_cluster = filtered_clusters[0] if len(filtered_clusters) > 0 else None
        if target_cluster is not None:
            cluster_diversity[filtered_clusters != target_cluster] += 0.1
        similarity_scores = similarity_scores + cluster_diversity

        # Adjust by popularity
        similarity_scores = self.adjust_by_popularity(similarity_scores, filtered_df)

        # Collect recommendations
        recommendations = []
        for idx in np.argsort(similarity_scores)[::-1][:n_recommendations]:
            song = filtered_df.iloc[idx]
            recommendations.append({
                'track_id': song['track_id'],
                'track_name': song['track_name'],
                'track_artist': song['track_artist'],
                'similarity_score': float(similarity_scores[idx]),
                'track_popularity': int(song.get('track_popularity', 0)),
                'playlist_genre': song.get('playlist_genre', ''),
                'playlist_subgenre': song.get('playlist_subgenre', '')
            })

        # Update user history
        if user_id:
            self.history[user_id] = self.history.get(user_id, []) + [r['track_id'] for r in recommendations]

        return recommendations
    
    def evaluate_recommendations(self, n_test_songs: int = 10, n_recommendations: int = 5) -> Dict[str, float]:
        test_indices = random.sample(range(len(self.df)), n_test_songs)
        metrics = {
            'precision@5': 0.0,
            'recall@5': 0.0,
            'ndcg@5': 0.0
        }
        
        for idx in test_indices:
            test_song = self.df.iloc[idx]
            
            song_features = {
                'danceability': test_song['danceability'],
                'energy': test_song['energy'],
                'loudness': test_song['loudness'],
                'speechiness': test_song['speechiness'],
                'acousticness': test_song['acousticness'],
                'instrumentalness': test_song['instrumentalness'],
                'liveness': test_song['liveness'],
                'valence': test_song['valence'],
                'tempo': test_song['tempo']
            }
            
            recommendations = self.find_similar_songs(
                audio_features=song_features,
                lyrics=test_song.get('lyrics', ''),
                release_date=test_song['track_album_release_date'],
                n_recommendations=n_recommendations
            )
            
            recommended_ids = [song['track_id'] for song in recommendations]
            
            relevant_items = 1
            precision = relevant_items / n_recommendations
            metrics['precision@5'] += precision
            
            recall = relevant_items / 1
            metrics['recall@5'] += recall
            
            relevance_scores = np.zeros(n_recommendations)
            if test_song['track_id'] in recommended_ids:
                relevance_scores[recommended_ids.index(test_song['track_id'])] = 1
            ndcg = ndcg_score([relevance_scores], [relevance_scores])
            metrics['ndcg@5'] += ndcg
        
        for metric in metrics:
            metrics[metric] /= n_test_songs
            
        return metrics
    
    def analyze_feature_importance(self) -> Dict[str, float]:
        similarity_ranges = [(0.8, 1.0), (0.6, 0.8), (0.4, 0.6), (0.2, 0.4), (0.0, 0.2)]
        feature_importance = {}
        
        sample_size = min(100, len(self.df))
        sample_indices = random.sample(range(len(self.df)), sample_size)
        
        for idx in sample_indices:
            song_features = self.features[idx]
            similarities = cosine_similarity([song_features], self.features)[0]
            
            for low, high in similarity_ranges:
                mask = (similarities >= low) & (similarities < high)
                if mask.any():
                    for feature in ['danceability', 'energy', 'valence', 'acousticness']:
                        if feature not in feature_importance:
                            feature_importance[feature] = []
                        feature_importance[feature].append(self.df[mask][feature].mean())
        
        avg_importance = {}
        for feature, values in feature_importance.items():
            if values:
                avg_importance[feature] = sum(values) / len(values)
        
        return avg_importance

def main():
    from data_processor import DataProcessor
    
    print("Starting test...")
    
    print("Initializing data processor...")
    processor = DataProcessor('src/data/spotify_songs.csv')
    print("Initializing recommender...")
    recommender = MusicRecommender(processor)
    
    print("Preparing data...")
    recommender.prepare_data()
    
    print("\nEvaluating model performance...")
    metrics = recommender.evaluate_recommendations(n_test_songs=20)
    print("\nEvaluation metrics:")
    for metric, value in metrics.items():
        print(f"{metric}: {value:.3f}")
    
    print("\nAnalyzing feature importance...")
    feature_importance = recommender.analyze_feature_importance()
    print("\nFeature importance by similarity range:")
    for feature, values in feature_importance.items():
        print(f"{feature}: {values}")
    
    print("\nTesting with a specific song...")
    target_song = recommender.df[recommender.df['track_name'] == 'Someone You Loved'].iloc[0]
    print(f"\nFinding songs similar to: {target_song['track_name']} by {target_song['track_artist']}")
    
    song_features = {
        'danceability': target_song['danceability'],
        'energy': target_song['energy'],
        'loudness': target_song['loudness'],
        'speechiness': target_song['speechiness'],
        'acousticness': target_song['acousticness'],
        'instrumentalness': target_song['instrumentalness'],
        'liveness': target_song['liveness'],
        'valence': target_song['valence'],
        'tempo': target_song['tempo']
    }
    
    similar_songs = recommender.find_similar_songs(
        audio_features=song_features,
        lyrics=target_song.get('lyrics', ''),
        release_date=target_song['track_album_release_date'],
        n_recommendations=5
    )
    
    print("\nSimilar songs found:")
    for song in similar_songs:
        print(f"- {song['track_name']} by {song['track_artist']} (similarity: {song['similarity_score']:.3f})")

if __name__ == "__main__":
    main() 