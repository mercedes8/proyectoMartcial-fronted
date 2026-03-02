import React, { useState, useEffect } from "react";
import "../app.css";
import ListadoPuntuaciones from "./listadoPuntuaciones";
import { useLocation } from "react-router-dom";

function PlayerPanel({ data, id, title, medicalTime, setMedicalTime }) {
  const location = useLocation();
  const [warnings, setWarnings] = useState(0);
  const [discounts, setDiscounts] = useState(0);
  const [salto360, setSalto360] = useState(null);
  const [disqualified, setDisqualified] = useState(false);
  const [mostrarReiniciar, setMostrarReiniciar] = useState(false);
  const [total1, setTotal1] = useState(0);
  const [total2, setTotal2] = useState(0); 
  const [scores, setScores] = useState([]);
  const [mostrarListado, setMostrarListado] = useState(false);
  const [grupoData, setGrupoData] = useState(null);

  // Obtener datos del grupo desde la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
     const tatamiId = searchParams.get("tatami");

      if (!tatamiId) {
    console.error("❌ No se recibió tatami en la URL");
    return;
  }

   const cargarEstadoTatami = async () => {
    try {
      const res = await fetch(`/api/tatamis/${tatamiId}/estado`);
      const data = await res.json();

      console.log("📥 Estado del tatami:", data);

       setGrupoData({
        tatamiId,
        tatamiNombre: data.tatamiNombre,
        categoria: data.categoria,
        modalidad: data.modalidad,
        rondaActual: data.rondaActual,
        combateActual: data.combateActual,
        totalCompetidores: data.competidores?.length || 0,
        competidores: data.competidores || []
      });

    } catch (error) {
      console.error("❌ Error obteniendo estado del tatami:", error);
    }
  };

  cargarEstadoTatami();
}, [location]);
    
    

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const res = await fetch("/api/valores");
        const data = await res.json();
        setTotal1(data.total1);
        setTotal2(data.total2);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      }
    };

    obtenerDatos();
    const intervalo = setInterval(obtenerDatos, 2000);
    return () => clearInterval(intervalo);
  }, []);

  // Función para obtener DNIs de los competidores
  const obtenerDNIsCompetidores = () => {
    // Opción 1: Usar datos del grupo desde la URL
    if (grupoData && grupoData.competidores) {
      return grupoData.competidores
        .map(comp => comp.dni)
        .filter(dni => dni && dni.trim() !== "");
    }
    
    // Opción 2: Usar datos pasados por props (backup)
    if (data && data.competidores) {
      return data.competidores
        .map(comp => comp.dni)
        .filter(dni => dni && dni.trim() !== "");
    }
    
    // Opción 3: Usar datos de grupo de las props
    if (data && data.grupo && data.grupo.competidores) {
      return data.grupo.competidores
        .map(comp => comp.dni)
        .filter(dni => dni && dni.trim() !== "");
    }
    
    console.warn("No se encontraron DNIs de competidores");
    return [];
  };

  // Función para manejar la transmisión
  const handleTransmitir = () => {
    const dnis = obtenerDNIsCompetidores();
    
    if (dnis.length === 0) {
      alert("No hay DNIs de competidores disponibles");
      return;
    }

    // Obtener información adicional del grupo
    const categoria = grupoData?.categoria || data?.categoria || "Sin categoría";
    const modalidad = grupoData?.modalidad || data?.modalidad || "combate";
    
    const url = `../tatami?id=${id}&dnis=${dnis.join(",")}&categoria=${categoria}&modalidad=${modalidad}`;
    console.log("URL de transmisión:", url);
    
    window.open(url, "_blank");
  };

  const handleDelete = (index) => {
    if (disqualified || medicalTime) return;
    const updated = [...scores];
    updated.splice(index, 1);
    setScores(updated);
  };

  const handleWarning = () => {
    if (disqualified || medicalTime) return;
    setWarnings((prev) => prev + 1);
  };

  const handleDiscount = () => {
    if (disqualified || medicalTime) return;
    setDiscounts((prev) => prev + 1);
  };

  const handleDisqualification = () => {
    if (medicalTime) return;
    setDisqualified(true);

    fetch("/api/descalificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jugador: title,
        id,
        descalificado: true,
        timestamp: new Date().toISOString(),
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log("Descalificación enviada:", data);
      })
      .catch(err => {
        console.error("Error enviando descalificación:", err);
      });
  };

  const handleSalto = (value) => {
    if (disqualified || medicalTime) return;
    setSalto360(value);
  };

  const undoWarning = () => {
    if (disqualified || medicalTime) return;
    setWarnings((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const undoDiscount = () => {
    if (disqualified || medicalTime) return;
    setDiscounts((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const undoSalto = () => {
    if (disqualified || medicalTime) return;
    setSalto360(null);
  };

  const handleTimeChange = (index, newTime) => {
    if (medicalTime) return;
    const updated = [...scores];
    updated[index].time = newTime;
    setScores(updated);
  };

  const getTotal = () => {
    if (disqualified) return 0;
    let total = 0;
    if (id === "0") {
      total = total1;
    } else if (id === "1") {
      total = total2;
    }
    total -= Math.floor(warnings / 3);
    total -= discounts;
    if (salto360 === true) total += 2;
    if (salto360 === false) total -= 2;
    return total < 0 ? 0 : total;
  };

  const handleAccept = () => {
    const total = getTotal();

    fetch("/api/aceptar-puntaje", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jugador: title,
        id,
        total,
        advertencias: warnings,
        descuentos: discounts,
        salto360,
        descalificado: disqualified,
        tiempoMedico: medicalTime,
        timestamp: new Date().toISOString(),
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log("Puntaje enviado:", data);
        alert(`Total de ${title}: ${total} puntos`);
      })
      .catch(err => {
        console.error("Error enviando puntaje:", err);
        alert("Error al enviar el puntaje");
      });
  };

  const toggleMedicalTime = () => {
    fetch("/api/tiempo-medico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jugador: title,
        id,
        medicalTime: true,
        timestamp: new Date().toISOString(),
      }),
    })
    .then(res => res.json())
    .then(data => {
      console.log("Señal tiempo médico enviada:", data);
    })
    .catch(err => {
      console.error("Error enviando señal tiempo médico:", err);
    });
    setMostrarReiniciar(true);
    setMedicalTime(prev => !prev);
  };

  const handleReiniciarCombate = () => {
    fetch("/api/tiempo-medico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jugador: title,
        id,
        medicalTime: false,
        timestamp: new Date().toISOString(),
      }),
    })
    .then(res => res.json())
    .then(data => {
      console.log("Señal tiempo médico enviada:", data);
    })
    .catch(err => {
      console.error("Error enviando señal tiempo médico:", err);
    });
    setMostrarReiniciar(false);
    setMedicalTime(false);
  };

  // Mostrar información del grupo actual
  const renderInfoGrupo = () => {
    if (!grupoData) return null;

    return (
      <div style={{ 
        background: '#f0f8ff', 
        padding: '0.5rem', 
        marginBottom: '1rem',
        borderRadius: '4px',
        border: '1px solid #d1ecf1'
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
          📋 {grupoData.tatamiNombre} - {grupoData.categoria}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>
          Modalidad: {grupoData.modalidad} • Competidores: {grupoData.totalCompetidores}
          {grupoData.rondaActual && ` • Ronda: ${grupoData.rondaActual}`}
        </div>
      </div>
    );
  };

  return (
    <div className={`player-panel ${medicalTime ? "paused" : ""}`}>
      <h2>{title}</h2>
      
      {/* Información del grupo */}
      {renderInfoGrupo()}
      
      {/* Botón Transmitir */}
      <button
        className="boton boton-transmitir"
        onClick={handleTransmitir}
        style={{
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        📡 Transmitir
      </button>

      <button
        onClick={() => setMostrarListado((prev) => !prev)}
        style={{ marginBottom: "1rem" }}
      >
        {mostrarListado ? "Ocultar Listado" : "Mostrar Listado"}
      </button>

      {mostrarListado && <ListadoPuntuaciones id={id} />}
    
      {medicalTime && (
        <div style={{ color: "blue", fontWeight: "bold", marginBottom: "8px" }}>
          ⏸️ Tiempo Médico en curso
        </div>
      )}

      <div className="info">
        <button
          className="player-adv"
          onClick={handleWarning}
          disabled={disqualified || medicalTime}
          style={{ backgroundColor: "white", marginTop: "0.5rem" }}
          aria-label="Agregar advertencia"
        >
          ⚠️ Advertencia ({warnings}) → (-1 cada 3)
        </button>

        <button
          onClick={handleDiscount}
          disabled={disqualified || medicalTime}
          style={{ backgroundColor: "gold", marginTop: "0.5rem" }}
          aria-label="Agregar descuento"
        >
          ➖ Descuento ({discounts}) → (-1 c/u)
        </button>

        <button
          onClick={handleDisqualification}
          disabled={disqualified || medicalTime}
          style={{ backgroundColor: "red", color: "white", marginTop: "0.5rem" }}
          aria-label="Descalificar jugador"
        >
          ❌ Descalificar
        </button>
      </div>

      {!mostrarReiniciar ? (
        <button
          onClick={toggleMedicalTime}
          style={{
            backgroundColor: medicalTime ? "blue" : "lightblue",
            color: "white",
            marginTop: "0.5rem",
          }}
        >
          {medicalTime ? "Reanudar Tiempo" : "⏸️ Tiempo Médico"}
        </button>
      ) : (
        <button
          onClick={handleReiniciarCombate}
          style={{
            backgroundColor: "orange",
            color: "white",
            marginTop: "0.5rem",
          }}
        >
          Reiniciar Combate
        </button>
      )}

      <div>¿Se realizó Salto 360?</div>
      <div className="salto-sect">
        <button
          className="player"
          onClick={() => handleSalto(true)}
          disabled={disqualified || medicalTime}
          style={{
            color: "white",
            backgroundColor: salto360 === true ? "green" : "#000000ff",
            marginRight: "8px",
          }}
          aria-pressed={salto360 === true}
        >
          SI (+2)
        </button>
        <button
          className="player"
          onClick={() => handleSalto(false)}
          disabled={disqualified || medicalTime}
          style={{
            color: "white",
            backgroundColor: salto360 === false ? "red" : "#000000ff",
          }}
          aria-pressed={salto360 === false}
        >
          NO (-2)
        </button>
      </div>

      <div className="Contenedor-pnts-y-vid">
        <div>Total: {getTotal()} puntos</div>
        <button onClick={() => {
          if (warnings > 0) {
            undoWarning();
          } else if (discounts > 0) {
            undoDiscount();
          } else {
            undoSalto();
          }}}
          className="Repeticion"
        >
          Eliminar Ultima Acción
        </button>
      </div>

      <button
        className="player btn-accept"
        onClick={handleAccept}
        disabled={(disqualified && getTotal() === 0) || medicalTime}
      >
        Aceptar
      </button>
    </div>
  );
}

export default PlayerPanel;