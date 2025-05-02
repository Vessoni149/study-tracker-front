"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { StudySession } from "@/lib/types"

interface YearlyTotalHistoryProps {
  studySessions: StudySession[]
  onClose: () => void
}

export default function YearlyTotalHistory({ studySessions, onClose }: YearlyTotalHistoryProps) {
  // Group sessions by year
  const yearlyData = useMemo(() => {
    const grouped: Record<
      number,
      {
        year: number
        totalHours: number
        theoreticalHours: number
        practicalHours: number
      }
    > = {}

    // Process all study sessions
    studySessions.forEach((session) => {
      const [day, month, year] = session.date.split("-").map(Number)

      if (!grouped[year]) {
        grouped[year] = {
          year,
          totalHours: 0,
          theoreticalHours: 0,
          practicalHours: 0,
        }
      }

      // Add hours to total
      grouped[year].totalHours += session.hours

      // Add hours to theoretical or practical total
      if (session.studyType === "teórico") {
        grouped[year].theoreticalHours += session.hours
      } else {
        grouped[year].practicalHours += session.hours
      }
    })

    // Convert to array
    return Object.values(grouped).sort((a, b) => b.year - a.year) // Sort by year (newest first)
  }, [studySessions])

  // List of available years
  const availableYears = useMemo(() => yearlyData.map(data => data.year), [yearlyData])
  
  // Default to current year view or most recent
  const currentYear = new Date().getFullYear()
  const defaultYearMode = availableYears.includes(currentYear) ? "single" : "all"
  
  // States
  const [viewMode, setViewMode] = useState<"single" | "all" | "compare">(defaultYearMode)
  const [selectedYear, setSelectedYear] = useState<number>(
    availableYears.includes(currentYear) ? currentYear : (availableYears[0] || currentYear)
  )
  const [compareYear, setCompareYear] = useState<number | null>(
    availableYears.length > 1 ? availableYears[1] : null
  )
  
  // Change selected year
  const navigateYear = (direction: 'prev' | 'next') => {
    const currentIndex = availableYears.indexOf(selectedYear)
    if (direction === 'prev' && currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1])
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1])
    }
  }
  
  // Change year for comparison
  const navigateCompareYear = (direction: 'prev' | 'next') => {
    if (!compareYear) return
    
    const currentIndex = availableYears.indexOf(compareYear)
    if (direction === 'prev' && currentIndex < availableYears.length - 1) {
      setCompareYear(availableYears[currentIndex + 1])
    } else if (direction === 'next' && currentIndex > 0) {
      setCompareYear(availableYears[currentIndex - 1])
    }
  }

  // Get data for the selected year
  const selectedYearData = useMemo(() => {
    return yearlyData.find(data => data.year === selectedYear) || null
  }, [yearlyData, selectedYear])

  // Get data for comparison year
  const compareYearData = useMemo(() => {
    if (!compareYear) return null
    return yearlyData.find(data => data.year === compareYear) || null
  }, [yearlyData, compareYear])

  // Prepare chart data for all years (oldest to newest)
  const allYearsChartData = useMemo(() => {
    return [...yearlyData].reverse()
  }, [yearlyData])

  // Prepare chart data for single year (breakdown by type)
  const singleYearChartData = useMemo(() => {
    if (!selectedYearData) return []
    
    return [
      {
        name: "Teórico",
        hours: selectedYearData.theoreticalHours,
        fill: "#2563eb" // Blue
      },
      {
        name: "Práctico",
        hours: selectedYearData.practicalHours,
        fill: "#16a34a" // Green
      }
    ]
  }, [selectedYearData])

  // Prepare chart data for comparison between two years
  const compareYearsChartData = useMemo(() => {
    if (!selectedYearData || !compareYearData) return []
    
    // Create data for comparison chart
    return [
      {
        name: "Teórico",
        [selectedYearData.year]: selectedYearData.theoreticalHours,
        [`${selectedYearData.year} Color`]: "#2563eb", // Blue
        [compareYearData.year]: compareYearData.theoreticalHours,
        [`${compareYearData.year} Color`]: "#93c5fd" // Light blue
      },
      {
        name: "Práctico",
        [selectedYearData.year]: selectedYearData.practicalHours,
        [`${selectedYearData.year} Color`]: "#16a34a", // Green
        [compareYearData.year]: compareYearData.practicalHours,
        [`${compareYearData.year} Color`]: "#86efac" // Light green
      },
      {
        name: "Total",
        [selectedYearData.year]: selectedYearData.totalHours,
        [`${selectedYearData.year} Color`]: "#9333ea", // Purple
        [compareYearData.year]: compareYearData.totalHours,
        [`${compareYearData.year} Color`]: "#d8b4fe" // Light purple
      }
    ]
  }, [selectedYearData, compareYearData])
  
  // Check if we can compare (need at least 2 years of data)
  const canCompare = availableYears.length >= 2

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial de totales anuales</DialogTitle>
        </DialogHeader>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="single">Año individual</TabsTrigger>
            <TabsTrigger value="all">Todos los años</TabsTrigger>
            <TabsTrigger value="compare" disabled={!canCompare}>
              Comparar años
            </TabsTrigger>
          </TabsList>
          
          {/* Single Year View */}
          <TabsContent value="single" className="space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateYear('prev')}
                disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h3 className="text-xl font-semibold">{selectedYear}</h3>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateYear('next')}
                disabled={availableYears.indexOf(selectedYear) === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-[300px]">
              {!selectedYearData ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No hay datos para {selectedYear}</p>
                  </CardContent>
                </Card>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={singleYearChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    barSize={80}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      label={{
                        value: "Horas",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} horas`]} />
                    <Bar dataKey="hours" name="Horas" fill="#24bf3e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Total</h4>
                  <p className="text-2xl font-bold">{selectedYearData?.totalHours.toFixed(1) || 0}</p>
                  <p className="text-xs text-muted-foreground">horas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Teórico</h4>
                  <p className="text-2xl font-bold">{selectedYearData?.theoreticalHours.toFixed(1) || 0}</p>
                  <p className="text-xs text-muted-foreground">horas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Práctico</h4>
                  <p className="text-2xl font-bold">{selectedYearData?.practicalHours.toFixed(1) || 0}</p>
                  <p className="text-xs text-muted-foreground">horas</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* All Years View */}
          <TabsContent value="all">
            <div className="h-[300px]">
              {allYearsChartData.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No hay datos para mostrar</p>
                  </CardContent>
                </Card>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={allYearsChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    barSize={60}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis
                      label={{
                        value: "Horas totales",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => [`${value} horas`, "Total anual"]} />
                    <Bar dataKey="totalHours" fill="#24bf3e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="overflow-y-auto max-h-[200px] mt-6">
              <div className="grid grid-cols-1 gap-4">
                {yearlyData.map((data, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{data.year}</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Total</h4>
                          <p className="text-lg font-bold">{data.totalHours.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">horas</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Teórico</h4>
                          <p className="text-lg font-bold">{data.theoreticalHours.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">horas</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Práctico</h4>
                          <p className="text-lg font-bold">{data.practicalHours.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">horas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Compare Years View */}
          <TabsContent value="compare" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigateYear('prev')}
                  disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="w-20 text-center font-semibold">{selectedYear}</div>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigateYear('next')}
                  disabled={availableYears.indexOf(selectedYear) === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm mx-2">vs</div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigateCompareYear('prev')}
                  disabled={!compareYear || availableYears.indexOf(compareYear) === availableYears.length - 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="w-20 text-center font-semibold">{compareYear || '-'}</div>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigateCompareYear('next')}
                  disabled={!compareYear || availableYears.indexOf(compareYear) === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="h-[300px]">
              {!selectedYearData || !compareYearData ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">Selecciona dos años para comparar</p>
                  </CardContent>
                </Card>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={compareYearsChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    barSize={30}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
                      formatter={(value, name) => [`${Number(value).toFixed(1)} horas`, name]} 
                      labelFormatter={(label) => label}
                    />
                    <Legend />
                    <Bar 
                      dataKey={selectedYear.toString()} 
                      name={selectedYear.toString()}
                      fill="#24bf3e" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      dataKey={compareYear?.toString()} 
                      name={compareYear?.toString()}  
                      fill="#93c5fd" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-2 text-center">
                  <h4 className="text-xs font-medium text-muted-foreground">Total</h4>
                  <div className="flex justify-around text-sm">
                    <div>
                      <p className="font-bold">{selectedYearData?.totalHours.toFixed(1) || 0}</p>
                      <p className="text-xs text-muted-foreground">{selectedYear}</p>
                    </div>
                    <div>
                      <p className="font-bold">{compareYearData?.totalHours.toFixed(1) || 0}</p>
                      <p className="text-xs text-muted-foreground">{compareYear}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <h4 className="text-xs font-medium text-muted-foreground">Teórico</h4>
                  <div className="flex justify-around text-sm">
                    <div>
                      <p className="font-bold">{selectedYearData?.theoreticalHours.toFixed(1) || 0}</p>
                      <p className="text-xs text-muted-foreground">{selectedYear}</p>
                    </div>
                    <div>
                      <p className="font-bold">{compareYearData?.theoreticalHours.toFixed(1) || 0}</p>
                      <p className="text-xs text-muted-foreground">{compareYear}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <h4 className="text-xs font-medium text-muted-foreground">Práctico</h4>
                  <div className="flex justify-around text-sm">
                    <div>
                      <p className="font-bold">{selectedYearData?.practicalHours.toFixed(1) || 0}</p>
                      <p className="text-xs text-muted-foreground">{selectedYear}</p>
                    </div>
                    <div>
                      <p className="font-bold">{compareYearData?.practicalHours.toFixed(1) || 0}</p>
                      <p className="text-xs text-muted-foreground">{compareYear}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}