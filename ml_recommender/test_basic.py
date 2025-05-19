import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from src.data.data_loader import DataLoader
from src.data.data_analyzer import DataAnalyzer

def test_data_loading():
    """Test basic data loading and display basic statistics"""
    try:
        loader = DataLoader("src/data/spotify_songs.csv")
        df = loader.load_data()
        info = loader.get_basic_info()
        print("\n=== Basic Data Info ===")
        print(info)

        analyzer = DataAnalyzer(df)
        numeric_report = analyzer.analyze_numeric_features()
        print("\n=== Numeric Features Analysis ===")
        print(numeric_report)

        analyzer.plot_feature_distributions(
            features=['danceability', 'energy', 'loudness', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'],
            save_path='feature_distributions.png'
        )
        print("Saved feature distributions plot to 'feature_distributions.png'")

        return True
    except Exception as e:
        print(f"Error during testing: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting basic data analysis test...")
    success = test_data_loading()
    if success:
        print("\nBasic data analysis completed successfully!")
    else:
        print("\nBasic data analysis failed!") 