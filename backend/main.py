import os
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
from PIL import Image
import io

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

KNOWN_FACES_DIR = "known_faces"

# DATABASE: Hardcoded relationships for your specific images
FAMILY_DATABASE = {
    "ADITYA": {
        "relation": "YOUR GRANDSON",
        "note": "He brought you lunch yesterday."
    },
    "CHAYAN": {
        "relation": "YOUR NEPHEW",
        "note": "Lives in Bangalore. Visiting for the week."
    },
    "JAGATH": {
        "relation": "NEIGHBOR",
        "note": "Helps with groceries on Sundays."
    },
    "KESHAVA": {
        "relation": "DR. KESHAVA",
        "note": "Your Cardiologist. Appointment on Friday."
    },
    "RISHABH": {
        "relation": "CARETAKER",
        "note": "Shift ends at 6:00 PM."
    },
    "SHREY": {
        "relation": "CHESS PARTNER",
        "note": "You won the last game against him."
    }
    "GAYATHRI": {
        "relation": "GRAND DAUGHTER",
        "note": "You won the last game of chess against her."
    }
}

@app.get("/")
def home():
    return {"message": "Memora Backend Active"}

@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_array = np.array(image)

        # 1. Iterate through all known faces
        for filename in os.listdir(KNOWN_FACES_DIR):
            known_path = os.path.join(KNOWN_FACES_DIR, filename)
            
            # Verify face using VGG-Face model (Good balance of speed/accuracy)
            result = DeepFace.verify(
                img_array, 
                known_path, 
                enforce_detection=True, # Ensure a face actually exists
                model_name="VGG-Face"
            )
            
            if result["verified"]:
                # Match Found!
                raw_name = os.path.splitext(filename)[0] # e.g., "Aditya"
                name_key = raw_name.upper()
                
                # Get info from database
                info = FAMILY_DATABASE.get(name_key, {
                    "relation": "FRIEND", 
                    "note": "Known Associate"
                })
                
                return {
                    "status": "success", 
                    "name": raw_name, 
                    "relation": info["relation"],
                    "note": info["note"]
                }

        # 2. If loop finishes with no match, but face was detected
        return {"status": "unknown"}

    except ValueError:
        # DeepFace throws ValueError if NO FACE is detected in the frame
        return {"status": "no_face"}
    except Exception as e:
        return {"status": "error", "message": str(e)}