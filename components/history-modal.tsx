"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Calendar } from "lucide-react"
import type { StudySession, Subject } from "@/lib/types"
import { softDeleteStudySession } from "@/lib/data"
import { useToast } from "@/components/ui/use-toast"
import StudyForm from "./study-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface HistoryModalProps {
  studySessions: StudySession[]
  setStudySessions: React.Dispatch<React.SetStateAction<StudySession[]>>
  subjects: Subject[]
  onClose: () => void
  onDataChange: () => void
  onViewMonth: (month: string, year: number) => void
}

export default function HistoryModal({
  studySessions,
  setStudySessions,
  subjects,
  onClose,
  onDataChange,
  onViewMonth,
}: HistoryModalProps) {
  const { toast } = useToast()
  const [editingSession, setEditingSession] = useState<StudySession | null>(null)
  const [deletingSession, setDeletingSession] = useState<StudySession | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>("all")

  // Group sessions by month and year
  const sessionsByMonth = useMemo(() => {
    const grouped: Record<string, { month: string; year: number; monthNumber: number; sessions: StudySession[] }> = {}

    studySessions.forEach((session) => {
      const [day, month, year] = session.date.split("-").map(Number)
      const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" })
      const key = `${year}-${month}`

      if (!grouped[key]) {
        grouped[key] = {
          month: monthName,
          year,
          monthNumber: month,
          sessions: [],
        }
      }

      grouped[key].sessions.push(session)
    })

    // Sort by date (newest first)
    return Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.monthNumber - a.monthNumber
    })
  }, [studySessions])

  const filteredSessions = useMemo(() => {
    if (selectedMonth === "all") {
      return studySessions.sort((a, b) => {
        // Sort by date (newest first)
        const [dayA, monthA, yearA] = a.date.split("-").map(Number)
        const [dayB, monthB, yearB] = b.date.split("-").map(Number)

        if (yearA !== yearB) return yearB - yearA
        if (monthA !== monthB) return monthB - monthA
        return dayB - dayA
      })
    }

    const [year, month] = selectedMonth.split("-").map(Number)
    return studySessions
      .filter((session) => {
        const [day, sessionMonth, sessionYear] = session.date.split("-").map(Number)
        return sessionMonth === month && sessionYear === year
      })
      .sort((a, b) => {
        // Sort by date (newest first)
        const [dayA] = a.date.split("-").map(Number)
        const [dayB] = b.date.split("-").map(Number)
        return dayB - dayA
      })
  }, [studySessions, selectedMonth])

  const handleSoftDelete = async (sessionToDelete: StudySession) => {
    try {
      // 1) Llamas sólo con el ID y recibes la sesión actualizada
      const updated = await softDeleteStudySession(sessionToDelete.id);
  
      // 2) Reemplazas en el array local
      setStudySessions(prev =>
        prev.map(s => (s.id === updated.id ? updated : s))
      );
  
      toast({
        title: "Sesión marcada como eliminada",
        description: "Los datos se han vaciado correctamente",
      });
  
      // 3) (Opcional) Refrescas el padre si lo deseas
      onDataChange();
      setDeletingSession(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo vaciar la sesión",
        variant: "destructive",
      });
    }
  };
  
  
  
  

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Historial de sesiones de estudio</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4 z-50 bg-red">
            <Select value={selectedMonth} onValueChange={setSelectedMonth} >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecciona un mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {sessionsByMonth.map(({ month, year, monthNumber }, index) => (
                  <SelectItem key={index} value={`${year}-${monthNumber}`}>
                    {month} {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedMonth !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const [year, month] = selectedMonth.split("-").map(Number)
                  const monthName = new Date(year, month - 1, 1).toLocaleString("default", {
                    month: "long",
                  })
                  onViewMonth(monthName, year)
                  onClose()
                }}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Ver gráfico mensual
              </Button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[50vh]">
            {filteredSessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay sesiones de estudio para mostrar</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Materia</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {session.subject?.name || "Sin materia"}
                        </div>
                      </TableCell>
                      <TableCell>{session.hours}</TableCell>
                      <TableCell>{session.studyType === "teórico" ? "Teórico" : "Práctico"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingSession(session)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingSession(session)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editingSession && (
        <StudyForm
          subjects={subjects}
          onClose={() => setEditingSession(null)}
          onDataChange={onDataChange}
          editSession={editingSession}
        />
      )}

      <AlertDialog open={!!deletingSession} onOpenChange={() => setDeletingSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta sesión de estudio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingSession && handleSoftDelete(deletingSession)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

