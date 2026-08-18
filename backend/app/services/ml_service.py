import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

# Try importing shap, set flag
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("SHAP not available, using heuristic feature attribution fallback.")

# Resolve absolute paths relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "saved_models", "collision_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "ml", "saved_models", "scaler.pkl")

# Keep track of loaded models in memory
_model_data = None
_scaler = None
_shap_explainer = None

def load_model_assets():
    global _model_data, _scaler, _shap_explainer
    if _model_data is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
            raise FileNotFoundError("Model or Scaler binary not found. Please train the model first.")
        
        _model_data = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
        
        # Initialize SHAP explainer
        if SHAP_AVAILABLE:
            try:
                # The model is inside model_data dict
                model = _model_data['model']
                # Create a TreeExplainer for tree models (Random Forest or Gradient Boosting)
                _shap_explainer = shap.TreeExplainer(model)
            except Exception as e:
                print(f"Failed to initialize SHAP TreeExplainer: {e}. Falling back to heuristics.")
                _shap_explainer = None

def engineer_single_record(data: Dict) -> pd.DataFrame:
    """
    Applies the same feature engineering logic as training on a single dict record.
    """
    # Create dictionary matching the original training format
    record = {
        'altitude': float(data['altitude']),
        'velocity': float(data['velocity']),
        'inclination': float(data['inclination']),
        'orbital_period': float(data['orbital_period']),
        'relative_distance': float(data['relative_distance']),
        'relative_velocity': float(data['relative_velocity']),
    }
    
    # Derived features
    record['approach_risk_index'] = record['relative_velocity'] / (record['relative_distance'] + 1e-5)
    record['kinetic_energy_proxy'] = record['relative_velocity'] ** 2
    record['log_relative_distance'] = np.log(record['relative_distance'] + 1e-5)
    record['congested_zone_proxy'] = np.abs(np.sin(np.radians(record['inclination'])))
    
    # Return as single row DataFrame with columns in exact training order
    return pd.DataFrame([record])

def generate_natural_language_explanations(
    inputs: Dict, 
    prediction_class: int, 
    attributions: Dict[str, float]
) -> List[str]:
    """
    Generates educational explanations based on top feature attributions and physics rules.
    """
    explanations = []
    
    dist = inputs['relative_distance']
    rel_v = inputs['relative_velocity']
    inc = inputs['inclination']
    
    # Base explanation based on predicted risk level
    if prediction_class == 2:  # High Risk
        explanations.append("CRITICAL ALERT: The satellite is on a high-probability collision course.")
    elif prediction_class == 1:  # Medium Risk
        explanations.append("WARNING: Moderate collision risk detected. Closely monitor orbital parameters.")
    else:
        explanations.append("Safe Operations: No immediate collision threat detected.")

    # Distance-based explanation
    if dist < 1.0:
        explanations.append(f"Extremely close encounter: Debris is approaching within {dist:.2f} km, which is well within the safety bubble.")
    elif dist < 5.0:
        explanations.append(f"Close approach: Debris distance of {dist:.2f} km requires caution and potential tracking adjustment.")
    else:
        explanations.append(f"Safe clearance: Debris is passing at a distance of {dist:.2f} km.")
        
    # Relative Velocity / Kinetic Energy explanation
    if rel_v > 10.0:
        explanations.append(f"Hypervelocity impact danger: The relative velocity is extremely high ({rel_v:.2f} km/s, or ~{rel_v * 3600:.0f} km/h). Even a tiny debris particle would release kinetic energy equivalent to an explosion.")
    elif rel_v > 5.0:
        explanations.append(f"High-speed crossing: Debris is traveling at {rel_v:.2f} km/s relative to the satellite.")
        
    # Inclination / Congested zones explanation
    if 80.0 <= inc <= 100.0:
        explanations.append(f"Polar Orbit Hazard: The satellite's inclination of {inc:.1f}° places it in a polar orbit. Polar orbits are heavily populated with defunct spacecraft and debris, increasing crossing frequencies.")
    elif inc < 10.0:
        explanations.append(f"Equatorial Orbit: The inclination of {inc:.1f}° places it close to the equatorial plane.")

    # Explain using SHAP feature importance contributions
    # Find features with the highest absolute attribution
    sorted_features = sorted(attributions.items(), key=lambda x: abs(x[1]), reverse=True)
    top_feature, weight = sorted_features[0]
    
    if weight > 0:
        # Features that drive risk UP
        if top_feature in ['relative_distance', 'log_relative_distance']:
            explanations.append(f"Model analysis shows the primary risk driver is the proximity (low relative distance).")
        elif top_feature in ['relative_velocity', 'kinetic_energy_proxy']:
            explanations.append(f"Model analysis indicates the massive relative velocity ({rel_v:.2f} km/s) is the key contributor to the risk classification.")
        elif top_feature == 'approach_risk_index':
            explanations.append("The combined ratio of high velocity and small distance (Approach Risk Index) is the dominant factor driving the alert.")
    
    return explanations

