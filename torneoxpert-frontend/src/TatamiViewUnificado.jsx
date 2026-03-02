import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./TatamiView.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const TatamiViewUnificado = ({ medicalTime, setMedicalTime }) => {

  const [ganadores, setGanadores] = useState({});
  const [ganadoresCompletos, setGanadoresCompletos] = useState([]);
  const [notificacionGanador, setNotificacionGanador] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(0);
  const [ganadorActual, setGanadorActual] = useState(null);
  const [descansoTime, setDescansoTime] = useState(false);
  const [tiempoDescanso, setTiempoDescanso] = useState(30);
  const [timerDescanso, setTimerDescanso] = useState(0);
  const intervaloDescansoRef = useRef(null);
  const [timerInicializadoManualmente, setTimerInicializadoManualmente] = useState(false);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // 🔧 CORREGIDO: Leer competidores desde URL
  const competidoresParam = searchParams.get("competidores");
  let competidoresIniciales = [];

  if (competidoresParam) {
    try {
      competidoresIniciales = JSON.parse(decodeURIComponent(competidoresParam));
      console.log("✅ Competidores recibidos en sala:", competidoresIniciales.map(c => c.nombre));
    } catch (err) {
      console.error("❌ Error parseando competidores:", err);
    }
  }

  // Fallback a DNIs si no hay competidores
  const dnis = competidoresIniciales.length === 0 
    ? (searchParams.get("dnis")?.split(",") || [])
    : competidoresIniciales.map(c => c.dni);

  const mode = searchParams.get("mode") || "combate";
  const tatamiId = searchParams.get("id") || "0";
  const [dnisState, setDnisState] = useState(dnis);

  const fetchGanadoresCompletos = async () => {
    try {
      const response = await fetch(`/ganadores-completos?tatami=${tatamiId+1}`);
      const data = await response.json();
      setGanadoresCompletos(data);
    } catch (error) {
      console.error("Error fetching ganadores completos:", error);
    }
  };

  const detectarNuevosGanadores = (nuevosGanadores) => {
    let ganadorMasReciente = null;
    let maxTimestamp = 0;

    for (const grupo in nuevosGanadores) {
      for (const etapa in nuevosGanadores[grupo]) {
        const ganador = nuevosGanadores[grupo][etapa];
        if (ganador.timestamp > maxTimestamp && ganador.timestamp > ultimaActualizacion) {
          maxTimestamp = ganador.timestamp;
          ganadorMasReciente = {
            nombre: ganador.nombre,
            grupo,
            etapa,
            modalidad: ganador.modalidad,
            timestamp: ganador.timestamp
          };
        }
      }
    }

    if (ganadorMasReciente) {
      setNotificacionGanador(ganadorMasReciente);
      setUltimaActualizacion(maxTimestamp);
      setTimeout(() => setNotificacionGanador(null), 5000);
      fetchGanadoresCompletos();
    }
  };

  const [totalAzul, setTotalAzul] = useState(0);
  const [totalRojo, setTotalRojo] = useState(0);
  const [ultimoPrefix, setUltimoPrefix] = useState("");
  const [claseBoton, setClaseBoton] = useState("");
  const [colorJugador, setColorJugador] = useState("");

  const [varActivadora, setVarActivadora] = useState(false);

  const [resultado1, setResultado1] = useState(0);
  const [resultado2, setResultado2] = useState(0);
  const [reinicio, setReinicio] = useState(false);

  const [competidorId, setCompetidorId] = useState(null);
  const [competidorNombre, setCompetidorNombre] = useState("");
  const [competidorPuntos, setCompetidorPuntos] = useState(0);

  const [puntajes, setPuntajes] = useState({
    A: { rojo: 0, azul: 0 },
    B: { rojo: 0, azul: 0 },
    C: { rojo: 0, azul: 0 },
    D: { rojo: 0, azul: 0 },
  });

  const ultimaSenalRef = useRef(null);

  const manejarSenal = (data) => {
    if (!data) return;

    const actualStr = JSON.stringify(data);
    const ultimaStr = ultimaSenalRef.current;

    if (ultimaStr === actualStr) {
      return;
    }

    ultimaSenalRef.current = actualStr;

    const prefix = data.tipo || "";
    const color = data.competidorColor?.toLowerCase() || "";
    const puntos = data.competidorPuntos || 0;

    if (!prefix || !color || puntos === 0) return;

    setPuntajes(prev => ({
      ...prev,
      [prefix]: {
        ...prev[prefix],
        [color]: (prev[prefix]?.[color] || 0) + puntos,
      },
    }));
  };

  useEffect(() => {
    const obtenerDatosTatami = async () => {
      try {
        const res = await fetch(`/api/valores/controles?tatami=${tatamiId}`);
        const data = await res.json();

        if (!data || Object.keys(data).length === 0) return;

        console.log("📥 Datos del tatami recibidos:", data);
        manejarSenal(data);
      } catch (error) {
        console.error("❌ Error al obtener datos del tatami:", error);
      }
    };

    obtenerDatosTatami();
    const intervalo = setInterval(obtenerDatosTatami, 2000);
    return () => clearInterval(intervalo);
  }, [tatamiId]);

  useEffect(() => {
    let r1 = 0;
    let r2 = 0;

    if ((puntajes.A?.rojo > 0) || (puntajes.A?.azul > 0)) {
      if (puntajes.A?.rojo > puntajes.A?.azul) r1++;
      else if (puntajes.A?.azul > puntajes.A?.rojo) r2++;
    }

    if ((puntajes.B?.rojo > 0) || (puntajes.B?.azul > 0)) {
      if (puntajes.B?.rojo > puntajes.B?.azul) r1++;
      else if (puntajes.B?.azul > puntajes.B?.rojo) r2++;
    }

    if ((puntajes.C?.rojo > 0) || (puntajes.C?.azul > 0)) {
      if (puntajes.C?.rojo > puntajes.C?.azul) r1++;
      else if (puntajes.C?.azul > puntajes.C?.rojo) r2++;
    }

    if ((puntajes.D?.rojo > 0) || (puntajes.D?.azul > 0)) {
      if (puntajes.D?.rojo > puntajes.D?.azul) r1++;
      else if (puntajes.D?.azul > puntajes.D?.rojo) r2++;
    }

    setResultado1(r1);
    setResultado2(r2);
  }, [puntajes]);

  // 🔧 CORREGIDO: Inicializar con competidores de URL
  const [competidores, setCompetidores] = useState(competidoresIniciales);
  const [competidoresActuales, setCompetidoresActuales] = useState(competidoresIniciales);
  const [fotoperfil, setFotoperfil] = useState(null);
  const [modoActual, setModoActual] = useState(mode);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const res = await fetch(`/api/valores/panel?tatami=${tatamiId}`);
        const data = await res.json();
        console.log("🔍 DEBUG - Datos recibidos:", data);
        
        if (data.medicalTime !== undefined) {
          setMedicalTime(data.medicalTime);
        }
        
        setVarActivadora(data.varActivadora);
        
        if (data.competidoresActuales && Array.isArray(data.competidoresActuales) && data.competidoresActuales.length > 0) {
          console.log("👥 Competidores recibidos del panel:", data.competidoresActuales.map(c => c?.nombre));
          
          const nombresActuales = competidoresActuales.map(c => c?.nombre).join(',');
          const nombresNuevos = data.competidoresActuales.map(c => c?.nombre).join(',');
          
          if (nombresActuales !== nombresNuevos) {
            console.log("🔄 Actualizando competidores en TatamiView");
            setCompetidoresActuales(data.competidoresActuales);
          }
        }
        
        if (data.descansoTime !== undefined) {
          const descansoCambio = data.descansoTime !== descansoTime;
          const tiempoCambio = data.tiempoDescanso !== tiempoDescanso;
          
          if (descansoCambio || tiempoCambio) {
            console.log("🎯 CAMBIO DETECTADO - descansoTime:", data.descansoTime, "tiempoDescanso:", data.tiempoDescanso);
            
            setDescansoTime(data.descansoTime);
            
            if (data.descansoTime && data.tiempoDescanso) {
              console.log("🚀 INICIANDO NUEVO TIMER:", data.tiempoDescanso, "segundos");
              setTiempoDescanso(data.tiempoDescanso);
              setTimerDescanso(data.tiempoDescanso);
              iniciarTimerDescanso(data.tiempoDescanso);
            } else if (!data.descansoTime && descansoCambio) {
              console.log("🛑 DETENIENDO TIMER - descanso desactivado");
              detenerTimerDescanso();
              setTimerDescanso(0);
            }
          }
        }
        
      } catch (error) {
        console.error("Error al obtener datos:", error);
      }
    };
    
    obtenerDatos();
    const intervalo = setInterval(obtenerDatos, 2000);
    return () => clearInterval(intervalo);
  }, [tatamiId, setMedicalTime, descansoTime, tiempoDescanso]);

  useEffect(() => {
    console.log("📊 Competidores actuales en TatamiView:", competidoresActuales.map(c => c?.nombre));
  }, [competidoresActuales]);

  const iniciarTimerDescanso = (segundosIniciales) => {
    if (intervaloDescansoRef.current) {
      console.log("⏱️ Timer ya activo, no se reinicia");
      return;
    }
    
    console.log("🚀 INICIANDO TIMER DE DESCANSO:", segundosIniciales, "segundos");
    setTimerDescanso(segundosIniciales);
    
    intervaloDescansoRef.current = setInterval(() => {
      setTimerDescanso(prev => {
        if (prev <= 1) {
          console.log("⏰ TIMER TERMINADO");
          detenerTimerDescanso();
          setDescansoTime(false);
          return 0;
        }
        console.log("⏱️ Timer countdown:", prev - 1);
        return prev - 1;
      });
    }, 1000);
  };

  const detenerTimerDescanso = () => {
    if (intervaloDescansoRef.current) {
      console.log("🛑 DETENIENDO TIMER DE DESCANSO");
      clearInterval(intervaloDescansoRef.current);
      intervaloDescansoRef.current = null;
    }
  };

  const formatoDescanso = (segundos) => {
    const min = String(Math.floor(segundos / 60)).padStart(2, "0");
    const seg = String(segundos % 60).padStart(2, "0");
    return `${min}:${seg}`;
  };

  useEffect(() => {
    return () => {
      detenerTimerDescanso();
    };
  }, []);

  const inicialesCombate = [60, 15, 15];
  const inicialesFormas = [120, 0, 0];
  const [tiempos, setTiempos] = useState(modoActual === "combate" ? inicialesCombate : inicialesFormas);
  const intervalos = useRef([null, null, null]);

  const [ampliado, setAmpliado] = useState(false);

  const formato = (segundos) => {
    const min = String(Math.floor(segundos / 60)).padStart(2, "0");
    const seg = String(segundos % 60).padStart(2, "0");
    return segundos > 0 ? `${min}:${seg}` : "¡Tiempo!";
  };

  useEffect(() => {
    setModoActual(mode);
    if (mode === "combate") {
      setTiempos([...inicialesCombate]);
    } else {
      setTiempos([...inicialesFormas]);
    }
    intervalos.current.forEach(intervalo => {
      if (intervalo) clearInterval(intervalo);
    });
    intervalos.current = [null, null, null];
    setAmpliado(false);
  }, [mode]);

  const resetearPuntos = async () => {
    try {
      const res = await fetch("/api/reset", {
        method: "POST"
      });
      const data = await res.json();
      console.log(data);
    } catch (error) {
      console.error("Error al resetear puntos:", error);
    }
  };

  useEffect(() => {
    console.log("🕒 Estado actual del timer:", {
      tiempoPrincipal: tiempos[0],
      estaEjecutandose: intervalos.current[0] !== null,
      medicalTime: medicalTime,
      varActivadora: varActivadora
    });
  }, [tiempos[0], medicalTime, varActivadora]);

  // PRIMERO DECLARAR LAS FUNCIONES DEL TIMER
  const iniciarPrimerTemporizador = () => {
    if (intervalos.current[0] || tiempos[0] <= 0) return;

    console.log("⏰ INICIANDO TEMPORIZADOR con:", tiempos[0], "segundos restantes");
    
    intervalos.current[0] = setInterval(() => {
      setTiempos(prevTiempos => {
        const nuevos = [...prevTiempos];
        nuevos[0] = nuevos[0] - 1;
        
        if (nuevos[0] <= 0) {
          clearInterval(intervalos.current[0]);
          intervalos.current[0] = null;
          
          console.log("🎯 TIMER HA LLEGADO A 0 - Disparando notificación");
          
          // Notificar inmediatamente cuando llega a 0
          fetch("/api/timer-finalizado", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tatamiId: tatamiId,
              timestamp: new Date().toISOString()
            }),
          }).catch(err => console.error("Error notificando timer finalizado:", err));
          
          if (modoActual === "combate" && nuevos[0] === 0) {
            iniciarOtrosTemporizadores();
          }
          
          if (nuevos.every(t => t <= 0)) setAmpliado(false);
        }
        return nuevos;
      });
    }, 1000);
    setAmpliado(true);
  };

  const pausarPrimerTemporizador = () => {
    if (intervalos.current[0]) {
      clearInterval(intervalos.current[0]);
      intervalos.current[0] = null;
    }
    setAmpliado(false);
  };

  const ReiniciarPrimerTemporizador = () => {
    pausarPrimerTemporizador();
    pausarOtrosTemporizadores();
    setTiempos(modoActual === "combate" ? [...inicialesCombate] : [...inicialesFormas]);
    setAmpliado(false);
    setTimerInicializadoManualmente(false);
  };

  const iniciarOtrosTemporizadores = () => {
    if (modoActual !== "combate") return;
    
    [1, 2].forEach(i => {
      if (intervalos.current[i] || tiempos[i] <= 0) return;

      intervalos.current[i] = setInterval(() => {
        setTiempos(prevTiempos => {
          const nuevos = [...prevTiempos];
          nuevos[i] = nuevos[i] - 1;
          if (nuevos[i] <= 0) {
            clearInterval(intervalos.current[i]);
            intervalos.current[i] = null;
            if (nuevos.every(t => t <= 0)) setAmpliado(false);
          }
          return nuevos;
        });
      }, 1000);
    });
  };

  const pausarOtrosTemporizadores = () => {
    if (modoActual !== "combate") return;
    
    [1, 2].forEach(i => {
      if (intervalos.current[i]) {
        clearInterval(intervalos.current[i]);
        intervalos.current[i] = null;
      }
    });
  };

  // LUEGO EL USEEFFECT QUE USA ESAS FUNCIONES
  useEffect(() => {
    console.log("🔄 Control - varActivadora:", varActivadora, "medicalTime:", medicalTime);
    console.log("🔍 Estado intervalo:", intervalos.current[0] ? "ACTIVO" : "INACTIVO");
    console.log("⏱️ Tiempo actual:", tiempos[0], "segundos");
    
    // PAUSAR: Cuando está en pausa O hay tiempo médico
    if (varActivadora === false || medicalTime === true) {
      console.log("⏸️ PAUSANDO - Tiempo preservado:", tiempos[0], "segundos");
      
      if (intervalos.current[0]) {
        clearInterval(intervalos.current[0]);
        intervalos.current[0] = null;
        console.log("✅ Intervalo limpiado correctamente");
      }
    }
    // REANUDAR: Solo cuando está activo Y NO hay tiempo médico
    else if (varActivadora === true && medicalTime === false) {
      console.log("🎬 REANUDANDO - Tiempo actual:", tiempos[0], "segundos");
      
      setTimerInicializadoManualmente(true);
      
      // Verificar que NO esté corriendo y que haya tiempo
      if (!intervalos.current[0] && tiempos[0] > 0) {
        console.log("✅ Iniciando temporizador...");
        iniciarPrimerTemporizador();
      } else {
        console.log("⚠️ No se inicia:", {
          intervaloActivo: !!intervalos.current[0],
          tiempoRestante: tiempos[0]
        });
      }
    }
  }, [varActivadora, medicalTime]);

