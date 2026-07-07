import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import joblib
import os
import sys
import kagglehub

def train_model():
    dataset_path = "Symptom2Disease.csv"
    print(f"Loading dataset from {dataset_path}...")
    try:
        df = pd.read_csv(dataset_path)
        # Drop the first unnamed column if it exists (Kaggle/GitHub index column)
        if df.columns[0] == "Unnamed: 0":
            df = df.drop(df.columns[0], axis=1)
    except Exception as e:
        print(f"Failed to read dataset: {e}")
        sys.exit(1)
    
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
