import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report

def engineer_features(df):
    # Create copy to avoid modifying original df
    data = df.copy()
    
    # Derived features
    # 1. Approach Risk Index = Relative Velocity / (Relative Distance + epsilon)
    # A higher relative velocity at closer distance indicates extreme threat
    data['approach_risk_index'] = data['relative_velocity'] / (data['relative_distance'] + 1e-5)
    
    # 2. Kinetic energy proxy (relative velocity squared)
    data['kinetic_energy_proxy'] = data['relative_velocity'] ** 2
    
    # 3. Log of relative distance (since it varies exponentially)
    data['log_relative_distance'] = np.log(data['relative_distance'] + 1e-5)
    
    # 4. Inclination difference threat level
    # Orbits crossing at high inclination differences are high risk
    # (Since we don't have debris inclination, we can use absolute inclination as a proxy for region density)
    # Satellites at high inclinations (e.g. polar orbits around 90 degrees) are in highly congested zones
    data['congested_zone_proxy'] = np.abs(np.sin(np.radians(data['inclination'])))
    
    return data

def main():
    dataset_path = 'ml/dataset/satellite_collision_dataset.csv'
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}. Please run generate_dataset.py first.")
        return
        
    print("Loading dataset...")
    df = pd.read_csv(dataset_path)
    
    print("Performing feature engineering...")
    df_engineered = engineer_features(df)
    
    # Feature columns and target column
    feature_cols = [
        'altitude', 'velocity', 'inclination', 'orbital_period', 
        'relative_distance', 'relative_velocity',
        'approach_risk_index', 'kinetic_energy_proxy', 
        'log_relative_distance', 'congested_zone_proxy'
    ]
    target_col = 'risk_class'
    
    X = df_engineered[feature_cols]
    y = df_engineered[target_col]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Define models
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Decision Tree': DecisionTreeClassifier(random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Gradient Boosting': GradientBoostingClassifier(random_state=42)
    }
    
    best_acc = 0.0
    best_model_name = ""
    best_model = None
    
    print("\nEvaluating models:")
    print("-" * 60)
    
    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        preds = model.predict(X_test_scaled)
        
        acc = accuracy_score(y_test, preds)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, preds, average='macro')
        
        print(f"{name}:")
        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {precision:.4f}")
        print(f"  Recall:    {recall:.4f}")
        print(f"  F1 Score:  {f1:.4f}")
        print("-" * 60)
        
        if acc > best_acc:
            best_acc = acc
            best_model_name = name
            best_model = model
            
    print(f"\nBest Model: {best_model_name} with Accuracy {best_acc:.4f}")
    
    # Evaluate best model with details
    best_preds = best_model.predict(X_test_scaled)
    print("\nClassification Report (Best Model):")
    print(classification_report(y_test, best_preds, target_names=['Low Risk', 'Medium Risk', 'High Risk']))
    
    # Save the model
    os.makedirs('ml/saved_models', exist_ok=True)
    
    model_save_path = 'ml/saved_models/collision_model.pkl'
    scaler_save_path = 'ml/saved_models/scaler.pkl'
    
    # We save a dictionary containing metadata, the model, and features
    model_data = {
        'model': best_model,
        'model_name': best_model_name,
        'features': feature_cols,
        'accuracy': best_acc
    }
    
    joblib.dump(model_data, model_save_path)
    joblib.dump(scaler, scaler_save_path)
    print(f"\nSaved model data to {model_save_path}")
    print(f"Saved scaler to {scaler_save_path}")
    
    # Print feature importance for tree-based best model
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        indices = np.argsort(importances)[::-1]
        print("\nFeature Importances:")
        for idx in indices:
            print(f"  {feature_cols[idx]}: {importances[idx]:.4f}")

if __name__ == '__main__':
    main()
