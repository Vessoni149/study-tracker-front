import React, { useState } from "react";
import { loginUser, registerUser } from "@/lib/data";

// Definimos las props que recibe el componente
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (username: string) => void;
}

export default function LoginModal({ open, onOpenChange, onLoginSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetFields = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleToggleMode = () => {
    setMode(m => (m === "login" ? "register" : "login"));
    setError("");
    setSuccess("");
    resetFields();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register") {
      // 1) Campos obligatorios
      if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setError("Por favor completa todos los campos.");
        return;
      }
      // 2) Email válido
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Por favor ingresa un email válido.");
        return;
      }
      // 3) Contraseña mínima
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      // 4) Confirmación
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      try {
        await registerUser(fullName, email, password);
        setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.");
        setMode("login");
        resetFields();
      } catch (err: any) {
        setError(err.response?.data?.message || "Error al registrar el usuario.");
      }

    } else {
      // LOGIN
      if (!email.trim() || !password.trim()) {
        setError("Por favor completa todos los campos.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Por favor ingresa un email válido.");
        return;
      }
      try {
        await loginUser(email, password);
        onOpenChange(false);
        const name = localStorage.getItem("fullName") ?? "";
        onLoginSuccess(name);
        resetFields();
      } catch (err: any) {
        setError(err.response?.data?.message || "Error al iniciar sesión.");
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {mode === "login" ? "Iniciar Sesión" : "Registro"}
        </h2>

        {error && (
          <div className="mb-4 text-red-600 bg-red-100 p-3 rounded">{error}</div>
        )}
        {success && (
          <div className="mb-4 text-green-600 bg-green-100 p-3 rounded">{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="Ingresa tu nombre"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="Ingresa tu email"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          {mode === "register" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="Repite tu contraseña"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            {mode === "login" ? "Ingresar" : "Registrarse"}
          </button>
        </form>

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