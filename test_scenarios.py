import tempfile, cv2, numpy as np
from backend.ml_pipeline.predictor import Predictor

pred = Predictor()

scenarios = [
    {'name': '1. Kedarnath Mountain (Dry Day - 0mm rain, slope 38 deg)', 'env': {'slope_angle': 38.0, 'rainfall': 0.0, 'soil_moisture': 22.0, 'vibration': 8.0, 'location_name': 'Kedarnath Ridge'}},
    {'name': '2. Shimla Mountain (Moderate Rain - 25mm rain, slope 35 deg)', 'env': {'slope_angle': 35.0, 'rainfall': 25.0, 'soil_moisture': 40.0, 'vibration': 10.0, 'location_name': 'Shimla Hills'}},
    {'name': '3. Manali Mountain (Sunny Dry - 5mm rain, slope 45 deg rock)', 'env': {'slope_angle': 45.0, 'rainfall': 5.0, 'soil_moisture': 20.0, 'vibration': 6.0, 'location_name': 'Manali Pass'}},
    {'name': '4. Joshimath Mountain (High slope 42 deg, Rain 15mm - Rock type)', 'env': {'slope_angle': 42.0, 'rainfall': 15.0, 'soil_moisture': 30.0, 'vibration': 9.0, 'location_name': 'Joshimath Cliff'}},
    {'name': '5. Wayanad Ghats (Cloudburst Extreme - 180mm rain, slope 36 deg, moist 88%)', 'env': {'slope_angle': 36.0, 'rainfall': 180.0, 'soil_moisture': 88.0, 'vibration': 25.0, 'location_name': 'Wayanad Meppadi Escarpment'}},
    {'name': '6. Delhi NCR (Flat Plain - 0mm rain, slope 1.5 deg)', 'env': {'slope_angle': 1.5, 'rainfall': 0.0, 'soil_moisture': 18.0, 'vibration': 4.0, 'location_name': 'Delhi Plain'}}
]

timg = tempfile.mktemp(suffix='.jpg')
cv2.imwrite(timg, np.zeros((100, 100, 3), dtype=np.uint8))

for s in scenarios:
    res = pred.run_single_image_prediction(timg, s['env'])
    print(s['name'])
    print(f"  Probability: {res['probability_percentage']}% | Risk: {res['risk_level']} | Fs: {res['factor_of_safety']}")
    print(f"  Convergence: {res['sensor_telemetry']['convergence_status']}")
    print(f"  Cohesion: {res['recursive_telemetry'].get('cohesion_kpa', 0)} kPa | Friction: {res['recursive_telemetry'].get('friction_angle_deg', 0)} deg")
    print("-" * 60)
