/**
 * 航空英语情景训练 - 进度追踪系统
 *
 * 使用 localStorage 持久化存储用户的场景训练进度
 */

import type {
  AllScenariosProgress,
  ScenarioProgress,
  AviationScenario,
} from './aviation-scenarios'
import { initializeScenarioProgress } from './aviation-scenarios'

const STORAGE_KEY = 'aviation-scenarios-progress'

/**
 * 从 localStorage 加载所有场景进度
 */
export function loadScenariosProgress(): AllScenariosProgress {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}

    return JSON.parse(stored) as AllScenariosProgress
  } catch (error) {
    console.error('Failed to load scenarios progress:', error)
    return {}
  }
}

/**
 * 保存所有场景进度到 localStorage
 */
export function saveScenariosProgress(progress: AllScenariosProgress): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Failed to save scenarios progress:', error)
  }
}

/**
 * 获取单个场景的进度
 */
export function getScenarioProgress(
  scenarioId: string
): ScenarioProgress {
  const allProgress = loadScenariosProgress()
  return allProgress[scenarioId] || initializeScenarioProgress(scenarioId)
}

/**
 * 开始场景训练（记录开始时间）
 */
export function startScenarioTraining(scenarioId: string): void {
  const allProgress = loadScenariosProgress()
  const scenarioProgress = allProgress[scenarioId] || initializeScenarioProgress(scenarioId)

  // 增加尝试次数
  scenarioProgress.attempts += 1
  scenarioProgress.lastPracticed = new Date().toISOString()

  allProgress[scenarioId] = scenarioProgress
  saveScenariosProgress(allProgress)
}

/**
 * 完成场景训练（记录反馈和评分）
 */
export function completeScenarioTraining(
  scenarioId: string,
  params: {
    summary: string
    strengths: string[]
    improvements: string[]
    score: number
    keyPhrasesUsed: string[]
  }
): void {
  const allProgress = loadScenariosProgress()
  const scenarioProgress = allProgress[scenarioId] || initializeScenarioProgress(scenarioId)

  // 添加反馈
  scenarioProgress.feedback.push({
    timestamp: new Date().toISOString(),
    summary: params.summary,
    strengths: params.strengths,
    improvements: params.improvements,
    score: params.score,
  })

  // 更新使用过的关键短语（去重）
  const allUsedPhrases = new Set([
    ...scenarioProgress.keyPhrasesUsed,
    ...params.keyPhrasesUsed,
  ])
  scenarioProgress.keyPhrasesUsed = Array.from(allUsedPhrases)

  // 更新完成度（基于最近3次练习的平均分）
  const recentScores = scenarioProgress.feedback
    .slice(-3)
    .map((f) => f.score)
  const avgScore =
    recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
  scenarioProgress.completionRate = Math.round(avgScore)

  allProgress[scenarioId] = scenarioProgress
  saveScenariosProgress(allProgress)
}

/**
 * 重置单个场景的进度
 */
export function resetScenarioProgress(scenarioId: string): void {
  const allProgress = loadScenariosProgress()
  delete allProgress[scenarioId]
  saveScenariosProgress(allProgress)
}

/**
 * 重置所有场景进度
 */
export function resetAllProgress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 获取场景的完成度百分比
 */
export function getScenarioCompletionRate(scenarioId: string): number {
  const progress = getScenarioProgress(scenarioId)
  return progress.completionRate
}

/**
 * 获取场景的练习次数
 */
export function getScenarioAttempts(scenarioId: string): number {
  const progress = getScenarioProgress(scenarioId)
  return progress.attempts
}

/**
 * 获取场景的最后练习时间
 */
export function getScenarioLastPracticed(scenarioId: string): string | null {
  const progress = getScenarioProgress(scenarioId)
  return progress.lastPracticed || null
}

/**
 * 检查是否使用过某个关键短语
 */
export function hasUsedKeyPhrase(
  scenarioId: string,
  phrase: string
): boolean {
  const progress = getScenarioProgress(scenarioId)
  return progress.keyPhrasesUsed.includes(phrase)
}

/**
 * 获取场景的最新反馈
 */
export function getLatestFeedback(scenarioId: string) {
  const progress = getScenarioProgress(scenarioId)
  return progress.feedback.length > 0
    ? progress.feedback[progress.feedback.length - 1]
    : null
}

/**
 * 获取场景训练历史统计
 */
export function getScenarioStats(scenarioId: string) {
  const progress = getScenarioProgress(scenarioId)

  const scores = progress.feedback.map((f) => f.score)
  const avgScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0

  const trend =
    scores.length >= 2
      ? scores[scores.length - 1] - scores[scores.length - 2]
      : 0

  return {
    attempts: progress.attempts,
    completionRate: progress.completionRate,
    averageScore: Math.round(avgScore),
    latestScore: scores[scores.length - 1] || 0,
    scoreTrend: trend, // 正数=进步，负数=退步
    totalFeedback: progress.feedback.length,
    keyPhrasesUsed: progress.keyPhrasesUsed.length,
    lastPracticed: progress.lastPracticed,
  }
}

/**
 * 导出训练数据（用于分析或备份）
 */
export function exportProgress(): string {
  const progress = loadScenariosProgress()
  return JSON.stringify(progress, null, 2)
}

/**
 * 导入训练数据
 */
export function importProgress(jsonData: string): boolean {
  try {
    const progress = JSON.parse(jsonData) as AllScenariosProgress
    saveScenariosProgress(progress)
    return true
  } catch (error) {
    console.error('Failed to import progress:', error)
    return false
  }
}

/**
 * 获取推荐练习的场景
 *
 * 优先级：
 * 1. 从未练习的场景（按难度从低到高）
 * 2. 完成度<80%的场景（按完成度从低到高）
 * 3. 完成度>=80%但最近未练习的场景
 */
export function getRecommendedScenarios(
  allScenarios: AviationScenario[],
  limit: number = 3
): AviationScenario[] {
  const allProgress = loadScenariosProgress()

  // 按优先级排序
  const sorted = allScenarios.sort((a, b) => {
    const progressA = allProgress[a.id]
    const progressB = allProgress[b.id]

    // 1. 未练习的场景优先（按难度排序）
    if (!progressA && !progressB) {
      const difficultyOrder = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
        expert: 4,
      }
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    }
    if (!progressA) return -1
    if (!progressB) return 1

    // 2. 完成度低的优先
    if (progressA.completionRate !== progressB.completionRate) {
      return progressA.completionRate - progressB.completionRate
    }

    // 3. 最近未练习的优先
    const timeA = progressA.lastPracticed
      ? new Date(progressA.lastPracticed).getTime()
      : 0
    const timeB = progressB.lastPracticed
      ? new Date(progressB.lastPracticed).getTime()
      : 0
    return timeA - timeB
  })

  return sorted.slice(0, limit)
}
