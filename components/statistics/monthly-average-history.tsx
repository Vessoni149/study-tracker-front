"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { StudySession } from "@/lib/types"

interface MonthlyAverageHistoryProps {
  studySessions: StudySession[]
  onClose: () => void
}

export default function MonthlyAverageHistory({ studySessions, onClose }: MonthlyAverageHistoryProps) {
  // Get all available years from sessions
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    
    studySessions.forEach((session) => {
      const [day, month, year] = session.date.split("-").map(Number)
      years.add(year)
    })
    
    return Array.from(years).sort((a, b) => b - a) // Sort descending
  }, [studySessions])
  
  // Default to current year or most recent year with data
  const currentYear = new Date().getFullYear()
  const defaultYear = availableYears.includes(currentYear) 
    ? currentYear 
    : (availableYears.length > 0 ? availableYears[0] : currentYear)
  
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear)

  // Group sessions by month and year
  const allMonthlyData = useMemo(() => {
    const grouped: Record<
      string,
      {
        year: number
        month: number
        monthName: string
        totalHours: number
        theoreticalHours: number
        practicalHours: number
        sessionCount: number
      }
    > = {}

    // Process all study sessions
    studySessions.forEach((session) => {
      const [day, month, year] = session.date.split("-").map(Number)
      const key = `${year}-${month}`

      if (!grouped[key]) {
        const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" })

        grouped[key] = {
          year,
          month,
          monthName,
          totalHours: 0,
          theoreticalHours: 0,
          practicalHours: 0,
          sessionCount: 0
        }
      }

      // Add hours to total
      grouped[key].totalHours += session.hours
      grouped[key].sessionCount += 1

      // Add hours to theoretical or practical total
      if (session.studyType === "teórico") {
        grouped[key].theoreticalHours += session.hours
      } else {
        grouped[key].practicalHours += session.hours
      }
    })

    // Convert to array
    return Object.values(grouped)
      .map((data) => ({
        ...data,
        label: `${data.monthName}`,
      }))
      .sort((a, b) => {
        // Sort by date (newest first)
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
  }, [studySessions])

  // Filter data for selected year
  const monthlyData = useMemo(() => {
    return allMonthlyData.filter(data => data.year === selectedYear)
  }, [allMonthlyData, selectedYear])

  // Prepare chart data (oldest to newest within the year)
  const chartData = useMemo(() => {
    return [...monthlyData]
      .sort((a, b) => a.month - b.month) // Sort by month (January to December)
  }, [monthlyData])

  // Move to previous/next year if available
  const changeYear = (direction: 'prev' | 'next') => {
    const currentIndex = availableYears.indexOf(selectedYear)
    if (direction === 'prev' && currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1])
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1])
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial de totales mensuales</DialogTitle>
        </DialogHeader>

        {/* Year selector */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => changeYear('prev')}
            disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => changeYear('next')}
            disabled={availableYears.indexOf(selectedYear) === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 overflow-y-auto pr-2">
          <div className="h-[300px]">
            {chartData.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">No hay datos para el año {selectedYear}</p>
                </CardContent>
              </Card>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  barSize={40} // Control bar width
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis
                    label={{
                      value: "Horas totales",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} horas`, "Total mensual"]} />
                  <Bar dataKey="totalHours" fill="#24bf3e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="overflow-y-auto max-h-[200px]">
            <div className="grid grid-cols-1 gap-4">
              {monthlyData.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center p-6">
                    <p className="text-muted-foreground">No hay datos para el año {selectedYear}</p>
                  </CardContent>
                </Card>
              ) : (
                monthlyData.map((data, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold capitalize">{data.monthName}</h3>
                        <span className="text-sm text-muted-foreground">{data.sessionCount} {data.sessionCount === 1 ? 'sesión' : 'sesiones'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Total</h4>
                          <p className="text-lg font-bold">{data.totalHours.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">horas</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Teórico</h4>
                          <p className="text-lg font-bold">{data.theoreticalHours.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">horas</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Práctico</h4>
                          <p className="text-lg font-bold">{data.practicalHours.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">horas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}