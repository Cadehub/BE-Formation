import React, { createContext, useContext, useState } from "react"
import { cn } from "../../lib/utils"

const TabsContext = createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

export function Tabs({ 
  defaultValue, 
  value, 
  onValueChange, 
  children, 
  className 
}: { 
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string 
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || "")
  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = onValueChange || setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("inline-flex items-center justify-center rounded-xl bg-[var(--card)]/80 p-1 border border-[var(--border)]", className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used within Tabs")
  
  const isSelected = context.value === value

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 flex-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50",
        isSelected 
          ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm" 
          : "text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--foreground)]/5",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used within Tabs")

  if (context.value !== value) return null

  return (
    <div className={cn("mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  )
}