// LUEGO EL USEEFFECT PARA NOTIFICAR TIMER FINALIZADO - VERSIÓN MEJORADA
  useEffect(() => {
    // ✅ Notificar INMEDIATAMENTE cuando llega a 0
    if (tiempos[0] === 0 && intervalos.current[0] === null) {
      console.log("⏰ TIMER PRINCIPAL TERMINADO - Enviando notificación INMEDIATA");
      
      fetch("/api/timer-finalizado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tatamiId: tatamiId,
          timestamp: new Date().toISOString()
        }),
      })
      .then(res => res.json())
      .then(data => console.log("✅ Notificación enviada:", data))
      .catch(error => console.error("❌ Error enviando notificación:", error));
    }
  }, [tiempos[0], tatamiId]);

  const determinarPuntos = () => {
    let nombreCom1 = "";
    let nombreCom2 = ""; 
    let puntosCom1 = 0;
    let puntosCom2 = 0;

    if (competidorId === "0") {
      puntosCom1 = competidorPuntos;
      nombreCom1 = competidorNombre;
    } 
    if (competidorId === "1") {
      puntosCom2 = competidorPuntos;
      nombreCom2 = competidorNombre;
    }

    console.log("Competidor 1:", nombreCom1, "Puntos:", puntosCom1);
    console.log("Competidor 2:", nombreCom2, "Puntos:", puntosCom2);
  };

  useEffect(() => {
    determinarPuntos();
  }, [competidorId, competidorNombre, competidorPuntos]);

  const [proximoCombate, setProximoCombate] = useState(false);

  useEffect(() => {
    const detectarProximoCombate = async () => {
      try {
        const res = await fetch(`/api/valores/panel?tatami=${tatamiId}`);
        const data = await res.json();
        
        console.log("🔄 Detectando próximo combate:", data);

        if (data.proximoCombate === true) {
          console.log("🎯 Señal de próximo combate detectada");

          if (data.competidores && data.competidores.length > 0) {
            console.log("👥 Nuevos competidores recibidos:", data.competidores.map(c => c?.nombre));
            setCompetidoresActuales(data.competidores);
          } else if (dnisState.length >= 4) {
            console.log("🔄 Rotando competidores manualmente");
            const nuevo = [...dnisState];
            [nuevo[1], nuevo[3]] = [nuevo[3], nuevo[1]];
            [nuevo[2], nuevo[0]] = [nuevo[0], nuevo[2]];
            setDnisState(nuevo);
          }

          ReiniciarPrimerTemporizador();
          resetearPuntos();

          fetch("/api/enviar/panel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tatamiId: tatamiId,
              proximoCombate: false,
              accion: 'reset_proximo_combate'
            })
          });
        }
      } catch (error) {
        console.error("❌ Error detectando próximo combate:", error);
      }
    };

    const intervalo = setInterval(detectarProximoCombate, 2000);
    return () => clearInterval(intervalo);
  }, [tatamiId, dnisState]);

  // 🔧 CORREGIDO: Solo consultar backend si NO hay competidores de URL
  useEffect(() => {
    // Si ya tenemos competidores de URL, no consultar backend
    if (competidoresIniciales.length > 0) {
      console.log("✅ Usando competidores de URL, no se consulta backend");
      return;
    }

    if (dnisState.length > 0) {
      console.log("⚠️ Cargando competidores desde backend con DNIs");
      fetch(`/api/competidores/by-dni?dnis=${dnisState.join(",")}`)
        .then(res => res.json())
        .then(data => {
          const ordenados = dnisState.map(dni => {
            const clean = dni.replace(/^0+/, "");
            return data.find(c =>
              String(c.dni) === dni || 
              String(c.dni) === clean
            );
          });

          setCompetidores(ordenados);
          setCompetidoresActuales(prev => prev.length === 0 ? ordenados : prev);
        })
        .catch(() => {
          setCompetidores([]);
          setCompetidoresActuales([]);
        });
    }
  }, [dnisState]);

