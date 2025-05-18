import pandas as pd
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataLoader:
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.data = None
        
    def load_data(self) -> pd.DataFrame:
        try:
            logger.info(f"Loading data from {self.data_path}")
            self.data = pd.read_csv(self.data_path)
            logger.info(f"Successfully loaded {len(self.data)} records")
            return self.data
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise
            
    def get_basic_info(self) -> dict:
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first")
            
        info = {
            "shape": self.data.shape,
            "columns": list(self.data.columns),
            "missing_values": self.data.isnull().sum().to_dict(),
            "dtypes": self.data.dtypes.to_dict()
        }
        
        return info
    
    def preprocess_data(self) -> pd.DataFrame:
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first")
            
        self.data = self.data.drop_duplicates()
        
        numeric_columns = self.data.select_dtypes(include=[np.number]).columns
        self.data[numeric_columns] = self.data[numeric_columns].fillna(self.data[numeric_columns].mean())
        
        text_columns = self.data.select_dtypes(include=['object']).columns
        self.data[text_columns] = self.data[text_columns].fillna('')
        
        return self.data

if __name__ == "__main__":
    loader = DataLoader("../../data/spotify_songs.csv")
    data = loader.load_data()
    info = loader.get_basic_info()
    processed_data = loader.preprocess_data() 