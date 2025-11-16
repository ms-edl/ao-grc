import * as React from "react"
import { cn } from "@/lib/utils"
import { DragHandle } from "./drag-handle"

interface ResizeHandleVerticalProps {
  onResize: (deltaY: number) => void
  className?: string
}

/**
 * ResizeHandleVertical - A vertical drag handle for resizing chart heights
 * 
 * Features:
 * - Mouse drag to resize
 * - Visual feedback on hover and active drag
 * - Smooth transitions
 * - Cursor change to ns-resize
 * - Uses DragHandle component (horizontal bar for vertical resizing)
 */
export function ResizeHandleVertical({ onResize, className }: ResizeHandleVerticalProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const startY = React.useRef<number>(0)
  const lastDeltaY = React.useRef<number>(0)

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    startY.current = e.clientY
    lastDeltaY.current = 0
  }, [])

  React.useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY.current - lastDeltaY.current
      lastDeltaY.current = e.clientY - startY.current
      onResize(deltaY)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      lastDeltaY.current = 0
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, onResize])

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 cursor-ns-resize",
        "flex items-center justify-center",
        className
      )}
      style={{
        height: '24px',
        zIndex: 10,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <DragHandle 
        orientation="horizontal"
        size="md"
        isDragging={isDragging}
        isActive={false}
        isHovered={isHovered}
      />
    </div>
  )
}

