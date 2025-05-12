"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { StudySession } from "@/lib/types"

interface MonthlyChartProps {
  studySessions: StudySession[]
  initialMonth?: number // 0-11, opcional para permitir configurar el mes inicial
  initialYear?: number // opcional para permitir configurar el año inicial
  currentMonth?: number // opcional, para compatibilidad con código existente
  currentYear?: number // opcional, para compatibilidad con código existente
}

export default function MonthlyChart({ 
  studySessions, 
  initialMonth = new Date().getMonth(), 
  initialYear = new Date().getFullYear(),
  currentMonth,
  currentYear 
}: MonthlyChartProps) {
  const [zoomLevel, setZoomLevel] = useState<"week" | "month">("month")
  const [month, setMonth] = useState<number>(initialMonth)
  const [year, setYear] = useState<number>(initialYear)
  const [weekOffset, setWeekOffset] = useState<number>(0) // Para navegar entre semanas
  
  // Reset week offset when changing zoom level
  useEffect(() => {
    if (zoomLevel === "month") {
      setWeekOffset(0)
    }
  }, [zoomLevel])
  
  // Reset week offset when changing month/year
  useEffect(() => {
    setWeekOffset(0)
  }, [month, year])

  // Obtener el nombre del mes para mostrar
  const getMonthName = (monthIndex: number): string => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    return monthNames[monthIndex]
  }

  // Navegar al mes anterior
  const goToPreviousMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  // Navegar al mes siguiente
  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  // Ir al mes actual
  const goToCurrentMonth = () => {
    setMonth(new Date().getMonth())
    setYear(new Date().getFullYear())
    setWeekOffset(0)
  }
  
  // Navegar a la semana anterior
  const goToPreviousWeek = () => {
    setWeekOffset(weekOffset - 1)
  }
  
  // Navegar a la semana siguiente
  const goToNextWeek = () => {
    setWeekOffset(weekOffset + 1)
  }
  
  // Ir a la semana actual
  const goToCurrentWeek = () => {
    setWeekOffset(0)
  }

  // Función para formatear fecha como DD-MM-YYYY
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0")
    const monthStr = (date.getMonth() + 1).toString().padStart(2, "0")
    const yearStr = date.getFullYear()
    return `${day}-${monthStr}-${yearStr}`
  }
  
  // Función para formatear fecha como DD/MM para mostrar en el gráfico
  const formatShortDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    return `${day}/${month}`
  }

  // Filter sessions for the current month
  const filteredSessions = studySessions.filter((session) => {
    const [day, sessionMonth, sessionYear] = session.date.split("-").map(Number)
    return sessionMonth - 1 === month && sessionYear === year
  })

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Create array with all days in month
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const formattedDay = day.toString().padStart(2, "0")
    const formattedMonth = (month + 1).toString().padStart(2, "0")
    return `${formattedDay}-${formattedMonth}-${year}`
  })

  // Group sessions by date and calculate total hours per day
  const chartData = daysArray.map((date) => {
    const [day, monthStr] = date.split("-")
    const dayOfWeek = new Date(year, Number.parseInt(monthStr) - 1, Number.parseInt(day)).getDay()
    // Convert Sunday (0) to 7 for better display
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek

    const dayTotal = studySessions
      .filter((session) => session.date === date)
      .reduce((sum, session) => sum + session.hours, 0)

    return {
      date,
      day: Number.parseInt(day),
      dayOfWeek: adjustedDayOfWeek,
      dayName: getDayName(adjustedDayOfWeek),
      shortDate: `${day}/${monthStr}`,
      fullDate: `${day}/${monthStr}/${year}`,
      hours: dayTotal,
    }
  })

