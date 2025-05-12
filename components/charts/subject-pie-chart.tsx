"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import type { StudySession, Subject } from "@/lib/types"

interface SubjectPieChartProps {
  studySessions: StudySession[]
  subjects: Subject[]
}

export default function SubjectPieChart({ studySessions, subjects }: SubjectPieChartProps) {
  // Verificar que los datos existen
  if (!studySessions?.length || !subjects?.length) {
    return (
      <div className="h-[300px]">
        <Card>
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No hay datos para mostrar</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  

  // Crear un mapa de nombres de materias a colores para referencia rápida
  const subjectColorMap = subjects.reduce((map, subject) => {
    map[subject.name] = subject.color
    return map
  }, {} as Record<string, string>)

  // Calcular total de horas por materia
  const subjectTotals = subjects
    .map((subject) => {
      const totalHours = studySessions
        .filter((session) => {
          // Comprobamos si session.subject es un objeto con propiedad name o directamente un string
          const sessionSubjectName = typeof session.subject === 'object' && session.subject !== null
            ? session.subject.name 
            : session.subject
          
          return sessionSubjectName === subject.name
        })
        .reduce((sum, session) => sum + session.hours, 0)

      return {
        name: subject.name,
        value: totalHours,
        color: subject.color, // Aseguramos que estamos usando el color definido en el objeto subject
      }
    })
    .filter((subject) => subject.value > 0) // Solo incluir materias con tiempo de estudio

  // Ordenar por horas (descendente)
  subjectTotals.sort((a, b) => b.value - a.value)

  // Calcular horas totales
  const totalHours = subjectTotals.reduce((sum, subject) => sum + subject.value, 0)

  // Si no hay datos después de filtrar, mostrar mensaje
  if (subjectTotals.length === 0) {
    return (
      <div className="h-[300px]">
        <Card>
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No hay datos para mostrar</p>
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={subjectTotals}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {subjectTotals.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || `hsl(${index * 25 % 360}, 70%, 50%)`} 
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${value} horas (${((value / totalHours) * 100).toFixed(1)}%)`,
              "Tiempo de estudio",
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}