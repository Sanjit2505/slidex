import cv2
import numpy as np
import base64
import os

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


def analyze_single_image_slope(img_path: str) -> dict:
    """
    Single-image cognitive imaging method:
    Extracts topographical slope incline, surface roughness, structural fracture lines,
    and drainage scarps from a single satellite or aerial terrain image.
    """
    try:
        img = cv2.imread(img_path)
        if img is None:
            raise ValueError("Could not read the satellite image.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        # 1. Slope Gradient Analysis via Spatial Derivatives (Sobel Operators)
        sobelx = cv2.Sobel(blur, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(blur, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.hypot(sobelx, sobely)
        
        # Normalize gradient to 0-255 for visual rendering
        norm_grad = cv2.normalize(gradient_magnitude, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        
        # 2. Estimate Slope Angle in Degrees
        # High gradient variation in rugged terrain correlates with steep slope angle
        grad_mean = float(np.mean(gradient_magnitude))
        grad_p90 = float(np.percentile(gradient_magnitude, 90))
        
        # Formula mapping gradient intensity to empirical slope angle (15° to 62°)
        estimated_slope_angle = round(min(62.0, max(12.0, 15.0 + (grad_p90 / 255.0) * 55.0)), 1)
        
        # 3. Terrain Roughness / Fractures Detection (Laplacian & Canny)
        laplacian = cv2.Laplacian(blur, cv2.CV_64F)
        roughness_score = float(np.var(laplacian)) / 1000.0 # higher variance = rocky/rugged/fissured
        roughness_index = round(min(1.0, roughness_score / 2.5), 3)

        edges = cv2.Canny(blur, 40, 120)
        fracture_density = round(float(np.count_nonzero(edges)) / float(edges.size), 4)

        # 4. Generate Topographic Slope Incline Heatmap (TURBO colormap)
        slope_heatmap = cv2.applyColorMap(norm_grad, cv2.COLORMAP_TURBO)
        
        # Overlay with original satellite image
        slope_overlay = cv2.addWeighted(img, 0.55, slope_heatmap, 0.45, 0)
        
        # Draw contour lines to highlight steep ridges
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(slope_overlay, contours, -1, (0, 255, 255), 1)

        # Cognitive single-image slope susceptibility index
        # Rugged, steep slopes with high fissure density are inherently more unstable
        cognitive_slope_score = round(min(0.99, (estimated_slope_angle / 60.0) * 0.55 + roughness_index * 0.25 + fracture_density * 2.0), 3)

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
            "estimated_slope_angle": 30.0,
            "roughness_index": 0.0,
            "fracture_density": 0.0,
            "cognitive_slope_score": 0.0,
            "heatmap_base64": None,
            "overlay_base64": None
        }
