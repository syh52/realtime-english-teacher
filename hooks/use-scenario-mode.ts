/**
 * 航空英语情景训练 - 场景管理Hook
 *
 * 管理场景选择、进度追踪和动态提示词生成
 */

import { useState, useEffect, useMemo } from 'react'
import type { AviationScenario, AllScenariosProgress } from '@/lib/aviation-scenarios'
import { getCategoryName, getDifficultyInfo } from '@/lib/aviation-scenarios'
import {
  loadScenariosProgress,
  startScenarioTraining,
  completeScenarioTraining,
  getScenarioStats,
  getRecommendedScenarios,
} from '@/lib/scenario-tracker'
import {
  generateScenarioInstructions,
  generateScenarioOpening,
} from '@/config/scenario-mode-instructions'

// 导入场景数据
import scenariosData from '@/lib/aviation-scenarios.json'

export interface ScenarioMode {
  isActive: boolean
  currentScenario: AviationScenario | null
  instructions: string | null
  opening: string | null
}

export function useScenarioMode() {
  // 场景数据
  const allScenarios = scenariosData as AviationScenario[]

  // 当前场景状态
  const [selectedScenario, setSelectedScenario] = useState<AviationScenario | null>(null)
  const [isScenarioMode, setIsScenarioMode] = useState(false)

  // 进度数据
  const [progress, setProgress] = useState<AllScenariosProgress>({})

  // 加载进度数据
  useEffect(() => {
    const loadedProgress = loadScenariosProgress()
    setProgress(loadedProgress)
  }, [])

  /**
   * 选择场景（进入场景模式）
   */
  const selectScenario = (scenarioId: string) => {
    const scenario = allScenarios.find((s) => s.id === scenarioId)
    if (!scenario) {
      console.error(`Scenario ${scenarioId} not found`)
      return
    }

    setSelectedScenario(scenario)
    setIsScenarioMode(true)
  }

  /**
   * 退出场景模式
   */
  const exitScenarioMode = () => {
    setSelectedScenario(null)
    setIsScenarioMode(false)
  }

  /**
   * 开始场景训练
   */
  const startScenario = (scenarioId: string) => {
    selectScenario(scenarioId)
    startScenarioTraining(scenarioId)

    // 刷新进度
    const loadedProgress = loadScenariosProgress()
    setProgress(loadedProgress)
  }

  /**
   * 完成场景训练
   */
  const completeScenario = (
    scenarioId: string,
    params: {
      summary: string
      strengths: string[]
      improvements: string[]
      score: number
      keyPhrasesUsed: string[]
    }
  ) => {
    completeScenarioTraining(scenarioId, params)

    // 刷新进度
    const loadedProgress = loadScenariosProgress()
    setProgress(loadedProgress)
  }

  /**
   * 获取当前场景的动态提示词
   */
  const currentInstructions = useMemo(() => {
    if (!selectedScenario) return null
    return generateScenarioInstructions(selectedScenario)
  }, [selectedScenario])

  /**
   * 获取当前场景的开场白
   */
  const currentOpening = useMemo(() => {
    if (!selectedScenario) return null
    return generateScenarioOpening(selectedScenario)
  }, [selectedScenario])

  /**
   * 获取场景列表（按分类分组）
   */
  const scenariosByCategory = useMemo(() => {
    const grouped: Record<string, AviationScenario[]> = {}

    allScenarios.forEach((scenario) => {
      if (!grouped[scenario.category]) {
        grouped[scenario.category] = []
      }
      grouped[scenario.category].push(scenario)
    })

    return grouped
  }, [allScenarios])

  /**
   * 获取场景统计信息
   */
  const getScenarioInfo = (scenarioId: string) => {
    const scenario = allScenarios.find((s) => s.id === scenarioId)
    if (!scenario) return null

    const stats = getScenarioStats(scenarioId)
    const category = getCategoryName(scenario.category)
    const difficulty = getDifficultyInfo(scenario.difficulty)

    return {
      scenario,
      stats,
      category,
      difficulty,
    }
  }

  /**
   * 获取推荐场景
   */
  const recommendedScenarios = useMemo(() => {
    return getRecommendedScenarios(allScenarios, 3)
  }, [allScenarios, progress])

  /**
   * 获取总体进度统计
   */
  const overallStats = useMemo(() => {
    const totalScenarios = allScenarios.length
    const scenariosStarted = Object.keys(progress).filter(
      (id) => progress[id].attempts > 0
    ).length
    const scenariosCompleted = Object.keys(progress).filter(
      (id) => progress[id].completionRate >= 80
    ).length

    let totalPracticeCount = 0
    let totalCompletion = 0

    Object.values(progress).forEach((p) => {
      totalPracticeCount += p.attempts
      totalCompletion += p.completionRate
    })

    const averageCompletion =
      scenariosStarted > 0 ? Math.round(totalCompletion / scenariosStarted) : 0

    return {
      totalScenarios,
      scenariosStarted,
      scenariosCompleted,
      practiceCount: totalPracticeCount,
      averageCompletion,
      completionPercentage: Math.round((scenariosCompleted / totalScenarios) * 100),
    }
  }, [allScenarios, progress])

  return {
    // 场景数据
    allScenarios,
    scenariosByCategory,

    // 当前场景状态
    selectedScenario,
    isScenarioMode,
    currentInstructions,
    currentOpening,

    // 进度数据
    progress,
    overallStats,
    recommendedScenarios,

    // 方法
    selectScenario,
    exitScenarioMode,
    startScenario,
    completeScenario,
    getScenarioInfo,
  }
}
