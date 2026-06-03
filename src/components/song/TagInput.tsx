import React, { useState, useRef } from 'react'
import { Tag } from '../ui/Badge'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  maxTags?: number
}

export function TagInput({ tags, onChange, suggestions = [], maxTags = 5 }: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  )

  const addTag = (tag: string) => {
    const clean = tag.trim()
    if (!clean || tags.includes(clean) || tags.length >= maxTags) return
    onChange([...tags, clean])
    setInput('')
    setShowSuggestions(false)
  }

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-secondary font-jakarta">
        Tag {tags.length > 0 && <span className="text-xs">({tags.length}/{maxTags})</span>}
      </label>
      <div
        className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark min-h-[44px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <Tag key={tag} label={tag} onRemove={() => removeTag(tag)} />
        ))}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={tags.length === 0 ? 'Aggiungi tag…' : ''}
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm font-jakarta text-primary-light dark:text-primary-dark placeholder:text-secondary"
          />
        )}
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="bg-white dark:bg-night-surface border border-border-light dark:border-border-dark rounded-xl shadow-lg overflow-hidden z-10">
          {filtered.slice(0, 6).map((s) => (
            <button
              key={s}
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm font-jakarta text-primary-light dark:text-primary-dark hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-secondary font-jakarta">Premi Enter o virgola per aggiungere</p>
    </div>
  )
}
