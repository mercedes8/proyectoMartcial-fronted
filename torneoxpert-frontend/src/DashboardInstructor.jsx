import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboardInstructor.css";

export default function DashboardInstructor() {
  const [instructor, setInstructor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const sesion = localStorage.getItem("instructorSesion");
    if (!sesion) {
      navigate("/login-instructor");
    } else {
      setInstructor(JSON.parse(sesion));
    }
  }, [navigate]);

  if (!instructor) return null;

  const cerrarSesion = () => {
    localStorage.removeItem("instructorSesion");
    navigate("/login-instructor");
  };

  const volverMenu = () => {
    localStorage.removeItem("instructorSesion");
    navigate("/");
  };

  return (

    <div className="dashboard-page">

      {/* luchador izquierda */}
      <div className="decoracion-luchador izquierda">
        <img src="/luchador-izquierdo.png" alt="luchador izquierda"/>
      </div>

      {/* luchador derecha */}
      <div className="decoracion-luchador derecha">
        <img src="/luchador-derecho.png" alt="luchador derecha"/>
      </div>

      <div className="dashboard-container">

        <h2 className="saludo">
          👋 Hola, {instructor.nombre}
        </h2>

        <div className="dashboard-buttons">

          <button
            onClick={() => navigate("/validar-competidores")}
            className="btn-secondary"
          >
             Validar inscripciones
          </button>

        </div>

        <div className="footer-buttons">

          <button className="btn-volver" onClick={volverMenu}>
            🔙 Volver al menú
          </button>

          <button className="btn-cerrar" onClick={cerrarSesion}>
            🔒 Cerrar sesión
          </button>

        </div>

      </div>
    </div>
  );
}