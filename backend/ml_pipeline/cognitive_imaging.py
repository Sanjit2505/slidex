import cv2
import numpy as np
import base64
import os
from typing import Optional

def calculate_image_difference(img1_path: str, img2_path: str) -> dict:
    """
    Multi-temporal cognitive imaging: calculates absolute difference, optical flow/gradient changes,
    and returns metrics as well as base64-encoded visual heatmaps of the terrain change.
    """
    try:
        img1 = cv2.imread(img1_path)
        img2 = cv2.imread(img2_path)
        
        if img1 is None or img2 is None:
            raise ValueError("Could not read one or both satellite images.")
            
        if len(img1.shape) == 2:
            img1 = cv2.cvtColor(img1, cv2.COLOR_GRAY2BGR)
        elif img1.shape[2] == 4:
            img1 = cv2.cvtColor(img1, cv2.COLOR_BGRA2BGR)

        if len(img2.shape) == 2:
            img2 = cv2.cvtColor(img2, cv2.COLOR_GRAY2BGR)
        elif img2.shape[2] == 4:
            img2 = cv2.cvtColor(img2, cv2.COLOR_BGRA2BGR)

        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))

        gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

        blur1 = cv2.GaussianBlur(gray1, (5, 5), 0)
        blur2 = cv2.GaussianBlur(gray2, (5, 5), 0)

        diff = cv2.absdiff(blur1, blur2)
        _, thresh = cv2.threshold(diff, 35, 255, cv2.THRESH_BINARY)
        
        heatmap = cv2.applyColorMap(diff, cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(img2, 0.6, heatmap, 0.4, 0)
        
        total_pixels = float(diff.shape[0] * diff.shape[1])
        changed_pixels = float(np.count_nonzero(thresh))
        change_ratio = changed_pixels / total_pixels if total_pixels > 0 else 0.0
        
        mean_intensity = float(np.mean(diff)) / 255.0
        
        sobelx1 = cv2.Sobel(gray1, cv2.CV_64F, 1, 0, ksize=3)
        sobely1 = cv2.Sobel(gray1, cv2.CV_64F, 0, 1, ksize=3)
        grad1 = np.hypot(sobelx1, sobely1)
        
        sobelx2 = cv2.Sobel(gray2, cv2.CV_64F, 1, 0, ksize=3)
        sobely2 = cv2.Sobel(gray2, cv2.CV_64F, 0, 1, ksize=3)
        grad2 = np.hypot(sobelx2, sobely2)
        
        slope_deformation = float(np.mean(np.abs(grad2 - grad1))) / 255.0

        _, buffer_overlay = cv2.imencode('.jpg', overlay)
        overlay_base64 = base64.b64encode(buffer_overlay).decode('utf-8')
        
        _, buffer_diff = cv2.imencode('.jpg', heatmap)
        heatmap_base64 = base64.b64encode(buffer_diff).decode('utf-8')

        return {
            "success": True,
            "change_ratio": round(change_ratio, 4),
            "mean_intensity": round(mean_intensity, 4),
            "slope_deformation": round(slope_deformation, 4),
            "cognitive_score": round(min(1.0, (change_ratio * 0.5 + slope_deformation * 1.2 + mean_intensity * 0.3) * 1.8), 4),
            "heatmap_base64": f"data:image/jpeg;base64,{heatmap_base64}",
            "overlay_base64": f"data:image/jpeg;base64,{overlay_base64}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "change_ratio": 0.0,
            "mean_intensity": 0.0,
            "slope_deformation": 0.0,
            "cognitive_score": 0.0,
            "heatmap_base64": None,
            "overlay_base64": None
        }


def analyze_single_image_slope(img_path: str, known_slope: Optional[float] = None, is_flat_land: bool = False) -> dict:
    """
    Single-image cognitive imaging method:
    Extracts topographical slope incline, surface roughness, structural fracture lines,
    and drainage scarps from a single satellite or aerial terrain image.
    Anchors to physical DEM slope when available, and suppresses false gradients on flat urban/plain areas.
    """
    try:
        img = cv2.imread(img_path)
        if img is None:
            raise ValueError("Could not read the satellite image.")

        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        elif img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        # 1. Slope Gradient Analysis via Multi-Scale Spatial Derivatives
        sobelx = cv2.Sobel(blur, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(blur, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.hypot(sobelx, sobely)
        
        # Morphological gradient for elevation relief & ridge profiling
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        morph_grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel)
        combined_grad = cv2.addWeighted(gradient_magnitude.astype(np.float32), 0.7, morph_grad.astype(np.float32), 0.3, 0)
        
        # 2. Precision Slope Estimation
        edges = cv2.Canny(blur, 35, 110)
        fracture_density = round(float(np.count_nonzero(edges)) / float(edges.size), 4)
        
        if is_flat_land or (known_slope is not None and known_slope < 12.0):
            # Explicit plain/flatland zone
            estimated_slope_angle = round(max(0.5, min(8.0, float(known_slope if known_slope is not None else 2.0))), 1)
        elif known_slope is not None and known_slope > 0:
            # Anchor to physically validated DEM ground truth
            estimated_slope_angle = round(float(known_slope), 1)
        else:
            # Automatic heuristic estimation from optical texture
            grad_p90 = float(np.percentile(combined_grad, 90))
            grad_p98 = float(np.percentile(combined_grad, 98))
            raw_slope = (grad_p90 * 0.4 + grad_p98 * 0.6) / 255.0 * 48.0
            if grad_p90 < 22.0 or fracture_density < 0.02:
                estimated_slope_angle = round(max(1.0, min(8.0, raw_slope * 0.3)), 1)
            else:
                estimated_slope_angle = round(min(58.0, max(12.0, raw_slope)), 1)

        # 3. Normalize gradient & scale according to actual topographic slope
        norm_grad = cv2.normalize(combined_grad, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        
        # If flat plain (<12°), scale down gradient highlights to prevent false alarm on city buildings
        if estimated_slope_angle < 12.0:
            suppression_factor = max(0.05, estimated_slope_angle / 35.0)
            norm_grad = (norm_grad.astype(np.float32) * suppression_factor).astype(np.uint8)

        # 4. High-Frequency Terrain Roughness
        laplacian = cv2.Laplacian(blur, cv2.CV_64F)
        roughness_score = float(np.var(laplacian)) / 900.0
        roughness_index = round(min(1.0, roughness_score / 2.8), 3)

        # 5. Generate Topographic Slope Incline Heatmap (TURBO colormap)
        slope_heatmap = cv2.applyColorMap(norm_grad, cv2.COLORMAP_TURBO)
        
        # Overlay with original satellite image
        slope_overlay = cv2.addWeighted(img, 0.55, slope_heatmap, 0.45, 0)
        
        # Draw structural fracture contours only if slope >= 12°
        if estimated_slope_angle >= 12.0:
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(slope_overlay, contours, -1, (0, 255, 255), 1)

        # High-Accuracy Cognitive Susceptibility Metric:
        # Strictly gated by slope steepness ratio (if slope < 12°, susceptibility score drops to ~0.01)
        if estimated_slope_angle < 12.0:
            cognitive_slope_score = round(max(0.01, min(0.06, (estimated_slope_angle / 12.0) * 0.06)), 3)
        else:
            slope_steepness_ratio = max(0.0, (estimated_slope_angle - 12.0) / 48.0)
            cognitive_slope_score = round(min(0.99, max(0.05, 
                slope_steepness_ratio * 0.60 + roughness_index * 0.20 + min(1.0, fracture_density * 4.0) * 0.20 * min(1.0, slope_steepness_ratio * 2.0)
            )), 3)

        _, buf_overlay = cv2.imencode('.jpg', slope_overlay)
        overlay_base64 = base64.b64encode(buf_overlay).decode('utf-8')
        
        _, buf_heatmap = cv2.imencode('.jpg', slope_heatmap)
        heatmap_base64 = base64.b64encode(buf_heatmap).decode('utf-8')

        return {
            "success": True,
            "estimated_slope_angle": estimated_slope_angle,
            "roughness_index": roughness_index,
            "fracture_density": fracture_density,
            "cognitive_slope_score": cognitive_slope_score,
            "heatmap_base64": f"data:image/jpeg;base64,{heatmap_base64}",
            "overlay_base64": f"data:image/jpeg;base64,{overlay_base64}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "estimated_slope_angle": 30.0 if known_slope is None else known_slope,
            "roughness_index": 0.0,
            "fracture_density": 0.0,
            "cognitive_slope_score": 0.0,
            "heatmap_base64": None,
            "overlay_base64": None
        }
