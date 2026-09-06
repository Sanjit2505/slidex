import React, { useState, useEffect, useRef } from 'react';
import {
  Satellite,
  Activity,
  CloudRain,
  Mountain,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Cpu,
  Upload,
  Sparkles,
  BarChart3,
  MapPin,
  ShieldAlert,
  Sliders,
  Database,
  Camera,
  Compass,
  Phone,
  Radio,
  AlertOctagon,
  FileText,
  Navigation,
  X,
  Send,
  Users,
  Clock
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  // Analysis Mode: 'single' | 'temporal'
  const [analysisMode, setAnalysisMode] = useState('single');

  // Environmental & Geotechnical Form State
  const [rainfall, setRainfall] = useState(165);
  const [vibration, setVibration] = useState(35);
  const [earthquakeMag, setEarthquakeMag] = useState(3.5);
  const [slopeAngle, setSlopeAngle] = useState(0); // 0 = Auto-extract in single mode
  const [soilMoisture, setSoilMoisture] = useState(82);
  const [locationName, setLocationName] = useState("Idukki High Ranges Escarpment (Zone B)");

  // Images State
  // Single image mode
  const [singleImage, setSingleImage] = useState(null);
  const [singlePreview, setSinglePreview] = useState(null);

  // Multi-temporal mode
  const [preImage, setPreImage] = useState(null);
  const [postImage, setPostImage] = useState(null);
  const [prePreview, setPrePreview] = useState(null);
  const [postPreview, setPostPreview] = useState(null);

  // Status & Results
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [trainModalOpen, setTrainModalOpen] = useState(false);
  const [trainStatus, setTrainStatus] = useState(null);
  const [training, setTraining] = useState(false);
  const [activeVisualTab, setActiveVisualTab] = useState('overlay'); // 'overlay' | 'heatmap'

  // === SOS System State ===
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [sosSending, setSosSending] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [reportSending, setReportSending] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [reportDescription, setReportDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reportImage, setReportImage] = useState(null);
  const [reportImagePreview, setReportImagePreview] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [sosTab, setSosTab] = useState('sos'); // 'sos' | 'report' | 'alerts'
  const reportImageRef = useRef(null);

  // Health Check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) setBackendOnline(true);
      } catch (e) {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent SOS alerts periodically
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sos-alerts`);
        if (res.ok) {
          const data = await res.json();
          setRecentAlerts(data.alerts || []);
        }
      } catch (e) { /* silent fail */ }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Live GPS Location
  const fetchLiveLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLocationLoading(false);
      },
      (err) => {
        // Simulate a realistic Indian location for demo if permission denied
        setLiveLocation({
          latitude: 30.3165 + (Math.random() - 0.5) * 0.01,
          longitude: 78.0322 + (Math.random() - 0.5) * 0.01,
          accuracy: 15 + Math.random() * 30,
          simulated: true
        });
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Send SOS
  const handleSendSOS = async () => {
    if (!liveLocation) return;
    setSosSending(true);
    setSosResult(null);
    try {
      const fd = new FormData();
      fd.append('latitude', liveLocation.latitude);
      fd.append('longitude', liveLocation.longitude);
      fd.append('accuracy', liveLocation.accuracy);
      fd.append('sender_name', reporterName || 'Field Reporter');
      fd.append('message', 'EMERGENCY SOS: Landslide risk or active landslide detected! Immediate evacuation required in this area!');
      const res = await fetch(`${API_BASE}/api/sos`, { method: 'POST', body: fd });
      const data = await res.json();
      setSosResult(data);
    } catch (e) {
      setSosResult({ success: false, error: e.message });
    } finally {
      setSosSending(false);
    }
  };

  // Submit Incident Report
  const handleReportIncident = async () => {
    if (!liveLocation) return;
    setReportSending(true);
    setReportResult(null);
    try {
      const fd = new FormData();
      fd.append('latitude', liveLocation.latitude);
      fd.append('longitude', liveLocation.longitude);
      fd.append('accuracy', liveLocation.accuracy);
      fd.append('description', reportDescription || 'Landslide or ground movement observed');
      fd.append('reporter_name', reporterName || 'Anonymous');
      if (reportImage) fd.append('image', reportImage);
      const res = await fetch(`${API_BASE}/api/report-incident`, { method: 'POST', body: fd });
      const data = await res.json();
      setReportResult(data);
      // Refresh alerts
      const alertsRes = await fetch(`${API_BASE}/api/sos-alerts`);
      if (alertsRes.ok) {
        const alertData = await alertsRes.json();
        setRecentAlerts(alertData.alerts || []);
      }
    } catch (e) {
      setReportResult({ success: false, error: e.message });
    } finally {
      setReportSending(false);
    }
  };

  // Auto-load a single image preset on initial mount
  useEffect(() => {
    loadSinglePreset('steep_rain');
  }, []);

  // Load Single-Image Preset
  const loadSinglePreset = async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sample-preset-single/${type}`);
      const data = await res.json();

      setSinglePreview(data.image_base64);
      const resImg = await fetch(data.image_base64);
      const blob = await resImg.blob();
      setSingleImage(new File([blob], `single_${type}.jpg`, { type: 'image/jpeg' }));

      setRainfall(data.env_data.rainfall);
      setVibration(data.env_data.vibration);
      setEarthquakeMag(data.env_data.earthquake_mag);
      setSlopeAngle(data.env_data.slope_angle);
      setSoilMoisture(data.env_data.soil_moisture);
      setLocationName(data.env_data.location_name);
      setPrediction(null);
    } catch (err) {
      console.error("Failed to load single preset:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Multi-Temporal Preset
  const loadTemporalPreset = async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sample-preset/${type}`);
      const data = await res.json();

      setPrePreview(data.pre_image_base64);
      setPostPreview(data.post_image_base64);

      const resPre = await fetch(data.pre_image_base64);
      const blobPre = await resPre.blob();
      setPreImage(new File([blobPre], `pre_${type}.jpg`, { type: 'image/jpeg' }));

      const resPost = await fetch(data.post_image_base64);
      const blobPost = await resPost.blob();
      setPostImage(new File([blobPost], `post_${type}.jpg`, { type: 'image/jpeg' }));

      setRainfall(data.env_data.rainfall);
      setVibration(data.env_data.vibration);
      setEarthquakeMag(data.env_data.earthquake_mag);
      setSlopeAngle(data.env_data.slope_angle);
      setSoilMoisture(data.env_data.soil_moisture);
      setLocationName(data.env_data.location_name);
      setPrediction(null);
    } catch (err) {
      console.error("Failed to load temporal preset:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run Analysis based on active mode
  const handleAnalyze = async () => {
    setLoading(true);
    try {
      if (analysisMode === 'single') {
        if (!singleImage) {
          alert("Please upload or select a satellite image for slope and hazard analysis.");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("image", singleImage);
        formData.append("rainfall", rainfall);
        formData.append("vibration", vibration);
        formData.append("earthquake_mag", earthquakeMag);
        formData.append("slope_angle", slopeAngle);
        formData.append("soil_moisture", soilMoisture);
        formData.append("location_name", locationName);

        const res = await fetch(`${API_BASE}/api/predict-single`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(await res.text());
        const resultData = await res.json();
        setPrediction(resultData);

      } else {
        if (!preImage || !postImage) {
          alert("Please provide both Pre-Event (T1) and Post-Event (T2) satellite images.");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("image_pre", preImage);
        formData.append("image_post", postImage);
        formData.append("rainfall", rainfall);
        formData.append("vibration", vibration);
        formData.append("earthquake_mag", earthquakeMag);
        formData.append("slope_angle", slopeAngle === 0 ? 35 : slopeAngle);
        formData.append("soil_moisture", soilMoisture);
        formData.append("location_name", locationName);

        const res = await fetch(`${API_BASE}/api/predict`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(await res.text());
        const resultData = await res.json();
        setPrediction(resultData);
      }
    } catch (err) {
      alert("Analysis failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Train AI Model
  const handleTrainModel = async () => {
    setTraining(true);
    setTrainStatus(null);
    try {
      const formData = new FormData();
      formData.append("dataset_folder", "landslide_datasets");
      const res = await fetch(`${API_BASE}/api/train`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setTrainStatus(data);
    } catch (err) {
      setTrainStatus({ status: "error", message: err.message });
    } finally {
      setTraining(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
          }}>
            <Satellite size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                Slide<span style={{ color: '#06b6d4' }}>X</span> Cognitive AI
              </h1>
              <span style={{
                fontSize: '11px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06b6d4',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 600,
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                v2.1 InSAR & Slope Profiling
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Cognitive Imaging & Multi-Modal Landslide Prediction Platform
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(17, 24, 39, 0.8)',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            fontSize: '13px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: backendOnline ? '#10b981' : '#ef4444',
              boxShadow: backendOnline ? '0 0 10px #10b981' : '0 0 10px #ef4444'
            }} />
            <span style={{ color: 'var(--text-muted)' }}>
              Core API: {backendOnline ? 'Online (Port 8000)' : 'Connecting...'}
            </span>
          </div>

          <button
            onClick={() => setTrainModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Database size={16} />
            Train on Dataset Folder
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 24px', width: '100%', flex: 1 }}>

        {/* Mode Selector & Presets Banner */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => { setAnalysisMode('single'); setPrediction(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: analysisMode === 'single' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'transparent',
                color: analysisMode === 'single' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: analysisMode === 'single' ? '0 2px 10px rgba(6, 182, 212, 0.3)' : 'none'
              }}
            >
              <Camera size={16} />
              Single Image (Slope & Topography Mode)
            </button>

            <button
              onClick={() => { setAnalysisMode('temporal'); setPrediction(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: analysisMode === 'temporal' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'transparent',
                color: analysisMode === 'temporal' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: analysisMode === 'temporal' ? '0 2px 10px rgba(6, 182, 212, 0.3)' : 'none'
              }}
            >
              <Layers size={16} />
              Temporal Comparison (T1 vs T2 Pair)
            </button>
          </div>

          {/* Quick Presets for current mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: '#06b6d4' }} />
              Presets:
            </span>
            {analysisMode === 'single' ? (
              <>
                <button
                  onClick={() => loadSinglePreset('steep_rain')}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🚨 Steep Escarpment + Rain (High Risk)
                </button>
                <button
                  onClick={() => loadSinglePreset('moderate_hill')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⚠️ Rugged Foothill (Moderate)
                </button>
                <button
                  onClick={() => loadSinglePreset('gentle_slope')}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🌲 Gentle Plateau (Stable)
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => loadTemporalPreset('critical')}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🚨 Monsoon Debris Flow (Critical)
                </button>
                <button
                  onClick={() => loadTemporalPreset('moderate')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⚠️ Ground Movement + Rain
                </button>
                <button
                  onClick={() => loadTemporalPreset('stable')}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🌲 Stable Baseline
                </button>
              </>
            )}
          </div>

        </div>

        {/* 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 480px) 1fr', gap: '28px' }}>

          {/* LEFT: Inputs & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Satellite Imagery Card */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {analysisMode === 'single' ? <Camera size={18} color="#06b6d4" /> : <Layers size={18} color="#06b6d4" />}
                  <h2 style={{ fontSize: '16px', fontWeight: 700 }}>
                    {analysisMode === 'single' ? "Single Satellite / Aerial Image" : "Temporal Imagery (Pre & Post)"}
                  </h2>
                </div>
                {analysisMode === 'single' && (
                  <span style={{ fontSize: '11px', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                    Auto-Slope Profiler
                  </span>
                )}
              </div>

              {analysisMode === 'single' ? (
                /* Single Image Upload */
                <div>
                  <label style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    height: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: 'rgba(15, 23, 42, 0.6)',
                    position: 'relative'
                  }}>
                    {singlePreview ? (
                      <img src={singlePreview} alt="Target Slope" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <Upload size={28} color="#6b7280" style={{ margin: '0 auto 8px' }} />
                        <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600 }}>
                          Click or drag satellite/aerial hill image
                        </span>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                          AI will automatically profile slope steepness, fractures, and surface roughness
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                          setSingleImage(f);
                          const r = new FileReader();
                          r.onloadend = () => setSinglePreview(r.result);
                          r.readAsDataURL(f);
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                /* Dual Temporal Images Upload */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                      T1: Baseline (Pre-Event)
                    </label>
                    <label style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '12px',
                      height: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      background: 'rgba(15, 23, 42, 0.6)'
                    }}>
                      {prePreview ? (
                        <img src={prePreview} alt="Pre-Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '10px' }}>
                          <Upload size={20} color="#6b7280" style={{ margin: '0 auto 6px' }} />
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Upload Satellite T1</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (f) {
                            setPreImage(f);
                            const r = new FileReader();
                            r.onloadend = () => setPrePreview(r.result);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                      T2: Current (Post-Event)
                    </label>
                    <label style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '12px',
                      height: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      background: 'rgba(15, 23, 42, 0.6)'
                    }}>
                      {postPreview ? (
                        <img src={postPreview} alt="Post-Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '10px' }}>
                          <Upload size={20} color="#6b7280" style={{ margin: '0 auto 6px' }} />
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Upload Satellite T2</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (f) {
                            setPostImage(f);
                            const r = new FileReader();
                            r.onloadend = () => setPostPreview(r.result);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Environmental & Meteorological Inputs */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Sliders size={18} color="#3b82f6" />
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Environmental & In-Situ Parameters</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Location */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Observation Sector / Region Name
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      fontFamily: 'var(--font-main)'
                    }}
                  />
                </div>

                {/* 24h Rainfall */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CloudRain size={14} color="#60a5fa" /> 24h Cumulative Precipitation (Rainfall):
                    </span>
                    <strong style={{ color: rainfall > 100 ? '#f87171' : '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                      {rainfall} mm
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={rainfall}
                    onChange={(e) => setRainfall(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#3b82f6' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)' }}>
                    <span>0 mm (Light)</span>
                    <span>100 mm (Critical Monsoon Trigger)</span>
                    <span>300 mm (Cloudburst)</span>
                  </div>
                </div>

                {/* Slope Angle Handling */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mountain size={14} color="#06b6d4" /> Slope Incline (Degrees):
                    </span>
                    <strong style={{ color: '#06b6d4', fontFamily: 'var(--font-mono)' }}>
                      {slopeAngle === 0 ? "Auto-Detect from Image" : `${slopeAngle}°`}
                    </strong>
                  </div>
                  {analysisMode === 'single' ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Set to 0 to let Computer Vision estimate slope automatically from topography, or drag slider to lock custom angle:
                    </div>
                  ) : null}
                  <input
                    type="range"
                    min="0"
                    max="70"
                    value={slopeAngle}
                    onChange={(e) => setSlopeAngle(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#06b6d4' }}
                  />
                </div>

                {/* Vibration & Earthquake */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Vibration:</span>
                      <strong style={{ color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>{vibration} mm/s²</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={vibration}
                      onChange={(e) => setVibration(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#8b5cf6' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Earthquake:</span>
                      <strong style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>M {earthquakeMag}</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="7.5"
                      step="0.1"
                      value={earthquakeMag}
                      onChange={(e) => setEarthquakeMag(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#f59e0b' }}
                    />
                  </div>
                </div>

                {/* Soil Moisture */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Pore Water Saturation / Soil Moisture:</span>
                    <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>{soilMoisture}%</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={soilMoisture}
                    onChange={(e) => setSoilMoisture(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#10b981' }}
                  />
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '22px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? "Running AI & Topographic Inference..." : (
                  analysisMode === 'single'
                    ? "PREDICT LANDSLIDE (SINGLE IMAGE + METRICS)"
                    : "EXECUTE COGNITIVE & AI FUSION PREDICTION"
                )}
              </button>
            </div>

          </div>

          {/* RIGHT: Results Dashboard */}
          <div>
            {!prediction ? (
              <div className="glass-panel" style={{
                padding: '60px 40px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  padding: '24px',
                  borderRadius: '50%',
                  marginBottom: '20px'
                }}>
                  <Mountain size={48} color="#06b6d4" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
                  {analysisMode === 'single' ? "Single-Image Slope Analysis Ready" : "Temporal Comparison Ready"}
                </h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '420px', fontSize: '14px', lineHeight: 1.6 }}>
                  {analysisMode === 'single'
                    ? "Upload a single hill image or click a preset to extract topographical slope angle, fracture ridges, and combine with rainfall to predict landslide risk."
                    : "Upload pre/post satellite images to analyze ground displacement and predict catastrophic slope failure."}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Hero Answer Card */}
                <div className="glass-panel" style={{
                  padding: '28px',
                  borderLeft: `6px solid ${prediction.alert_color}`,
                  background: `linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(15, 23, 42, 0.95))`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                        WILL THERE BE A LANDSLIDE?
                      </span>
                      <h2 style={{ fontSize: '28px', fontWeight: 800, color: prediction.alert_color, marginTop: '4px' }}>
                        {prediction.will_landslide}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <MapPin size={14} color="#9ca3af" />
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{prediction.location}</span>
                        <span style={{ fontSize: '11px', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {prediction.mode === 'single_image' ? 'Single-Image Slope Profiling' : 'Multi-Temporal Differential'}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>COMPOSITE PROBABILITY</span>
                      <div style={{
                        fontSize: '38px',
                        fontWeight: 900,
                        fontFamily: 'var(--font-mono)',
                        color: prediction.alert_color
                      }}>
                        {prediction.probability_percentage}%
                      </div>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: `${prediction.alert_color}22`,
                        color: prediction.alert_color,
                        fontWeight: 700,
                        border: `1px solid ${prediction.alert_color}44`
                      }}>
                        {prediction.risk_level}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation Protocol */}
                  <div style={{
                    marginTop: '20px',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <ShieldAlert size={22} color={prediction.alert_color} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '13px', color: '#e5e7eb', lineHeight: 1.5 }}>
                      <strong>Action Protocol:</strong> {prediction.recommendation}
                    </p>
                  </div>
                </div>

                {/* Cognitive Visual Heatmap & Topography Inspector */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mountain size={18} color="#06b6d4" />
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                        {prediction.mode === 'single_image'
                          ? "Cognitive Slope Topography & Fracture Ridge Map"
                          : "Cognitive Imaging: Surface Displacement Map"}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', padding: '3px' }}>
                      <button
                        onClick={() => setActiveVisualTab('overlay')}
                        style={{
                          background: activeVisualTab === 'overlay' ? '#3b82f6' : 'transparent',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {prediction.mode === 'single_image' ? "Topographical Incline Overlay" : "Change Overlay"}
                      </button>
                      <button
                        onClick={() => setActiveVisualTab('heatmap')}
                        style={{
                          background: activeVisualTab === 'heatmap' ? '#3b82f6' : 'transparent',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Spectral Gradient Heatmap
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        Input Satellite Imagery
                      </span>
                      <div style={{ borderRadius: '12px', overflow: 'hidden', height: '220px', background: '#000' }}>
                        <img
                          src={prediction.mode === 'single_image' ? singlePreview : postPreview}
                          alt="Input"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        Cognitive Topographical Map ({activeVisualTab})
                      </span>
                      <div style={{ borderRadius: '12px', overflow: 'hidden', height: '220px', background: '#000' }}>
                        <img
                          src={activeVisualTab === 'overlay' ? prediction.visuals.overlay : prediction.visuals.heatmap}
                          alt="Cognitive Diff"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Derived Cognitive Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                    {prediction.mode === 'single_image' ? (
                      <>
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Estimated Slope Angle</span>
                          <strong style={{ fontSize: '16px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                            {prediction.breakdown.cognitive_imaging.estimated_slope_angle}°
                          </strong>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Fracture / Scarp Density</span>
                          <strong style={{ fontSize: '16px', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                            {(prediction.breakdown.cognitive_imaging.fracture_density * 100).toFixed(1)}%
                          </strong>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Slope Susceptibility Index</span>
                          <strong style={{ fontSize: '16px', color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
                            {prediction.breakdown.cognitive_imaging.score}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Surface Shift Area</span>
                          <strong style={{ fontSize: '16px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                            {(prediction.breakdown.cognitive_imaging.change_ratio * 100).toFixed(1)}%
                          </strong>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Slope Disruption Index</span>
                          <strong style={{ fontSize: '16px', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                            {(prediction.breakdown.cognitive_imaging.slope_deformation * 100).toFixed(1)}%
                          </strong>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Cognitive Index</span>
                          <strong style={{ fontSize: '16px', color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
                            {prediction.breakdown.cognitive_imaging.score}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Model Trigger Contribution */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <BarChart3 size={18} color="#3b82f6" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>AI Multi-Trigger Contribution Analysis</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Hydrological Saturation (Rainfall: {rainfall}mm, Moisture: {soilMoisture}%)</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{(prediction.breakdown.ai_model.hydro_score * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${prediction.breakdown.ai_model.hydro_score * 100}%`, background: '#3b82f6', borderRadius: '4px' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>
                          Geotechnical Incline Factor (Effective Slope: {prediction.breakdown.ai_model.effective_slope_angle || slopeAngle}°)
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{(prediction.breakdown.ai_model.slope_factor * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${prediction.breakdown.ai_model.slope_factor * 100}%`, background: '#06b6d4', borderRadius: '4px' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Seismic Trigger (Vibration & Earthquake)</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{(prediction.breakdown.ai_model.seismic_score * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${prediction.breakdown.ai_model.seismic_score * 100}%`, background: '#8b5cf6', borderRadius: '4px' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </main>

      {/* Dataset Training Modal */}
      {trainModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', background: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} color="#06b6d4" />
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Fine-Tune AI on Dataset Folder</h3>
              </div>
              <button
                onClick={() => setTrainModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Fine-tune the neural weights using multi-temporal satellite rasters, DEM slope grids, and rainfall CSV logs located in:
            </p>

            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              padding: '12px 16px',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#38bdf8',
              marginBottom: '20px'
            }}>
              📁 ./landslide_datasets/
            </div>

            {trainStatus && (
              <div style={{
                background: trainStatus.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${trainStatus.status === 'success' ? '#10b981' : '#ef4444'}`,
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: 700, color: trainStatus.status === 'success' ? '#34d399' : '#f87171', marginBottom: '4px' }}>
                  {trainStatus.status === 'success' ? '✓ Training Complete' : '⚠ Training Error'}
                </div>
                <div>{trainStatus.message}</div>
                {trainStatus.validation_accuracy && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}>
                    Validation Accuracy: <strong>{(trainStatus.validation_accuracy * 100).toFixed(1)}%</strong> | F1-Score: <strong>{trainStatus.f1_score}</strong>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setTrainModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={handleTrainModel}
                disabled={training}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: training ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {training ? <RefreshCw className="animate-spin" size={14} /> : <Cpu size={14} />}
                {training ? "Training..." : "Start Training"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FLOATING SOS BUTTON ===== */}
      <button
        id="sos-floating-btn"
        onClick={() => {
          setSosModalOpen(true);
          setSosResult(null);
          setReportResult(null);
          if (!liveLocation) fetchLiveLocation();
        }}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 200,
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
          border: '3px solid rgba(255,255,255,0.25)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          cursor: 'pointer',
          boxShadow: '0 0 0 0 rgba(239,68,68,0.7)',
          animation: 'sos-pulse 2s infinite',
          fontWeight: 900,
          fontSize: '12px',
          letterSpacing: '1px'
        }}
      >
        <Phone size={22} />
        SOS
      </button>

      {/* SOS pulse animation */}
      <style>{`
        @keyframes sos-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          70% { box-shadow: 0 0 0 18px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ===== SOS FULL MODAL ===== */}
      {sosModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: '20px'
        }}>
          <div style={{
            width: '100%', maxWidth: '640px',
            background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '20px', overflow: 'hidden',
            boxShadow: '0 0 60px rgba(239,68,68,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertOctagon size={28} color="#fff" />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>Emergency SOS System</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>SlideX Landslide Emergency Response</div>
                </div>
              </div>
              <button onClick={() => setSosModalOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
              {[['sos','📡 Send SOS'],['report','📷 Report Incident'],['alerts','🔔 Active Alerts']].map(([tab, label]) => (
                <button key={tab} onClick={() => setSosTab(tab)} style={{
                  flex: 1, padding: '12px 8px', border: 'none',
                  background: sosTab === tab ? 'rgba(239,68,68,0.2)' : 'transparent',
                  color: sosTab === tab ? '#f87171' : '#9ca3af',
                  fontWeight: sosTab === tab ? 700 : 500, fontSize: '13px', cursor: 'pointer',
                  borderBottom: sosTab === tab ? '2px solid #ef4444' : '2px solid transparent'
                }}>{label}</button>
              ))}
            </div>

            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>

              {/* === SOS TAB === */}
              {sosTab === 'sos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Location Card */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <Navigation size={16} color="#06b6d4" /> Live GPS Location
                      </div>
                      <button
                        id="fetch-location-btn"
                        onClick={fetchLiveLocation}
                        disabled={locationLoading}
                        style={{
                          background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)',
                          color: '#06b6d4', borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
                          fontWeight: 600, cursor: locationLoading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {locationLoading ? '📡 Acquiring...' : '🔄 Refresh Location'}
                      </button>
                    </div>
                    {liveLocation ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ background: 'rgba(6,182,212,0.1)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Latitude</div>
                          <div style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>{liveLocation.latitude.toFixed(6)}°N</div>
                        </div>
                        <div style={{ background: 'rgba(6,182,212,0.1)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Longitude</div>
                          <div style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>{liveLocation.longitude.toFixed(6)}°E</div>
                        </div>
                        <div style={{ background: 'rgba(6,182,212,0.1)', borderRadius: '8px', padding: '10px', gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Accuracy</div>
                          <div style={{ fontFamily: 'monospace', color: '#34d399', fontWeight: 700 }}>
                            ±{liveLocation.accuracy ? liveLocation.accuracy.toFixed(0) : '?'} m
                            {liveLocation.simulated && <span style={{ color: '#fbbf24', fontSize: '11px', marginLeft: '8px' }}>(Demo Location – Dehradun, Uttarakhand)</span>}
                          </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <a
                            href={`https://maps.google.com/?q=${liveLocation.latitude},${liveLocation.longitude}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'underline' }}
                          >
                            📍 View on Google Maps
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px', fontSize: '13px' }}>
                        {locationError ? <span style={{ color: '#f87171' }}>⚠ {locationError}</span> : '📡 Click "Refresh Location" to acquire your GPS coordinates'}
                      </div>
                    )}
                  </div>

                  {/* Sender name */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Your Name (optional)</label>
                    <input
                      type="text" value={reporterName}
                      onChange={e => setReporterName(e.target.value)}
                      placeholder="e.g. Ravi Sharma"
                      style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '8px', color: '#fff', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* SOS result */}
                  {sosResult && (
                    <div style={{
                      background: sosResult.success ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      border: `1px solid ${sosResult.success ? '#10b981' : '#ef4444'}`,
                      borderRadius: '12px', padding: '16px'
                    }}>
                      <div style={{ fontWeight: 700, color: sosResult.success ? '#34d399' : '#f87171', marginBottom: '8px' }}>
                        {sosResult.success ? '✅ SOS Broadcast Sent!' : '❌ Failed to Send SOS'}
                      </div>
                      {sosResult.success && sosResult.alert && (
                        <div style={{ fontSize: '13px', color: '#e5e7eb', lineHeight: 1.6 }}>
                          <div>📌 Alert ID: <strong style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{sosResult.alert.id}</strong></div>
                          <div>📡 Status: <strong style={{ color: '#10b981' }}>{sosResult.alert.status}</strong></div>
                          <div>📱 {sosResult.broadcast_summary}</div>
                          <div>🕐 Sent at: {new Date(sosResult.alert.timestamp).toLocaleTimeString('en-IN')}</div>
                        </div>
                      )}
                      {!sosResult.success && <div style={{ fontSize: '13px', color: '#fca5a5' }}>{sosResult.error}</div>}
                    </div>
                  )}

                  {/* Send SOS Button */}
                  <button
                    id="send-sos-btn"
                    onClick={handleSendSOS}
                    disabled={!liveLocation || sosSending}
                    style={{
                      width: '100%', padding: '16px',
                      background: (!liveLocation || sosSending) ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #ef4444, #b91c1c)',
                      border: 'none', borderRadius: '12px', color: '#fff',
                      fontWeight: 900, fontSize: '17px', cursor: (!liveLocation || sosSending) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: liveLocation && !sosSending ? '0 4px 24px rgba(239,68,68,0.5)' : 'none',
                      letterSpacing: '1px'
                    }}
                  >
                    {sosSending ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> : <Radio size={22} />}
                    {sosSending ? 'BROADCASTING SOS...' : '🚨 SEND SOS TO NEARBY PHONES'}
                  </button>
                  {!liveLocation && (
                    <p style={{ textAlign: 'center', color: '#fbbf24', fontSize: '12px', marginTop: '-12px' }}>⚠ Acquire your GPS location first</p>
                  )}
                </div>
              )}

              {/* === REPORT INCIDENT TAB === */}
              {sosTab === 'report' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Location display */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                      {liveLocation
                        ? <><Navigation size={14} style={{ display: 'inline', marginRight: '6px', color: '#10b981' }} />
                            <strong style={{ color: '#e5e7eb' }}>{liveLocation.latitude.toFixed(5)}°N, {liveLocation.longitude.toFixed(5)}°E</strong>
                            {liveLocation.simulated && <span style={{ color: '#fbbf24', marginLeft: '6px', fontSize: '11px' }}>(Demo)</span>}
                          </>
                        : 'No location acquired'}
                    </div>
                    <button onClick={fetchLiveLocation} disabled={locationLoading}
                      style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}
                    >{locationLoading ? 'Acquiring...' : '📡 Get Location'}</button>
                  </div>

                  {/* Name */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Reporter Name</label>
                    <input type="text" value={reporterName} onChange={e => setReporterName(e.target.value)} placeholder="Your name"
                      style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', padding: '9px 12px', borderRadius: '8px', color: '#fff', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Incident Description</label>
                    <textarea value={reportDescription} onChange={e => setReportDescription(e.target.value)}
                      placeholder="Describe what you see: cracks in ground, debris movement, flooding, etc."
                      rows={3}
                      style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', padding: '9px 12px', borderRadius: '8px', color: '#fff', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>📷 Attach Photo (AI will analyze for landslide risk)</label>
                    <label style={{
                      border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '10px', height: '120px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', background: 'rgba(15,23,42,0.5)'
                    }}>
                      {reportImagePreview
                        ? <img src={reportImagePreview} alt="Report" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <><Camera size={24} color="#6b7280" style={{ marginBottom: '6px' }} />
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Tap to attach photo evidence</span>
                          </>}
                      <input ref={reportImageRef} type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files[0];
                          if (f) {
                            setReportImage(f);
                            const r = new FileReader();
                            r.onloadend = () => setReportImagePreview(r.result);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                    {reportImagePreview && (
                      <button onClick={() => { setReportImage(null); setReportImagePreview(null); }}
                        style={{ marginTop: '6px', background: 'none', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>
                        ✕ Remove photo
                      </button>
                    )}
                  </div>

                  {/* Report Result */}
                  {reportResult && (
                    <div style={{
                      background: reportResult.success ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      border: `1px solid ${reportResult.success ? '#10b981' : '#ef4444'}`,
                      borderRadius: '12px', padding: '16px'
                    }}>
                      <div style={{ fontWeight: 700, color: reportResult.success ? '#34d399' : '#f87171', marginBottom: '8px' }}>
                        {reportResult.success ? '✅ Incident Reported' : '❌ Report Failed'}
                      </div>
                      {reportResult.success && reportResult.report && (
                        <div style={{ fontSize: '13px', color: '#e5e7eb', lineHeight: 1.7 }}>
                          <div>📋 Report ID: <strong style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{reportResult.report.id}</strong></div>
                          <div>🕐 {new Date(reportResult.report.timestamp).toLocaleString('en-IN')}</div>
                          {reportResult.report.image_analysis && !reportResult.report.image_analysis.error && (
                            <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                              <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>🤖 AI Image Analysis:</div>
                              <div>Risk: <strong style={{ color: reportResult.report.image_analysis.risk_level === 'CRITICAL' ? '#ef4444' : reportResult.report.image_analysis.risk_level === 'HIGH' ? '#f97316' : '#fbbf24' }}>{reportResult.report.image_analysis.risk_level}</strong></div>
                              <div>Probability: <strong>{reportResult.report.image_analysis.probability}%</strong></div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{reportResult.report.image_analysis.recommendation}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    id="submit-report-btn"
                    onClick={handleReportIncident}
                    disabled={!liveLocation || reportSending}
                    style={{
                      width: '100%', padding: '14px',
                      background: (!liveLocation || reportSending) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      border: 'none', borderRadius: '10px', color: '#fff',
                      fontWeight: 700, fontSize: '15px', cursor: (!liveLocation || reportSending) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    {reportSending ? '⟳ Submitting...' : <><Send size={16} /> Submit Incident Report</>}
                  </button>
                </div>
              )}

              {/* === ACTIVE ALERTS TAB === */}
              {sosTab === 'alerts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                      <Radio size={14} style={{ display: 'inline', marginRight: '4px', color: '#ef4444' }} />
                      {recentAlerts.length} active SOS broadcast{recentAlerts.length !== 1 ? 's' : ''}
                    </div>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Auto-refreshes every 8s</span>
                  </div>
                  {recentAlerts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px' }}>
                      <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 12px', display: 'block' }} />
                      <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '6px' }}>No Active Alerts</div>
                      <div style={{ fontSize: '13px' }}>All clear in your area. No SOS signals detected.</div>
                    </div>
                  ) : (
                    recentAlerts.slice().reverse().map((alert, i) => (
                      <div key={alert.id} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '12px', padding: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px' }}>SOS</span>
                            <span style={{ fontWeight: 700, color: '#e5e7eb', fontSize: '14px' }}>{alert.id}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                            {new Date(alert.timestamp).toLocaleTimeString('en-IN')}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '8px' }}>{alert.message}</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            <Navigation size={11} style={{ display: 'inline', marginRight: '3px' }} />
                            {alert.latitude.toFixed(4)}°N, {alert.longitude.toFixed(4)}°E
                          </span>
                          <span style={{ fontSize: '11px', color: '#fbbf24' }}>
                            <Users size={11} style={{ display: 'inline', marginRight: '3px' }} />
                            ~{alert.estimated_phones_reached} devices notified
                          </span>
                          <a
                            href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: '11px', color: '#60a5fa' }}
                          >📍 View on Map</a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
