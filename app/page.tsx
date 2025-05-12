"use client"

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, BarChart2, PieChart, Plus, History, CircleUserRound,LogOut } from "lucide-react";
import StudyForm from "@/components/study-form";
import HistoryModal from "@/components/history-modal";
import DailyChart from "@/components/charts/daily-chart";
import MonthlyChart from "@/components/charts/monthly-chart";
import HistoricalChart from "@/components/charts/historical-chart";
import SubjectPieChart from "@/components/charts/subject-pie-chart";
import type { StudySession, Subject } from "@/lib/types";
import { getStudySessions, getSubjects } from "@/lib/data";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster"
import LoginModal from "@/components/LoginModal";
import YearlyTotalHistory from '@/components/statistics/yearly-total-history';
import MonthlyAverageHistory from "@/components/statistics/monthly-average-history";

export default function Dashboard() {
  
  // Estado de usuario autenticado
  const [user, setUser] = useState<string | null>(null)
  const isAuthenticated = Boolean(user)

  // Datos
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [localSubjects, setLocalSubjects] = useState<Subject[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // UI controls
  const [showStudyForm, setShowStudyForm] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showHistoricalChart, setShowHistoricalChart] = useState(false)
  const [showYearlyHistory, setShowYearlyHistory] = useState(false)
  const [showMonthlyHistory, setShowMonthlyHistory] = useState(false)
  const [openUserModal, setOpenUserModal] = useState(false)

  const { toast } = useToast()

  


  useEffect(() => {
    const token = localStorage.getItem("jwtToken")
    const name  = localStorage.getItem("fullName")
    let timeoutId: number | undefined

    if (token && name) {
      try {
        const [, payloadB64] = token.split(".")
        const { exp } = JSON.parse(atob(payloadB64)) as { exp: number }
        const expiresAt = exp * 1000

        if (Date.now() > expiresAt) {
          // Ya expiró
          localStorage.removeItem("jwtToken")
          localStorage.removeItem("fullName")
          setUser(null)
          setOpenUserModal(true)
          toast({
            title: "Sesión expirada",
            description: "Vuelve a iniciar sesión para continuar.",
            variant: "destructive",
          })
        } else {
          // Token válido: inicializo y programo auto-logout
          setUser(name)
          timeoutId = window.setTimeout(() => {
            window.dispatchEvent(new Event("logout"))
          }, expiresAt - Date.now())
        }
      } catch {
        // Token corrupto
        localStorage.removeItem("jwtToken")
        localStorage.removeItem("fullName")
        setUser(null)
      }
    }

    const onLogout = () => {
      localStorage.removeItem("jwtToken")
      localStorage.removeItem("fullName")
      setUser(null)
      setOpenUserModal(true)
      toast({
        title: "Sesión expirada",
        description: "Por favor inicia sesión de nuevo.",
        variant: "destructive",
      })
    }
    window.addEventListener("logout", onLogout)

    return () => {
      window.removeEventListener("logout", onLogout)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [toast])

  // 2) fetchData: sesiones y subjects globales
  const fetchData = useCallback(async () => {
    try {
      const [sessions, materias] = await Promise.all([
        getStudySessions(),
        getSubjects(),
      ])
      setStudySessions(sessions)
      setSubjects(materias)
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    }
  }, [toast])

  // 3) fetchLocalSubjects: para el Select interno
  const fetchLocalSubjects = useCallback(async () => {
    try {
      const materias = await getSubjects()
      setLocalSubjects(materias)
    } catch {
      toast({
        title: "Error al obtener materias",
        description: "No se pudieron cargar las materias.",
        variant: "destructive",
      })
    }
  }, [toast])

  // 4) Cuando cambia auth: cargamos o limpiamos datos
  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
      fetchLocalSubjects()
    } else {
      setStudySessions([])
      setSubjects([])
      setLocalSubjects([])
    }
  }, [isAuthenticated, fetchData, fetchLocalSubjects])

  // 5) Logout manual
  const handleLogout = () => {
    if (!window.confirm("¿Estás seguro de que quieres cerrar sesión?")) return
    localStorage.removeItem("jwtToken")
    localStorage.removeItem("fullName")
    setUser(null)
    toast({
      title: "Sesión cerrada",
      description: "Has salido de tu cuenta correctamente.",
    })
  }

  // 6) Apertura de gráfica histórica
  const openHistoricalChart = (month: string, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    setShowHistoricalChart(true)
  }


  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const currentYear = new Date().getFullYear();

  // Calcular teorico vs practico
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

  // Calcular total horas mes actual
  const currentMonthSessions = studySessions.filter((session) => {
    const [day, month, year] = session.date.split("-").map(Number);
    return month === (new Date().getMonth() + 1) && year === currentYear;
  });

  const totalHoursThisMonth = currentMonthSessions.reduce((sum, session) => sum + session.hours, 0);

  // Calcular total horas año actual
  const currentYearSessions = studySessions.filter((session) => {
    const [day, month, year] = session.date.split("-").map(Number);
    return year === currentYear;
  });
  const totalHoursThisYear = currentYearSessions.reduce((sum, session) => sum + session.hours, 0);

  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div
      className="relative w-full h-[100vh] bg-black text-white"
      style={{
        backgroundImage: `url('/banner.png')`,
        backgroundSize: 'cover',     // <— cambia cover por contain
        backgroundPosition: 'center',  
        backgroundRepeat: 'no-repeat', // evita que se repita si cabe más pequeña
        marginTop: '-50px'
      }}
    >
      {/* Botones condicionados por isAuthenticated */}
      {isAuthenticated && (
        <div className="absolute inset-0 flex items-end justify-end p-4 space-x-2">
          <Button onClick={() => setShowStudyForm(true)} className="bg-gray-700 hover:bg-gray-800 text-white cursor-pointer">
            <Plus size={16} /> Registrar estudio
          </Button>
          <Button variant="outline" onClick={() => setShowHistoryModal(true)} className="bg-gray-700 hover:bg-gray-800 text-white cursor-pointer">
            <History size={16} /> Historial
          </Button>
        </div>
      )}
        <div className="absolute top-0 right-0 p-4 flex items-center gap-4 mt-10">
          {isAuthenticated ? (
            <>
              <span className="text-white text-lg">
                Hola, <span className="font-semibold">{user}</span>
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="bg-gray-700 hover:bg-gray-800 text-white"
              >
                <LogOut className="w-6 h-6" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setOpenUserModal(true)}
              variant="ghost"
              className="bg-gray-700 hover:bg-gray-800 text-white"
            >
              <CircleUserRound className="w-6 h-6" />
            </Button>
          )}
        </div>
        
        {/* Título centrado y un poco más arriba */}
        <div className="absolute inset-x-0 top-1/4 transform -translate-y-1/2">
          <h1 className="text-3xl font-bold text-center">Gestión de estudio</h1>
        </div>
      </div>

      <div className="flex-grow mx-auto p-4 w-full bg-black text-white">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center">
            <p className="text-lg mb-4">Por favor, inicia sesión para registrar y ver tus datos.</p>
            <Button onClick={() => setOpenUserModal(true)}>Iniciar Sesión</Button>
          </div>
        ) : (
          <>          
            <div className="grid gap-6">
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
                  {/* Primer gráfico: Total Estudiado (gráfico diario) */}
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

                  {/* Sección A: Contenedor para PieChart global y Total anual */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PieChart de distribución global por materias */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="flex items-center gap-2">
                          Distribución por materias total
                        </CardTitle>
                        <PieChart className="h-5 w-5" /> 
                      </CardHeader>
                      <CardContent>
                        <CardDescription>Porcentaje de tiempo dedicado a cada materia</CardDescription>
                          <SubjectPieChart studySessions={studySessions} subjects={subjects} />
                        </CardContent>
                    </Card>

                    {/* Card de total anual */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="flex items-center gap-2">
                          Total anual ({currentYear})
                        </CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalHoursThisYear} h</div>
                        <p className="text-xs text-muted-foreground mb-4">Acumulado hasta la fecha</p>
                        <div className="flex mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-gray-700 hover:bg-gray-800 text-white cursor-pointer"
                            onClick={() => setShowYearlyHistory(true)}
                          >
                            <span>Historial</span>
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    {showYearlyHistory && (
                      <YearlyTotalHistory studySessions={studySessions} onClose={() => setShowYearlyHistory(false)} />
                    )}
                  </div>

                  {/* Segundo gráfico: Total Estudiado en el Mes (gráfico mensual) */}
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
                        initialMonth={new Date().getMonth()}
                        initialYear={currentYear}
                      />
                    </CardContent>
                  </Card>

                  {/* Sección B: Contenedor para PieChart mensual y Total mensual */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PieChart de distribución mensual por materias */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="flex items-center gap-2">
                          Distribución mensual
                        </CardTitle>
                        <PieChart className="h-5 w-5" />
                      </CardHeader>
                      <CardContent>
                      <CardDescription>Porcentaje de tiempo por materia en {currentMonth}</CardDescription>
                        <SubjectPieChart 
                          studySessions={currentMonthSessions} 
                          subjects={subjects} 
                        />
                      </CardContent>
                    </Card>

                    {/* Card de total mensual */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="flex items-center gap-2 text-2xl font-medium">
                          Total mensual
                        </CardTitle>
                        <BarChart2 className="h-5 w-5" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalHoursThisMonth} h</div>
                        <p className="text-xs text-muted-foreground mb-4">
                          {currentMonth} {currentYear}
                        </p>
                        <div className="flex mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-gray-700 hover:bg-gray-800 text-white cursor-pointer"
                            onClick={() => setShowMonthlyHistory(true)}
                          >
                            <span>Historial</span>
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    {showMonthlyHistory && (
                      <MonthlyAverageHistory studySessions={studySessions} onClose={() => setShowMonthlyHistory(false)} />
                    )}
                  </div>

                    <div className="flex flex-col md:flex-row gap-4">
                  {/* Card de Teórico vs Práctico */}
                  <Card className="w-full md:w-1/2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-2xl font-medium">
                        Teórico vs Práctico
                      </CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-base font-medium">Teórico</p>
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
                            <span className="text-base ml-2">{theoreticalHours} h</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-base font-medium">Práctico</p>
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
                            <span className="text-base ml-2">{practicalHours} h</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card de Total por materias */}
                  <Card className="w-full md:w-1/2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-2xl font-medium">Total por materias</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {subjects.length === 0 ? (
                          <p className="text-base text-muted-foreground">No hay datos disponibles</p>
                        ) : (
                          subjects.map((subject, index) => {
                            const totalHours = studySessions
                              .filter((session) => session.subject?.name === subject.name)
                              .reduce((sum, session) => sum + session.hours, 0);
                            return totalHours > 0 ? (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-2" 
                                    style={{ backgroundColor: subject.color }} 
                                  />
                                  <span className="text-base font-medium">{subject.name}</span>
                                </div>
                                <span className="text-base">{totalHours} horas</span>
                              </div>
                            ) : null;
                          }).filter(Boolean)
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </>
              )}
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
                setStudySessions={setStudySessions}
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
      <Toaster />
    </div>
  );
}