import React, { useState } from "react";
import { loginUser, registerUser } from "@/lib/data";

// Definimos las props que recibe el componente
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (username: string) => void;
}

export default function LoginModal({ open, onOpenChange, onLoginSuccess }: LoginModalProps) {
  const [mode, setMode] = useState("login"); // "login" o "register"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Resetea los campos de formulario
  const resetFields = () => {
    setFullName("");
    setEmail("");
    setPassword("");
  };

  // Alterna entre modo login y registro
  const handleToggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setSuccess("");
    resetFields();
  };

  // Maneja el envío del formulario (login o registro según el modo)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validación básica en frontend
    if (mode === "register") {
      // Verificar campos obligatorios
      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setError("Por favor completa todos los campos.");
        return;
      }
      // Verificar formato de email
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Por favor ingresa un email válido.");
        return;
      }
      // Verificar longitud mínima de contraseña
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      try {
        await registerUser(fullName, email, password);
        // Mostrar mensaje de éxito y cambiar a modo login
        setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.");
        setMode("login");
        resetFields();
      } catch (err: any) {
        // Mostrar mensaje de error (puede venir de axios)
        setError(err.response?.data?.message || "Error al registrar el usuario.");
      }
    } else {
      // Modo login
      // Verificar campos obligatorios
      if (!email.trim() || !password.trim()) {
        setError("Por favor completa todos los campos.");
        return;
      }
      // Verificar formato de email
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Por favor ingresa un email válido.");
        return;
      }
      try {
        await loginUser(email, password);
        // Login exitoso: cerrar modal, limpiar campos y notificar al padre
        onOpenChange(false);
        onLoginSuccess(email.split('@')[0]); // Usamos la parte del email antes del @ como nombre de usuario
        resetFields();
      } catch (err: any) {
        setError(err.response?.data?.message || "Error al iniciar sesión.");
      }
    }
  };

  // Si el modal no está abierto, no renderizamos nada
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {mode === "login" ? "Iniciar Sesión" : "Registro"}
        </h2>

        {/* Mensajes de error o éxito */}
        {error && (
          <div className="mb-4 text-red-600 bg-red-100 p-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-green-600 bg-green-100 p-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Campo Nombre completo (solo en registro) */}
          {mode === "register" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="Ingresa tu nombre"
              />
            </div>
          )}

          {/* Campo Email */}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="Ingresa tu email"
            />
          </div>

          {/* Campo Contraseña */}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          {/* Botón de enviar */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            {mode === "login" ? "Ingresar" : "Registrarse"}
          </button>
        </form>

        {/* Enlace para cambiar de modo */}
        <div className="mt-4 text-sm text-center">
          {mode === "login" ? (
            <p>
              ¿No tienes cuenta?{" "}
              <button
                onClick={handleToggleMode}
                className="text-blue-500 hover:underline"
              >
                Regístrate
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={handleToggleMode}
                className="text-blue-500 hover:underline"
              >
                Iniciar Sesión
              </button>
            </p>
          )}
        </div>

        {/* Botón para cerrar el modal */}
        <button
          onClick={() => onOpenChange(false)}
          className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}