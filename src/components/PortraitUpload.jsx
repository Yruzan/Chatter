import React, { useEffect, useRef, useState } from "react";
import { Upload, ImagePlus, X, Check, Move, RotateCcw } from "lucide-react";

const validTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export default function PortraitUpload({ value, onChange, onBusyChange }) {
  const input = useRef(null),
    source = useRef(null),
    sourceUrl = useRef(null),
    request = useRef(0),
    callback = useRef(onChange);
  callback.current = onChange;
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [cropPending, setCropPending] = useState(false),
    [dragging, setDragging] = useState(false),
    [crop, setCrop] = useState({ zoom: 1, x: 50, y: 50 }),
    [adjust, setAdjust] = useState(false),
    [hasSource, setHasSource] = useState(false);
  useEffect(() => {
    onBusyChange?.(loading || cropPending);
  }, [loading, cropPending, onBusyChange]);
  useEffect(
    () => () => {
      request.current++;
      if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
    },
    [],
  );
  useEffect(() => {
    if (value) return;
    source.current = null;
    setHasSource(false);
    setAdjust(false);
    setCropPending(false);
    if (sourceUrl.current) {
      URL.revokeObjectURL(sourceUrl.current);
      sourceUrl.current = null;
    }
  }, [value]);
  useEffect(() => {
    if (!source.current) return;
    const image = source.current;
    setCropPending(true);
    const timer = setTimeout(() => {
      try {
        const side =
          Math.min(image.naturalWidth, image.naturalHeight) / crop.zoom;
        const sx = ((image.naturalWidth - side) * crop.x) / 100,
          sy = ((image.naturalHeight - side) * crop.y) / 100;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#17281c";
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(image, sx, sy, side, side, 0, 0, 512, 512);
        callback.current(canvas.toDataURL("image/webp", 0.85));
      } catch {
        setError("This image could not be processed. Try another photo.");
      } finally {
        setCropPending(false);
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [crop, hasSource]);
  async function upload(file) {
    if (!file) return;
    setError("");
    if (!validTypes.has(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    const token = ++request.current;
    setLoading(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (token !== request.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (
        !image.naturalWidth ||
        !image.naturalHeight ||
        image.naturalWidth * image.naturalHeight > 40000000
      )
        throw new Error(
          "Image dimensions are too large. Choose an image under 40 megapixels.",
        );
      if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
      source.current = image;
      sourceUrl.current = url;
      setHasSource(true);
      setCrop({ zoom: 1, x: 50, y: 50 });
      setAdjust(true);
    } catch (e) {
      URL.revokeObjectURL(url);
      if (token === request.current)
        setError(
          e.message.startsWith("Image dimensions")
            ? e.message
            : "That image could not be opened. Try another JPG, PNG, or WebP file.",
        );
    } finally {
      if (token === request.current) setLoading(false);
    }
  }
  function remove() {
    request.current++;
    setLoading(false);
    setCropPending(false);
    setError("");
    callback.current(null);
  }
  return (
    <div className="portrait-upload">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Upload character image"
        className="portrait-file-input"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div
        className={`portrait-dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="portrait-upload-icon">
          <ImagePlus size={21} />
        </div>
        <div>
          <strong>
            {value
              ? "Your portrait, your character."
              : "Give them a face of their own."}
          </strong>
          <p>JPG, PNG, or WebP · up to 10 MB</p>
        </div>
        <button
          type="button"
          className="button secondary"
          disabled={loading}
          onClick={() => input.current.click()}
        >
          <Upload size={15} />
          {loading ? "Opening…" : value ? "Replace image" : "Upload image"}
        </button>
      </div>
      {error && (
        <p className="portrait-upload-error" role="alert">
          {error}
        </p>
      )}
      {value && (
        <div className="portrait-image-actions">
          <span>
            <Check size={12} /> Resized for a lighter, faster preview
          </span>
          <div>
            {hasSource && !adjust && (
              <button
                type="button"
                className="text-button"
                onClick={() => setAdjust(true)}
              >
                <Move size={12} /> Adjust crop
              </button>
            )}
            <button type="button" className="text-button" onClick={remove}>
              <X size={12} /> Remove image
            </button>
          </div>
        </div>
      )}
      {adjust && hasSource && (
        <div className="portrait-crop-editor">
          <div className="portrait-crop-heading">
            <span>
              <Move size={14} /> Frame your portrait
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => setCrop({ zoom: 1, x: 50, y: 50 })}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <div className="portrait-crop-layout">
            <div className="portrait-crop-preview">
              {value && (
                <img src={value} alt="Character portrait crop preview" />
              )}
              <span />
              <i />
            </div>
            <div className="portrait-crop-controls">
              {[
                ["zoom", "Zoom", 1, 3, 0.05],
                ["x", "Horizontal position", 0, 100, 1],
                ["y", "Vertical position", 0, 100, 1],
              ].map(([key, label, min, max, step]) => (
                <label key={key} htmlFor={`portrait-${key}`}>
                  {label}
                  <input
                    id={`portrait-${key}`}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={crop[key]}
                    onChange={(e) =>
                      setCrop((c) => ({ ...c, [key]: Number(e.target.value) }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <button
            className="button secondary"
            type="button"
            onClick={() => setAdjust(false)}
          >
            <Check size={14} /> Done framing
          </button>
        </div>
      )}
    </div>
  );
}
