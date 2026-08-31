"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, Search, X } from "lucide-react"

export interface SearchableSelectProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const SearchableSelect = React.forwardRef<HTMLDivElement, SearchableSelectProps>(
  ({ options, value, onChange, placeholder = "Select...", disabled, className }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const selected = options.find((o) => o.value === value)

    React.useEffect(() => {
      if (!open) setQuery("")
    }, [open])

    React.useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }, [])

    const filtered = query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options

    const clearValue = (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange("")
    }

    const setRefs = (node: HTMLDivElement | null) => {
      containerRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    }

    return (
      <div ref={setRefs} className="relative w-full">
        <div className="relative">
          <input
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
              value && !open && "pr-14",
              className
            )}
            placeholder={open ? "Search..." : placeholder}
            value={open ? query : selected?.label ?? ""}
            readOnly={!open}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
          />
          {!disabled && value && !open && (
            <button
              type="button"
              onClick={clearValue}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-500",
              open && "rotate-180"
            )}
          />
        </div>
        {open && !disabled && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                <Search className="h-4 w-4" /> No options found
              </div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900 flex items-center justify-between",
                    o.value === value && "bg-blue-50 font-medium"
                  )}
                >
                  <span>{o.label}</span>
                  {o.value === value && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    )
  }
)
SearchableSelect.displayName = "SearchableSelect"

export { SearchableSelect }
