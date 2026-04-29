from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch
import torch.nn.functional as F
import os

app = Flask(__name__)
CORS(app)

# Load Model & Tokenizer
# Path relatif ke folder model_judol_bert
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model_judol_indobertweet")

print(f"Loading model from: {MODEL_PATH}")
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

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        text = data.get('text', '')

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Tokenization
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)

        # Inference
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = F.softmax(logits, dim=1)
            confidence, predicted_class_id = torch.max(probs, dim=1)

        label_id = predicted_class_id.item()
        label_name = LABEL_MAP.get(label_id, f"LABEL_{label_id}")
        
        # Sentiment Analysis
        sentiment_result = sentiment_analyzer(text)[0]
        sentiment_label = sentiment_result['label']
        
        # Mapping untuk model mdhugol/indonesia-bert-sentiment-classification
        # LABEL_0: positive, LABEL_1: neutral, LABEL_2: negative
        if sentiment_label == 'LABEL_0': sentiment_label = 'positive'
        elif sentiment_label == 'LABEL_1': sentiment_label = 'neutral'
        elif sentiment_label == 'LABEL_2': sentiment_label = 'negative'
        
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
