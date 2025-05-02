"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { StudySession, Subject } from "@/lib/types"
import { BookOpen, Clock, Calendar, BarChart2, History } from "lucide-react"
import MonthlyAverageHistory from "./monthly-average-history"
import YearlyTotalHistory from "./yearly-total-history"

interface StatsPanelProps {
  studySessions: StudySession[]
  subjects: Subject[]
}

export default function StatsPanel({ studySessions, subjects }: StatsPanelProps) {
  const [showMonthlyHistory, setShowMonthlyHistory] = useState(false)
  const [showYearlyHistory, setShowYearlyHistory] = useState(false)

  // Calculate hours by subject
  const hoursBySubject = subjects
    .map((subject) => {
      const totalHours = studySessions
        .filter((session) => session.subject.name === subject.name)
        .reduce((sum, session) => sum + session.hours, 0)

      return {
        name: subject.name,
        hours: totalHours,
        color: subject.color,
      }
    })
    .filter((subject) => subject.hours > 0) // Only include subjects with study time

  // Sort by hours (descending)
  hoursBySubject.sort((a, b) => b.hours - a.hours)

  // Calculate theoretical vs practical hours
  const theoreticalHours = studySessions
  .filter((session) => {
    const studyType = session.studyType?.toLowerCase();
    return studyType === "teórico" || studyType === "teorico";
  })
  .reduce((sum, session) => sum + session.hours, 0);

const practicalHours = studySessions
  .filter((session) => {
    const studyType = session.studyType?.toLowerCase();
    return studyType === "práctico" || studyType === "practico";
  })
  .reduce((sum, session) => sum + session.hours, 0);

  // Calculate total hours for current month
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  const currentMonthName = new Date().toLocaleString("default", { month: "long" })

  const currentMonthSessions = studySessions.filter((session) => {
    const [day, month, year] = session.date.split("-").map(Number)
    return month === currentMonth && year === currentYear
  })

  const totalHoursThisMonth = currentMonthSessions.reduce((sum, session) => sum + session.hours, 0)

  // Calculate total hours this year
  const currentYearSessions = studySessions.filter((session) => {
    const [day, month, year] = session.date.split("-").map(Number)
    return year === currentYear
  })

  const totalHoursThisYear = currentYearSessions.reduce((sum, session) => sum + session.hours, 0)

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total por materias</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hoursBySubject.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
              ) : (
                hoursBySubject.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: subject.color }} />
                      <span className="text-sm font-medium">{subject.name}</span>
                    </div>
                    <span className="text-sm">{subject.hours} horas</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teórico vs Práctico</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Teórico</p>
                <div className="flex items-center justify-between">
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${
                          theoreticalHours + practicalHours > 0
                            ? (theoreticalHours / (theoreticalHours + practicalHours)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm ml-2">{theoreticalHours} h</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Práctico</p>
                <div className="flex items-center justify-between">
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          theoreticalHours + practicalHours > 0
                            ? (practicalHours / (theoreticalHours + practicalHours)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm ml-2">{practicalHours} h</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total mensual</CardTitle>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursThisMonth} h</div>
            <p className="text-xs text-muted-foreground mb-4">
              {currentMonthName} {currentYear}
            </p>
            <div className="flex  mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 text-xs hover:bg-gray-100 cursor-pointer" 
                onClick={() => setShowMonthlyHistory(true)}
              >
                <span>Historial</span>
                <History className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total anual ({currentYear})</CardTitle>
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursThisYear} h</div>
            <p className="text-xs text-muted-foreground mb-4">Acumulado hasta la fecha</p>
            <div className="flex  mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 text-xs hover:bg-gray-100 cursor-pointer" 
                onClick={() => setShowYearlyHistory(true)}
              >
                <span>Historial</span>
                <History className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showMonthlyHistory && (
        <MonthlyAverageHistory studySessions={studySessions} onClose={() => setShowMonthlyHistory(false)} />
      )}

      {showYearlyHistory && (
        <YearlyTotalHistory studySessions={studySessions} onClose={() => setShowYearlyHistory(false)} />
      )}
    </div>
  )
}