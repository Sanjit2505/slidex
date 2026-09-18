import os
import cv2
import numpy as np
from backend.ml_pipeline.predictor import Predictor

def create_dummy_images():
    img1 = np.ones((100, 100, 3), dtype=np.uint8) * 100
    img2 = np.ones((100, 100, 3), dtype=np.uint8) * 100
    cv2.rectangle(img2, (20, 20), (50, 50), (200, 50, 50), -1)
    
    cv2.imwrite("dummy1.png", img1)
    cv2.imwrite("dummy2.png", img2)
    return "dummy1.png", "dummy2.png"

def main():
    print("--- Starting ML Pipeline Verification ---")
    img1_path, img2_path = create_dummy_images()
    predictor = Predictor()

    test_scenarios = [
        ("Flat Plain (Delhi City Grid)", {"rainfall": 140.0, "vibration": 10.0, "earthquake_mag": 2.0, "slope_angle": 2.0, "soil_moisture": 55.0, "location_name": "Delhi NCR Plain"}),
        ("Mountain Foothill (Dehradun Lower)", {"rainfall": 45.0, "vibration": 12.0, "earthquake_mag": 2.2, "slope_angle": 18.0, "soil_moisture": 45.0, "location_name": "Garhwal Foothills"}),
        ("Moderate Mountain Slope (Kullu Beas)", {"rainfall": 75.0, "vibration": 20.0, "earthquake_mag": 2.8, "slope_angle": 30.0, "soil_moisture": 65.0, "location_name": "Kullu Mountain Slope"}),
        ("Steep Escarpment (Joshimath Active Creep)", {"rainfall": 185.0, "vibration": 42.0, "earthquake_mag": 4.5, "slope_angle": 44.0, "soil_moisture": 86.0, "location_name": "Joshimath Escarpment"}),
        ("Extreme Rock Wall (Kedarnath Mandakini)", {"rainfall": 240.0, "vibration": 50.0, "earthquake_mag": 4.8, "slope_angle": 52.0, "soil_moisture": 92.0, "location_name": "Kedarnath Escarpment"}),
    ]

    try:
        print("\n================ MULTI-TIER SLOPE & PROBABILITY CALIBRATION ================")
        for name, env in test_scenarios:
            res = predictor.run_prediction(img1_path, img2_path, env)
            print(f"Location: {name:<42s} | Slope: {res['slope_angle']:4.1f} deg | Fs: {res['factor_of_safety']:4.2f} | Prob: {res['probability_percentage']:4.1f}% | Risk: {res['risk_level']}")
            
            if env["slope_angle"] < 12.0:
                assert res["probability_percentage"] <= 5.0, "Plain should have <= 5% probability"
            elif env["slope_angle"] <= 20.0:
                assert res["probability_percentage"] <= 25.0, "Foothill should have <= 25% probability"
            elif env["slope_angle"] <= 32.0:
                assert 10.0 <= res["probability_percentage"] <= 55.0, "Moderate slope should have 10-55% probability"
            else:
                assert res["probability_percentage"] >= 50.0, "Steep escarpment under rain should have >= 50% probability"

        print("\n[SUCCESS] ALL MULTI-TIER MOUNTAIN SLOPES AND PROBABILITIES CALIBRATED ACCURATELY!")
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise
    finally:
        if os.path.exists("dummy1.png"):
            os.remove("dummy1.png")
        if os.path.exists("dummy2.png"):
            os.remove("dummy2.png")

if __name__ == "__main__":
    main()
