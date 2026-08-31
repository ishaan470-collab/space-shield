import sys
import os
import unittest

# Add backend and parent directory to PYTHONPATH to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.services.ml_service import predict_collision_risk, load_model_assets
from app.services.satellite_service import calculate_orbital_elements

class TestSpaceShieldAPI(unittest.TestCase):

    def setUp(self):
        # Force model assets load
        load_model_assets()

    def test_orbital_period_calculation(self):
        """
        Tests calculation of orbital elements (altitude, velocity, period) from mean motion.
        For ISS: Mean motion ~ 15.5 revs/day.
        """
        alt, vel, period = calculate_orbital_elements(15.498, 0.0004)
        
        # Check physically consistent bounds for ISS LEO altitude (~350 - 450 km)
        self.assertTrue(380.0 <= alt <= 460.0, f"Expected LEO altitude, got {alt} km")
        # Speed for LEO should be ~ 7.5 - 7.8 km/s
        self.assertTrue(7.4 <= vel <= 7.8, f"Expected speed ~7.6 km/s, got {vel} km/s")
        # Period should be ~ 92-93 minutes
        self.assertTrue(91.0 <= period <= 94.0, f"Expected period ~92.8 min, got {period} min")

    def test_low_risk_prediction(self):
        """
        Assess an extremely low risk scenario (high distance, low velocity).
        """
        inputs = {
            "altitude": 400.0,
            "velocity": 7.67,
            "inclination": 51.6,
            "orbital_period": 92.8,
            "relative_distance": 35.0,  # 35 km away is very safe
            "relative_velocity": 1.2
        }
        
        prediction, confidence, explanations, attributions = predict_collision_risk(inputs)
        
        self.assertEqual(prediction, "Low Risk")
        self.assertTrue(confidence >= 0.5)
        self.assertTrue(len(explanations) > 0)
        self.assertTrue("Relative Distance" in attributions)

    def test_high_risk_prediction(self):
        """
        Assess an extremely high risk scenario (close distance, high relative velocity).
        """
        inputs = {
            "altitude": 400.0,
            "velocity": 7.67,
            "inclination": 51.6,
            "orbital_period": 92.8,
            "relative_distance": 0.2,   # 200 meters is critical
            "relative_velocity": 14.5   # extremely fast crossing
        }
        
        prediction, confidence, explanations, attributions = predict_collision_risk(inputs)
        
        self.assertEqual(prediction, "High Risk")
        self.assertTrue(confidence >= 0.5)
        self.assertTrue(len(explanations) > 0)
        # Low distance should be an important feature
        self.assertTrue(attributions["Relative Distance"] > 0)

if __name__ == '__main__':
    unittest.main()
