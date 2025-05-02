import axios from "axios";
import type { StudySession, Subject } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Cambiado a false si no necesitas enviar cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");

    // Rutas que NO deben llevar el token
    const excludedPaths = [
      "/api/auth/login",
      "/api/auth/register"
    ];

    // Verificamos si la URL está en las rutas excluidas
    const isExcluded = excludedPaths.some((path) =>
      config.url?.includes(path)
    );

    if (token && !isExcluded) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token expirado o no autorizado
      console.warn("Token expirado o inválido. Redirigiendo al login...");

      // Limpiar token y otros datos si es necesario
      localStorage.removeItem("authToken");

      // Redirigir al login (asumiendo que usás Next.js)
      if (typeof window !== "undefined") {
        window.location.href = "/login"; // O donde tengas el login
      }
    }

    return Promise.reject(error);
  }
);



// Obtener sesiones de estudio
export const getStudySessions = async (): Promise<StudySession[]> => {
  try {
    const { data } = await api.get("/session/getAll");
    console.log("API response data:", data.data);
    
    // Transformar los datos al formato esperado por los componentes
    const transformedData = data.data.map((session: any) => ({
      id: String(session.id), // Aseguramos que id sea string
      // Convertir formato de fecha de YYYY-MM-DD a DD-MM-YYYY
      date: session.date.split('-').reverse().join('-'),
      // Mantener el objeto subject con propiedad name
      subject: {
        name: session.subject.name
      },
      hours: session.hours,
      studyType: session.studyType,
    }));
    
    console.log("Transformed data:", transformedData);
    return transformedData || [];
    
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    return [];
  }
};

// Crear o editar una sesión de estudio
export const addStudySession = async (session: StudySession, isEdit = false): Promise<StudySession | null> => {
  try {
    const url = isEdit ? `/session/edit/${session.id}` : "/session/create";
    const method = isEdit ? "PUT" : "POST";

    const sessionDto = {
      date: session.date,
      subject: session.subject,
      hours: session.hours,
      studyType: session.studyType,
    };

    const { data } = await api.request({
      url,
      method,
      headers: { "Content-Type": "application/json" },
      data: sessionDto,
    });

    return data.data || null;
  } catch (error) {
    console.error("Error saving study session:", error);
    return null;
  }
};

// Eliminar sesión de estudio
export const deleteStudySession = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/session/delete/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting study session:", error);
    return false;
  }
};

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const { data } = await api.get("/subject/getAll");
    return data.data || [];
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
};

// Crear una materia
export const addSubject = async (subject: Omit<Subject, 'id'>, isUpdate: boolean = false): Promise<Subject | null> => {
  try {
    // Si es una actualización, usamos el endpoint de update
    if (isUpdate && 'id' in subject) {
      const { data } = await api.put(`/subject/edit/${subject.id}`, {
        name: subject.name,
        color: subject.color
      });
      return data.data || null;
    } else {
      // Si es una creación, usamos el endpoint de create
      const { data } = await api.post("/subject/create", {
        name: subject.name,
        color: subject.color
      });
      return data.data || null;
    }
  } catch (error) {
    console.error(`Error ${isUpdate ? 'updating' : 'creating'} subject:`, error);
    return null;
  }
};

// Eliminar una materia
export const deleteSubject = async (subjectId: string): Promise<boolean> => {
  try {
    const { data } = await api.delete(`/subject/delete/${subjectId}`);
    return data.success || false;
  } catch (error) {
    console.error("Error deleting subject:", error);
    return false;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    
    const response = await api.post("api/auth/login", JSON.stringify({ email, password }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Respuesta recibida:', response);
    localStorage.setItem("jwtToken", response.data.data.token);
  } catch (error) {
    console.error("Error durante el login:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalles del error:", error.response?.data);
      console.error("Status:", error.response?.status);
      console.error("Headers:", error.response?.headers);
    }
    throw error;
  }
};


export const registerUser = async (fullName: string, email: string, password: string) => {
  try {

    const response = await api.post("api/auth/register", JSON.stringify({ fullName, email, password }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Respuesta recibida:', response);
    return response.data;
  } catch (error) {
    console.error("Error durante el registro:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalles del error:", error.response?.data);
      console.error("Status:", error.response?.status);
      console.error("Headers:", error.response?.headers);
    }
    throw error;
  }
};