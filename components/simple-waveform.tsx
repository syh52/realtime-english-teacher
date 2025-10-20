"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SimpleWaveformProps {
  active: boolean;
  height?: number;
  className?: string;
  barCount?: number;
  barColor?: string;
}

/**
 * 简化版的音频波形可视化组件
 * 不依赖麦克风流，纯粹基于动画效果
 */
export function SimpleWaveform({
  active,
  height = 80,
  className,
  barCount = 40,
  barColor = "hsl(var(--primary))",
}: SimpleWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const barsRef = useRef<number[]>(Array(barCount).fill(0.1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置 canvas 尺寸
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;

    const animate = () => {
      if (!canvas || !ctx) return;

      const width = rect.width;
      const height = rect.height;

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 更新波形数据
      if (active) {
        time += 0.05;
        for (let i = 0; i < barCount; i++) {
          // 多个正弦波叠加产生自然的波形效果
          const wave1 = Math.sin(time * 1.5 + i * 0.15) * 0.3;
          const wave2 = Math.sin(time * 0.8 - i * 0.1) * 0.2;
          const wave3 = Math.cos(time * 2 + i * 0.05) * 0.15;
          const targetValue = 0.3 + wave1 + wave2 + wave3;

          // 平滑过渡
          barsRef.current[i] += (targetValue - barsRef.current[i]) * 0.3;
        }
      } else {
        // 淡出效果
        for (let i = 0; i < barCount; i++) {
          barsRef.current[i] *= 0.95;
        }
      }

      // 绘制对称的竖条
      const barWidth = 3;
      const barGap = 1;
      const totalBarWidth = barWidth + barGap;
      const centerX = width / 2;

      ctx.fillStyle = barColor;

      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.max(4, barsRef.current[i] * height);
        const x = centerX + (i - barCount / 2) * totalBarWidth;
        const y = (height - barHeight) / 2;

        // 绘制圆角矩形
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1.5);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, height, barCount, barColor]);

  return (
    <div className={cn("w-full", className)} style={{ height: `${height}px` }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
