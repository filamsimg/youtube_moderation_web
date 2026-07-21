import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

# Set cache directory to a specific path
CACHE_DIR = os.environ.get("HF_HOME", "/app/hf_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

MODEL_PATH = "filamss/bert-judol-indonesia"
SENTIMENT_MODEL = "mdhugol/indonesia-bert-sentiment-classification"

def download_models():
    print(f"Using HF_HOME cache directory: {CACHE_DIR}")
    
    print(f"1. Downloading spam classification model: {MODEL_PATH}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, cache_dir=CACHE_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH, cache_dir=CACHE_DIR)
    
    print(f"2. Downloading sentiment analysis model: {SENTIMENT_MODEL}")
    # Using pipeline is safer to ensure all files (config, model, tokenizer, special tokens) are correctly cached
    pipeline("sentiment-analysis", model=SENTIMENT_MODEL, cache_dir=CACHE_DIR)
    
    print("All models successfully cached!")

if __name__ == "__main__":
    download_models()
