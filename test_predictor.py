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
    
    env_data = {
        "rainfall": 120.5,
        "vibration": 35.2,
        "earthquake_mag": 4.1,
        "slope_angle": 38.0,
        "soil_moisture": 75.0
    }
    
    predictor = Predictor()
    
    try:
        print("Running Combined Cognitive + AI Prediction...")
        result = predictor.run_prediction(img1_path, img2_path, env_data)
        print("Result:", result["will_landslide"], "| Prob:", result["probability_percentage"], "% | Risk:", result["risk_level"])
        print("Breakdown:", result["breakdown"])
        print("PASS: Prediction pipeline verified successfully!")
    except Exception as e:
        print(f"Error during prediction: {e}")
    finally:
        if os.path.exists("dummy1.png"):
            os.remove("dummy1.png")
        if os.path.exists("dummy2.png"):
            os.remove("dummy2.png")

if __name__ == "__main__":
    main()
