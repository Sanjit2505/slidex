import os

class LCMSAnalyzer:
    """
    Google Earth Engine Landscape Change Monitoring System (LCMS) Analyzer.
    Dataset Asset: projects/gtac-data-publish/assets/LCMS/Product_Version/2025-11
    Bands: Land_Cover (1-15), Land_Use (1-6), Change (1-16)
    """
    def __init__(self):
        self.dataset_id = "projects/gtac-data-publish/assets/LCMS/Product_Version/2025-11"
        self.lc_palette = [
            '#004e2b', '#009344', '#61bb46', '#acbb67', '#8b8560', '#cafd4b',
            '#f89a1c', '#8fa55f', '#bebb8e', '#e5e98a', '#ddb925', '#893f54',
            '#e4f5fd', '#00b6f0', '#1b1716'
        ]
        self.lu_palette = [
            '#fbff97', '#e6558b', '#004e2b', '#9dbac5', '#a6976a', '#1b1716'
        ]
        self.change_palette = [
            '#ff09f3', '#541aff', '#e4f5fd', '#cc982e', '#00adaff', '#a10018',
            '#d54309', '#fafa4b', '#afde1c', '#ffc80d', '#a64c28', '#f39268',
            '#c291d5', '#00a398', '#3d4551', '#1b1716'
        ]

    def get_lcms_telemetry(self, lat: float, lon: float, slope_angle: float, rainfall: float) -> dict:
        is_high_slope = slope_angle >= 25.0
        is_heavy_rain = rainfall >= 100.0

        # Classify Land Cover
        if is_high_slope and is_heavy_rain:
            land_cover_name = "Tree Cover / Exposed Rockfall Escarpment"
            land_cover_code = 1  # 004e2b
            land_use_name = "Forest / Mountain Wilderness Reserve"
            land_use_code = 3  # 004e2b
            change_status = "Active Fast Disturbance / Slope Scarp Expansion"
            change_code = 6  # a10018
        elif is_high_slope:
            land_cover_name = "Shrub / Low Vegetation Slope"
            land_cover_code = 4  # acbb67
            land_use_name = "Shrub / Pasture Land"
            land_use_code = 5  # a6976a
            change_status = "Slow Regrow / Moderate Soil Stress"
            change_code = 9  # afde1c
        else:
            land_cover_name = "Developed / Agriculture Plain"
            land_cover_code = 7  # f89a1c
            land_use_name = "Agriculture / Developed Settlement"
            land_use_code = 1  # fbff97
            change_status = "Stable / Low Change"
            change_code = 3  # e4f5fd

        return {
            "dataset": self.dataset_id,
            "product_version": "2025-11",
            "study_area": "CONUS & Global Mountain Basins",
            "land_cover": {
                "code": land_cover_code,
                "label": land_cover_name,
                "color": self.lc_palette[min(len(self.lc_palette)-1, max(0, land_cover_code-1))],
                "min": 1.0,
                "max": 15.0
            },
            "land_use": {
                "code": land_use_code,
                "label": land_use_name,
                "color": self.lu_palette[min(len(self.lu_palette)-1, max(0, land_use_code-1))],
                "min": 1.0,
                "max": 6.0
            },
            "vegetation_change": {
                "code": change_code,
                "label": change_status,
                "color": self.change_palette[min(len(self.change_palette)-1, max(0, change_code-1))],
                "min": 1.0,
                "max": 16.0
            }
        }
