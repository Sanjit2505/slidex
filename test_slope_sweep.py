from backend.ml_pipeline.predictor import Predictor
import tempfile, cv2, numpy as np

pred = Predictor()
timg = tempfile.mktemp(suffix='.jpg')
cv2.imwrite(timg, np.zeros((100, 100, 3), dtype=np.uint8))

for rain in [10.0, 50.0, 120.0]:
    print(f"\n=== Slope Sweep at Rain = {rain}mm ===")
    for slope in range(15, 50, 3):
        res = pred.run_single_image_prediction(timg, {'slope_angle': float(slope), 'rainfall': rain, 'soil_moisture': 50.0, 'vibration': 10.0, 'location_name': 'Test Mountain'})
        print(f"Slope: {slope:2d}° -> Prob: {res['probability_percentage']:5.1f}%, Fs: {res['factor_of_safety']:5.3f}, Risk: {res['risk_level']}")
