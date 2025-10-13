import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface ModelSelectorProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function ModelSelector({ value, onValueChange, disabled }: ModelSelectorProps) {
  return (
    <div className="form-group space-y-2">
      <Label className="text-sm font-medium">模型选择</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full" disabled={disabled}>
          <SelectValue placeholder="选择模型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-realtime">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">gpt-realtime</span>
              <span className="text-xs text-muted-foreground">推荐 · 最新版 · 性能提升 30-50% · 价格优惠 20%</span>
            </div>
          </SelectItem>
          <SelectItem value="gpt-4o-realtime-preview-2024-12-17">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">gpt-4o-realtime (2024-12-17)</span>
              <span className="text-xs text-muted-foreground">预览版 · 当前使用</span>
            </div>
          </SelectItem>
          <SelectItem value="gpt-4o-mini-realtime-preview-2024-12-17">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">gpt-4o-mini-realtime</span>
              <span className="text-xs text-muted-foreground">轻量版 · 更便宜 · 延迟更低</span>
            </div>
          </SelectItem>
          <SelectItem value="gpt-4o-realtime-preview-2024-10-01">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">gpt-4o-realtime (2024-10-01)</span>
              <span className="text-xs text-muted-foreground">旧版本</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
