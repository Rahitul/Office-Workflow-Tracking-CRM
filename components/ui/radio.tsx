import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps {
  name: string
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  className?: string
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {options.map((option) => (
        <label key={option.value} className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

export { RadioGroup }