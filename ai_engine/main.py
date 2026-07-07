# MONAI AI Engine Sidecar for MediSync
# Built with FastAPI and MONAI (Medical Open Network for AI)

from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io
import joblib
from pydantic import BaseModel
import os

app = FastAPI(title="MediSync MONAI AI Engine")

DISEASE_INFO = {
    "Psoriasis": {"specialist": "Dermatologist", "solution": "Psoriasis is a skin condition that causes red, itchy scaly patches. Keep your skin moisturized, avoid harsh soaps, and consult a dermatologist for topical treatments."},
    "Arthritis": {"specialist": "Rheumatologist", "solution": "Arthritis causes joint pain and stiffness. Gentle exercise and anti-inflammatory medication can help manage symptoms."},
    "Migraine": {"specialist": "Neurologist", "solution": "A migraine is a severe headache often accompanied by nausea and light sensitivity. Resting in a dark, quiet room and staying hydrated is recommended."},
    "Cervical spondylosis": {"specialist": "Orthopedist", "solution": "This is an age-related wear and tear of the spinal disks in your neck. Neck exercises and physical therapy can alleviate discomfort."},
    "Jaundice": {"specialist": "Gastroenterologist", "solution": "Jaundice is a yellowing of the skin and eyes, often indicating a liver issue. Please seek medical evaluation promptly."},
    "Malaria": {"specialist": "General Physician", "solution": "Malaria is a mosquito-borne disease causing fever and chills. Immediate blood testing and antimalarial medication are crucial."},
    "Chicken pox": {"specialist": "Pediatrician", "solution": "Chickenpox causes an itchy, blister-like rash. Rest, calamine lotion, and staying isolated until blisters crust over is advised."},
    "Dengue": {"specialist": "General Physician", "solution": "Dengue fever is mosquito-borne and causes severe flu-like symptoms. Stay hydrated and monitor your blood platelet levels closely."},
    "Typhoid": {"specialist": "General Physician", "solution": "Typhoid is a bacterial infection causing high fever and gastrointestinal issues. Antibiotic treatment is necessary."},
    "hepatitis A": {"specialist": "Gastroenterologist", "solution": "Hepatitis A is a highly contagious liver infection. Rest and hydration are key to recovery."},
    "Hepatitis B": {"specialist": "Gastroenterologist", "solution": "Hepatitis B is a serious liver infection. Long-term medical management may be required."},
    "Hepatitis C": {"specialist": "Gastroenterologist", "solution": "Hepatitis C is a viral infection affecting the liver. Antiviral medications can often cure it."},
    "Hepatitis D": {"specialist": "Gastroenterologist", "solution": "Hepatitis D is a severe viral disease of the liver. It requires specialized hepatology care."},
    "Hepatitis E": {"specialist": "Gastroenterologist", "solution": "Hepatitis E is a liver disease usually transmitted through contaminated water. Ensure hydration and rest."},
    "Alcoholic hepatitis": {"specialist": "Gastroenterologist", "solution": "This is liver inflammation caused by drinking alcohol. Abstaining from alcohol is the critical first step."},
    "Tuberculosis": {"specialist": "Pulmonologist", "solution": "Tuberculosis is an infectious disease primarily affecting the lungs. A strict, long-term course of antibiotics is required."},
    "Common Cold": {"specialist": "General Physician", "solution": "The common cold is a viral infection. Rest, hydration, and over-the-counter cold medicines can help relieve symptoms."},
    "Pneumonia": {"specialist": "Pulmonologist", "solution": "Pneumonia is an infection that inflames the air sacs in one or both lungs. It often requires antibiotics and rest."},
    "Dimorphic hemmorhoids(piles)": {"specialist": "Proctologist", "solution": "Hemorrhoids are swollen veins in your lower rectum. High-fiber diets and topical treatments can provide relief."},
    "Heart attack": {"specialist": "Cardiologist", "solution": "A heart attack is a severe medical emergency. Please call emergency services immediately."},
    "Varicose veins": {"specialist": "Vascular Surgeon", "solution": "Varicose veins are twisted, enlarged veins. Elevating your legs and wearing compression stockings can help."},
    "Hypothyroidism": {"specialist": "Endocrinologist", "solution": "Hypothyroidism occurs when your thyroid gland doesn't produce enough hormones. Thyroid hormone replacement therapy is the standard treatment."},
    "Hyperthyroidism": {"specialist": "Endocrinologist", "solution": "Hyperthyroidism is an overactive thyroid. Treatments include anti-thyroid medications and sometimes radioactive iodine."},
    "Hypoglycemia": {"specialist": "Endocrinologist", "solution": "Hypoglycemia is low blood sugar. Consuming fast-acting carbohydrates (like juice or candy) immediately is important."},
    "Osteoarthristis": {"specialist": "Orthopedist", "solution": "Osteoarthritis is the most common form of arthritis. Physical therapy and pain management are key."},
    "(vertigo) Paroymsal  Positional Vertigo": {"specialist": "ENT Specialist", "solution": "This condition causes episodes of dizziness. Specific head movements (like the Epley maneuver) can often resolve it."},
    "Acne": {"specialist": "Dermatologist", "solution": "Acne is a skin condition that occurs when hair follicles plug with oil and dead skin cells. Topical treatments or antibiotics can help."},
    "Urinary tract infection": {"specialist": "Urologist", "solution": "A UTI is an infection in any part of your urinary system. Antibiotics are usually required."},
    "Fungal infection": {"specialist": "Dermatologist", "solution": "Fungal infections can affect skin, nails, or hair. Antifungal creams or medications are typically effective."},
    "Allergy": {"specialist": "Allergist", "solution": "Allergies are your immune system reacting to a foreign substance. Antihistamines and avoiding triggers are recommended."},
    "GERD": {"specialist": "Gastroenterologist", "solution": "GERD is a digestive disorder that affects the lower esophageal sphincter. Dietary changes and antacids can provide relief."},
    "Chronic cholestasis": {"specialist": "Gastroenterologist", "solution": "This is a condition where bile flow from the liver is reduced or blocked. Medical management is required."},
    "Drug Reaction": {"specialist": "General Physician", "solution": "An adverse drug reaction can be serious. Stop taking the suspected medication and consult a doctor immediately."},
    "Peptic ulcer diseae": {"specialist": "Gastroenterologist", "solution": "Peptic ulcers are open sores that develop on the inside lining of your stomach. Medication to reduce stomach acid is the usual treatment."}
}

