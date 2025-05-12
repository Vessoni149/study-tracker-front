"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash, Edit } from "lucide-react"
import type { StudySession, Subject } from "@/lib/types"
import { createStudySession, editStudySession, getSubjects, deleteSubject } from "@/lib/data";
import SubjectForm from "./subject-form"

interface StudyFormProps {
  subjects: Subject[]
  onClose: () => void
  onDataChange: () => void
  editSession?: StudySession
}

export default function StudyForm({ subjects, onClose, onDataChange, editSession }: StudyFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>(undefined)
  const [localSubjects, setLocalSubjects] = useState<Subject[]>([])
  // Clave para forzar re-renderizado del componente Select
  const [selectKey, setSelectKey] = useState(0)
  const [open, setOpen] = useState(false);

  const today = new Date()
  const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const [formData, setFormData] = useState<{
    date: string
    subject: string
    hours: number
    type: "theoretical" | "practical"
  }>({
    date: formattedDate,
    subject: "",
    hours: 1,
    type: "theoretical",
  })

  // Cargar materias inicialmente y cada vez que se cierre el SubjectForm
  const fetchSubjects = async () => {
    try {
      const res = await getSubjects()
      setLocalSubjects(res)
      setSelectKey(prev => prev + 1)
    } catch (error) {
      console.error("Error al cargar materias:", error) // Log para debugging
      toast({ title: "Error al cargar materias", description: "No se pudieron obtener las materias", variant: "destructive" })
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  // Cuando editSession cambia, precargar fechas y valores
  useEffect(() => {
    if (editSession) {
      let isoDate = editSession.date
      if (/^\d{2}-\d{2}-\d{4}$/.test(editSession.date)) {
        const [day, month, year] = editSession.date.split("-")
        isoDate = `${year}-${month}-${day}`
      }
      
      setFormData({
        date: isoDate,
        subject: editSession.subject.name,
        hours: editSession.hours,
        type: editSession.studyType === "teórico" ? "theoretical" : "practical",
      })
    }
  }, [editSession])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const selectedDate = new Date(formData.date)
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    if (selectedDate > currentDate) {
      toast({ title: "Error de validación", description: "La fecha no puede ser futura", variant: "destructive" })
      return false
    }
    if (formData.hours <= 0 || formData.hours > 24) {
      toast({ title: "Error de validación", description: "Las horas deben ser un número positivo y menor a 24", variant: "destructive" })
      return false
    }
    if (!formData.subject) {
      toast({ title: "Error de validación", description: "Debes seleccionar una materia", variant: "destructive" })
      return false
    }
    return true
  }

  function buildCreateDto(): {
    date: string;
    subject: { name: string; color: string };
    hours: number;
    studyType: string;
  } {
    const sub = localSubjects.find(s => s.name === formData.subject)!;
    return {
      date: formData.date,
      subject: { name: sub.name, color: sub.color },
      hours: formData.hours,
      studyType: formData.type === "theoretical" ? "teórico" : "práctico",
    };
  }
  
  function buildEditDto(): {
    date: string;
    subjectId: string;
    hours: number;
    studyType: string;
  } {
    const sub = localSubjects.find(s => s.name === formData.subject)!;
    return {
      date: formData.date,
      subjectId: sub.id,
      hours: formData.hours,
      studyType: formData.type === "theoretical" ? "teórico" : "práctico",
    };
  }
  
  const handleCreate = async () => {
    const dto = buildCreateDto();
    const created = await createStudySession(dto);
    if (!created) throw new Error("Création fallida");
    return created;
  };
  
  const handleEdit = async () => {
    const dto = buildEditDto();
    const updated = await editStudySession(editSession!.id, dto);
    if (!updated) throw new Error("Edición fallida");
    return updated;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setLoading(true);
    try {
      const result = editSession
        ? await handleEdit()
        : await handleCreate();
  
      toast({
        title: editSession ? "Sesión actualizada" : "Sesión registrada",
        description: "Los datos se han guardado correctamente",
      });
  
      onDataChange();
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message || "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await deleteSubject(subjectId)
      toast({ title: "Materia eliminada", description: "La materia fue eliminada exitosamente." })
      await fetchSubjects()
      if (formData.subject === subjectId) handleChange('subject', '')
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar la materia", variant: "destructive" })
    }
  }

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setShowSubjectForm(true)
  }

  // Función para manejar la creación/edición de materia
  const handleSubjectFormClose = async (shouldRefresh: boolean = false) => {
    setShowSubjectForm(false)
    setEditingSubject(undefined)
    if (shouldRefresh) {
      await fetchSubjects()
      onDataChange(); 
    }
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editSession ? "Editar sesión de estudio" : "Registrar sesión de estudio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Fecha y Horas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" type="date" value={formData.date} max={formattedDate}
                    onChange={e => handleChange('date', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Horas dedicadas</Label>
                  <Input id="hours" type="number" min="0.5" max="24" step="0.5"
                    value={formData.hours} onChange={e => handleChange('hours', parseFloat(e.target.value))} required />
                </div>
              </div>

              {/* Materia con Select y botón Nueva */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject">Materia</Label>
                  <Button size="sm" variant="ghost" onClick={() => setShowSubjectForm(true)}
                    className="h-8 px-2 text-xs">
                    <Plus className="h-3 w-3 mr-1"/> Nueva materia
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Select
                    key={selectKey}
                    open={open}
                    onOpenChange={setOpen}
                    value={formData.subject}
                    onValueChange={(value) =>
                      handleChange("subject", value)
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {localSubjects.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.name}
                          className="pl-8 pr-2"
                        >
                          <div className="flex items-center w-full px-2 py-1.5">
                            <div className="flex items-center flex-1 min-w-0">
                              <div
                                className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    subject.color || "#ccc",
                                }}
                              />
                              <span className="truncate">
                                {subject.name}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Botones de Edit / Trash junto al SelectTrigger */}
                  {formData.subject && (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full text-blue-500 p-0.5"
                        onClick={() => {
                          const sub = localSubjects.find(
                            (s) => s.name === formData.subject
                          )!
                          handleEditSubject(sub)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full text-red-500 p-0.5"
                        onClick={() => {
                          const sub = localSubjects.find(
                            (s) => s.name === formData.subject
                          )!
                          handleDeleteSubject(sub.id)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Tipo de estudio */}
              <div className="space-y-2">
                <Label htmlFor="studyType">Tipo de estudio</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) =>
                    handleChange("type", value)
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="theoretical"
                      id="theoretical"
                    />
                    <Label htmlFor="theoretical">Teórico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="practical"
                      id="practical"
                    />
                    <Label htmlFor="practical">Práctico</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}{" "}
                {editSession ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showSubjectForm && (
        <SubjectForm
          onClose={() => handleSubjectFormClose(false)}
          onDataChange={() => handleSubjectFormClose(true)}
          existingSubjects={localSubjects}
          editSubject={editingSubject}
        />
      )}
    </>
  )
}