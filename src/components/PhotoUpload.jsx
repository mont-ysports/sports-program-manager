/**
 * PhotoUpload.jsx — Photo capture/upload component for membership cards
 *
 * Supports:
 *  - File upload from device gallery
 *  - Live camera capture (getUserMedia) on mobile/desktop
 *  - Preview with crop guidance overlay
 *  - Base64 output for Apps Script upload
 */

import React, { useState, useRef, useCallback } from 'react';
import './PhotoUpload.css';

const MAX_SIZE_MB   = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const TARGET_WIDTH  = 400; // resize to this width before sending

/**
 * Resize an image File/Blob to TARGET_WIDTH, return base64 JPEG string.
 */
async function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio  = TARGET_WIDTH / img.width;
      const height = img.height * ratio;
      const canvas = document.createElement('canvas');
      canvas.width  = TARGET_WIDTH;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, TARGET_WIDTH, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1]); // base64 only
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function PhotoUpload({ label, hint, value, onChange, error, required }) {
  const [mode, setMode]           = useState('idle'); // idle | camera | preview
  const [stream, setStream]       = useState(null);
  const [facingMode, setFacingMode]   = useState('user'); // 'user' = front | 'environment' = back
  const [cameraError, setCameraError] = useState('');
  const [processing, setProcessing]   = useState(false);

  const fileInputRef = useRef(null);
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);

  // ── File upload ──────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, HEIC, etc.)');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      alert(`Photo must be under ${MAX_SIZE_MB}MB. Please choose a smaller file.`);
      return;
    }

    setProcessing(true);
    try {
      const base64 = await resizeImage(file);
      const previewUrl = URL.createObjectURL(file);
      onChange({ base64, previewUrl, fileName: file.name });
    } catch {
      alert('Could not process image. Please try a different photo.');
    } finally {
      setProcessing(false);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  }

  // ── Camera ───────────────────────────────────────────────
  async function startCamera(facing) {
    setCameraError('');
    const mode = facing || facingMode;
    // Stop any existing stream before starting a new one
    if (stream) stream.getTracks().forEach((t) => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(s);
      setFacingMode(mode);
      setMode('camera');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, or upload a photo instead.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device. Please upload a photo instead.');
      } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not available. Please use the Upload Photo button instead.');
      } else {
        setCameraError('Could not access camera: ' + err.message);
      }
    }
  }

  async function flipCamera() {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(newFacing);
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setMode('idle');
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror only front camera (selfie mode) — back camera should not be mirrored
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    setProcessing(true);
    canvas.toBlob(async (blob) => {
      try {
        const base64 = await resizeImage(blob);
        const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
        onChange({ base64, previewUrl, fileName: 'camera-capture.jpg' });
        stopCamera();
      } catch {
        alert('Could not process captured photo. Please try again.');
      } finally {
        setProcessing(false);
      }
    }, 'image/jpeg', 0.9);
  }

  function removePhoto() {
    onChange(null);
    setMode('idle');
  }

  return (
    <div className={`photo-upload ${error ? 'photo-upload--error' : ''}`}>
      <div className="photo-upload__label">
        {label}
        {required && <span className="required" aria-hidden="true"> *</span>}
      </div>

      {/* Photo guidelines */}
      <div className="photo-guidelines">
        <div className="photo-guidelines__sample">
          <svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Light background */}
            <rect width="80" height="90" fill="#F8F9FA" rx="6"/>
            {/* Head outline */}
            <ellipse cx="40" cy="32" rx="18" ry="20" fill="#D4B896" />
            {/* Neck */}
            <rect x="33" y="50" width="14" height="12" fill="#D4B896" />
            {/* Shoulders */}
            <path d="M10 90 Q10 68 40 65 Q70 68 70 90 Z" fill="#4A5568"/>
            {/* Left ear */}
            <ellipse cx="22" cy="33" rx="4" ry="5.5" fill="#C9A882"/>
            {/* Right ear */}
            <ellipse cx="58" cy="33" rx="4" ry="5.5" fill="#C9A882"/>
            {/* Eyes */}
            <ellipse cx="33" cy="29" rx="3" ry="3.5" fill="white"/>
            <ellipse cx="47" cy="29" rx="3" ry="3.5" fill="white"/>
            <circle cx="34" cy="30" r="2" fill="#3D2B1F"/>
            <circle cx="48" cy="30" r="2" fill="#3D2B1F"/>
            {/* Smile */}
            <path d="M34 40 Q40 45 46 40" stroke="#8B6349" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {/* ✓ ear markers */}
            <text x="14" y="20" fontSize="8" fill="#00C853">✓</text>
            <text x="56" y="20" fontSize="8" fill="#00C853">✓</text>
            {/* Border frame */}
            <rect width="80" height="90" fill="none" stroke="#CBD5E0" strokeWidth="1.5" rx="6"/>
          </svg>
          <span className="photo-guidelines__good">✓ Good</span>
        </div>
        <ul className="photo-guidelines__rules">
          <li>📸 <strong>For membership card use</strong></li>
          <li>⬜ White or light background</li>
          <li>👤 Shoulders-up, facing camera</li>
          <li>👂 Both ears visible if possible</li>
          <li>💡 Good lighting, no sunglasses</li>
          <li>📐 Clear, not blurry</li>
        </ul>
      </div>

      {/* Camera mode */}
      {mode === 'camera' && (
        <div className="photo-upload__camera">
          <div className="camera-viewport">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            {/* Oval face guide overlay */}
            <div className="camera-overlay">
              <div className="camera-oval" />
            </div>
            <div className="camera-hint">Position face within the oval</div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="camera-controls">
            <button type="button" className="btn btn--ghost btn--sm" onClick={stopCamera}>
              ✕ Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary capture-btn"
              onClick={capturePhoto}
              disabled={processing}
            >
              {processing ? <span className="spinner spinner--sm" /> : '📸 Capture'}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm flip-btn"
              onClick={flipCamera}
              disabled={processing}
              title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
            >
              🔄 {facingMode === 'user' ? 'Back' : 'Front'}
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {value && mode !== 'camera' && (
        <div className="photo-upload__preview">
          <img src={value.previewUrl} alt="Photo preview" className="photo-preview-img" />
          <div className="photo-preview__actions">
            <span className="photo-preview__ok">✅ Photo ready</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={removePhoto}>
              🗑 Remove
            </button>
          </div>
        </div>
      )}

      {/* Upload / Camera buttons (shown when no photo yet and not in camera mode) */}
      {!value && mode !== 'camera' && (
        <div className="photo-upload__actions">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            📁 Upload Photo
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={startCamera}
            disabled={processing}
          >
            📷 Use Camera
          </button>
          {processing && <span className="spinner spinner--sm" />}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture={undefined}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        </div>
      )}

      {cameraError && (
        <div className="alert alert--warning" style={{ marginTop: 8, fontSize: '0.85rem' }}>
          <span>⚠️</span>
          <div>{cameraError}</div>
        </div>
      )}

      {hint && !value && (
        <span className="form-hint">{hint}</span>
      )}

      {error && (
        <span className="form-error" role="alert">{error}</span>
      )}
    </div>
  );
}