// Need to update component state based on legacy props
  useEffect(() => {
    if (currentMonth !== undefined) setMonth(currentMonth);
    if (currentYear !== undefined) setYear(currentYear || new Date().getFullYear());
  }, [currentMonth, currentYear]);

  // Function to get week days with offset (for week navigation)
  const getWeekDays = (offset: number = 0) => {
    // Use current date when viewing current month/year, otherwise use the 15th of the month
    let startDate: Date
    const today = new Date()
    
    if (month === today.getMonth() && year === today.getFullYear() && offset === 0) {
      startDate = today
    } else {
      // Use the 15th of the month as reference for non-current months
      startDate = new Date(year, month, 15)
    }

    // Find the Monday of the current week
    const currentDayOfWeek = startDate.getDay() || 7 // Convert Sunday (0) to 7
    const mondayDate = new Date(startDate)
    mondayDate.setDate(startDate.getDate() - (currentDayOfWeek - 1))
    
    // Apply week offset
    mondayDate.setDate(mondayDate.getDate() + (offset * 7))

    // Create an array for all 7 days of the week
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate)
      date.setDate(mondayDate.getDate() + i)
      
      const dateStr = formatDate(date)
      const shortDate = formatShortDate(date)
      
      // Find study hours for this day across ALL sessions
      const dayTotal = studySessions
        .filter((session) => session.date === dateStr)
        .reduce((sum, session) => sum + session.hours, 0)

      weekDays.push({
        date: dateStr,
        day: date.getDate(),
        dayOfWeek: i + 1, // Monday = 1, Sunday = 7
        dayName: `${getDayName(i + 1)}\n${shortDate}`, // Include date with day name
        shortDate,
        fullDate: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
      hours: dayTotal,
      month: date.getMonth(),
      year: date.getFullYear(),
      })
    }

    return weekDays
  }

  // Function to get day name
  function getDayName(dayOfWeek: number): string {
    const dayNames = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    return dayNames[dayOfWeek]
  }
  
  // Get week range for title display
  const getWeekRangeText = () => {
    const weekData = getWeekDays(weekOffset)
    if (weekData.length === 0) return ""
    
    const firstDay = weekData[0]
    const lastDay = weekData[weekData.length - 1]
    
    return `${firstDay.day} ${getMonthName(firstDay.month).substring(0, 3)} - ${lastDay.day} ${getMonthName(lastDay.month).substring(0, 3)} ${lastDay.year}`
  }
  
  // Determine if we're viewing the current week
  const isCurrentWeek = () => {
    if (weekOffset !== 0) return false
    
    const today = new Date()
    return month === today.getMonth() && year === today.getFullYear()
  }

  // Filter data based on zoom level
  const zoomedData = zoomLevel === "week" ? getWeekDays(weekOffset) : chartData

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {zoomLevel === "month" ? (
            // Month navigation controls
            <>
              <button 
                onClick={goToPreviousMonth}
                className="p-1 rounded-full hover:bg-secondary"
                aria-label="Mes anterior"
              >
                <ChevronLeft size={20} />
              </button>
              
              <h3 className="font-medium">
                {getMonthName(month)} {year}
              </h3>
              
              <button 
                onClick={goToNextMonth}
                className="p-1 rounded-full hover:bg-secondary"
                aria-label="Mes siguiente"
              >
                <ChevronRight size={20} />
              </button>
              
              <button 
                onClick={goToCurrentMonth}
                className="ml-2 px-2 py-1 text-xs rounded bg-secondary hover:text-gray-500 cursor-pointer"
              >
                Hoy
              </button>
            </>
          ) : (
            // Week navigation controls
            <>
              <button 
                onClick={goToPreviousWeek}
                className="p-1 rounded-full hover:text-gray-500 cursor-pointer"
                aria-label="Semana anterior"
              >
                <ChevronLeft size={20} />
              </button>
              
              <h3 className="font-medium">
                {getWeekRangeText()}
              </h3>
              
              <button 
                onClick={goToNextWeek}
                className="p-1 rounded-full hover:text-gray-500 cursor-pointer"
                aria-label="Semana siguiente"
              >
                <ChevronRight size={20} />
              </button>
              
              {!isCurrentWeek() && (
                <button 
                  onClick={goToCurrentWeek}
                  className="ml-2 px-2 py-1 text-xs rounded bg-secondary hover:text-gray-500 cursor-pointer"
                >
                  Semana actual
                </button>
              )}
            </>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setZoomLevel("week")}
            className={`px-3 py-1 text-sm rounded-md ${
              zoomLevel === "week"
                ? "bg-gray-300 text-black"
                : "bg-secondary text-secondary-foreground"
            } hover:text-gray-500 cursor-pointer`}
          >
            Semana
          </button>
          <button
            onClick={() => setZoomLevel("month")}
            className={`px-3 py-1 text-sm rounded-md ${
              zoomLevel === "month"
                ? "bg-gray-300 text-black"
                : "bg-secondary text-secondary-foreground"
            } hover:text-gray-500 cursor-pointer`}
          >
            Mes
          </button>
        </div>

      </div>

      <div className="h-[300px]">
        {zoomLevel === "month" && filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No hay datos para mostrar en este mes</p>
            </CardContent>
          </Card>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoomedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey={zoomLevel === "week" ? "dayName" : "day"} 
                tick={{ fontSize: 12 }}
                height={40}
                tickFormatter={(value, index) => {
                  if (zoomLevel === "week") {
                    // For week view, just return the value (already formatted)
                    return value.toString().split('\n')[0]; // Only show the day name
                  }
                  return value.toString();
                }}
              />
              {zoomLevel === "week" && (
                <XAxis 
                  dataKey="shortDate"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value}
                  xAxisId="date"
                />
              )}
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
                labelFormatter={(label, data) => {
                  if (zoomLevel === "week") {
                    // Extract only the day name from the label (removing the date part)
                    const dayName = label.toString().split('\n')[0];
                    const item = zoomedData.find((item) => item.dayName.includes(dayName))
                    if (item) {
                      return `${item.fullDate} (${dayName})`
                    }
                    return label
                  }
                  return `${label}/${month + 1}/${year}`
                }}
              />
              <Bar dataKey="hours" fill="#24bf3e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}