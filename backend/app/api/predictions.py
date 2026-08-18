import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.models import PredictionHistory, User
from backend.app.models.schemas import (
    PredictRequest, PredictResponse, PredictionHistoryResponse,
    SatelliteSearchResponse, AnalyticsDashboardResponse, RiskDistribution
)
from backend.app.api.auth import get_current_user
from backend.app.services.satellite_service import search_satellite
from backend.app.services.ml_service import predict_collision_risk

router = APIRouter(tags=["Predictions & Satellites"])

@router.get("/api/satellite/search", response_model=SatelliteSearchResponse)
def search_sat(query: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    sat_info = search_satellite(query, db)
    if not sat_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satellite '{query}' not found on Celestrak or in local cache."
        )
    return sat_info

@router.post("/api/predict", response_model=PredictResponse)
def predict_collision(
    request: PredictRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inputs = {
        "altitude": request.altitude,
        "velocity": request.velocity,
        "inclination": request.inclination,
        "orbital_period": request.orbital_period,
        "relative_distance": request.relative_distance,
        "relative_velocity": request.relative_velocity
    }
    
    try:
        prediction_text, confidence, explanations, attributions = predict_collision_risk(inputs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML Model Inference failed: {str(e)}"
        )
        
    # Create History object
    db_history = PredictionHistory(
        user_id=current_user.id if current_user else None,
        satellite_name=request.satellite_name,
        altitude=request.altitude,
        velocity=request.velocity,
        inclination=request.inclination,
        orbital_period=request.orbital_period,
        relative_distance=request.relative_distance,
        relative_velocity=request.relative_velocity,
        prediction=prediction_text,
        confidence=confidence,
        explanation=json.dumps(explanations),
        feature_importance=json.dumps(attributions),
        timestamp=datetime.datetime.utcnow()
    )
    
    db.add(db_history)
    try:
        db.commit()
        db.refresh(db_history)
    except Exception as e:
        db.rollback()
        print(f"Failed to save prediction history: {e}")
        
    return PredictResponse(
        id=db_history.id,
        satellite_name=db_history.satellite_name,
        altitude=db_history.altitude,
        velocity=db_history.velocity,
        inclination=db_history.inclination,
        orbital_period=db_history.orbital_period,
        relative_distance=db_history.relative_distance,
        relative_velocity=db_history.relative_velocity,
        prediction=db_history.prediction,
        confidence=db_history.confidence,
        explanation=explanations,
        feature_importance=attributions,
        timestamp=db_history.timestamp
    )

@router.get("/api/history", response_model=List[PredictionHistoryResponse])
def get_prediction_history(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve prediction history. If logged in, returns user's predictions.
    If guest, returns guest predictions (user_id is null).
    """
    if current_user:
        history_list = db.query(PredictionHistory).filter(
            PredictionHistory.user_id == current_user.id
        ).order_by(PredictionHistory.timestamp.desc()).all()
    else:
        # Return recent guest predictions
        history_list = db.query(PredictionHistory).filter(
            PredictionHistory.user_id == None
        ).order_by(PredictionHistory.timestamp.desc()).limit(30).all()
        
    responses = []
    for item in history_list:
        try:
            exps = json.loads(item.explanation) if item.explanation else []
        except Exception:
            exps = []
            
        try:
            feats = json.loads(item.feature_importance) if item.feature_importance else {}
        except Exception:
            feats = {}
            
        responses.append(
            PredictionHistoryResponse(
                id=item.id,
                user_id=item.user_id,
                satellite_name=item.satellite_name,
                altitude=item.altitude,
                velocity=item.velocity,
                inclination=item.inclination,
                orbital_period=item.orbital_period,
                relative_distance=item.relative_distance,
                relative_velocity=item.relative_velocity,
                prediction=item.prediction,
                confidence=item.confidence,
                explanation=exps,
                feature_importance=feats,
                timestamp=item.timestamp
            )
        )
    return responses

@router.delete("/api/history/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prediction_history(
    prediction_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history_item = db.query(PredictionHistory).filter(PredictionHistory.id == prediction_id).first()
    if not history_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found."
        )
        
    # Check permissions: if registered user, must own it. If guest, can only delete guest records.
    if current_user:
        if history_item.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this record."
            )
    else:
        if history_item.user_id is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete registered user records."
            )
            
    db.delete(history_item)
    db.commit()
    return

@router.get("/api/analytics", response_model=AnalyticsDashboardResponse)
def get_analytics(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Gathers metrics for analytics charts and summaries.
    """
    # Base query filters
    if current_user:
        base_query = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id)
    else:
        base_query = db.query(PredictionHistory).filter(PredictionHistory.user_id == None)
        
    total = base_query.count()
    
    if total == 0:
        return AnalyticsDashboardResponse(
            total_predictions=0,
            average_confidence=0.0,
            risk_distribution=RiskDistribution(low=0, medium=0, high=0),
            recent_predictions=[]
        )
        
    avg_conf = db.query(func.avg(PredictionHistory.confidence)).filter(
        PredictionHistory.user_id == (current_user.id if current_user else None)
    ).scalar() or 0.0
    
    # Calculate Risk Distribution counts
    low_cnt = base_query.filter(PredictionHistory.prediction == "Low Risk").count()
    med_cnt = base_query.filter(PredictionHistory.prediction == "Medium Risk").count()
    high_cnt = base_query.filter(PredictionHistory.prediction == "High Risk").count()
    
    # Fetch recent predictions (limit 5)
    recent_items = base_query.order_by(PredictionHistory.timestamp.desc()).limit(5).all()
    recent_responses = []
    
    for item in recent_items:
        try:
            exps = json.loads(item.explanation) if item.explanation else []
        except Exception:
            exps = []
            
        try:
            feats = json.loads(item.feature_importance) if item.feature_importance else {}
        except Exception:
            feats = {}
            
        recent_responses.append(
            PredictionHistoryResponse(
                id=item.id,
                user_id=item.user_id,
                satellite_name=item.satellite_name,
                altitude=item.altitude,
                velocity=item.velocity,
                inclination=item.inclination,
                orbital_period=item.orbital_period,
                relative_distance=item.relative_distance,
                relative_velocity=item.relative_velocity,
                prediction=item.prediction,
                confidence=item.confidence,
                explanation=exps,
                feature_importance=feats,
                timestamp=item.timestamp
            )
        )
        
    return AnalyticsDashboardResponse(
        total_predictions=total,
        average_confidence=round(float(avg_conf), 4),
        risk_distribution=RiskDistribution(low=low_cnt, medium=med_cnt, high=high_cnt),
        recent_predictions=recent_responses
    )
