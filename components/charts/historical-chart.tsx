"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import type { StudySession } from "@/lib/types"

interface HistoricalChartProps {
  studySessions: StudySession[]
  month: string
  year: number
  onClose: () => void
}

export default function HistoricalChart({ studySessions, month, year, onClose }: HistoricalChartProps) {
  // Get month number from name
  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ]
  const monthNumber = monthNames.findIndex((m) => m.toLowerCase() === month.toLowerCase()) + 1

  // Filter sessions for the selected month
  const filteredSessions = studySessions.filter((session) => {
    const [day, sessionMonth, sessionYear] = session.date.split("-").map(Number)
    return sessionMonth === monthNumber && sessionYear === year
  })

  // Get days in month
  const daysInMonth = new Date(year, monthNumber, 0).getDate()

  // Create array with all days in month
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const formattedDay = day.toString().padStart(2, "0")
    const formattedMonth = monthNumber.toString().padStart(2, "0")
    return `${formattedDay}-${formattedMonth}-${year}`
  })

  // Group sessions by date and calculate total hours per day
  const chartData = daysArray.map((date) => {
    const dayTotal = filteredSessions
      .filter((session) => session.date === date)
      .reduce((sum, session) => sum + session.hours, 0)

    return {
      date,
      hours: dayTotal,
    }
  })

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            Horas de estudio - {month} {year}
          </DialogTitle>
        </DialogHeader>

        <div className="h-[400px]">
          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">No hay datos para mostrar en este mes</p>
              </CardContent>
            </Card>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const [day] = value.split("-")
                    return day
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{
                    value: "Horas",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} horas`, "Tiempo de estudio"]}
                  labelFormatter={(label) => {
                    const [day, month, year] = label.split("-")
                    return `${day}/${month}/${year}`
                  }}
                />
                <Bar dataKey="hours" fill="#433aff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

