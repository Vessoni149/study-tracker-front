"use client"

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, BarChart2, PieChart, Plus, History, CircleUserRound } from "lucide-react";
import StudyForm from "@/components/study-form";
import HistoryModal from "@/components/history-modal";
import DailyChart from "@/components/charts/daily-chart";
import MonthlyChart from "@/components/charts/monthly-chart";
import HistoricalChart from "@/components/charts/historical-chart";
import SubjectPieChart from "@/components/charts/subject-pie-chart";
import StatsPanel from "@/components/statistics/stats-panel";
import type { StudySession, Subject } from "@/lib/types";
import { getStudySessions, getSubjects } from "@/lib/data";
import { useToast } from "@/components/ui/use-toast";
import LoginModal from "@/components/LoginModal";
import banner from "../public/banner.png";

export default function Dashboard() {
  // Estado de usuario autenticado
  const [user, setUser] = useState<string | null>(null);
  const isAuthenticated = Boolean(user);

  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showHistoricalChart, setShowHistoricalChart] = useState(false);
  const { toast } = useToast();
  const [openUserModal, setOpenUserModal] = useState(false);
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(subjects)


  // Función para cargar datos solo si está autenticado
  const fetchData = async () => {
    try {
      const [sessions, materias] = await Promise.all([getStudySessions(), getSubjects()]);
      setStudySessions(sessions);
      setSubjects(materias);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos" , variant: "destructive"});
    }
  };

  // Efecto: solo corre fetchData cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      // limpia datos al cerrar sesión
      setStudySessions([]);
      setSubjects([]);
    }
  }, [isAuthenticated]);

  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const currentYear = new Date().getFullYear();

  const openHistoricalChart = (month: string, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setShowHistoricalChart(true);
  };

  useEffect(() => {
    fetchSubjects()
  }, [])
  
  const fetchSubjects = async () => {
    try {
      const updatedSubjects = await getSubjects()
      setLocalSubjects(updatedSubjects)
    } catch (error) {
      toast({
        title: "Error al obtener materias",
        description: "No se pudieron cargar las materias.",
        variant: "destructive",
      })
    }
  }

  
  return (
    <div className="min-h-screen bg-background">
      {/* Banner para imagen de fondo (30% de altura) */}
      <div
        className="relative w-full h-[85vh] bg-gray-900 text-white"
        style={{
          backgroundImage: `url('/banner.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          marginTop:'-50px'
        }}
>
        {/* Aquí el usuario colocará su propia imagen como background */}
        <div className="absolute top-0 right-0 p-4">
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <p className="text-lg">Hola, <span className="font-semibold">{user}</span></p>
            )}
            <Button 
              onClick={() => setOpenUserModal(true)} 
              variant="ghost" 
              className="bg-gray-700 hover:bg-gray-800 text-white"
            >
              <CircleUserRound className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        {/* Título centrado y un poco más arriba */}
        <div className="absolute inset-x-0 top-1/4 transform -translate-y-1/2">
          <h1 className="text-3xl font-bold text-center">Gestión de estudio</h1>
        </div>
      </div>

      <div className=" mx-auto p-4 w-full bg-black text-white">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center ">
            <p className="text-lg mb-4">Por favor, inicia sesión para ver tus datos.</p>
            <Button onClick={() => setOpenUserModal(true)}>Iniciar Sesión</Button>
          </div>
        ) : (
          <>          
            <div className="flex justify-end gap-4 mb-6 mt-6">
              <Button onClick={() => setShowStudyForm(true)} className="bg-gray-700 hover:bg-gray-800 text-white">
                <Plus size={16} /> Registrar estudio
              </Button>
              <Button variant="outline" onClick={() => setShowHistoryModal(true)} className="bg-gray-700 hover:bg-gray-800 text-white">
                <History size={16} /> Historial
              </Button>
            </div>

            <div className="grid gap-6">
              <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="dashboard" >Dashboard</TabsTrigger>
                  <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
                </TabsList>
                <TabsContent value="dashboard" className="space-y-6">
                  {studySessions.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-center text-muted-foreground">
                          No hay datos de estudio registrados. ¡Comienza a registrar tus horas de estudio!
                        </p>
                        <Button onClick={() => setShowStudyForm(true)} className="mt-4 gap-2">
                          <Plus size={16} /> Registrar estudio
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart2 className="h-5 w-5" /> Total estudiado
                          </CardTitle>
                          <CardDescription>Horas de estudio por día</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <DailyChart studySessions={studySessions} />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" /> Total estudiado en el mes de {currentMonth}
                          </CardTitle>
                          <CardDescription>Horas de estudio diarias del mes actual</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <MonthlyChart
                            studySessions={studySessions}
                            month={new Date().getMonth()}
                            year={currentYear}
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" /> Distribución por materias
                          </CardTitle>
                          <CardDescription>Porcentaje de tiempo dedicado a cada materia</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <SubjectPieChart studySessions={studySessions} subjects={subjects} />
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
                <TabsContent value="statistics">
                  <StatsPanel studySessions={studySessions} subjects={subjects} />
                </TabsContent>
              </Tabs>
            </div>

            {showStudyForm && (
              <StudyForm
                subjects={subjects}
                onClose={() => setShowStudyForm(false)}
                onDataChange={fetchData}
              />
            )}

            {showHistoryModal && (
              <HistoryModal
                studySessions={studySessions}
                subjects={subjects}
                onClose={() => setShowHistoryModal(false)}
                onDataChange={fetchData}
                onViewMonth={openHistoricalChart}
              />
            )}

            {showHistoricalChart && selectedMonth && selectedYear && (
              <HistoricalChart
                studySessions={studySessions}
                month={selectedMonth}
                year={selectedYear}
                onClose={() => setShowHistoricalChart(false)}
              />
            )}
          </>
        )}
      </div>

      <LoginModal
        open={openUserModal}
        onOpenChange={setOpenUserModal}
        onLoginSuccess={(username) => {
          setUser(username);
          toast({ title: "Bienvenido", description: `Hola ${username}` });
        }}
      />
    </div>
  );
}