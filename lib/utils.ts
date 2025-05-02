import type { StudySession } from "./types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatDate(dateString: string): string {
  const [day, month] = dateString.split("-")
  return `${day}/${month}`
}

export function groupSessionsByDate(sessions: StudySession[]): { date: string; hours: number }[] {
  const groupedData: Record<string, number> = {}

  sessions.forEach((session) => {
    if (!groupedData[session.date]) {
      groupedData[session.date] = 0
    }
    groupedData[session.date] += session.hours
  })

  // Convert to array and sort by date
  return Object.entries(groupedData)
    .map(([date, hours]) => ({ date, hours }))
    .sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split("-").map(Number)
      const [dayB, monthB, yearB] = b.date.split("-").map(Number)

      if (yearA !== yearB) return yearA - yearB
      if (monthA !== monthB) return monthA - monthB
      return dayA - dayB
    })
}

export function generateUniqueColor(existingColors: string[]): string {
  // Define a set of predefined distinct colors
  const distinctColors = [
    "hsl(0, 80%, 50%)", // Red
    "hsl(30, 80%, 50%)", // Orange
    "hsl(60, 80%, 50%)", // Yellow
    "hsl(120, 80%, 50%)", // Green
    "hsl(180, 80%, 50%)", // Cyan
    "hsl(210, 80%, 50%)", // Blue
    "hsl(240, 80%, 50%)", // Indigo
    "hsl(270, 80%, 50%)", // Purple
    "hsl(300, 80%, 50%)", // Pink
    "hsl(330, 80%, 50%)", // Magenta
    "hsl(15, 80%, 50%)", // Red-Orange
    "hsl(45, 80%, 50%)", // Yellow-Orange
    "hsl(75, 80%, 50%)", // Yellow-Green
    "hsl(150, 80%, 50%)", // Blue-Green
    "hsl(195, 80%, 50%)", // Light Blue
    "hsl(225, 80%, 50%)", // Blue-Purple
    "hsl(255, 80%, 50%)", // Purple-Blue
    "hsl(285, 80%, 50%)", // Purple-Pink
    "hsl(315, 80%, 50%)", // Pink-Red
    "hsl(345, 80%, 50%)", // Red-Pink
  ]

  // First try to find a color from our predefined list that's not in use
  for (const color of distinctColors) {
    if (!existingColors.includes(color)) {
      return color
    }
  }

  // If all predefined colors are used, generate a random one
  // that's visually distinct from existing colors
  const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360)
    const saturation = 70 + Math.floor(Math.random() * 30) // 70-100%
    const lightness = 45 + Math.floor(Math.random() * 10) // 45-55%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  // Check if a color is visually distinct from existing colors
  const isDistinct = (color: string) => {
    // Extract hue from HSL color
    const hueMatch = color.match(/hsl\((\d+),/)
    if (!hueMatch) return false

    const hue = Number.parseInt(hueMatch[1])

    // Check if this hue is sufficiently different from existing colors
    for (const existingColor of existingColors) {
      const existingHueMatch = existingColor.match(/hsl\((\d+),/)
      if (!existingHueMatch) continue

      const existingHue = Number.parseInt(existingHueMatch[1])
      const hueDifference = Math.min(Math.abs(hue - existingHue), 360 - Math.abs(hue - existingHue))

      // If hues are too close (less than 30 degrees apart), colors are not distinct
      if (hueDifference < 30) {
        return false
      }
    }

    return true
  }

  let color = getRandomColor()
  let attempts = 0

  // Try to find a distinct color, with a maximum of 20 attempts
  while (!isDistinct(color) && attempts < 20) {
    color = getRandomColor()
    attempts++
  }

  return color
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

