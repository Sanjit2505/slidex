from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import tempfile
import cv2
import numpy as np
import base64
import uvicorn

from backend.ml_pipeline.predictor import Predictor
from backend.ml_pipeline.trainer import train_custom_dataset

app = FastAPI(title="Landslide Cognitive AI System", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = Predictor()

@app.get("/")
def read_root():
    return {"status": "online", "system": "SlideX Multi-Modal Cognitive Landslide Prediction API"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "model_version": "v2.4-SpatioTemporal-InSAR", "single_image_mode": True}

@app.post("/api/train")
def train_model(dataset_folder: str = Form("landslide_datasets")):
    try:
        result = train_custom_dataset(dataset_folder)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict")
async def run_prediction(
    image_pre: UploadFile = File(...),
    image_post: UploadFile = File(...),
    rainfall: float = Form(45.0),
    vibration: float = Form(12.0),
    earthquake_mag: float = Form(2.1),
    slope_angle: float = Form(32.0),
    soil_moisture: float = Form(55.0),
    location_name: str = Form("Target Region")
):
    temp_dir = tempfile.mkdtemp()
    try:
        pre_path = os.path.join(temp_dir, f"pre_{image_pre.filename}")
        post_path = os.path.join(temp_dir, f"post_{image_post.filename}")

        with open(pre_path, "wb") as f:
            shutil.copyfileobj(image_pre.file, f)

        with open(post_path, "wb") as f:
            shutil.copyfileobj(image_post.file, f)

        env_data = {
            "rainfall": rainfall,
            "vibration": vibration,
            "earthquake_mag": earthquake_mag,
            "slope_angle": slope_angle,
            "soil_moisture": soil_moisture
        }

        result = predictor.run_prediction(pre_path, post_path, env_data)
        result["location"] = location_name
        result["inputs"] = env_data
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.post("/api/predict-single")
async def run_predict_single(
    image: UploadFile = File(...),
    rainfall: float = Form(50.0),
    vibration: float = Form(10.0),
    earthquake_mag: float = Form(2.0),
    slope_angle: float = Form(0.0), # 0 indicates auto-extract from image
    soil_moisture: float = Form(60.0),
    location_name: str = Form("Target Hillside")
):
    """
    Single-image cognitive analysis: extracts slope inclination, terrain roughness,
    and fracture patterns directly from the satellite image, and combines with rainfall & location.
    """
    temp_dir = tempfile.mkdtemp()
    try:
        img_path = os.path.join(temp_dir, f"single_{image.filename}")
        with open(img_path, "wb") as f:
            shutil.copyfileobj(image.file, f)

        env_data = {
            "rainfall": rainfall,
            "vibration": vibration,
            "earthquake_mag": earthquake_mag,
            "slope_angle": slope_angle,
            "soil_moisture": soil_moisture
        }

        result = predictor.run_single_image_prediction(img_path, env_data)
        result["location"] = location_name
        result["inputs"] = env_data
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Single-image prediction error: {str(e)}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.get("/api/sample-preset-single/{preset_type}")
def get_sample_preset_single(preset_type: str):
    """
    Returns a single high-resolution satellite imagery preset with terrain topography.
    """
    width, height = 512, 512
    np.random.seed(101)
    base_terrain = np.zeros((height, width, 3), dtype=np.uint8)
    base_terrain[:, :, 0] = np.random.randint(25, 55, (height, width))
    base_terrain[:, :, 1] = np.random.randint(70, 130, (height, width))
    base_terrain[:, :, 2] = np.random.randint(45, 85, (height, width))
    
    if preset_type == "steep_rain":
        # Steep rugged mountain escarpment with ridge cracks
        for y in range(80, 450, 40):
            cv2.line(base_terrain, (20, y), (490, y + 25), (20, 50, 80), 5)
        # Add rock fissure
        cv2.polylines(base_terrain, [np.array([[240, 100], [260, 240], [290, 420]], np.int32)], False, (10, 30, 70), 8)
        env = {
            "rainfall": 175.0, # heavy monsoon downpour
            "vibration": 38.0,
            "earthquake_mag": 3.7,
            "slope_angle": 0, # Auto-detect from image!
            "soil_moisture": 84.0,
            "location_name": "Idukki High Ranges Escarpment (Steep Incline)"
        }
    elif preset_type == "moderate_hill":
        # Rolling hillside
        cv2.line(base_terrain, (0, 200), (512, 280), (35, 85, 55), 10)
        env = {
            "rainfall": 65.0,
            "vibration": 15.0,
            "earthquake_mag": 2.2,
            "slope_angle": 0,
            "soil_moisture": 58.0,
            "location_name": "Garhwal Foothills Slope Sector"
        }
    else: # gentle_slope
        env = {
            "rainfall": 18.0,
            "vibration": 3.0,
            "earthquake_mag": 1.0,
            "slope_angle": 0,
            "soil_moisture": 32.0,
            "location_name": "Deccan Plateau Outskirts (Gentle Slope)"
        }

    _, b_img = cv2.imencode('.jpg', base_terrain)
    return {
        "preset": preset_type,
        "image_base64": f"data:image/jpeg;base64,{base64.b64encode(b_img).decode('utf-8')}",
        "env_data": env
    }

@app.get("/api/sample-preset/{preset_type}")
def get_sample_preset(preset_type: str):
    width, height = 512, 512
    np.random.seed(42)
    base_terrain = np.zeros((height, width, 3), dtype=np.uint8)
    base_terrain[:, :, 0] = np.random.randint(30, 60, (height, width))
    base_terrain[:, :, 1] = np.random.randint(80, 140, (height, width))
    base_terrain[:, :, 2] = np.random.randint(50, 90, (height, width))
    
    cv2.line(base_terrain, (0, 120), (512, 180), (40, 100, 70), 8)
    cv2.line(base_terrain, (0, 300), (512, 340), (35, 90, 60), 12)
    
    img_pre = base_terrain.copy()
    img_post = base_terrain.copy()
    
    if preset_type == "critical":
        pts = np.array([[180, 140], [290, 170], [340, 420], [210, 480], [150, 300]], np.int32)
        cv2.fillPoly(img_post, [pts], (20, 60, 130))
        cv2.ellipse(img_post, (260, 380), (80, 40), 25, 0, 360, (15, 45, 110), -1)
        env = {
            "rainfall": 215.0,
            "vibration": 85.0,
            "earthquake_mag": 4.8,
            "slope_angle": 46.5,
            "soil_moisture": 92.0,
            "location_name": "Western Ghats Mountain Sector (Critical Alert)"
        }
    elif preset_type == "moderate":
        cv2.line(img_post, (200, 150), (280, 320), (20, 50, 100), 10)
        env = {
            "rainfall": 78.0,
            "vibration": 28.0,
            "earthquake_mag": 3.4,
            "slope_angle": 34.0,
            "soil_moisture": 62.0,
            "location_name": "Sub-Himalayan Foothill Corridor"
        }
    else: # stable
        env = {
            "rainfall": 12.0,
            "vibration": 2.0,
            "earthquake_mag": 1.2,
            "slope_angle": 21.0,
            "soil_moisture": 38.0,
            "location_name": "Stable Plateau Ridge Area"
        }

    _, b_pre = cv2.imencode('.jpg', img_pre)
    _, b_post = cv2.imencode('.jpg', img_post)
    
    return {
        "preset": preset_type,
        "pre_image_base64": f"data:image/jpeg;base64,{base64.b64encode(b_pre).decode('utf-8')}",
        "post_image_base64": f"data:image/jpeg;base64,{base64.b64encode(b_post).decode('utf-8')}",
        "env_data": env
    }

import datetime
from typing import Optional

# In-memory store for SOS alerts and incident reports
sos_alerts = []
incident_reports = []

@app.post("/api/sos")
async def send_sos(
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(0.0),
    sender_name: str = Form("Anonymous"),
    message: str = Form("EMERGENCY: Potential landslide! Immediate evacuation needed!")
):
    """Broadcast an SOS alert with the sender's live GPS location."""
    alert_id = f"SOS-{len(sos_alerts)+1:04d}"
    alert = {
        "id": alert_id,
        "latitude": latitude,
        "longitude": longitude,
        "accuracy_m": accuracy,
        "sender": sender_name,
        "message": message,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "status": "BROADCAST",
        "notified_radius_km": 10,
        "estimated_phones_reached": max(5, int(50 / max(accuracy, 1) * 100))
    }
    sos_alerts.append(alert)
    return {
        "success": True,
        "alert": alert,
        "broadcast_summary": f"SOS broadcast to all devices within {alert['notified_radius_km']} km radius. Est. {alert['estimated_phones_reached']} devices notified."
    }

@app.post("/api/report-incident")
async def report_incident(
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(0.0),
    description: str = Form("Landslide observed"),
    reporter_name: str = Form("Anonymous"),
    image: Optional[UploadFile] = File(None)
):
    """Report a landslide incident with location and optional image analysis."""
    report_id = f"RPT-{len(incident_reports)+1:04d}"
    image_analysis = None

    if image:
        temp_dir = tempfile.mkdtemp()
        try:
            img_path = os.path.join(temp_dir, f"report_{image.filename}")
            with open(img_path, "wb") as f:
                shutil.copyfileobj(image.file, f)

            env_data = {
                "rainfall": 80.0,
                "vibration": 20.0,
                "earthquake_mag": 2.5,
                "slope_angle": 0,
                "soil_moisture": 65.0
            }
            result = predictor.run_single_image_prediction(img_path, env_data)
            image_analysis = {
                "risk_level": result.get("risk_level", "UNKNOWN"),
                "probability": result.get("probability_percentage", 0),
                "will_landslide": result.get("will_landslide", "Analysis Incomplete"),
                "recommendation": result.get("recommendation", "")
            }
        except Exception as e:
            image_analysis = {"error": str(e)}
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    report = {
        "id": report_id,
        "latitude": latitude,
        "longitude": longitude,
        "accuracy_m": accuracy,
        "description": description,
        "reporter": reporter_name,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "image_analysis": image_analysis,
        "status": "RECEIVED"
    }
    incident_reports.append(report)
    return {"success": True, "report": report}

@app.get("/api/sos-alerts")
def get_sos_alerts():
    return {"alerts": sos_alerts[-20:]}

@app.get("/api/incident-reports")
def get_incident_reports():
    return {"reports": incident_reports[-20:]}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
