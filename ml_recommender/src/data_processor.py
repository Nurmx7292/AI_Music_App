import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import re

class DataProcessor:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.scaler = MinMaxScaler()
        
        # Download required NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
        try:
            nltk.data.find('corpora/wordnet')
        except LookupError:
            nltk.download('wordnet')
            
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()
        
    def load_data(self):
        """Load the dataset"""
        self.df = pd.read_csv(self.data_path)
        return self.df
    
    def preprocess_audio_features(self):
        """Preprocess audio features"""
        audio_features = [
            'danceability', 'energy', 'loudness', 
            'speechiness', 'acousticness', 'instrumentalness',
            'liveness', 'valence', 'tempo'
        ]
        
        # Normalize loudness (it's in dB, usually negative)
        self.df['loudness'] = (self.df['loudness'] - self.df['loudness'].min()) / (self.df['loudness'].max() - self.df['loudness'].min())
        
        # Normalize tempo
        self.df['tempo'] = (self.df['tempo'] - self.df['tempo'].min()) / (self.df['tempo'].max() - self.df['tempo'].min())
        
        # Scale all features to [0, 1]
        self.df[audio_features] = self.scaler.fit_transform(self.df[audio_features])
        
        return self.df[audio_features]
    
    def preprocess_lyrics(self, text):
        """Preprocess lyrics text"""
        if pd.isna(text):
            return ""
            
        text = text.lower()
        
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and lemmatize
        tokens = [self.lemmatizer.lemmatize(token) for token in tokens if token not in self.stop_words]
        
        return ' '.join(tokens)
    
    def preprocess_release_date(self):
        """Convert release date to numerical features"""
        # Convert to datetime with ISO8601 format
        self.df['release_date'] = pd.to_datetime(self.df['track_album_release_date'], format='ISO8601')
        
        self.df['release_year'] = self.df['release_date'].dt.year
        self.df['release_month'] = self.df['release_date'].dt.month
        
        # Normalize year and month
        self.df['release_year'] = (self.df['release_year'] - self.df['release_year'].min()) / (self.df['release_year'].max() - self.df['release_year'].min())
        self.df['release_month'] = (self.df['release_month'] - 1) / 11  # Scale to [0, 1]
        
        return self.df[['release_year', 'release_month']]
    
    def prepare_features(self):
        """Prepare all features for the model"""
        # Load data if not loaded
        if self.df is None:
            self.load_data()
            
        # Process each feature type
        audio_features = self.preprocess_audio_features()
        release_features = self.preprocess_release_date()
        
        # Process lyrics if available
        if 'lyrics' in self.df.columns:
            self.df['processed_lyrics'] = self.df['lyrics'].apply(self.preprocess_lyrics)
        
        # Combine all features
        features = pd.concat([audio_features, release_features], axis=1)
        
        return features, self.df

def main():
    # Test the data processor
    processor = DataProcessor('src/data/spotify_songs.csv')
    features, df = processor.prepare_features()
    
    print("=== Feature Preparation Complete ===")
    print("\nFeature shapes:")
    print(f"Audio features: {features.shape}")
    print(f"Original dataset: {df.shape}")
    
    print("\nSample of processed features:")
    print(features.head())

if __name__ == "__main__":
    main() 