def get_heuristic_attributions(inputs: Dict, prediction_class: int) -> Dict[str, float]:
    """
    Fallback explanation heuristic that mimics SHAP attribution using simple physical formulas.
    """
    dist = inputs['relative_distance']
    rel_v = inputs['relative_velocity']
    inc = inputs['inclination']
    
    # Calculate heuristic score contributions (0 to 1 scaling)
    # Smaller distance = higher risk contribution
    dist_contrib = max(0.0, 1.0 - (dist / 20.0))
    # Higher velocity = higher risk contribution
    vel_contrib = min(1.0, rel_v / 15.0)
    # Combined approach index contribution
    approach_contrib = min(1.0, (rel_v / (dist + 0.1)) / 10.0)
    # Inclination contribution (higher at polar orbits)
    inc_contrib = np.abs(np.sin(np.radians(inc))) * 0.2
    
    attributions = {
        'relative_distance': float(dist_contrib * 0.35),
        'log_relative_distance': float(dist_contrib * 0.35),
        'relative_velocity': float(vel_contrib * 0.1),
        'kinetic_energy_proxy': float(vel_contrib * 0.1),
        'approach_risk_index': float(approach_contrib * 0.2),
        'congested_zone_proxy': float(inc_contrib),
        'altitude': 0.01,
        'velocity': 0.01,
        'inclination': float(inc_contrib * 0.5),
        'orbital_period': 0.01
    }
    
    # Normalize attributions to sum to 1.0
    total = sum(abs(v) for v in attributions.values())
    if total > 0:
        attributions = {k: v / total for k, v in attributions.items()}
        
    return attributions

def predict_collision_risk(inputs: Dict) -> Tuple[str, float, List[str], Dict[str, float]]:
    """
    Main prediction logic:
    1. Preprocesses the input record.
    2. Runs model inference.
    3. Computes SHAP values or heuristic attributions.
    4. Generates explanation list.
    """
    load_model_assets()
    
    # Feature engineering
    df_engineered = engineer_single_record(inputs)
    feature_cols = _model_data['features']
    X = df_engineered[feature_cols]
    
    # Scale
    X_scaled = _scaler.transform(X)
    
    # Predict
    model = _model_data['model']
    probs = model.predict_proba(X_scaled)[0]
    pred_class = int(np.argmax(probs))
    confidence = float(probs[pred_class])
    
    # Map predictions classes back to text
    class_map = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}
    prediction_text = class_map[pred_class]
    
    # Compute attributions
    attributions = {}
    if _shap_explainer is not None:
        try:
            # Get SHAP values for this instance
            # shap_values is a list of arrays (one per class)
            # or a 3D array [samples, features, classes]
            raw_shap = _shap_explainer.shap_values(X_scaled)
            
            # Extract shap values for the predicted class
            if isinstance(raw_shap, list):
                # GradientBoosting / RandomForest inside scikit-learn
                # list contains [array(n_samples, n_features)] * n_classes
                class_shap = raw_shap[pred_class][0]
            elif isinstance(raw_shap, np.ndarray) and len(raw_shap.shape) == 3:
                # Shape is (samples, features, classes)
                class_shap = raw_shap[0, :, pred_class]
            elif isinstance(raw_shap, np.ndarray) and len(raw_shap.shape) == 2:
                # Sometimes shap returns a 2D array if model is binary, but we have 3 classes
                class_shap = raw_shap[0]
            else:
                # General fallback
                class_shap = raw_shap[0]
                
            # Map back to feature names
            for name, val in zip(feature_cols, class_shap):
                attributions[name] = float(val)
        except Exception as e:
            print(f"SHAP inference failed: {e}. Using fallback.")
            attributions = get_heuristic_attributions(inputs, pred_class)
    else:
        attributions = get_heuristic_attributions(inputs, pred_class)
        
    # Clean up engineered features for a cleaner user display of feature importances
    # Map engineered features back to user-friendly names
    user_friendly_attributions = {
        "Altitude": abs(attributions.get('altitude', 0) + attributions.get('orbital_period', 0)),
        "Velocity": abs(attributions.get('velocity', 0)),
        "Inclination": abs(attributions.get('inclination', 0) + attributions.get('congested_zone_proxy', 0)),
        "Relative Distance": abs(attributions.get('relative_distance', 0) + attributions.get('log_relative_distance', 0) + attributions.get('approach_risk_index', 0) * 0.5),
        "Relative Velocity": abs(attributions.get('relative_velocity', 0) + attributions.get('kinetic_energy_proxy', 0) + attributions.get('approach_risk_index', 0) * 0.5)
    }
    
    # Normalize user friendly attributions
    total_friendly = sum(user_friendly_attributions.values())
    if total_friendly > 0:
        user_friendly_attributions = {k: round(v / total_friendly, 4) for k, v in user_friendly_attributions.items()}
    else:
        user_friendly_attributions = {
            "Altitude": 0.1,
            "Velocity": 0.1,
            "Inclination": 0.1,
            "Relative Distance": 0.4,
            "Relative Velocity": 0.3
        }

    # Generate explanations
    explanations = generate_natural_language_explanations(inputs, pred_class, attributions)
    
    return prediction_text, confidence, explanations, user_friendly_attributions
