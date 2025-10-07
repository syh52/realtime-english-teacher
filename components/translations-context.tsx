"use client"

import { createContext, useContext, ReactNode } from 'react'
import { zh } from '@/lib/translations/zh'

type TranslationValue = string | { [key: string]: TranslationValue }

type TranslationsContextType = {
  t: (key: string) => string
}

const TranslationsContext = createContext<TranslationsContextType | null>(null)

export function TranslationsProvider({ children }: { children: ReactNode }) {
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: TranslationValue = zh

    for (const k of keys) {
      if (value === undefined) return key
      value = typeof value === 'object' ? value[k] : key
    }

    return typeof value === 'string' ? value : key
  }

  return (
    <TranslationsContext.Provider value={{ t }}>
      {children}
    </TranslationsContext.Provider>
  )
}

export function useTranslations() {
  const context = useContext(TranslationsContext)
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationsProvider')
  }
  return context
} 