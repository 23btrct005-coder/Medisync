import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import joblib
import os
import sys

# Default to Kaggle Symptom2Disease dataset format if available
DATASET_PATH = "Symptom2Disease.csv"

def train_model():
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset '{DATASET_PATH}' not found in ai_engine directory.")
        print("Please download it from Kaggle (e.g., Symptom2Disease) and place it here.")
        print("For testing, I will create a small mock dataset.")
        
        # Create a mock dataset for testing purposes
        mock_data = {
            "label": ["Psoriasis", "Psoriasis", "Arthritis", "Arthritis", "Migraine", "Migraine", "Covid", "Covid"],
            "text": [
                "I have red scaly patches on my skin.",
                "My skin is peeling and extremely itchy with red spots.",
                "My joints are stiff and hurt when I wake up.",
                "I have severe pain in my knees and fingers.",
                "My head is throbbing and I hate bright lights.",
                "I have a terrible headache and feel nauseous.",
                "I lost my sense of smell and have a fever.",
                "I have a dry cough, fever, and feel very tired."
            ]
        }
        df = pd.DataFrame(mock_data)
        df.to_csv(DATASET_PATH, index=False)
        print(f"Created mock {DATASET_PATH} for training.")
        
    print(f"Loading dataset {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)
    
    # Assuming columns 'text' for symptoms and 'label' for disease.
    # Adjust column names if the downloaded Kaggle dataset is different.
    text_col = "text"
    label_col = "label"
    
    if text_col not in df.columns or label_col not in df.columns:
        print(f"Dataset must have '{text_col}' and '{label_col}' columns.")
        sys.exit(1)

    X = df[text_col]
    y = df[label_col]
    
    print("Performing 70:30 Train/Test Split...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Testing set: {len(X_test)} samples")
    
    print("Building NLP Pipeline (TF-IDF + Random Forest)...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000)),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    print("Training model...")
    pipeline.fit(X_train, y_train)
    
    print("Evaluating model...")
    accuracy = pipeline.score(X_test, y_test)
    print(f"Test Accuracy: {accuracy * 100:.2f}%")
    
    model_filename = "chatbot_model.pkl"
    joblib.dump(pipeline, model_filename)
    print(f"Model successfully trained and saved to {model_filename}")

if __name__ == "__main__":
    train_model()
