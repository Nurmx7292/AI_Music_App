import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import List, Dict, Any
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataAnalyzer:
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.data = None
        
    def load_data(self) -> pd.DataFrame:
        """Load the dataset"""
        try:
            logger.info(f"Loading data from {self.data_path}")
            self.data = pd.read_csv(self.data_path)
            logger.info(f"Successfully loaded {len(self.data)} records")
            return self.data
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise
            
    def get_basic_info(self) -> dict:
        """Get basic information about the dataset"""
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first")
            
        info = {
            "shape": self.data.shape,
            "columns": list(self.data.columns),
            "missing_values": self.data.isnull().sum().to_dict(),
            "dtypes": self.data.dtypes.to_dict()
        }
        
        return info
    
    def analyze_audio_features(self):
        """Analyze audio features"""
        audio_features = [
            'danceability', 'energy', 'loudness', 
            'speechiness', 'acousticness', 'instrumentalness',
            'liveness', 'valence', 'tempo'
        ]
        
        # Check for missing values
        missing = self.data[audio_features].isnull().sum()
        print("\nMissing values in audio features:")
        print(missing)
        
        # Basic statistics
        print("\nBasic statistics for audio features:")
        print(self.data[audio_features].describe())
        
        # Plot distributions
        plt.figure(figsize=(15, 10))
        for i, feature in enumerate(audio_features, 1):
            plt.subplot(3, 3, i)
            sns.histplot(data=self.data, x=feature, bins=30)
            plt.title(f'{feature} distribution')
        plt.tight_layout()
        plt.savefig('audio_features_distribution.png')
        plt.close()
        
    def analyze_lyrics(self):
        """Analyze lyrics data"""
        if 'lyrics' not in self.data.columns:
            print("\nNo lyrics column found in the dataset")
            return
            
        # Check for missing values
        missing_lyrics = self.data['lyrics'].isnull().sum()
        print(f"\nMissing lyrics: {missing_lyrics}")
        
        # Basic statistics about lyrics length
        self.data['lyrics_length'] = self.data['lyrics'].str.len()
        print("\nLyrics length statistics:")
        print(self.data['lyrics_length'].describe())
        
        # Plot lyrics length distribution
        plt.figure(figsize=(10, 6))
        sns.histplot(data=self.data, x='lyrics_length', bins=50)
        plt.title('Distribution of lyrics length')
        plt.savefig('lyrics_length_distribution.png')
        plt.close()
        
    def analyze_release_dates(self):
        """Analyze release dates"""
        if 'release_date' not in self.data.columns:
            print("\nNo release_date column found in the dataset")
            return
            
        # Convert to datetime
        self.data['release_date'] = pd.to_datetime(self.data['release_date'])
        
        # Basic statistics
        print("\nRelease date range:")
        print(f"Earliest: {self.data['release_date'].min()}")
        print(f"Latest: {self.data['release_date'].max()}")
        
        # Plot distribution by year
        plt.figure(figsize=(12, 6))
        self.data['release_year'] = self.data['release_date'].dt.year
        sns.histplot(data=self.data, x='release_year', bins=50)
        plt.title('Distribution of songs by release year')
        plt.savefig('release_year_distribution.png')
        plt.close()
        
    def analyze_genres(self):
        """Analyze genres if available"""
        if 'genre' not in self.data.columns:
            print("\nNo genre column found in the dataset")
            return
            
        # Count unique genres
        unique_genres = self.data['genre'].nunique()
        print(f"\nNumber of unique genres: {unique_genres}")
        
        # Top 10 genres
        top_genres = self.data['genre'].value_counts().head(10)
        print("\nTop 10 genres:")
        print(top_genres)
        
        # Plot top genres
        plt.figure(figsize=(12, 6))
        top_genres.plot(kind='bar')
        plt.title('Top 10 genres')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig('top_genres.png')
        plt.close()
        
    def analyze_numeric_features(self) -> Dict[str, Any]:
        """Analyze all numeric features"""
        numeric_columns = self.data.select_dtypes(include=[np.number]).columns
        stats = self.data[numeric_columns].describe()
        correlations = self.data[numeric_columns].corr()
        
        return {
            "descriptive_stats": stats.to_dict(),
            "correlations": correlations.to_dict()
        }
    
    def analyze_categorical_features(self) -> Dict[str, Any]:
        """Analyze all categorical features"""
        categorical_columns = self.data.select_dtypes(include=['object']).columns
        analysis = {}
        
        for col in categorical_columns:
            value_counts = self.data[col].value_counts()
            analysis[col] = {
                "unique_values": len(value_counts),
                "most_common": value_counts.head(5).to_dict(),
                "missing_values": self.data[col].isnull().sum()
            }
            
        return analysis
    
    def plot_correlation_matrix(self, save_path: str = None):
        """Plot correlation matrix for numeric features"""
        numeric_columns = self.data.select_dtypes(include=[np.number]).columns
        corr_matrix = self.data[numeric_columns].corr()
        
        plt.figure(figsize=(12, 8))
        sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0)
        plt.title('Correlation Matrix')
        
        if save_path:
            plt.savefig(save_path)
        plt.close()
    
    def generate_full_report(self, save_dir: str = None) -> Dict[str, Any]:
        """Generate a complete analysis report"""
        if self.data is None:
            self.load_data()
            
        report = {
            "basic_info": self.get_basic_info(),
            "numeric_analysis": self.analyze_numeric_features(),
            "categorical_analysis": self.analyze_categorical_features()
        }
        
        # Analyze specific features
        self.analyze_audio_features()
        self.analyze_lyrics()
        self.analyze_release_dates()
        self.analyze_genres()
        
        if save_dir:
            Path(save_dir).mkdir(parents=True, exist_ok=True)
            self.plot_correlation_matrix(f"{save_dir}/correlation_matrix.png")
            
        return report

def main():
    analyzer = DataAnalyzer('src/data/spotify_songs.csv')  # Updated path since we're in the data directory
    df = analyzer.load_data()
    
    print("=== Starting Full Data Analysis ===")
    
    print("\n1. Getting Basic Info...")
    basic_info = analyzer.get_basic_info()
    print(f"Dataset shape: {basic_info['shape']}")
    print(f"Columns: {basic_info['columns']}")
    
    print("\n2. Analyzing Audio Features...")
    analyzer.analyze_audio_features()
    
    print("\n3. Analyzing Lyrics...")
    analyzer.analyze_lyrics()
    
    print("\n4. Analyzing Release Dates...")
    analyzer.analyze_release_dates()
    
    print("\n5. Analyzing Genres...")
    analyzer.analyze_genres()
    
    print("\n6. Generating Correlation Matrix...")
    analyzer.plot_correlation_matrix('correlation_matrix.png')
    
    print("\n=== Analysis Complete ===")
    print("Check the generated plots for visualizations.")

if __name__ == "__main__":
    main() 