import React, { useState, useEffect } from "react";
import "../app.css";
import ListadoPuntuaciones from "./listadoPuntuaciones";
import { useLocation } from "react-router-dom";

function PlayerPanel({ data, id, title, combateEstado, onCombateEstadoChange, tatamiId, medicalTime, setMedicalTime }) {
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
  const [medicalTimeInput, setMedicalTimeInput] = useState(2); // valor inicial en minutos


  // En PlayerPanel, agrega este estado y useEffect
const [alertaTimer, setAlertaTimer] = useState(false);
const [mostrarAlerta, setMostrarAlerta] = useState(false);

// Verificar si el timer ha finalizado
  useEffect(() => {
    const verificarTimerFinalizado = async () => {
      try {
        const res = await fetch(`/api/timer-finalizado?tatami=${tatamiId}`);
        const data = await res.json();
        
        if (data.timerFinalizado && !alertaTimer) {
          console.log("🚨 ALERTA: Timer finalizado detectado en PlayerPanel");
          setAlertaTimer(true);
          setMostrarAlerta(true);
          
          // Auto-ocultar después de 10 segundos
          setTimeout(() => {
            setMostrarAlerta(false);
          }, 10000);
        }
      } catch (error) {
        console.error("Error verificando timer finalizado:", error);
      }
    };

    verificarTimerFinalizado();
    const intervalo = setInterval(verificarTimerFinalizado, 500);
    return () => clearInterval(intervalo);
  }, [tatamiId, alertaTimer]);

  // Función para cerrar la alerta manualmente
  const cerrarAlerta = () => {
    setMostrarAlerta(false);
    setAlertaTimer(false);
    
    // Resetear el estado en el backend
    fetch("/api/reset-timer-finalizado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tatamiId })
    })
    .then(res => res.json())
    .then(data => console.log("✅ Estado reseteado:", data))
    .catch(err => console.error("Error reseteando:", err));
  };

// Función para reproducir sonido de alerta (opcional)
const playAlertaSonido = () => {
  // Puedes agregar un sonido de alerta aquí
  console.log("🔊 Reproduciendo sonido de alerta");
};

  // Obtener datos del grupo desde la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const grupoParam = searchParams.get('grupo');
    
    if (grupoParam) {
      try {
        const grupoDecodificado = JSON.parse(decodeURIComponent(grupoParam));
        setGrupoData(grupoDecodificado);
        console.log("Datos del grupo recibidos:", grupoDecodificado);
      } catch (error) {
        console.error("Error al parsear datos del grupo:", error);
      }
    }
  }, [location]);

  useEffect(() => {
    const obtenerDatosTatami = async () => {
      console.log("🔄 Iniciando fetch de datos para tatami:", tatamiId);
      try {
        const res = await fetch(`/api/valores/controles?tatami=${tatamiId}`);
        const data = await res.json();

        if (!data || Object.keys(data).length === 0) return;

        console.log("📥 Nuevos datos recibidos:", data);

        setTotal1(data.total1);
        setTotal2(data.total2);

      } catch (error) {
        console.error("❌ Error al obtener datos del tatami:", error);
      }
    };
    obtenerDatosTatami();
    const intervalo = setInterval(obtenerDatosTatami, 2000);
    return () => clearInterval(intervalo);
  }, [tatamiId]);

  const obtenerDNIsCompetidores = () => {
    if (grupoData && grupoData.competidores) {
      return grupoData.competidores
        .map(comp => comp.dni)
        .filter(dni => dni && dni.trim() !== "");
    }
    
    if (data && data.competidores) {
      return data.competidores
        .map(comp => comp.dni)
        .filter(dni => dni && dni.trim() !== "");
    }
    
    if (data && data.grupo && data.grupo.competidores) {
      return data.grupo.competidores
        .map(comp => comp.dni)
        .filter(dni => dni && dni.trim() !== "");
    }
    
    console.warn("No se encontraron DNIs de competidores");
    return [];
  };

  const handleTransmitir = () => {
    const dnis = obtenerDNIsCompetidores();
    
    if (dnis.length === 0) {
      alert("No hay DNIs de competidores disponibles");
      return;
    }

    const categoria = grupoData?.categoria || data?.categoria || "Sin categoría";
    const modalidad = grupoData?.modalidad || data?.modalidad || "combate";
    const tatamiNombre = grupoData?.tatamiNombre || `Tatami ${tatamiId}`;
    
    const params = new URLSearchParams({
      id: id,
      dnis: dnis.join(","),
      categoria: categoria,
      modalidad: modalidad,
      tatamiNombre: tatamiNombre
    });
    const urlTatami = `../tatami?id=${tatamiId}&dnis=${dnis.join(",")}&categoria=${categoria}&modalidad=${modalidad}`;
    
    window.open(urlTatami, `tatami_${tatamiId}`, 'width=1000,height=700,menubar=no,toolbar=no,location=no');
  };

  useEffect(() => {
    if (combateEstado === 'pausado') {
      console.log(`Tatami ${tatamiId} - Combate pausado`);
    } else if (combateEstado === 'iniciado') {
      console.log(`Tatami ${tatamiId} - Combate reanudado`);
    }
  }, [combateEstado, tatamiId]);

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

