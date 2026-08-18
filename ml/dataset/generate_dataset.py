import numpy as np
import pandas as pd
import os

def generate_orbital_data(num_samples=5000, seed=42):
    np.random.seed(seed)
    
    # Earth parameters
    GM = 398600.44  # km^3/s^2
    R_E = 6371.0    # km (Earth radius)
    
    # 1. Generate Altitude (LEO: 300 to 2000 km)
    altitude = np.random.uniform(300.0, 2000.0, num_samples)
    
    # 2. Derive physical Velocity (v = sqrt(GM / (R_E + h))) in km/s
    orbital_radius = R_E + altitude
    velocity = np.sqrt(GM / orbital_radius) + np.random.normal(0, 0.02, num_samples)
    
    # 3. Derive physical Orbital Period in minutes (T = 2 * pi * sqrt(a^3 / GM))
    orbital_period_sec = 2 * np.pi * np.sqrt((orbital_radius) ** 3 / GM)
    orbital_period = (orbital_period_sec / 60.0) + np.random.normal(0, 0.1, num_samples)
    
    # 4. Generate Inclination (0 to 180 degrees)
    inclination = np.random.uniform(0.0, 180.0, num_samples)
    
    # 5. Generate Relative Distance of nearby debris (0.05 to 50.0 km)
    relative_distance = np.exp(np.random.uniform(np.log(0.05), np.log(50.0), num_samples))
    
    # 6. Generate Relative Velocity (0.1 to 16.0 km/s)
    relative_velocity = np.random.uniform(0.1, 16.0, num_samples)
    
    # Create DataFrame
    df = pd.DataFrame({
        'satellite_name': [f'SAT-{i:04d}' for i in range(num_samples)],
        'altitude': altitude,
        'velocity': velocity,
        'inclination': inclination,
        'orbital_period': orbital_period,
        'relative_distance': relative_distance,
        'relative_velocity': relative_velocity
    })
    
    # 7. Classify Risk
    # Risk classification rules:
    # High (2), Medium (1), Low (0)
    risk_classes = []
    
    for i in range(num_samples):
        d = relative_distance[i]
        v_rel = relative_velocity[i]
        
        # Base classification logic
        if d < 1.0:
            if v_rel > 6.0:
                p = [0.01, 0.09, 0.90]
            else:
                p = [0.05, 0.25, 0.70]
        elif d < 4.0:
            if v_rel > 8.0:
                p = [0.05, 0.35, 0.60]
            else:
                p = [0.15, 0.65, 0.20]
        elif d < 10.0:
            if v_rel > 10.0:
                p = [0.30, 0.60, 0.10]
            else:
                p = [0.70, 0.25, 0.05]
        elif d < 20.0:
            if v_rel > 12.0:
                p = [0.60, 0.35, 0.05]
            else:
                p = [0.90, 0.09, 0.01]
        else:
            p = [0.99, 0.01, 0.00]
            
        risk = np.random.choice([0, 1, 2], p=p)
        risk_classes.append(risk)
        
    df['risk_class'] = risk_classes
    
    return df

if __name__ == '__main__':
    # Ensure directory exists
    os.makedirs('ml/dataset', exist_ok=True)
    
    print("Generating synthetic satellite collision data...")
    df = generate_orbital_data(num_samples=6000)
    
    output_path = 'ml/dataset/satellite_collision_dataset.csv'
    df.to_csv(output_path, index=False)
    print(f"Dataset generated and saved to {output_path}")
    print("Class distribution:")
    print(df['risk_class'].value_counts())
