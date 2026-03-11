import * as React from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof BaseScrollArea.Root> {
  viewportClassName?: string;
  contentClassName?: string;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, viewportClassName, contentClassName, children, ...props }, ref) => {
    return (
      <BaseScrollArea.Root
        ref={ref}
        className={cn("group/scroll-area relative h-full w-full min-h-0", className)}
        {...props}
      >
        <BaseScrollArea.Viewport className={cn("h-full w-full", viewportClassName)}>
          <BaseScrollArea.Content className={cn("min-h-full", contentClassName)}>
            {children}
          </BaseScrollArea.Content>
        </BaseScrollArea.Viewport>
        <BaseScrollArea.Scrollbar
          className={cn(
            "flex touch-none select-none p-0.5 transition-opacity duration-150",
            "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2",
            "opacity-0 pointer-events-none",
            "group-hover/scroll-area:opacity-100 group-hover/scroll-area:pointer-events-auto",
            "data-[hovering]:opacity-100 data-[hovering]:pointer-events-auto",
            "data-[scrolling]:opacity-100 data-[scrolling]:pointer-events-auto",
          )}
        >
          <BaseScrollArea.Thumb className="relative flex-1 rounded-full bg-[rgb(var(--content-tertiary)/0.35)] hover:bg-[rgb(var(--content-tertiary)/0.55)]" />
        </BaseScrollArea.Scrollbar>
      </BaseScrollArea.Root>
    );
  },
);

ScrollArea.displayName = "ScrollArea";