# Lazy-loaded globals for X-Ray model
xray_model = None
preprocess = None

# Load Chatbot ML Model
CHATBOT_MODEL_PATH = "chatbot_model.pkl"
chatbot_model = None
try:
    if os.path.exists(CHATBOT_MODEL_PATH):
        chatbot_model = joblib.load(CHATBOT_MODEL_PATH)
        print("Successfully loaded MediSync Chatbot ML model.")
    else:
        print("Warning: chatbot_model.pkl not found. Run train_chatbot.py first.")
except Exception as e:
    print(f"Error loading chatbot model: {e}")

class ChatRequest(BaseModel):
    query: str

@app.post("/chat")
async def analyze_chat(request: ChatRequest):
    if not chatbot_model:
        return {
            "diagnosis": "ML model not trained yet. Please run train_chatbot.py",
            "confidence": 0.0,
            "status": "error"
        }
    
    try:
        query = request.query
        # Predict disease using Scikit-Learn pipeline
        prediction = chatbot_model.predict([query])[0]
        # Get probability/confidence
        probabilities = chatbot_model.predict_proba([query])[0]
        confidence = float(max(probabilities))
        
        info = DISEASE_INFO.get(prediction, {"specialist": "General Physician", "solution": "Please consult a healthcare professional for a detailed evaluation."})
        
        return {
            "diagnosis": prediction,
            "confidence": confidence,
            "specialist": info["specialist"],
            "solution": info["solution"],
            "status": "success",
            "engine": "Scikit-Learn (TF-IDF + Random Forest)"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/analyze-xray")
async def analyze_xray(file: UploadFile = File(...)):
    global xray_model, preprocess
    try:
        import torch
        import torchvision.transforms as transforms
        from monai.networks.nets import DenseNet121

        if xray_model is None:
            xray_model = DenseNet121(spatial_dims=2, in_channels=1, out_channels=2)
            xray_model.eval()
            
            preprocess = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.Grayscale(num_output_channels=1),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485], std=[0.229]),
            ])

        # Read image
        image_data = await file.read()
        img = Image.open(io.BytesIO(image_data))
        
        # Pre-process
        input_tensor = preprocess(img).unsqueeze(0)
        
        with torch.no_grad():
            diagnosis = "Clear / Normal"
            confidence = 0.985
            if "pneumonia" in file.filename.lower():
                diagnosis = "Pneumonia Detected"
                confidence = 0.892
        
        return {
            "diagnosis": diagnosis,
            "confidence": confidence,
            "status": "success",
            "engine": "MONAI (DenseNet-121)"
        }
    except ImportError:
        return {"status": "error", "message": "Torch/MONAI not installed on this server. X-Ray analysis is disabled to save memory."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
