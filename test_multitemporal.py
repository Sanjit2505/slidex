import tempfile, cv2, numpy as np
from backend.ml_pipeline.predictor import Predictor

pred = Predictor()

scenarios = [
    {'name': '1. Multi-Temporal Kedarnath Mountain (Dry Day - 0mm rain, slope 38 deg)', 'env': {'slope_angle': 38.0, 'rainfall': 0.0, 'soil_moisture': 22.0, 'vibration': 8.0, 'location_name': 'Kedarnath Ridge'}},
    {'name': '2. Multi-Temporal Wayanad Ghats (Cloudburst Extreme - 180mm rain, slope 36 deg, moist 88%)', 'env': {'slope_angle': 36.0, 'rainfall': 180.0, 'soil_moisture': 88.0, 'vibration': 25.0, 'location_name': 'Wayanad Meppadi Escarpment'}}
]

timg1 = tempfile.mktemp(suffix='.jpg')
timg2 = tempfile.mktemp(suffix='.jpg')
cv2.imwrite(timg1, np.zeros((100, 100, 3), dtype=np.uint8))
cv2.imwrite(timg2, np.zeros((100, 100, 3), dtype=np.uint8))

for s in scenarios:
    res = pred.run_prediction(timg1, timg2, s['env'])
    print(s['name'])
    print(f"  Probability: {res['probability_percentage']}% | Risk: {res['risk_level']} | Fs: {res['factor_of_safety']}")
    print(f"  Convergence: {res['sensor_telemetry']['convergence_status']}")
    print("-" * 60)
