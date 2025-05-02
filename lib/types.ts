export interface StudySession {
  id: string
  date: string // DD-MM-YYYY
  subject: {
    name: string,
    color: string
  }
  hours: number
  studyType: "teórico" | "práctico" 

}

export interface Subject {
  id: string,
  name: string
  color: string
}

