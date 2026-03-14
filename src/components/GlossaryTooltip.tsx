/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useGlossary } from '../context/GlossaryContext'
import type { GlossaryEntry } from '../context/GlossaryContext'

const TOOLTIP_DELAY_MS = 150
const TOOLTIP_ANIM_MS = 140
const VIEWPORT_PADDING = 12

const buildAriaLabel = (term: string, entry?: GlossaryEntry) => {
  if (!entry) return term
  return `${entry.term}: ${entry.definition}`
}

export function GlossaryTerm({
  term,
  children,
}: {
  term: string
  children?: React.ReactNode
}) {
  const { getEntry } = useGlossary()
  const entry = getEntry(term)
  const [isOpen, setIsOpen] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'top' })
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const openTimeoutRef = useRef<number | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)

  const label = useMemo(() => buildAriaLabel(term, entry), [term, entry])

  const showTooltip = (delay = TOOLTIP_DELAY_MS) => {
    if (!entry) return

    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    if (openTimeoutRef.current) window.clearTimeout(openTimeoutRef.current)

    const openNow = () => {
      setIsRendered(true)
      setIsOpen(true)
    }

    if (delay === 0) {
      openNow()
      return
    }

    openTimeoutRef.current = window.setTimeout(openNow, delay)
  }

  const hideTooltip = () => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }

    setIsOpen(false)

    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsRendered(false)
    }, TOOLTIP_ANIM_MS)
  }

  useLayoutEffect(() => {
    if (!isRendered) return
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!trigger || !tooltip) return

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()

      let top = rect.top - tooltipRect.height - VIEWPORT_PADDING
      let placement = 'top'
      if (top < VIEWPORT_PADDING) {
        top = rect.bottom + VIEWPORT_PADDING
        placement = 'bottom'
      }

      let left = rect.left + rect.width / 2 - tooltipRect.width / 2
      left = Math.max(
        VIEWPORT_PADDING,
        Math.min(left, window.innerWidth - tooltipRect.width - VIEWPORT_PADDING)
      )

      setCoords({ top, left, placement })
    }

    updatePosition()

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isRendered, term])

  useEffect(() => {
    if (!isRendered) return

    const handlePointerDown = (event: PointerEvent) => {
      const trigger = triggerRef.current
      const tooltip = tooltipRef.current
      if (!trigger || !tooltip) return

      const target = event.target as Node | null
      if (!target) return

      // Tapping/clicking anywhere outside closes the tooltip.
      if (!trigger.contains(target) && !tooltip.contains(target)) {
        hideTooltip()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideTooltip()
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRendered])

  const handlePointerDown: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    if (!entry) return

    // Touch / pen = tap-to-toggle.
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      event.preventDefault()
      event.stopPropagation()
      if (isOpen) hideTooltip()
      else showTooltip(0)
    }
  }

  if (!entry) {
    return <span className="glossary-term">{children ?? term}</span>
  }

  return (
    <span
      ref={triggerRef}
      className="glossary-term glossary-term--active"
      tabIndex={0}
      onMouseEnter={() => showTooltip()}
      onMouseLeave={hideTooltip}
      onFocus={() => showTooltip(0)}
      onBlur={hideTooltip}
      onPointerDown={handlePointerDown}
      aria-label={label}
      aria-expanded={isOpen}
    >
      {children ?? entry.term}
      {isRendered && (
        <div
          ref={tooltipRef}
          className={`glossary-tooltip glossary-tooltip--${coords.placement}`}
          data-state={isOpen ? 'open' : 'closed'}
          style={{ top: coords.top, left: coords.left }}
          role="tooltip"
        >
          <div className="glossary-tooltip-title">{entry.term}</div>
          <div className="glossary-tooltip-definition">{entry.definition}</div>
          {entry.example ? (
            <div className="glossary-tooltip-example">{entry.example}</div>
          ) : null}
        </div>
      )}
    </span>
  )
}

export const renderGlossaryText = (text: string) => {
  const parts: React.ReactNode[] = []
  const regex = /\{:(.+?)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const [token, rawTerm] = match
    const index = match.index
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }
    parts.push(
      <GlossaryTerm key={`${rawTerm}-${index}`} term={rawTerm}>
        {rawTerm}
      </GlossaryTerm>
    )
    lastIndex = index + token.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}
