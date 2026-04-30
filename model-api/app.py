from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch
import torch.nn.functional as F
import os
import random
import numpy as np
import re
import unicodedata
import string

# Set seed untuk hasil yang konsisten (Deterministik)
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

app = Flask(__name__)
CORS(app)

# Load Model & Tokenizer dari Hugging Face Hub
MODEL_PATH = "filamss/bert-judol-indonesia"

print(f"Loading model from Hugging Face: {MODEL_PATH}")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

# Load Sentiment Model
print("Loading sentiment model (Lighter version)...")
sentiment_analyzer = pipeline("sentiment-analysis", model="mdhugol/indonesia-bert-sentiment-classification")

# Mapping Label (Sesuaikan jika urutannya berbeda)
# Biasanya: 0 = Normal, 1 = Spam
LABEL_MAP = {
    0: "Normal",
    1: "Spam"
}

# --- TEXT CLEANSING UTILITIES FROM COLAB ---
LEET_DICT = {"4":"a", "7":"t", "0":"o", "1":"i", "3":"e", "5":"s", "@":"a"}
url_re = re.compile(r"(https?://\S+|www\.\S+)", re.IGNORECASE)
DOMAIN_EXCLUDE = re.compile(r"\.(com|net|org|id|xyz|biz|info|io|gov|edu)\b", re.IGNORECASE)

def fold_spaced_words(text):
    return re.sub(r"\b(?:[a-z]\s+){2,}[a-z]\b",
                  lambda m: m.group(0).replace(" ", ""),
                  text)

def selective_leet_fix(match):
    word = match.group(0)
    if DOMAIN_EXCLUDE.search(word):
        return word

    if re.search(r'[a-z]', word):
        suffix_digits = re.search(r'\d+\b$', word)
        safe_index = suffix_digits.start() if suffix_digits else len(word)

        new_word = ""
        for i, char in enumerate(word):
            if char in LEET_DICT and i < safe_index:
                new_word += LEET_DICT[char]
            else:
                new_word += char
        return new_word
    return word

def clean_text(text):
    if not isinstance(text, str):
        return ""
    t = unicodedata.normalize("NFKC", text).lower()
    t = re.sub(r'\b[a-z0-9@.]+\b', selective_leet_fix, t)
    t = fold_spaced_words(t)
    t = re.sub(r'([a-z])\1{2,}', r'\1\1', t)
    t = t.encode('ascii', 'ignore').decode('ascii')
    t = t.translate(str.maketrans('', '', string.punctuation))
    t = re.sub(r"\s+", " ", t).strip()
    return t
# -------------------------------------------

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        text = data.get('text', '')

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Text Cleansing (Train-Serving Skew Fix)
        cleaned_text = clean_text(text)

        # Tokenization
        inputs = tokenizer(cleaned_text, return_tensors="pt", truncation=True, padding=True, max_length=128)

        # Inference
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = F.softmax(logits, dim=1)
            confidence, predicted_class_id = torch.max(probs, dim=1)

        label_id = predicted_class_id.item()
        label_name = LABEL_MAP.get(label_id, f"LABEL_{label_id}")
        
        # Sentiment Analysis
        sentiment_result = sentiment_analyzer(cleaned_text)[0]
        raw_sentiment = sentiment_result['label'].upper() # Pastikan uppercase untuk perbandingan
        
        # Mapping lebih robust
        sentiment_label = 'neutral' # Default
        if raw_sentiment in ['LABEL_0', 'POSITIVE']: 
            sentiment_label = 'positive'
        elif raw_sentiment in ['LABEL_1', 'NEUTRAL']: 
            sentiment_label = 'neutral'
        elif raw_sentiment in ['LABEL_2', 'NEGATIVE']: 
            sentiment_label = 'negative'
        else:
            # Jika model sudah memberikan label teks sendiri
            sentiment_label = raw_sentiment.lower()

        print(f"Original: {text[:30]}... | Cleaned: {cleaned_text[:30]}... | Sentiment: {sentiment_label}")
        
        return jsonify({
            "label": label_name,
            "confidence": float(confidence.item()),
            "label_id": label_id,
            "sentiment": sentiment_label,
            "sentiment_score": float(sentiment_result['score'])
        })

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Jalankan di port 5000 agar sesuai dengan settingan .env di web-app
    app.run(host='0.0.0.0', port=5000, debug=True)
