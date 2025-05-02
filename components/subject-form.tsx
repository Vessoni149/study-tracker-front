"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Subject } from "@/lib/types"
import { addSubject } from "@/lib/data"

interface SubjectFormProps {
  onClose: () => void
  onDataChange: () => void
  existingSubjects: Subject[]
  editSubject?: Subject
}

export default function SubjectForm({ onClose, onDataChange, existingSubjects, editSubject }: SubjectFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    color: string
  }>({
    name: editSubject?.name || "",
    color: editSubject?.color || "#3b82f6" // Default azul
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error de validación", description: "El nombre de la materia es requerido", variant: "destructive" })
      return false
    }
    
    // Verificar que no exista una materia con el mismo nombre (excepto si estamos editando)
    const nameExists = existingSubjects.some(
      subject => subject.name.toLowerCase() === formData.name.toLowerCase() && 
      (!editSubject || editSubject.id !== subject.id)
    )
    
    if (nameExists) {
      toast({ title: "Error de validación", description: "Ya existe una materia con ese nombre", variant: "destructive" })
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const subjectData = {
        ...(editSubject && { id: editSubject.id }), // Solo incluimos el ID si estamos editando
        name: formData.name.trim(),
        color: formData.color,
      }

      console.log("Guardando materia con datos:", subjectData)
      const result = await addSubject(subjectData, !!editSubject)
      
      if (result) {
        toast({ 
          title: editSubject ? "Materia actualizada" : "Materia creada", 
          description: "Los datos se han guardado correctamente" 
        })
        // Llamamos a onDataChange para notificar que los datos cambiaron
        onDataChange()
      } else {
        toast({ 
          title: "Error", 
          description: "No se pudieron guardar los datos", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("Error al guardar materia:", error)
      toast({ title: "Error", description: "Ocurrió un error al guardar los datos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editSubject ? "Editar materia" : "Crear nueva materia"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la materia</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Ej: Matemáticas"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={e => handleChange('color', e.target.value)}
                  className="w-16 h-8 p-1"
                />
                <span className="text-sm text-gray-500">Color para identificar la materia</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editSubject ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}