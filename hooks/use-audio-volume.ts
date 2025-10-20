import { useEffect, useRef } from "react"

/**
 * 将 AnalyserNode 转换为 Orb 组件可用的音量回调函数
 *
 * @param analyser - Web Audio API AnalyserNode，用于分析音频输入
 * @returns 返回 getInputVolume 和 getOutputVolume 回调函数
 */
export function useAudioVolume(analyser: AnalyserNode | null) {
  const inputVolumeRef = useRef(0)
  const outputVolumeRef = useRef(0.3) // 默认输出音量

  useEffect(() => {
    if (!analyser) {
      inputVolumeRef.current = 0
      return
    }

    // 创建数据数组用于存储频域数据
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let rafId: number

    const updateVolume = () => {
      // 获取当前的频域数据
      analyser.getByteFrequencyData(dataArray)

      // 计算平均音量
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length

      // 归一化到 0-1 范围
      const normalized = average / 255

      // 应用平方根和缩放来增强可见性（与 Voice Chat 01 一致）
      // 使用与 Voice Chat 01 相同的公式：Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5)
      inputVolumeRef.current = Math.min(1.0, Math.pow(normalized, 0.5) * 2.5)

      // 继续下一帧
      rafId = requestAnimationFrame(updateVolume)
    }

    // 开始采样
    rafId = requestAnimationFrame(updateVolume)

    // 清理函数
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [analyser])

  return {
    /**
     * 获取当前输入音量（麦克风音量）
     * 返回值范围：0-1
     */
    getInputVolume: () => inputVolumeRef.current,

    /**
     * 获取当前输出音量（AI 说话音量）
     *
     * 注意：由于当前项目没有输出音量数据，这里返回固定值
     * 未来可以通过分析 AI 音频流来获取真实的输出音量
     */
    getOutputVolume: () => outputVolumeRef.current,
  }
}
