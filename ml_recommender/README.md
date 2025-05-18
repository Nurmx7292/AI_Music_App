# Music Recommender System

A machine learning-based music recommendation system using audio features and song lyrics.

## Project Structure

```
ml_recommender/
├── data/                  # Datasets
├── src/                   # Source code
│   ├── data/             # Data processing
│   ├── models/           # ML models
│   ├── utils/            # Utilities
│   └── api/              # API integration
├── notebooks/            # Jupyter notebooks
├── tests/                # Tests
└── requirements.txt      # Dependencies
```

## Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # for Linux/Mac
venv\Scripts\activate     # for Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Download required NLP models:
```bash
python -m spacy download en_core_web_sm
python -m nltk.downloader punkt stopwords
```

## Usage

[Usage description will be added after implementing core functionality]

## Development

[Development information will be added] 