useEffect(() => {
    const obtenerConfiguracionTimer = async () => {
      try {
        const res = await fetch(`/api/tiempo-central?tatami=${tatamiId}`);
        if (!res.ok) return;
        
        const data = await res.json();
        
        console.log("🔍 Datos del timer recibidos:", data);
        
        if (data.segundos !== undefined) {
          setTiempos(prev => {
            const timerEnEjecucion = intervalos.current[0] !== null;
            
            // ✅ Solo ignorar si el timer está corriendo
            if (timerEnEjecucion) {
              console.log("⏸️ Timer corriendo, ignorando actualización");
              return prev;
            }
            
            const nuevosSegundos = data.segundos;
            
            // ✅ Verificar si hay un cambio real
            if (nuevosSegundos === prev[0]) {
              return prev;
            }
            
            // ✅ Validación más permisiva
            if (nuevosSegundos >= 30 && nuevosSegundos <= 180) { 
              console.log(`✅ Timer actualizado: ${data.minutos} min (${nuevosSegundos}s)`);
              const nuevos = [...prev];
              nuevos[0] = nuevosSegundos;
              
              // ✅ Resetear la bandera de inicialización manual
              setTimerInicializadoManualmente(false);
              
              return nuevos;
            }
            
            return prev;
          });
        }
      } catch (error) {
        console.error("❌ Error obteniendo configuración timer:", error);
      }
    };

    // ✅ Consultar inmediatamente y luego cada 2 segundos
    obtenerConfiguracionTimer();
    const intervalo = setInterval(obtenerConfiguracionTimer, 2000);
    return () => clearInterval(intervalo);
  }, [tatamiId]);

  const mostrarPuntos = (juezNumero, color) => {
    if (ultimoPrefix === String.fromCharCode(64 + juezNumero) && colorJugador === color) {
      return puntos;
    }
    return 0;
  };

  const calcularDiferencia = (juez) => {
    const rojo = puntajes[juez]?.rojo || 0;
    const azul = puntajes[juez]?.azul || 0;
    const diferencia = Math.abs(rojo - azul);
    if (diferencia === 0) return null;
    return {
      ganador: rojo > azul ? "rojo" : "azul",
      diferencia
    };
  };

  return (
    <>
      
      <div className="container-foto" />
      <div className="background">
        <div className="modo-indicador">
          Modo: {modoActual === "combate" ? "Combate" : "Formas"}
        </div>

        {notificacionGanador && (
          <div className="notificacion-ganador">
            <div className="ganador-content">
              <h3>🎉 ¡GANADOR SELECCIONADO! 🎉</h3>
              <p><strong>{notificacionGanador.nombre}</strong></p>
              <p>Grupo: {notificacionGanador.grupo} - {notificacionGanador.modalidad}</p>
              <button onClick={() => setNotificacionGanador(null)} className="cerrar-notificacion">
                ×
              </button>
            </div>
          </div>
        )}
        
        {medicalTime && (
          <div className="medical-time-overlay">
            <div className="medical-time-modal">
              <div className="medical-time-content">
                <h2>🏥 TIEMPO MÉDICO</h2>
                <p>Combate en pausa</p>
                <p style={{marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8}}>
                  El combate se reanudará al presionar "Reanudar" en el panel de control
                </p>
              </div>
            </div>
          </div>
        )}        
        
        {descansoTime && (
          <div className="descanso-overlay">
            <div className="descanso-modal">
              <div className="descanso-content">
                <h2>⏱️ TIEMPO DE DESCANSO</h2>
                <div className="descanso-timer">
                  {formatoDescanso(timerDescanso)}
                </div>
                <p>El combate se reanudará automáticamente</p>
                <div className="descanso-progress">
                  <div 
                    className="descanso-progress-bar"
                    style={{
                      width: `${((tiempoDescanso - timerDescanso) / tiempoDescanso) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="dnis-tatami">
          <strong>Competidores en combate:</strong>{" "}
          {competidoresActuales.length > 0
            ? `${competidoresActuales[0]?.nombre || ""} vs ${competidoresActuales[1]?.nombre || ""}`
            : dnisState.join(" - ")}
        </div>
        
        <div className="Cartas-presentacion">
          {ganadorActual === null && (
            <>
              <div className="cardpresentation-container">
                <div className="top-panel"></div>
                <div className="character-image">
                  <img src={`uploads/${competidoresActuales[0]?.fotoPerfil}`} alt="Competidor A" />
                </div>
                <div className="cardpresentation-content">{competidoresActuales[0]?.nombre || "Competidor 1"}</div>
              </div>

              <div className="cardpresentation-container2">
                <div className="top-panel-2"></div>
                <div className="character-image-2">
                  <img src={`uploads/${competidoresActuales[1]?.fotoPerfil}`} alt="Competidor B" />
                </div>
                <div className="cardpresentation-content2">{competidoresActuales[1]?.nombre || "Competidor 2"}</div>
              </div>
            </>
          )}

          {ganadorActual && (
            <div className="cardpresentation-ganador">
              <div className="top-panel-ganador"></div>
              <div className="character-image-ganador">
                <img
                  src={
                    ganadorActual === "rojo"
                      ? `/uploads/${competidoresActuales[0]?.fotoPerfil}`
                      : `/uploads/${competidoresActuales[1]?.fotoPerfil}`
                  }
                  alt="Ganador"
                />
              </div>
              <div className="cardpresentation-content-ganador">
                🏆 {ganadorActual === "rojo"
                  ? competidoresActuales[0]?.nombre
                  : competidoresActuales[1]?.nombre} 🏆
              </div>
            </div>
          )}
        </div>

        <div className="contadores">
          <div className="card3">
            <div className="timer-principal">{formato(tiempos[0])}</div>
          </div>

          <div className="card-box">
            <div className={`card ${ampliado ? "ampliado" : ""}`}>
              <h2 id="totalA" className="resultado">{resultado2}</h2>
            </div>
            <div className={`card2 ${ampliado ? "ampliado" : ""}`}>
              <h2 id="totalB" className="resultado">{resultado1}</h2>
            </div>
          </div>

          <div className="contador-j1">
            <div className="juez-1"><h2>Juez 1</h2></div>
            {calcularDiferencia("A") && (
              <div className={`diferencia-box ${calcularDiferencia("A").ganador}`}>
                {calcularDiferencia("A").diferencia}
              </div>
            )}
          </div>

          <div className="contador-j2">
            <div className="juez-1"><h2>Juez 2</h2></div>
            {calcularDiferencia("B") && (
              <div className={`diferencia-box ${calcularDiferencia("B").ganador}`}>
                {calcularDiferencia("B").diferencia}
              </div>
            )}
          </div>

          <div className="contador-j3">
            <div className="juez-1"><h2>Juez 3</h2></div>
            {calcularDiferencia("C") && (
              <div className={`diferencia-box ${calcularDiferencia("C").ganador}`}>
                {calcularDiferencia("C").diferencia}
              </div>
            )}
          </div>

          <div className="contador-j4">
            <div className="juez-1"><h2>Juez 4</h2></div>
            {calcularDiferencia("D") && (
              <div className={`diferencia-box ${calcularDiferencia("D").ganador}`}>
                {calcularDiferencia("D").diferencia}
              </div>
            )}
          </div>
        </div>
   

      </div>
    </> 
  );
};

export default TatamiViewUnificado;