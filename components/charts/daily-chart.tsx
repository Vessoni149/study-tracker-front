"use client"

import { useState, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Brush } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { StudySession } from "@/lib/types"
import { formatDate, groupSessionsByDate } from "@/lib/utils"

interface DailyChartProps {
  studySessions: StudySession[]
}

type ZoomLevel = "month" | "year" | "all"

export default function DailyChart({ studySessions }: DailyChartProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("month")
  const now = new Date()
  // estados para navegar mes/año
  const [month, setMonth] = useState<number>(now.getMonth()) // 0-11
  const [monthYear, setMonthYear] = useState<number>(now.getFullYear())
  const [year, setYear] = useState<number>(now.getFullYear())

  // Agrupa sesiones y suma horas por día
  const chartData = groupSessionsByDate(studySessions)

  // Resetea vistas específicas al cambiar zoom
  useEffect(() => {
    if (zoomLevel === "month") {
      setMonth(now.getMonth())
      setMonthYear(now.getFullYear())
    }
    if (zoomLevel === "year") {
      setYear(now.getFullYear())
    }
  }, [zoomLevel])

  // Funciones de navegación
  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setMonthYear(monthYear - 1)
    } else {
      setMonth(month - 1)
    }
  }
  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setMonthYear(monthYear + 1)
    } else {
      setMonth(month + 1)
    }
  }
  const goToCurrentMonth = () => {
    setMonth(now.getMonth())
    setMonthYear(now.getFullYear())
  }

  const goToPrevYear = () => setYear(year - 1)
  const goToNextYear = () => setYear(year + 1)
  const goToCurrentYear = () => setYear(now.getFullYear())

  // Filtra según nivel de zoom
  const filteredData = (() => {
    if (zoomLevel === "month") {
      return chartData.filter(item => {
        const [day, m, y] = item.date.split("-").map(Number)
        return m - 1 === month && y === monthYear
      })
    }
    if (zoomLevel === "year") {
      return chartData.filter(item => {
        const [, , y] = item.date.split("-").map(Number)
        return y === year
      })
    }
    return chartData
  })()

  // Nombres de meses
  const monthNames = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ]

  // Colores del gráfico
  const primaryColor = "#31c500"
  const secondaryColor = "#6afb9f"

  return (
    <div className="space-y-4">
      {/* Controles de navegación */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {zoomLevel === "month" ? (
            <>
              <button onClick={goToPrevMonth} className="p-1 rounded-full hover:bg-secondary">
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-medium">
                {monthNames[month]} {monthYear}
              </h3>
              <button onClick={goToNextMonth} className="p-1 rounded-full hover:bg-secondary">
                <ChevronRight size={20} />
              </button>
              <button onClick={goToCurrentMonth} className="ml-2 px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/80">
                Hoy
              </button>
            </>
          ) : zoomLevel === "year" ? (
            <>
              <button onClick={goToPrevYear} className="p-1 rounded-full hover:bg-secondary">
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-medium">
                {year}
              </h3>
              <button onClick={goToNextYear} className="p-1 rounded-full hover:bg-secondary">
                <ChevronRight size={20} />
              </button>
              <button onClick={goToCurrentYear} className="ml-2 px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/80">
                Año actual
              </button>
            </>
          ) : null}
        </div>

        {/* Botones de zoom */}
        <div className="flex space-x-2">
          <button
            onClick={() => setZoomLevel("month")}
            className={`px-3 py-1 text-sm rounded-md ${zoomLevel === "month" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            Mes
          </button>
          <button
            onClick={() => setZoomLevel("year")}
            className={`px-3 py-1 text-sm rounded-md ${zoomLevel === "year" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            Año
          </button>
          <button
            onClick={() => setZoomLevel("all")}
            className={`px-3 py-1 text-sm rounded-md ${zoomLevel === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            Todo
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[300px]">
        {filteredData.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No hay datos para mostrar en este período</p>
            </CardContent>
          </Card>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <Brush
                dataKey="date"
                height={30}
                stroke={primaryColor}
                travellerWidth={10}
                startIndex={filteredData.length - 90}  // por ejemplo abre en últimos 90 días
                endIndex={filteredData.length - 1}
              />
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} tick={{ fontSize: 12 }} />
              <YAxis
                label={{ value: "Horas", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value} horas`, "Tiempo de estudio"]}
                labelFormatter={(label) => `Fecha: ${formatDate(label)}`} />
              <Area
                type="monotone"
                dataKey="hours"
                stroke={primaryColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
