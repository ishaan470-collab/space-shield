from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    predictions = relationship("PredictionHistory", back_populates="user", cascade="all, delete-orphan")

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    satellite_name = Column(String, nullable=False)
    altitude = Column(Float, nullable=False)
    velocity = Column(Float, nullable=False)
    inclination = Column(Float, nullable=False)
    orbital_period = Column(Float, nullable=False)
    relative_distance = Column(Float, nullable=False)
    relative_velocity = Column(Float, nullable=False)
    
    prediction = Column(String, nullable=False)  # "Low Risk", "Medium Risk", "High Risk"
    confidence = Column(Float, nullable=False)   # Probability score
    explanation = Column(Text, nullable=True)     # JSON-serialized explanation notes
    feature_importance = Column(Text, nullable=True) # JSON-serialized shap/feature importance dictionary
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="predictions")

class SatelliteCache(Base):
    __tablename__ = "satellite_cache"

    id = Column(Integer, primary_key=True, index=True)
    satellite_name = Column(String, nullable=False)
    norad_id = Column(String, unique=True, index=True, nullable=False)
    altitude = Column(Float, nullable=False)
    velocity = Column(Float, nullable=False)
    inclination = Column(Float, nullable=False)
    orbital_period = Column(Float, nullable=False)
    eccentricity = Column(Float, nullable=False)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
