/**
 * QRScanner.jsx — Live camera QR code scanner using jsQR
 *
 * Renders a camera feed and continuously scans frames for QR codes.
 * Calls onScan(decodedText) when a valid QR is detected.
 */

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import './QRScanner.css';

export default function QRScanner({ onScan, onClose }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus]     = useState('starting'); // starting | scanning | error
  const [errorMsg, setErrorMsg] = useState('');
  const [lastScan, setLastScan] = useState('');

  useEffect(() => {
    startScanner();
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScanner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        await videoRef.current.play();
        setStatus('scanning');
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied. Please allow camera access and try again, or enter the Registration ID manually below.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No back camera found. Please enter the Registration ID manually.');
      } else {
        setErrorMsg('Camera error: ' + err.message);
      }
      setStatus('error');
    }
  }

  function stopScanner() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function scanFrame() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      const text = code.data;
      if (text !== lastScan) {
        setLastScan(text);
        stopScanner();
        // Extract registration ID from URL if QR encodes full URL
        let id = text;
        try {
          const url = new URL(text);
          const param = url.searchParams.get('id');
          if (param) id = param;
        } catch {
          // Not a URL — use text directly as ID
        }
        onScan(id.trim().toUpperCase());
        return;
      }
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }

  return (
    <div className="qr-scanner">
      <div className="qr-scanner__header">
        <h3>📷 Scan QR Code</h3>
        <button className="btn btn--ghost btn--sm" type="button" onClick={() => { stopScanner(); onClose(); }}>
          ✕ Close
        </button>
      </div>

      {status === 'error' ? (
        <div className="qr-scanner__error">
          <div className="alert alert--warning">
            <span>⚠️</span>
            <div>{errorMsg}</div>
          </div>
        </div>
      ) : (
        <div className="qr-scanner__viewport">
          <video ref={videoRef} className="qr-video" muted playsInline />
          {/* Targeting overlay */}
          <div className="qr-overlay">
            <div className="qr-frame">
              <span className="qr-frame__corner qr-frame__corner--tl" />
              <span className="qr-frame__corner qr-frame__corner--tr" />
              <span className="qr-frame__corner qr-frame__corner--bl" />
              <span className="qr-frame__corner qr-frame__corner--br" />
              <div className="qr-scan-line" />
            </div>
          </div>
          <div className="qr-hint">
            {status === 'starting' ? 'Starting camera…' : 'Point at participant\'s QR code'}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
