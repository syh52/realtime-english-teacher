import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "@/components/translations-context"
import { Label } from "@/components/ui/label"

interface VoiceSelectorProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function VoiceSelector({ value, onValueChange, disabled }: VoiceSelectorProps) {
  const { t } = useTranslations()
  return (
    <div className="form-group space-y-2">
      <Label className="text-sm font-medium">{t('voice.select')}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full" disabled={disabled}>
          <SelectValue placeholder={t('voice.select')} />
        </SelectTrigger>
        <SelectContent>
          {/* 第二代声音 - 更具表现力（2024年10月新增） */}
          <SelectItem value="ash">{t('voice.ash')}</SelectItem>
          <SelectItem value="ballad">{t('voice.ballad')}</SelectItem>
          <SelectItem value="coral">{t('voice.coral')}</SelectItem>
          <SelectItem value="sage">{t('voice.sage')}</SelectItem>
          <SelectItem value="verse">{t('voice.verse')}</SelectItem>

          {/* 第一代声音 - 经典稳定 */}
          <SelectItem value="alloy">{t('voice.alloy')}</SelectItem>
          <SelectItem value="echo">{t('voice.echo')}</SelectItem>
          <SelectItem value="shimmer">{t('voice.shimmer')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
} 