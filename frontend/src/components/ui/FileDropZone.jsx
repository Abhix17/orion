import React, { useState, useRef } from 'react';
import { UploadCloud, X, File, CheckCircle2, Film, Music, Image as ImageIcon } from 'lucide-react';
import Button from './Button';

export default function FileDropZone({
  accept = '*/*',
  mediaType = 'file', // 'image' | 'audio' | 'video' | 'file'
  selectedFile = null,
  onFileSelect,
  onFileRemove,
  previewUrl = null,
  maxSizeMB = 25,
  helperText = 'Drop your file here or click to browse',
  style = {},
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const validateAndSelect = (file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File exceeds maximum size limit of ${maxSizeMB}MB.`);
      return;
    }
    if (onFileSelect) onFileSelect(file);
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image': return ImageIcon;
      case 'audio': return Music;
      case 'video': return Film;
      default: return File;
    }
  };

  const MediaIcon = getMediaIcon();

  return (
    <div style={{ width: '100%', ...style }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current && inputRef.current.click()}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.12)'}`,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: isDragOver ? 'rgba(110, 231, 255, 0.04)' : 'rgba(11, 16, 26, 0.6)',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'rgba(110, 231, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(110, 231, 255, 0.25)',
            }}
          >
            <UploadCloud size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {helperText}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Supports {accept.replace(/\/\*/g, '').toUpperCase()} up to {maxSizeMB}MB
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(110, 231, 255, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            {previewUrl && mediaType === 'image' ? (
              <img
                src={previewUrl}
                alt="Upload preview"
                style={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(110, 231, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(110, 231, 255, 0.2)',
                  flexShrink: 0,
                }}
              >
                <MediaIcon size={24} color="var(--accent-cyan)" />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for inspection
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (inputRef.current) inputRef.current.value = '';
              if (onFileRemove) onFileRemove();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
