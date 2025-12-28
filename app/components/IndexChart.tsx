// components/IndexChart.tsx
import { useEffect, useRef } from 'react';

interface IndexChartProps {
  currentValue: number;
  changePercent: number;
  isPositive?: boolean;
}

export default function IndexChart({ currentValue, changePercent, isPositive = true }: IndexChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Generate mock data points
    const dataPoints = Array.from({ length: 50 }, (_, i) => {
      const x = i / 49;
      const baseY = isPositive ? 0.3 : 0.7;
      const noise = Math.sin(x * Math.PI * 4) * 0.2 * Math.random();
      return baseY + noise * (isPositive ? -1 : 1);
    });

    // Draw area
    ctx.beginPath();
    ctx.moveTo(padding, padding + (1 - dataPoints[0]) * (height - 2 * padding));
    
    for (let i = 1; i < dataPoints.length; i++) {
      const x = padding + (i / (dataPoints.length - 1)) * (width - 2 * padding);
      const y = padding + (1 - dataPoints[i]) * (height - 2 * padding);
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isPositive) {
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    }
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(padding, padding + (1 - dataPoints[0]) * (height - 2 * padding));
    
    for (let i = 1; i < dataPoints.length; i++) {
      const x = padding + (i / (dataPoints.length - 1)) * (width - 2 * padding);
      const y = padding + (1 - dataPoints[i]) * (height - 2 * padding);
      ctx.lineTo(x, y);
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = isPositive ? '#22c55e' : '#ef4444';
    ctx.stroke();
  }, [currentValue, isPositive]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    />
  );
}