from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional
import datetime

# Authentication Schemas
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Prediction Schemas
class PredictRequest(BaseModel):
    satellite_name: Optional[str] = "Unknown Satellite"
    altitude: float = Field(..., ge=100.0, le=40000.0, description="Altitude in km")
    velocity: float = Field(..., ge=0.0, le=30.0, description="Velocity in km/s")
    inclination: float = Field(..., ge=0.0, le=180.0, description="Inclination in degrees")
    orbital_period: float = Field(..., ge=10.0, le=2000.0, description="Orbital period in minutes")
    relative_distance: float = Field(..., ge=0.001, le=1000.0, description="Distance to nearest debris in km")
    relative_velocity: float = Field(..., ge=0.0, le=50.0, description="Relative velocity in km/s")

class PredictResponse(BaseModel):
    id: Optional[int] = None
    satellite_name: str
    altitude: float
    velocity: float
    inclination: float
    orbital_period: float
    relative_distance: float
    relative_velocity: float
    prediction: str
    confidence: float
    explanation: List[str]
    feature_importance: Dict[str, float]
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class PredictionHistoryResponse(PredictResponse):
    id: int
    user_id: Optional[int] = None

# Satellite Query Schemas
class SatelliteSearchResponse(BaseModel):
    satellite_name: str
    norad_id: str
    altitude: float
    velocity: float
    inclination: float
    orbital_period: float
    eccentricity: float

    class Config:
        from_attributes = True

# Dashboard / Analytics Schemas
class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int

class FeatureImportanceResponse(BaseModel):
    feature_name: str
    importance: float

class AnalyticsDashboardResponse(BaseModel):
    total_predictions: int
    average_confidence: float
    risk_distribution: RiskDistribution
    recent_predictions: List[PredictionHistoryResponse]
