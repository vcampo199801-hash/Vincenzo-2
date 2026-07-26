"use client";

import { useRef, useState, useEffect } from "react";

/** Riquadro di firma touch/mouse: disegna su canvas, il tratto viene serializzato
 * come PNG base64 in un input nascosto (name) così viaggia con il form come
 * qualsiasi altro campo. Firma elettronica semplice, non firma digitale
 * qualificata — vedi nota nella pagina di compilazione. */
export function SignaturePad({ name, label, required }: { name: string; label: string; required?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasStrokeRef.current = true;
  }

  function end() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (hasStrokeRef.current && canvasRef.current && inputRef.current) {
      inputRef.current.value = canvasRef.current.toDataURL("image/png");
      setIsEmpty(false);
    }
  }

  function cancella() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokeRef.current = false;
    if (inputRef.current) inputRef.current.value = "";
    setIsEmpty(true);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        <button type="button" onClick={cancella} className="text-xs font-medium text-slate-500 hover:text-slate-700">
          Cancella
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-32 w-full touch-none rounded-lg border border-slate-300 bg-white"
        style={{ cursor: "crosshair" }}
      />
      <input ref={inputRef} type="hidden" name={name} />
      {required && isEmpty && <p className="mt-1 text-xs text-amber-600">Firma richiesta prima di salvare.</p>}
    </div>
  );
}
