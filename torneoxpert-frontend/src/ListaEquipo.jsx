import React, { useEffect, useState } from "react";
import "./Equipos.css";
import { useNavigate } from "react-router-dom";

export default function ListaEquipos() {
  const [equipos, setEquipos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [equipoAbierto, setEquipoAbierto] = useState(null);
  const navigate = useNavigate();

  const volverAlMenu = () => navigate("/");

  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        setCargando(true);

        const response = await fetch("/api/equipos");

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Formato de datos inválido");
        }

        setEquipos(data);
        setMensaje("");
      } catch (error) {
        console.error("Error cargando equipos:", error);
        setMensaje("⚠️ Error cargando equipos. Verifica que el servidor esté funcionando.");
        setEquipos([]);
      } finally {
        setCargando(false);
      }
    };

    cargarEquipos();
  }, []);

  const toggleEquipo = (id) => {
    setEquipoAbierto(equipoAbierto === id ? null : id);
  };

  if (cargando) {
    return (
      <div className="form-container">
        <p>Cargando equipos...</p>
      </div>
    );
  }

  return (

    <div className="app-contenedor">

      {/* Luchador izquierda */}
      <div className="decoracion-luchador izquierda">
        <img src="/luchador-izquierdo.png" alt="luchador izquierda" />
      </div>

      {/* Luchador derecha */}
      <div className="decoracion-luchador derecha">
        <img src="/luchador-derecho.png" alt="luchador derecha" />
      </div>

      <div className="form-container">

        <h1 className="form-title">Equipos Inscritos</h1>

        {mensaje && <p className="mensaje-error">{mensaje}</p>}

        {!cargando && equipos.length === 0 && !mensaje ? (
          <p>No hay equipos registrados aún.</p>
        ) : (
          <div className="equipos-grid">
            {equipos.map((eq) => (
              <div
                key={eq.id}
                className={`equipo-card ${equipoAbierto === eq.id ? 'abierto' : ''}`}
                onClick={() => toggleEquipo(eq.id)}
              >
                <div className="equipo-indicador"></div>

                <h3>{eq.nombreEquipo}</h3>

                <div className="equipo-info-basica">
                  <p><strong>Escuela:</strong> {eq.escuela}</p>
                  <p><strong>Instructor:</strong> {eq.instructor}</p>
                </div>

                <div className="equipo-contenido">
                  <div className="equipo-seccion">
                    <h4>Titulares</h4>
                    <ul className="titulares-lista">
                      {Array.isArray(eq.titulares) && eq.titulares.map((t) => (
                        <li key={t.dni}>
                          {t.nombre} ({t.dni}) - {t.graduacion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="equipo-seccion">
                    <h4>Suplente</h4>
                    <div className="suplente-info">
                      {eq.suplente?.nombre ? (
                        <p>{eq.suplente.nombre} ({eq.suplente.dni})</p>
                      ) : (
                        <p>No asignado</p>
                      )}
                    </div>
                  </div>

                  <p className="equipo-fecha">
                    Inscripto el {new Date(eq.fecha).toLocaleString()}
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}

        <div className="botones-container">
          <button className="btn-volver" onClick={volverAlMenu}>
            Volver al menú
          </button>
        </div>

      </div>
    </div>
  );
}