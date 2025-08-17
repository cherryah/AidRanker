from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import hashlib
import json

app = Flask(__name__)
CORS(app)

clf = pipeline("zero-shot-classification", model="joeddav/xlm-roberta-large-xnli")

labels_urgency = ["High urgency", "Medium urgency", "Low urgency"]

EXPECTED_TOKEN_HASH = hashlib.sha256('aidranker_secure'.encode()).hexdigest()

def verify_auth_token(token):
    """Verify the authentication token by comparing hashed values"""
    if not token:
        return False
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token_hash == EXPECTED_TOKEN_HASH

@app.route('/rank', methods=['POST'])
def rank_requests():
    try:
        data = request.get_json()
        
        auth_token = data.get('auth_token')
        if not verify_auth_token(auth_token):
            return jsonify({"error": "Invalid or missing authentication token"}), 401
        
        requests_data = data.get('requests', [])
        
        if not requests_data:
            return jsonify({"error": "No requests provided"}), 400
        
        results = []
        for req in requests_data:
            description = req.get('description', '')
            percent_done = req.get('percent_done', 0.0)
            
            u = clf(description, labels_urgency, multi_label=False)
            
            aggressive_score = u["scores"][0] * (1 + percent_done)
            
            results.append({
                "description": description,
                "percent_done": percent_done,
                "urgency_label": u["labels"][0],
                "urgency_score_model": u["scores"][0],
                "urgency_score_aggressive": aggressive_score,
                **{k: v for k, v in req.items() if k not in ['description', 'percent_done']}  # Include other fields
            })
        
        results.sort(key=lambda x: x["urgency_score_aggressive"], reverse=True)
        
        return jsonify({"ranked_requests": results})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)