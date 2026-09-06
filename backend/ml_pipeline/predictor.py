from .cognitive_imaging import calculate_image_difference, analyze_single_image_slope
from .ai_model import SpatioTemporalLandslideModel

class Predictor:
    def __init__(self):
        self.ai_model = SpatioTemporalLandslideModel()
        
    def _evaluate_risk(self, probability: float):
        if probability >= 0.75:
            return {
                "risk_level": "CRITICAL / IMMINENT",
                "alert_color": "#ef4444",
                "recommendation": "Immediate evacuation of downslope zones. High probability of catastrophic slope failure under current precipitation.",
                "will_landslide": "YES - High Probability"
            }
        elif probability >= 0.50:
            return {
                "risk_level": "HIGH RISK",
                "alert_color": "#f97316",
                "recommendation": "Issue landslide warning. Continuous real-time sensor monitoring and halt transportation along active mountain corridors.",
                "will_landslide": "LIKELY - Caution Advised"
            }
        elif probability >= 0.30:
            return {
                "risk_level": "MODERATE RISK",
                "alert_color": "#eab308",
                "recommendation": "Heightened surveillance on slope drainage channels and seismic baseline. Prepare localized advisories.",
                "will_landslide": "POSSIBLE (Under Persistent Rain)"
            }
        else:
            return {
                "risk_level": "LOW RISK / STABLE",
                "alert_color": "#22c55e",
                "recommendation": "Terrain conditions within normal stability envelope. Routine satellite and meteorological observation.",
                "will_landslide": "NO - Low Probability"
            }

    def run_prediction(self, img1_path: str, img2_path: str, env_data: dict) -> dict:
        cog_result = calculate_image_difference(img1_path, img2_path)
        cog_score = cog_result.get("cognitive_score", 0.0)
        
        ai_result = self.ai_model.predict(env_data)
        ai_score = ai_result.get("ai_score", 0.0)
        
        weighted_prob = (cog_score * 0.45) + (ai_score * 0.55)
        if cog_score > 0.6 and ai_score > 0.6:
            weighted_prob = min(0.99, weighted_prob * 1.15)
            
        probability = round(min(0.99, max(0.01, weighted_prob)), 4)
        eval_meta = self._evaluate_risk(probability)
            
        return {
            "mode": "multi_temporal",
            "probability": probability,
            "probability_percentage": round(probability * 100, 1),
            "will_landslide": eval_meta["will_landslide"],
            "risk_level": eval_meta["risk_level"],
            "alert_color": eval_meta["alert_color"],
            "recommendation": eval_meta["recommendation"],
            "breakdown": {
                "cognitive_imaging": {
                    "score": cog_score,
                    "change_ratio": cog_result.get("change_ratio", 0.0),
                    "slope_deformation": cog_result.get("slope_deformation", 0.0),
                    "mean_intensity": cog_result.get("mean_intensity", 0.0)
                },
                "ai_model": {
                    "score": ai_score,
                    "hydro_score": ai_result.get("hydro_score", 0.0),
                    "seismic_score": ai_result.get("seismic_score", 0.0),
                    "slope_factor": ai_result.get("slope_factor", 0.0),
                    "model_version": ai_result.get("version", "v2.4")
                }
            },
            "visuals": {
                "heatmap": cog_result.get("heatmap_base64"),
                "overlay": cog_result.get("overlay_base64")
            }
        }

    def run_single_image_prediction(self, img_path: str, env_data: dict) -> dict:
        """
        Runs single satellite image cognitive slope profiling and fuses with environmental triggers.
        """
        cog_result = analyze_single_image_slope(img_path)
        cog_score = cog_result.get("cognitive_slope_score", 0.0)
        
        # Override or supplement slope angle with image-extracted slope
        extracted_slope = cog_result.get("estimated_slope_angle", 30.0)
        env_copy = env_data.copy()
        # If user did not manually lock slope angle or requested auto-extraction
        if "slope_angle" not in env_copy or env_copy["slope_angle"] == 0:
            env_copy["slope_angle"] = extracted_slope
        else:
            # Blend user input slope and computer vision extracted slope
            env_copy["slope_angle"] = round((float(env_copy["slope_angle"]) * 0.4 + extracted_slope * 0.6), 1)

        ai_result = self.ai_model.predict(env_copy)
        ai_score = ai_result.get("ai_score", 0.0)
        
        # In single image mode:
        # Cognitive image provides 40% intrinsic structural susceptibility (slope steepness + fracture density)
        # Tabular triggers (rainfall, vibration, moisture) provide 60% dynamic triggering force
        weighted_prob = (cog_score * 0.40) + (ai_score * 0.60)
        
        # If steep slope + heavy rain
        if extracted_slope > 35.0 and env_copy.get("rainfall", 0) > 90:
            weighted_prob = min(0.99, weighted_prob * 1.18)

        probability = round(min(0.99, max(0.01, weighted_prob)), 4)
        eval_meta = self._evaluate_risk(probability)

        return {
            "mode": "single_image",
            "probability": probability,
            "probability_percentage": round(probability * 100, 1),
            "will_landslide": eval_meta["will_landslide"],
            "risk_level": eval_meta["risk_level"],
            "alert_color": eval_meta["alert_color"],
            "recommendation": eval_meta["recommendation"],
            "breakdown": {
                "cognitive_imaging": {
                    "score": cog_score,
                    "estimated_slope_angle": extracted_slope,
                    "roughness_index": cog_result.get("roughness_index", 0.0),
                    "fracture_density": cog_result.get("fracture_density", 0.0)
                },
                "ai_model": {
                    "score": ai_score,
                    "hydro_score": ai_result.get("hydro_score", 0.0),
                    "seismic_score": ai_result.get("seismic_score", 0.0),
                    "slope_factor": ai_result.get("slope_factor", 0.0),
                    "effective_slope_angle": env_copy["slope_angle"],
                    "model_version": ai_result.get("version", "v2.4")
                }
            },
            "visuals": {
                "heatmap": cog_result.get("heatmap_base64"),
                "overlay": cog_result.get("overlay_base64")
            }
        }
