"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const UserMenu = React.forwardRef<HTMLDivElement, UserMenuProps>(
  ({ open, onOpenChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute right-0 top-16 mt-2 w-64 bg-background shadow-lg rounded-md p-4 transform transition-transform duration-200 ease-out origin-top-right",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
        {...props}
      >
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    )
  }
)

UserMenu.displayName = "UserMenu"

export { UserMenu }
