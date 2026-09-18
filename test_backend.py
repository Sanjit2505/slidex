import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(method, path, **kwargs):
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            r = requests.get(url, **kwargs)
        elif method == "POST":
            r = requests.post(url, **kwargs)
        print(f"[{r.status_code}] {method} {path}")
        if r.status_code != 200:
            print(f"   Error detail: {r.text[:300]}")
        return r
    except Exception as e:
        print(f"[FAIL] {method} {path} -> {e}")
        return None

def main():
    print("=== TESTING BACKEND API ENDPOINTS ===")
    
    test_endpoint("GET", "/")
    test_endpoint("GET", "/api/health")
    test_endpoint("GET", "/api/gee-presets")
    test_endpoint("GET", "/api/gee-fetch?preset_id=uttarakhand_joshimath&sensor=sentinel2_sr")
    test_endpoint("GET", "/api/gee-capture-custom?lat=30.55&lon=79.56&location_name=Joshimath")
    
    # auto-capture-analyze
    test_endpoint("POST", "/api/auto-capture-analyze", data={"lat": "30.557", "lon": "79.566", "location_name": "Joshimath"})

    # scan-entire-map
    test_endpoint("POST", "/api/scan-entire-map", data={"lat": "30.557", "lon": "79.566", "radius_km": "15.0", "grid_size": "3"})

    # gee-export-code
    test_endpoint("GET", "/api/gee-export-code?preset_id=uttarakhand_joshimath&sensor=sentinel2_sr")

    # sample presets
    test_endpoint("GET", "/api/sample-preset-single/steep_rain")
    test_endpoint("GET", "/api/sample-preset/critical")

    # SOS & incident
    test_endpoint("POST", "/api/sos", data={"latitude": "30.55", "longitude": "79.56", "sender_name": "Test", "message": "Test SOS"})
    test_endpoint("POST", "/api/report-incident", data={"latitude": "30.55", "longitude": "79.56", "description": "Test Incident"})
    test_endpoint("GET", "/api/sos-alerts")
    test_endpoint("GET", "/api/incident-reports")

    # Predict single with dummy image
    dummy_img = ("test.jpg", b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xFF\xC0\x00\x0b\x08\x00\x10\x00\x10\x01\x01\x11\x00\xFF\xC4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xFF\xDA\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xFF\xD9", "image/jpeg")
    
    test_endpoint("POST", "/api/predict-single", files={"image": dummy_img}, data={"rainfall": "50", "vibration": "10", "earthquake_mag": "2", "slope_angle": "35", "soil_moisture": "60", "location_name": "Test Location"})
    
    test_endpoint("POST", "/api/predict", files={"image_pre": dummy_img, "image_post": dummy_img}, data={"rainfall": "50", "vibration": "10", "earthquake_mag": "2", "slope_angle": "35", "soil_moisture": "60", "location_name": "Test Location"})

    # AI rescue ideas
    test_endpoint("POST", "/api/ai-rescue-ideas", data={"location_name": "Joshimath", "lat": "30.55", "lon": "79.56", "probability": "0.85", "slope_angle": "42", "rainfall": "180"})

    # train
    test_endpoint("POST", "/api/train", data={"dataset_folder": "landslide_datasets"})

if __name__ == "__main__":
    main()
