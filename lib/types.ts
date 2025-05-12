export interface StudySession {
  id: string
  date: string // DD-MM-YYYY
  subject: {
    name: string | null
    color: string | null
  } | null
  hours: number
  studyType: "teórico" | "práctico" | null
}

export interface Subject {
  id: string,
  name: string
  color: string
}
export interface SessionDto {
  date: string;
  subjectId: string;
  hours: number;
  studyType: string;
}
