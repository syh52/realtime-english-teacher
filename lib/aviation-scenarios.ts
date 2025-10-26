/**
 * 航空英语情景训练系统 - 数据类型定义
 *
 * 这个文件定义了航空情景训练的核心数据结构和工具函数
 */

/**
 * 场景分类
 */
export type ScenarioCategory =
  | 'conflict'        // 冲突处理
  | 'communication'   // 机组沟通
  | 'emergency'       // 紧急事件
  | 'routine'         // 常规操作

/**
 * 难度级别
 */
export type ScenarioDifficulty =
  | 'beginner'        // 初级：⭐
  | 'intermediate'    // 中级：⭐⭐
  | 'advanced'        // 高级：⭐⭐⭐
  | 'expert'          // 专家：⭐⭐⭐⭐

/**
 * 对话行数据结构
 */
export interface DialogueLine {
  speaker: string;      // 说话人：Security Officer, Passenger A等
  chinese: string;      // 中文内容
  english: string;      // 英文内容
}

/**
 * 航空情景数据结构
 */
export interface AviationScenario {
  id: string;                    // 场景唯一ID：scenario-01
  title: {
    zh: string;                  // 中文标题：打架斗殴
    en: string;                  // 英文标题：Fighting and Brawling
  };
  category: ScenarioCategory;    // 场景分类
  difficulty: ScenarioDifficulty; // 难度级别

  roles: {
    learner: string;             // 学习者扮演的角色：Security Officer
    ai: string[];                // AI扮演的角色：['Passenger A', 'Passenger B']
  };

  background: {
    zh: string;                  // 场景背景描述（中文）
    en: string;                  // 场景背景描述（英文）
  };

  dialogueScript: DialogueLine[]; // 参考对话脚本

  keyPhrases: string[];          // 关键短语列表

  learningObjectives: {
    zh: string[];                // 学习目标（中文）
    en: string[];                // 学习目标（英文）
  };

  tips: {
    zh: string[];                // 实用提示（中文）
    en: string[];                // 实用提示（英文）
  };
}

/**
 * 场景训练进度
 */
export interface ScenarioProgress {
  scenarioId: string;            // 场景ID
  attempts: number;              // 练习次数
  lastPracticed?: string;        // 最后练习时间（ISO 8601）
  keyPhrasesUsed: string[];      // 已使用的关键短语
  completionRate: number;        // 完成度（0-100）

  feedback: {
    timestamp: string;           // 反馈时间
    summary: string;             // 总结
    strengths: string[];         // 优点
    improvements: string[];      // 改进建议
    score: number;               // 评分（0-100）
  }[];
}

/**
 * 所有场景训练数据
 */
export interface AllScenariosProgress {
  [scenarioId: string]: ScenarioProgress;
}

/**
 * 工具函数：根据分类获取中文名称
 */
export function getCategoryName(category: ScenarioCategory): { zh: string; en: string; icon: string } {
  const categoryMap = {
    conflict: { zh: '冲突处理', en: 'Conflict Management', icon: '🔥' },
    communication: { zh: '机组沟通', en: 'Crew Communication', icon: '📞' },
    emergency: { zh: '紧急事件', en: 'Emergency Response', icon: '🚨' },
    routine: { zh: '常规操作', en: 'Routine Operations', icon: '📋' },
  }
  return categoryMap[category]
}

/**
 * 工具函数：根据难度获取显示信息
 */
export function getDifficultyInfo(difficulty: ScenarioDifficulty): {
  zh: string;
  en: string;
  stars: string;
  color: string;
} {
  const difficultyMap = {
    beginner: {
      zh: '初级',
      en: 'Beginner',
      stars: '⭐',
      color: 'text-green-500'
    },
    intermediate: {
      zh: '中级',
      en: 'Intermediate',
      stars: '⭐⭐',
      color: 'text-blue-500'
    },
    advanced: {
      zh: '高级',
      en: 'Advanced',
      stars: '⭐⭐⭐',
      color: 'text-orange-500'
    },
    expert: {
      zh: '专家',
      en: 'Expert',
      stars: '⭐⭐⭐⭐',
      color: 'text-red-500'
    },
  }
  return difficultyMap[difficulty]
}

/**
 * 工具函数：计算总体进度统计
 */
export function calculateOverallProgress(progress: AllScenariosProgress): {
  totalScenarios: number;
  practiceCount: number;
  averageCompletion: number;
  scenariosStarted: number;
  scenariosCompleted: number;
} {
  const scenarioIds = Object.keys(progress)
  const totalScenarios = scenarioIds.length

  let totalPracticeCount = 0
  let totalCompletion = 0
  let scenariosStarted = 0
  let scenariosCompleted = 0

  scenarioIds.forEach(id => {
    const scenarioProgress = progress[id]
    totalPracticeCount += scenarioProgress.attempts
    totalCompletion += scenarioProgress.completionRate

    if (scenarioProgress.attempts > 0) {
      scenariosStarted++
    }

    if (scenarioProgress.completionRate >= 80) {
      scenariosCompleted++
    }
  })

  return {
    totalScenarios,
    practiceCount: totalPracticeCount,
    averageCompletion: totalScenarios > 0 ? Math.round(totalCompletion / totalScenarios) : 0,
    scenariosStarted,
    scenariosCompleted,
  }
}

/**
 * 工具函数：获取推荐的下一个场景
 */
export function getRecommendedScenario(
  scenarios: AviationScenario[],
  progress: AllScenariosProgress
): AviationScenario | null {
  // 优先推荐未练习的场景
  const unpracticed = scenarios.filter(s => !progress[s.id] || progress[s.id].attempts === 0)
  if (unpracticed.length > 0) {
    // 从未练习的场景中选择最简单的
    return unpracticed.sort((a, b) => {
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    })[0]
  }

  // 推荐完成度最低的场景
  const incomplete = scenarios
    .filter(s => progress[s.id] && progress[s.id].completionRate < 80)
    .sort((a, b) => progress[a.id].completionRate - progress[b.id].completionRate)

  return incomplete[0] || null
}

/**
 * 工具函数：初始化场景进度
 */
export function initializeScenarioProgress(scenarioId: string): ScenarioProgress {
  return {
    scenarioId,
    attempts: 0,
    keyPhrasesUsed: [],
    completionRate: 0,
    feedback: [],
  }
}
