import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class DataAnalyzer:
    def __init__(self, data: pd.DataFrame):
        self.data = data
        
    def analyze_numeric_features(self) -> Dict[str, Any]:
        numeric_columns = self.data.select_dtypes(include=[np.number]).columns
        stats = self.data[numeric_columns].describe()
        correlations = self.data[numeric_columns].corr()
        
        return {
            "descriptive_stats": stats.to_dict(),
            "correlations": correlations.to_dict()
        }
    
    def analyze_categorical_features(self) -> Dict[str, Any]:
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
    
    def plot_feature_distributions(self, features: List[str], save_path: str = None):
        n_features = len(features)
        fig, axes = plt.subplots(n_features, 1, figsize=(10, 5*n_features))
        
        if n_features == 1:
            axes = [axes]
            
        for ax, feature in zip(axes, features):
            if self.data[feature].dtype in [np.float64, np.int64]:
                sns.histplot(data=self.data, x=feature, ax=ax)
            else:
                sns.countplot(data=self.data, y=feature, ax=ax)
            ax.set_title(f'Distribution of {feature}')
            
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
        plt.close()
    
    def plot_correlation_matrix(self, save_path: str = None):
        numeric_columns = self.data.select_dtypes(include=[np.number]).columns
        corr_matrix = self.data[numeric_columns].corr()
        
        plt.figure(figsize=(12, 8))
        sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0)
        plt.title('Correlation Matrix')
        
        if save_path:
            plt.savefig(save_path)
        plt.close()
    
    def generate_report(self, save_dir: str = None) -> Dict[str, Any]:
        report = {
            "numeric_analysis": self.analyze_numeric_features(),
            "categorical_analysis": self.analyze_categorical_features()
        }
        
        if save_dir:
            numeric_columns = self.data.select_dtypes(include=[np.number]).columns
            self.plot_feature_distributions(
                numeric_columns[:5].tolist(),
                f"{save_dir}/numeric_distributions.png"
            )
            
            self.plot_correlation_matrix(f"{save_dir}/correlation_matrix.png")
            
        return report

if __name__ == "__main__":
    from data_loader import DataLoader
    
    loader = DataLoader("../../data/spotify_songs.csv")
    data = loader.load_data()
    
    analyzer = DataAnalyzer(data)
    report = analyzer.generate_report("../../notebooks/analysis") 