const handleReiniciarCombate = () => {
  console.log("🔄 Reiniciando combate después de tiempo médico");
  
  fetch("/api/enviar/panel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tatamiId: tatamiId,
      jugador: title,
      id,
      medicalTime: false,
      reiniciarCombate: true, // ← Nueva señal para reinicio
      accion: 'reiniciar_combate',
      timestamp: new Date().toISOString(),
    }),
  })
  .then(res => res.json())
  .then(data => {
    console.log("✅ Combate reiniciado:", data);
    setMostrarReiniciar(false);
    setMedicalTime(false);
  })
  .catch(err => {
    console.error("❌ Error reiniciando combate:", err);
  });
};

  useEffect(() => {
    const obtenerTimerCentral = async () => {
      try {
        const res = await fetch(`/api/tiempo-central?tatami=${tatamiId}`);
        const data = await res.json();
        if (data.minutos !== undefined) {
          setMedicalTimeInput(data.minutos);
        }
      } catch (err) {
        console.error("Error al obtener timer central:", err);
      }
    };

    obtenerTimerCentral();
    const intervalo = setInterval(obtenerTimerCentral, 2000);
    return () => clearInterval(intervalo);
  }, [tatamiId]);

 const handleEnviarGanador = async () => {
  const totalJugador1 = total1;
  const totalJugador2 = total2;
  const puntajeGanador = Math.max(totalJugador1, totalJugador2);
  
  let ganadorId = null;
  let ganadorNombre = "";

  console.log("🎯 Determinando ganador con totales:", { totalJugador1, totalJugador2 });
  console.log("👥 competidoresActuales disponibles:", grupoData?.competidoresActuales);

  // 🔧 CORREGIDO: Usar competidoresActuales en lugar de competidores
  const competidoresCombate = grupoData?.competidoresActuales || grupoData?.competidores;

  if (!competidoresCombate || competidoresCombate.length < 2) {
    alert("❌ Error: No se encontraron los competidores del combate actual");
    console.error("competidoresCombate:", competidoresCombate);
    return;
  }

  if (totalJugador1 > totalJugador2) {
    // Ganó el jugador 1 (Competidor A)
    ganadorId = competidoresCombate[0].id;
    ganadorNombre = competidoresCombate[0].nombre;
    console.log(`🏆 Ganador: Jugador 1 - ${ganadorNombre}`);
  } else if (totalJugador2 > totalJugador1) {
    // Ganó el jugador 2 (Competidor B)
    ganadorId = competidoresCombate[1].id;
    ganadorNombre = competidoresCombate[1].nombre;
    console.log(`🏆 Ganador: Jugador 2 - ${ganadorNombre}`);
  } else {
    alert("❌ No se puede determinar un ganador. Los puntajes están empatados.");
    return;
  }

  if (!ganadorId) {
    alert("❌ Error: No se pudo obtener la información del ganador");
    return;
  }

  if (!grupoData || !grupoData.grupoLlave) {
    alert("❌ Error: No se encontró la información de la llave");
    return;
  }

  // Obtener información de ronda y combate desde estadoActual
  const rondaActual = grupoData.estadoActual?.rondaActual || grupoData.rondaActual || 1;
  const combateActual = grupoData.estadoActual?.combateActual || grupoData.combateActual || 1;

  console.log("📊 Estado del combate:", {
    rondaActual,
    combateActual,
    grupoLlave: grupoData.grupoLlave,
    ganadorId,
    ganadorNombre,
    puntajeGanador
  });

  const datosGanador = {
    grupoLlave: grupoData.grupoLlave,
    rondaActual: rondaActual,
    combateActual: combateActual,
    ganadorId: ganadorId,
    ganadorNombre: ganadorNombre,
    puntaje: puntajeGanador
  };

  console.log("📤 Enviando ganador a /api/llaves/guardar-ganador:", datosGanador);

  try {
    // 🔧 SOLO llamar a guardar-ganador (que ya hace el trabajo completo)
    const response = await fetch("/api/llaves/guardar-ganador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosGanador),
    });

    const resultado = await response.json();

    if (resultado.success) {
      alert(`✅ Ganador registrado: ${ganadorNombre} con ${puntajeGanador} puntos`);
      console.log("✅ Ganador guardado exitosamente:", resultado);
      console.log("📋 Estado actualizado:", resultado.ganador);
    } else {
      alert(`❌ Error al guardar ganador: ${resultado.error}`);
      console.error("Error del servidor:", resultado);
    }
  } catch (error) {
    console.error("❌ Error enviando ganador:", error);
    alert("❌ Error de conexión al guardar el ganador");
  }
};


  const cerrarPopupListado = () => {
    setMostrarListado(false);
  };

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
{/* ALERTA DE TIMER FINALIZADO */}
      {mostrarAlerta && (
        <div className="alerta-timer-overlay">
          <div className="alerta-timer-modal">
            <div className="alerta-timer-content">
              <div className="alerta-timer-icon">⏰</div>
              <h2>¡TIEMPO FINALIZADO!</h2>
              <p>El tiempo del combate ha terminado</p>
              <div className="alerta-timer-acciones">
                <button onClick={cerrarAlerta} className="btn-cerrar-alerta">
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    <style>
      {`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `}
    </style>
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
        Abrir Sala
      </button>

    <div style={{ marginTop: "1rem" }}>
          <label>
            ⏱️ Timer principal:
            <select
              value={medicalTimeInput}
              onChange={(e) => {
                const minutos = parseFloat(e.target.value);
                setMedicalTimeInput(minutos);

                console.log(`🕒 Configurando timer a ${minutos} minutos`);

                // ✅ Enviar al backend Y forzar actualización
                fetch("/api/ajustar-timer", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tatamiId,
                    minutos,
                    forzarActualizacion: true, // ← NUEVO
                    timestamp: new Date().toISOString(),
                  }),
                })
                .then((res) => res.json())
                .then((data) => {
                  console.log("✅ Timer configurado:", data);
                  console.log(`✅ Nuevo valor: ${data.minutos} minutos = ${data.timer} segundos`);
                })
                .catch((err) => console.error("❌ Error configurando timer:", err));
              }}
              style={{ 
                marginLeft: "0.5rem", 
                padding: "0.3rem",
                borderRadius: "4px",
                border: "1px solid #ccc"
              }}
            >
              <option value={1}>1:30 minutos</option>
            </select>
          </label>
        </div>

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
  onClick={handleEnviarGanador}
  style={{
    backgroundColor: "#28a745",
    color: "white",
    fontWeight: "bold",
    padding: "0.7rem 1.2rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    marginTop: "1rem",
    width: "100%"
  }}
>
  ✅ Aceptar Ganador
</button>


      {/* Popup del Listado de Puntuaciones */}
      {mostrarListado && (
        <div className="popup-overlay" onClick={cerrarPopupListado}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>📊 Listado de Puntuaciones - {title}</h3>
              <button className="popup-close" onClick={cerrarPopupListado}>
                ×
              </button>
            </div>
            <div className="popup-body">
              <ListadoPuntuaciones tatamiId={tatamiId} jugadorId={id} />
            </div>
            <div className="popup-footer">
              <button 
                className="popup-close-btn"
                onClick={cerrarPopupListado}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default PlayerPanel;