"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RealAudioWaveformProps {
  active: boolean;
  analyser?: AnalyserNode | null;
  height?: number;
  className?: string;
  barCount?: number;
  barColor?: string;
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  sensitivity?: number;
}

/**
 * 真实音频波形可视化组件
 * 使用共享的 AnalyserNode 显示真实麦克风音频数据
 * 不请求麦克风权限，避免与 WebRTC 冲突
 */
export function RealAudioWaveform({
  active,
  analyser,
  height = 80,
  className,
  barCount = 40,
  barColor = "hsl(var(--primary))",
  barWidth = 3,
  barGap = 1,
  barRadius = 1.5,
  sensitivity = 1.5,
}: RealAudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const barsRef = useRef<number[]>(Array(barCount).fill(0.1));
  const lastUpdateRef = useRef<number>(0);

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

    const updateRate = 30; // 更新频率（毫秒）

    const animate = (currentTime: number) => {
      if (!canvas || !ctx) return;

      const width = rect.width;
      const canvasHeight = rect.height;

      // 清空画布
      ctx.clearRect(0, 0, width, canvasHeight);

      // 更新波形数据
      if (active && analyser && currentTime - lastUpdateRef.current > updateRate) {
        lastUpdateRef.current = currentTime;

        // 获取频率数据
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // 选择频率范围 (5%-40% 的频率范围，对应人声)
        const startFreq = Math.floor(dataArray.length * 0.05);
        const endFreq = Math.floor(dataArray.length * 0.4);
        const rangeSize = endFreq - startFreq;
        const barsPerBucket = Math.ceil(rangeSize / barCount);

        // 更新每个竖条的高度
        for (let i = 0; i < barCount; i++) {
          // 对多个频率点取平均，产生更平滑的效果
          const startIdx = startFreq + i * barsPerBucket;
          const endIdx = Math.min(startIdx + barsPerBucket, endFreq);

          let sum = 0;
          for (let j = startIdx; j < endIdx; j++) {
            sum += dataArray[j];
          }
          const average = sum / (endIdx - startIdx);

          // 归一化到 0-1 范围，应用灵敏度
          const normalizedValue = (average / 255) * sensitivity;
          const targetValue = Math.min(1, Math.max(0.05, normalizedValue));

          // 平滑过渡
          barsRef.current[i] += (targetValue - barsRef.current[i]) * 0.4;
        }
      } else if (!active) {
        // 淡出效果
        for (let i = 0; i < barCount; i++) {
          barsRef.current[i] *= 0.9;
          // 最小值保持一点点，避免完全消失
          if (barsRef.current[i] < 0.05) {
            barsRef.current[i] = 0.05;
          }
        }
      }

      // 绘制对称的竖条
      const totalBarWidth = barWidth + barGap;
      const centerX = width / 2;

      ctx.fillStyle = barColor;

      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.max(4, barsRef.current[i] * canvasHeight * 0.9);
        const x = centerX + (i - barCount / 2) * totalBarWidth;
        const y = (canvasHeight - barHeight) / 2;

        // 绘制圆角矩形
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, analyser, height, barCount, barColor, barWidth, barGap, barRadius, sensitivity]);

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
