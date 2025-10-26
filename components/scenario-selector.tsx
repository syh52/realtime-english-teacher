"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useScenarioMode } from '@/hooks/use-scenario-mode'
import { getCategoryName, getDifficultyInfo } from '@/lib/aviation-scenarios'
import { getScenarioStats } from '@/lib/scenario-tracker'
import type { AviationScenario } from '@/lib/aviation-scenarios'

interface ScenarioSelectorProps {
  onSelectScenario: (scenarioId: string) => void
  onStartFreeMode: () => void
}

export function ScenarioSelector({
  onSelectScenario,
  onStartFreeMode,
}: ScenarioSelectorProps) {
  const {
    scenariosByCategory,
    overallStats,
    recommendedScenarios,
  } = useScenarioMode()

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* 标题和总体统计 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">🛫 航空英语情景训练</h1>
        <p className="text-muted-foreground text-lg">
          Aviation English Scenario Training
        </p>

        {/* 总体进度 */}
        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {overallStats.scenariosStarted}
            </div>
            <div className="text-sm text-muted-foreground">已练习场景</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {overallStats.scenariosCompleted}
            </div>
            <div className="text-sm text-muted-foreground">已完成场景</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {overallStats.practiceCount}
            </div>
            <div className="text-sm text-muted-foreground">总练习次数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">
              {overallStats.averageCompletion}%
            </div>
            <div className="text-sm text-muted-foreground">平均完成度</div>
          </div>
        </div>
      </div>

      {/* 推荐场景 */}
      {recommendedScenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🎯 推荐练习</CardTitle>
            <CardDescription>
              根据您的进度，我们推荐以下场景
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onSelect={onSelectScenario}
                  isRecommended
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 自由对话模式按钮 */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={onStartFreeMode}
          className="text-lg px-8"
        >
          💬 开始自由对话模式
        </Button>
      </div>

      {/* 按分类展示场景 */}
      {Object.entries(scenariosByCategory).map(([category, scenarios]) => {
        const categoryInfo = getCategoryName(category as 'conflict' | 'communication' | 'emergency' | 'routine')
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{categoryInfo.icon}</span>
                <span>{categoryInfo.zh}</span>
                <span className="text-muted-foreground text-sm font-normal">
                  {categoryInfo.en}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    onSelect={onSelectScenario}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface ScenarioCardProps {
  scenario: AviationScenario
  onSelect: (scenarioId: string) => void
  isRecommended?: boolean
}

function ScenarioCard({
  scenario,
  onSelect,
  isRecommended = false,
}: ScenarioCardProps) {
  const stats = getScenarioStats(scenario.id)
  const difficultyInfo = getDifficultyInfo(scenario.difficulty)

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 50) return 'bg-blue-500'
    if (rate >= 20) return 'bg-orange-500'
    return 'bg-gray-500'
  }

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow ${
        isRecommended ? 'border-2 border-primary' : ''
      }`}
      onClick={() => onSelect(scenario.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className={difficultyInfo.color}>
            {difficultyInfo.stars}
          </Badge>
          {isRecommended && (
            <Badge className="bg-primary">推荐</Badge>
          )}
        </div>
        <CardTitle className="text-lg">{scenario.title.zh}</CardTitle>
        <CardDescription className="text-sm">
          {scenario.title.en}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 进度条 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>完成度</span>
            <span>{stats.completionRate}%</span>
          </div>
          <Progress
            value={stats.completionRate}
            className={getCompletionColor(stats.completionRate)}
          />
        </div>

        {/* 统计信息 */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>练习 {stats.attempts} 次</span>
          {stats.latestScore > 0 && (
            <span>
              最近得分: {stats.latestScore}分
              {stats.scoreTrend > 0 && (
                <span className="text-green-500"> ↑</span>
              )}
              {stats.scoreTrend < 0 && (
                <span className="text-red-500"> ↓</span>
              )}
            </span>
          )}
        </div>

        {/* 关键短语掌握情况 */}
        {stats.keyPhrasesUsed > 0 && (
          <div className="text-xs text-muted-foreground">
            已掌握 {stats.keyPhrasesUsed}/{scenario.keyPhrases.length} 个关键短语
          </div>
        )}

        {/* 开始按钮 */}
        <Button
          className="w-full mt-2"
          variant={isRecommended ? 'default' : 'outline'}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(scenario.id)
          }}
        >
          {stats.attempts === 0 ? '开始训练' : '继续练习'}
        </Button>
      </CardContent>
    </Card>
  )
}
