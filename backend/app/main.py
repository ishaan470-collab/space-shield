import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base
from backend.app.api import auth, predictions

# Create database tables at startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SpaceShield AI API",
    description="Backend API for predicting satellite collision risks using Machine Learning and live orbital data.",
    version="1.0.0"
)

# CORS middleware configuration
# Allows requests from localhost:3000 (Next.js default development server)
# and general hosts.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development ease. Can restrict to specific domains in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(predictions.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "SpaceShield AI API",
        "description": "AI-Powered Space Situational Awareness & Satellite Collision Risk Prediction Platform"
    }

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
