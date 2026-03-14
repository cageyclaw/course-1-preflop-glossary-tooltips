/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react'
import glossaryData from '../data/poker-terms-glossary.json'

type GlossaryEntry = {
  term: string
  definition: string
  example?: string
}

type GlossaryMetadata = {
  source?: string
  files_analyzed?: string[]
  generated?: string
}

type GlossaryData = {
  metadata?: GlossaryMetadata
  [category: string]: GlossaryEntry[] | GlossaryMetadata | undefined
}

type GlossaryContextValue = {
  terms: Record<string, GlossaryEntry>
  getEntry: (term: string) => GlossaryEntry | undefined
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null)

const normalizeTerm = (term: string) => term.trim().toLowerCase()

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  const terms = useMemo(() => {
    const data = glossaryData as GlossaryData
    const map: Record<string, GlossaryEntry> = {}

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'metadata') return
      if (!Array.isArray(value)) return
      value.forEach((entry) => {
        if (!entry?.term) return
        map[normalizeTerm(entry.term)] = entry
      })
    })

    return map
  }, [])

  const contextValue = useMemo<GlossaryContextValue>(() => {
    return {
      terms,
      getEntry: (term: string) => terms[normalizeTerm(term)],
    }
  }, [terms])

  return (
    <GlossaryContext.Provider value={contextValue}>
      {children}
    </GlossaryContext.Provider>
  )
}

export function useGlossary() {
  const context = useContext(GlossaryContext)
  if (!context) {
    throw new Error('useGlossary must be used within a GlossaryProvider')
  }
  return context
}

export type { GlossaryEntry }
