# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from groq import Groq
import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
load_dotenv()
import json

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client (Ensure GROQ_API_KEY is in your environment variables)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class RequestModel(BaseModel):
    department: str
    quantity: int
    description: str

@app.get("/")
def read_root():
    return {"message": "ScholiFi API is running"}

@app.post("/api/login")
def login(registration_number: str):
    prefix = registration_number[:3].upper()
    if prefix == "PRO":
        return {"role": "Professor", "id": registration_number}
    elif prefix == "ADM":
        return {"role": "Admin", "id": registration_number}
    elif prefix == "VEN":
        return {"role": "Vendor", "id": registration_number}
    else:
        raise HTTPException(status_code=401, detail="Invalid Registration Number")

@app.post("/api/generate-rfp")
def generate_rfp(request: RequestModel):
    prompt = f"Write a professional Request for Proposal (RFP) for a school {request.department} department. The requirement is to procure {request.quantity} units of: {request.description}. Keep it under 150 words and output only the RFP text.Dont use * anywhere in you output. Make up a hypothetical example of why you need the item."
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", 
        )
        return {"rfp_text": chat_completion.choices[0].message.content}
    except Exception as e:
        print(f"Groq API Error Details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/estimate-cost")
def estimate_cost(request: RequestModel):
    # 1. Give the AI a strict persona
    system_prompt = """
    You are an expert school procurement officer in India. 
    Estimate the realistic total market cost in INR (₹) for the requested items. 
    Respond ONLY with a valid JSON object containing a single key "cost" mapped to an integer.
    Example: {"cost": 15000}. 
    """
    
    user_prompt = f"Estimate the total cost for {request.quantity} units of: '{request.description}'."
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"} # 2. Force Groq to return valid JSON
        )
        
        # 3. Safely parse the JSON
        response_text = chat_completion.choices[0].message.content
        data = json.loads(response_text)
        
        # 4. Extract the integer safely
        estimated_cost = int(data.get("cost", 0))
        
        return {"estimated_cost": estimated_cost}
    except Exception as e:
        print(f"Groq API Error Details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to estimate cost")
