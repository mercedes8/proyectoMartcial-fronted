import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PlayerPanel from "./components/PlayerPanel";
import "./PlayerPanelPage.css";

const globalSearchParams = new URLSearchParams(window.location.search);
const grupoParam = globalSearchParams.get("grupo");

function PlayerPanelPage({ medicalTime, setMedicalTime }) {
  const [resetKey, setResetKey] = useState(0);
  const [horaReset, setHoraReset] = useState("");
  const [combateEstado, setCombateEstado] = useState("pausado");
  const [combateIniciado, setCombateIniciado] = useState(false);
  const [enlaces, setEnlaces] = useState([]);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [descansoTime, setDescansoTime] = useState(false);
  const [tiempoDescanso, setTiempoDescanso] = useState(30);
  const [mostrarPuntajes, setMostrarPuntajes] = useState(false);
  const [registrosEnVivo, setRegistrosEnVivo] = useState([]);
  const [rondas, setRondas] = useState([]);
  const [rondaIndex, setRondaIndex] = useState(0);
  const [combateIndex, setCombateIndex] = useState(0);
  const [ventanaCombateActual, setVentanaCombateActual] = useState(null);
  const [competidoresActuales, setCompetidoresActuales] = useState([]);
  const [grupoData, setGrupoData] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // 🔧 FUNCIÓN MEJORADA CON MÁS DIAGNÓSTICO
  const obtenerCompetidorReal = (competidorRef, todosCompetidores, estadoActual) => {
    console.log("🔍 obtenerCompetidorReal llamado con:", {
      competidorRef,
      tieneTodosCompetidores: !!todosCompetidores,
      cantidadCompetidores: todosCompetidores?.length,
      tieneEstadoActual: !!estadoActual,
      ganadores: estadoActual?.ganadores
    });

    if (!competidorRef) {
      console.log("❌ competidorRef es null/undefined");
      return null;
    }
    
    if (competidorRef.nombre && competidorRef.id) {

      return competidorRef;

    }

 

    if (typeof competidorRef === 'string' || typeof competidorRef === 'number') {

      return todosCompetidores?.find(c => c.id === competidorRef || c.dni === competidorRef) || null;

    }

 

    if (competidorRef.id) {

      return todosCompetidores?.find(c => c.id === competidorRef.id) || competidorRef;

    }

 

    return null;

  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const grupoParam = searchParams.get("grupo");

    if (grupoParam) {
      try {
        const data = JSON.parse(decodeURIComponent(grupoParam));
        setGrupoData(data);
        
        console.log("📦 Datos del grupo recibidos:", data);
        console.log("🔍 Competidores en data:", data.competidores);
        console.log("🔍 Competidores actuales en data:", data.competidoresActuales);
        console.log("🔍 Rondas generadas:", data.rondasGeneradas);
        console.log("🏆 Ganadores guardados:", data.estadoActual?.ganadores);
        
        // 🔧 CORREGIDO: Resolver competidores actuales con soporte para ganadores
        let competidoresCombateActual = [];
        
        if (data.competidoresActuales && data.competidoresActuales.length > 0) {
          // Si ya vienen los competidores actuales del combate (desde siguiente combate)
          competidoresCombateActual = data.competidoresActuales;
          console.log("✅ Usando competidoresActuales:", competidoresCombateActual.map(c => c.nombre));
        } else
        // Establecer competidores iniciales (primer combate)

        if (data.rondasGeneradas && data.rondasGeneradas.length > 0) {

          const rondaInicial = data.rondasGeneradas[0];

          if (rondaInicial.combates && rondaInicial.combates.length > 0) {

            const combateInicial = rondaInicial.combates[0];

            const competidoresCombate = [

              obtenerCompetidorReal(combateInicial.c1, data.competidores),

              obtenerCompetidorReal(combateInicial.c2, data.competidores)

            ].filter(c => c);

 

            setCompetidoresActuales(competidoresCombate);

            console.log("👥 Competidores iniciales:", competidoresCombate.map(c => c.nombre));

          }

        }
        // Configurar estado inicial

        if (data.estadoActual) {

          setRondaIndex((data.estadoActual.rondaActual || 1) - 1);

          setCombateIndex((data.estadoActual.combateActual || 1) - 1);

        }

 

      } catch (error) {

        console.error("Error parseando grupo:", error);

      }

    }

  }, [location]);

    // 🔄 POLLING: Refrescar datos de llave cada 10 segundos para sincronizar con cambios del bracket

  useEffect(() => {

    if (!grupoData?.grupoLlave) return;

 

    const interval = setInterval(async () => {

      try {

        await refrescarGrupoData(grupoData.grupoLlave);

      } catch (error) {

        console.error('Error en polling de datos:', error);

      }

    }, 10000); // Cada 10 segundos

 

    return () => clearInterval(interval);

  }, [grupoData?.grupoLlave]);

  let tatamiId = "0";
  let competidoresIniciales = [];

  const grupoParam2 = searchParams.get("grupo");

  if (grupoParam2) {
    try {
      const data = JSON.parse(decodeURIComponent(grupoParam2));
      tatamiId = data.tatamiId?.toString() || "0";
      competidoresIniciales = data.competidores || [];
    } catch (error) {
      console.error("Error parseando grupo:", error);
    }
  }

  const [competidores, setCompetidores] = useState(competidoresIniciales);

  useEffect(() => {
    if (competidores.length > 0) {
      fetch("https://torneoxpert.digital/api/generar-rondas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competidores }),
      })
        .then(res => res.json())
        .then(data => {
          console.log("Rondas generadas:", data.rondas);
          setRondas(data.rondas);
        })
        .catch(err => console.error("Error generando rondas:", err));
    }
  }, [competidores]);

  if (grupoParam2) {
    try {
      const grupoData = JSON.parse(decodeURIComponent(grupoParam2));
      tatamiId = grupoData.tatamiId?.toString() || "0";
    } catch (error) {
      console.error("Error al parsear el parámetro 'grupo':", error);
    }
  
  }

  useEffect(() => {
  if (competidoresActuales.length > 0) {
    console.log("📤 Sincronizando competidores con backend:", competidoresActuales.map(c => c?.nombre));
    
    fetch("/api/enviar/panel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tatamiId: tatamiId,
        accion: "sincronizar_competidores",
        competidoresActuales: competidoresActuales.map(comp => ({
          id: comp?.id,
          dni: comp?.dni,
          nombre: comp?.nombre,
          fotoPerfil: comp?.fotoPerfil
        })),
        timestamp: new Date().toISOString(),
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("✅ Competidores sincronizados:", data))
      .catch((err) => console.error("❌ Error sincronizando:", err));
  }
}, [competidoresActuales, tatamiId]);

 const activarDescanso = (segundos = 30) => {
  setDescansoTime(true);
  setTiempoDescanso(segundos);
  setCombateEstado("pausado");
  
  console.log(`⏱️ Activando descanso de ${segundos} segundos para tatami:`, tatamiId);
  
  fetch("/api/enviar/panel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tatamiId: tatamiId,
      descansoTime: true,
      tiempoDescanso: segundos,
      varActivadora: false,
      accion: "descanso",
      estado: "pausado",
      competidoresActuales: competidoresActuales.map(comp => ({
        id: comp?.id,
        dni: comp?.dni,
        nombre: comp?.nombre,
        fotoPerfil: comp?.fotoPerfil
      })),
      timestamp: new Date().toISOString(),
    }),
  })
    .then((res) => res.json())
    .then((data) => console.log("Descanso activado:", data))
    .catch((err) => console.error("Error:", err));
};

  const desactivarDescanso = () => {
    setDescansoTime(false);
    
    console.log("⏱️ Desactivando descanso para tatami:", tatamiId);
    
    fetch("/api/enviar/panel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tatamiId: tatamiId,
        descansoTime: false,
        accion: "fin_descanso",
        timestamp: new Date().toISOString(),
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("Descanso desactivado:", data))
      .catch((err) => console.error("Error:", err));
  };

 const handleInit = () => {
  const horaActual = new Date().toISOString();
  setHoraReset(horaActual);
  setCombateEstado("iniciado");
  setCombateIniciado(true);
  setMedicalTime(false);
  setDescansoTime(false);

  fetch("/api/enviar/panel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tatamiId: tatamiId,
      varActivadora: true,
      medicalTime: false,
      accion: "iniciar",
      estado: "iniciado",
      hora: horaActual,
      competidoresActuales: competidoresActuales.map(comp => ({
        id: comp?.id,
        dni: comp?.dni,
        nombre: comp?.nombre,
        fotoPerfil: comp?.fotoPerfil
      })),
      timestamp: new Date().toISOString(),
    }),
  })
    .then((res) => res.json())
    .then((data) => console.log("Combate iniciado:", data))
    .catch((err) => console.error("Error:", err));
};


const pausarCombate = () => {
  setCombateEstado("pausado");
  setMedicalTime(false);
  setDescansoTime(false);

  fetch("/api/enviar/panel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tatamiId: tatamiId,
      varActivadora: false,
      medicalTime: false,
      accion: "pausar",
      estado: "pausado",
      competidoresActuales: competidoresActuales.map(comp => ({
        id: comp?.id,
        dni: comp?.dni,
        nombre: comp?.nombre,
        fotoPerfil: comp?.fotoPerfil
      })),
      timestamp: new Date().toISOString(),
    }),
  })
    .then((res) => res.json())
    .then((data) => console.log("Combate pausado:", data))
    .catch((err) => console.error("Error:", err));
};


const reanudarCombate = () => {
  setCombateEstado("iniciado");
  fetch("/api/enviar/panel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tatamiId: tatamiId,
      varActivadora: true,
      accion: "reanudar",
      estado: "iniciado",
      competidoresActuales: competidoresActuales.map(comp => ({
        id: comp?.id,
        dni: comp?.dni,
        nombre: comp?.nombre,
        fotoPerfil: comp?.fotoPerfil
      })),
      timestamp: new Date().toISOString(),
    }),
  })
    .then((res) => res.json())
    .then((data) => console.log("Combate reanudado:", data))
    .catch((err) => console.error("Error:", err));
};

  // 🔄 Actualizar competidores actuales cuando cambian los datos del grupo

  useEffect(() => {

    if (!grupoData?.rondasGeneradas || !grupoData?.estadoActual) return;

 

    const { rondasGeneradas, estadoActual, competidores: todosCompetidores } = grupoData;

    const rondaActualIndex = (estadoActual.rondaActual || 1) - 1;

    const combateActualIndex = (estadoActual.combateActual || 1) - 1;

 

    if (rondasGeneradas[rondaActualIndex]?.combates?.[combateActualIndex]) {

      const combateActual = rondasGeneradas[rondaActualIndex].combates[combateActualIndex];

      const competidoresCombate = [

        obtenerCompetidorReal(combateActual.c1, todosCompetidores),

        obtenerCompetidorReal(combateActual.c2, todosCompetidores)

      ].filter(c => c);

 

      // Solo actualizar si los competidores han cambiado

      const competidoresActualesIds = competidoresActuales.map(c => c?.id).sort().join(',');

      const nuevosCompetidoresIds = competidoresCombate.map(c => c?.id).sort().join(',');

 

      if (competidoresActualesIds !== nuevosCompetidoresIds && competidoresCombate.length > 0) {

        console.log('🔄 Actualizando competidores actuales desde datos refrescados:', competidoresCombate.map(c => c.nombre));

        setCompetidoresActuales(competidoresCombate);

      }

    }

  }, [grupoData?.rondasGeneradas, grupoData?.estadoActual]);

  const desactivarTiempoMedico = () => {

    setMedicalTime(false);

 

    console.log("✅ Desactivando tiempo médico para tatami:", tatamiId);

 

    fetch("/api/enviar/panel", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        tatamiId: tatamiId,

        medicalTime: false,

        varActivadora: false,

        accion: "fin_tiempo_medico",

        estado: "pausado",

        timestamp: new Date().toISOString(),

      }),

    })

      .then((res) => res.json())

      .then((data) => console.log("Tiempo médico desactivado:", data))

      .catch((err) => console.error("Error:", err));

  };


  const activarTiempoMedico = () => {
  setMedicalTime(true);
  setCombateEstado("pausado");
  
    console.log("🏥 Activando tiempo médico para tatami:", tatamiId);

 

    fetch("/api/enviar/panel", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        tatamiId: tatamiId,

        medicalTime: true,

        varActivadora: false,

        accion: "tiempo_medico",

        estado: "pausado",

        timestamp: new Date().toISOString(),

      }),

    })

      .then((res) => res.json())

      .then((data) => console.log("Tiempo médico activado:", data))

      .catch((err) => console.error("Error:", err));

  };
  // 🔄 FUNCIÓN PARA REFRESCAR DATOS DE LA LLAVE DESDE LA BASE DE DATOS

  const refrescarGrupoData = async (grupoLlave) => {

    try {

      console.log('🔄 Refrescando datos de llave desde BD:', grupoLlave);

      const response = await fetch(`/api/llaves/${grupoLlave}`);

 

      if (!response.ok) {

        throw new Error(`Error ${response.status} al cargar llave`);

      }

 

      const data = await response.json();

 

      if (data.success) {

        const datosActualizados = {

          grupoLlave: data.grupoLlave,

          competidores: data.competidores,

          rondasGeneradas: data.rondasGeneradas,

          estadoActual: data.estadoActual,

          tatamiId: grupoData?.tatamiId || data.tatamiAsignado

        };

 

        setGrupoData(datosActualizados);

        console.log('✅ Datos de llave actualizados:', datosActualizados);

        return datosActualizados;

      } else {

        throw new Error('Error en respuesta del servidor');

      }

    } catch (error) {

      console.error('❌ Error refrescando datos de llave:', error);

      throw error;

    }

  };


  // FUNCIÓN SIGUIENTE COMBATE MEJORADA

  const siguienteCombate = async () => {

    if (!grupoData) {

      console.error("❌ No hay datos de grupo cargados");

      return;

    }

 

    const { grupoLlave } = grupoData;

 

    // 🔄 REFRESCAR DATOS DESDE LA BASE DE DATOS ANTES DE AVANZAR

    let datosActualizados;

    try {

      datosActualizados = await refrescarGrupoData(grupoLlave);

    } catch (error) {

      alert('Error al cargar datos actualizados. Por favor, intenta nuevamente.');

      return;

    }

 

    const { rondasGeneradas, estadoActual, competidores: todosCompetidores } = datosActualizados;
    
    if (!rondasGeneradas || rondasGeneradas.length === 0) {
      console.error("❌ No hay rondas generadas");
      return;
    }

    const rondaActualIndex = (estadoActual?.rondaActual || 1) - 1;
    const combateActualIndex = (estadoActual?.combateActual || 1) - 1;

    console.log(`📊 Avanzando desde: Ronda ${rondaActualIndex + 1}, Combate ${combateActualIndex + 1}`);
    console.log(`📋 Estructura completa de rondas:`, rondasGeneradas);
    console.log(`🏆 Estado actual completo:`, estadoActual);

    // 🆕 PRIMERO: Determinar quién ganó el combate actual
    let ganadorActual = null;
    try {
      const resGanador = await fetch(`/api/llaves/obtener-ganador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupoLlave: grupoLlave,
          rondaIndex: rondaActualIndex,
          combateIndex: combateActualIndex
        })
      });
      
      if (resGanador.ok) {
        const dataGanador = await resGanador.json();
        ganadorActual = dataGanador.ganador;
        console.log("🏆 Ganador del combate actual:", ganadorActual?.nombre);
      }
    } catch (err) {
      console.warn("⚠️ No se pudo obtener ganador del combate actual:", err);
    }

    // Determinar siguiente combate
    let siguienteRondaIndex = rondaActualIndex;
    let siguienteCombateIndex = combateActualIndex + 1;

    // Si es el último combate de la ronda, avanzar de ronda
    if (siguienteCombateIndex >= rondasGeneradas[rondaActualIndex].combates.length) {
      siguienteRondaIndex++;
      siguienteCombateIndex = 0;
    }

    // Verificar si el torneo ha terminado
    if (siguienteRondaIndex >= rondasGeneradas.length) {
      console.log("🏆 Torneo completado");
      alert("¡El torneo ha finalizado!");
      return;
    }

    const siguienteRonda = rondasGeneradas[siguienteRondaIndex];
    const siguienteCombate = siguienteRonda.combates[siguienteCombateIndex];

    if (!siguienteCombate) {
      console.error("❌ No hay siguiente combate disponible");
      return;
    }

    console.log(`🔍 SIGUIENTE COMBATE (Ronda ${siguienteRondaIndex + 1}, Combate ${siguienteCombateIndex + 1}):`, siguienteCombate);

    // 🔧 CORREGIDO: Obtener competidores reales para el siguiente combate usando la función mejorada
    console.log("🔍 Datos del siguiente combate:", {

      ronda: siguienteRondaIndex + 1,

      combate: siguienteCombateIndex + 1,

      c1: siguienteCombate.c1,

      c2: siguienteCombate.c2

    });

 

    const competidor1 = obtenerCompetidorReal(siguienteCombate.c1, todosCompetidores);

    const competidor2 = obtenerCompetidorReal(siguienteCombate.c2, todosCompetidores);

 

    const nuevosCompetidores = [competidor1, competidor2].filter(c => c);

 

    console.log("👥 Nuevos competidores:", nuevosCompetidores.map(c => c?.nombre));

 

    if (nuevosCompetidores.length === 0) {

      console.error("❌ No hay competidores válidos para el siguiente combate");

      console.log("📊 Datos disponibles:", {

        siguienteCombate,

        todosCompetidores: todosCompetidores?.length || 0

      });

      alert("No hay competidores válidos para el siguiente combate.\n\nEsto puede suceder si:\n- Los ganadores de la ronda anterior aún no se han definido\n- La llave necesita actualizarse desde el bracket diagram\n\nPor favor, verifica que todos los ganadores estén registrados en el bracket diagram.");

      return;

    }

    // Actualizar estado
    const nuevoEstado = {
      ...estadoActual,
      rondaActual: siguienteRondaIndex + 1,
      combateActual: siguienteCombateIndex + 1
    };

    try {
      // 1. Actualizar estado en backend
      const res = await fetch("/api/llaves/actualizar-estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupoLlave, estadoActual: nuevoEstado }),
      });
      
      const data = await res.json();
      if (!data.success) throw new Error("Error actualizando estado");
      
      // 2. 🔧 CRÍTICO: Mantener TODOS los competidores originales de la llave
      const grupoActualizado = {
        ...grupoData,
        estadoActual: nuevoEstado,
        competidores: todosCompetidores,
        competidoresActuales: nuevosCompetidores,
        rondasGeneradas: rondasGeneradas,
        rondaActual: siguienteRondaIndex + 1,
        combateActual: siguienteCombateIndex + 1,
        ganadorAnterior: ganadorActual
      };

      console.log("📦 Grupo actualizado que se enviará:", {
        ronda: grupoActualizado.rondaActual,
        combate: grupoActualizado.combateActual,
        competidoresActuales: grupoActualizado.competidoresActuales?.map(c => c.nombre),
        totalCompetidores: grupoActualizado.competidores?.length,
        totalRondas: grupoActualizado.rondasGeneradas?.length
      });

      // 3. 🆕 ABRIR NUEVA PESTAÑA
      const urlParams = new URLSearchParams();
      urlParams.set('grupo', JSON.stringify(grupoActualizado));

      const nuevaPestanaUrl = `/player-panel?${urlParams.toString()}`;
      
      console.log(`📑 Abriendo nueva pestaña para combate ${siguienteRondaIndex + 1}-${siguienteCombateIndex + 1}`);
      console.log(`👥 Con competidores: ${nuevosCompetidores.map(c => c.nombre).join(" vs ")}`);
      
      const nuevaPestana = window.open(nuevaPestanaUrl, '_blank');
      
      if (!nuevaPestana) {
        alert('❌ No se pudo abrir la nueva pestaña. Por favor, permite ventanas emergentes en tu navegador.');
        return;
      }

      // 4. Notificar al sistema sobre el nuevo combate
      await fetch("/api/enviar/panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tatamiId: grupoData.tatamiId,
          proximoCombate: true,
          accion: "siguiente_combate",
          rondaActual: siguienteRondaIndex + 1,
          combateActual: siguienteCombateIndex + 1,
          competidores: nuevosCompetidores,
          nuevaPestana: true,
          timestamp: new Date().toISOString(),
        }),
      });
      
      console.log("✅ Nueva pestaña de combate creada exitosamente");
      
      // 5. 🆕 CERRAR AUTOMÁTICAMENTE LA PESTAÑA ACTUAL
      setTimeout(() => {
        console.log("🔒 Cerrando pestaña actual...");
        window.close();
      }, 1000);
      
    } catch (err) {
      console.error("❌ Error completo:", err);
      alert("Error al abrir nueva pestaña de combate: " + err.message);
    }
  };

const limpiarTatami = async () => {
  console.log(`🎯 Limpiando solo puntos del tatami ${tatamiId}...`);
  
  try {
    // 1. 🗑️ LIMPIAR REGISTROS DE PUNTUACIONES EN DB
    const deleteResponse = await fetch(`/api/registros/${tatamiId}`, {
      method: "DELETE",
    });

    if (deleteResponse.ok) {
      console.log("✅ Registros de puntuaciones eliminados");
    }

    // 2. 🔄 RESETEAR PUNTOS A CERO EN EL BACKEND
    await fetch("/api/enviar/panel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tatamiId: tatamiId,
        accion: "resetear_puntos",
        total1: 0,
        total2: 0,
        varActivadora: combateEstado === "iniciado",
        estado: combateEstado,
        medicalTime: medicalTime,
        descansoTime: descansoTime,
        timestamp: new Date().toISOString(),
      }),
    });

    // 3. 🔄 RESETEAR CONTROLES A CERO
    await fetch("/api/valores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total1: 0,
        total2: 0
      }),
    });

    console.log("✅ Puntos reseteados a cero");

  } catch (error) {
    console.error("❌ Error limpiando puntos:", error);
  }

  // 4. 🔄 FORZAR ACTUALIZACIÓN DE PLAYER PANELS
  setResetKey((prev) => prev + 1);
  
  // 5. 🧹 LIMPIAR VISUALIZACIÓN DE PUNTAJES
  setRegistrosEnVivo([]);
  
  if (mostrarPuntajes) {
    setMostrarPuntajes(false);
    setTimeout(() => setMostrarPuntajes(true), 100);
  }

  console.log(`✅ Puntos del tatami ${tatamiId} limpiados (estado del combate mantenido)`);
  alert("🎯 Puntos limpiados correctamente");
};

  const toggleDropdown = () => setDropdownAbierto((s) => !s);

  const copiarEnlace = (url) => {
    navigator.clipboard.writeText(`${window.location.origin}${url}`)
      .then(() => console.log("Enlace copiado al portapapeles"))
      .catch(err => console.error("Error al copiar: ", err));
  };

  const guardarControles = async (enlacesGenerados) => {
    try {
      console.log('🔄 Intentando guardar controles...', {
        tatamiId,
        cantidadEnlaces: enlacesGenerados.length,
        competidores: competidores.length,
        estadoCombate: combateEstado
      });

      const response = await fetch("/api/controles/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tatamiId: tatamiId,
          enlaces: enlacesGenerados,
          competidores: competidores,
          estadoCombate: combateEstado
        }),
      });
      
      console.log('📡 Respuesta del servidor:', response.status);
      
      const data = await response.json();
      console.log('📄 Datos de respuesta:', data);
      
      if (data.success) {
        console.log("✅ Controles guardados en backend:", data.control.enlaces.length, "enlaces");
      } else {
        console.error("❌ Error guardando controles:", data.error);
      }
    } catch (error) {
      console.error("❌ Error de conexión guardando controles:", error);
    }
  };

  const handleTransmitir = () => {
    const params = new URLSearchParams(window.location.search);
    const grupoParamLocal = params.get("grupo");

    let tatamiIdActual = tatamiId;
    if (grupoParamLocal) {
      try {
        const grupoData = JSON.parse(decodeURIComponent(grupoParamLocal));
        tatamiIdActual = grupoData.tatamiId;
      } catch (err) {
        console.warn("Error parseando grupo en handleTransmitir:", err);
      }
    }

    const letras = ["A", "B", "C", "D"];
    const nuevosEnlaces = letras.map((letra) => ({
      id: `juez-${letra}-${Date.now()}`,
      letra,
      nombre: `Juez ${letra}`,
      url: `/tatami-sala?id=${letra}&tatamiId=${tatamiIdActual}`,
    }));

    setEnlaces(nuevosEnlaces);
    setDropdownAbierto(true);
    guardarControles(nuevosEnlaces);
  };

  const fetchRegistros = async () => {
    try {
      const res = await fetch(`/api/registros/${tatamiId}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setRegistrosEnVivo(data || []);
    } catch (err) {
      console.error("❌ Error al obtener registros:", err);
    }
  };

  useEffect(() => {
    if (!mostrarPuntajes) return;
    fetchRegistros();

    const intervalo = setInterval(() => {
      fetchRegistros();
    }, 3000);

    return () => clearInterval(intervalo);
  }, [mostrarPuntajes, tatamiId]);

  console.log("COMPETIDORES RECIBIDOS:", competidores);
  
  return (
    <>
      {/* Banner de información de combate actual */}
      {grupoData && (
        <>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '1rem',
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            🥋 {grupoData.grupoLlave} | Ronda {grupoData.estadoActual?.rondaActual || 1} - Combate {grupoData.estadoActual?.combateActual || 1}
          </div>
          
          {/* 🆕 Banner del ganador del combate anterior */}
          {grupoData.ganadorAnterior && (
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '0.8rem',
              textAlign: 'center',
              fontWeight: 'bold',
              marginBottom: '1rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #FFD700'
            }}>
              🏆 Ganador del combate anterior: {grupoData.ganadorAnterior.nombre}
              {grupoData.ganadorAnterior.puntaje && ` (${grupoData.ganadorAnterior.puntaje} pts)`}
            </div>
          )}
        </>
      )}

      {/* BOTONES PRINCIPALES */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/dashboard")}>Volver a Tatamis</button>

        {!medicalTime ? (
          <button 
            onClick={activarTiempoMedico} 
            style={{ backgroundColor: "#ff9800", color: "white" }}
            disabled={!combateIniciado}
          >
            🏥 Tiempo Médico
          </button>
        ) : (
          <button 
            onClick={desactivarTiempoMedico} 
            style={{ backgroundColor: "#4caf50", color: "white" }}
          >
            ✅ Finalizar Tiempo Médico
          </button>
        )}

        {combateEstado === "pausado" ? (
          <button onClick={reanudarCombate} style={{ backgroundColor: "green" }}>
            ▶️ Reanudar Combate
          </button>
        ) : (
          <button onClick={pausarCombate} style={{ backgroundColor: "orange" }}>
            ⏸️ Pausar Combate
          </button>
        )}

        {!combateIniciado ? (
          <button onClick={handleInit} style={{ backgroundColor: "#b71c1c" }}>
            🥋 Iniciar Combate
          </button>
        ) : (
          <button 
            onClick={siguienteCombate} 
            style={{ 
              backgroundColor: "purple",
              position: "relative",
              paddingRight: "2.5rem"
            }}
            title="Abrirá una nueva ventana con el siguiente combate"
          >
            ⏭️ Siguiente Combate
            <span style={{ 
              position: "absolute", 
              right: "0.5rem",
              fontSize: "0.8rem",
              opacity: 0.8
            }}>🪟</span>
          </button>
        )}

        <button onClick={handleTransmitir} style={{ backgroundColor: "#2196f3" }}>
          🔗 Generar Links de Controles
        </button>
      </div>

      {/* BOTONES DE LIMPIEZA / PUNTAJES */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
        <button
          className="btn-clear"
          onClick={() => {
            console.log("🧹 Limpiando panel solo en frontend...");
            limpiarTatami();
          }}
        >
          🧹 Limpiar Panel
        </button>

        {!descansoTime ? (
          <>
            <button 
              onClick={() => activarDescanso(30)} 
              style={{ backgroundColor: "#ffeb3b", color: "black" }}
              disabled={!combateIniciado}
            >
              ⏱️ Descanso 30s
            </button>
            <button 
              onClick={() => activarDescanso(60)} 
              style={{ backgroundColor: "#ffc107", color: "black" }}
              disabled={!combateIniciado}
            >
              ⏱️ Descanso 1m
            </button>
          </>
        ) : (
          <button 
            onClick={desactivarDescanso} 
            style={{ backgroundColor: "#4caf50", color: "white" }}
          >
            ✅ Finalizar Descanso
          </button>
        )}

        <button
          onClick={() => setMostrarPuntajes((s) => !s)}
          style={{ backgroundColor: "#009688", color: "white" }}
        >
          📊 Puntajes en vivo
        </button>
      </div>

      {/* DROPDOWN ANIMADO PARA LOS LINKS */}
      {enlaces.length > 0 && (
        <div className="dropdown-container">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            📋 Controles Disponibles
            <span className={`dropdown-arrow ${dropdownAbierto ? "open" : ""}`}>▼</span>
          </button>

          <div className={`dropdown-content ${dropdownAbierto ? "show" : ""}`}>
            <div className="dropdown-header">
              <h3>Enlaces de Jueces</h3>
              <button className="close-dropdown" onClick={() => setDropdownAbierto(false)}>×</button>
            </div>

            <div className="links-grid">
              {enlaces.map(({ id, letra, url }) => (
                <div key={id || letra} className="link-item">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="link-button">
                    <span className="judge-icon">⚖️</span> Juez {letra}
                  </a>
                  <button className="copy-button" onClick={() => copiarEnlace(url)} title="Copiar enlace">📋</button>
                </div>
              ))}
            </div>

            <div className="dropdown-footer">
              <small>Haz clic en 📋 para copiar el enlace</small>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / PANEL PUNTAJES EN VIVO */}
      {mostrarPuntajes && (
        <div className="puntajes-modal">
          <div className="puntajes-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Puntajes en vivo - Tatami {tatamiId}</h3>
              <div>
                <button onClick={() => { fetchRegistros();}}>🔄 Refrescar</button>
                <button onClick={() => setMostrarPuntajes(false)} style={{ marginLeft: "0.5rem" }}>❌ Cerrar</button>
              </div>
            </div>

            <section style={{ marginTop: "0.5rem" }}>
              <h4>Registros (se muestran en orden ascendente por 'fecha')</h4>
              <table>
                <thead>
                  <tr>
                    <th>⏱ (s)</th>
                    <th>⚖️ Juez</th>
                    <th>🥋 Competidor</th>
                    <th>⭐ Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosEnVivo.length === 0 ? (
                    <tr><td colSpan="4">Sin registros aún...</td></tr>
                  ) : (
                    registrosEnVivo.map((r) => (
                      <tr key={r.id}>
                        <td>{r.fecha}</td>
                        <td>{r.juez}</td>
                        <td>{r.competidor}</td>
                        <td style={{ fontWeight: "bold" }}>{r.valor}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      )}

      {/* PLAYER PANELS */}
      <div className="app">
        <div className="chong">
          <PlayerPanel
            key={`panel-${tatamiId}-${resetKey}-A`}
            id={"0"}
            title={competidoresActuales[0]?.nombre || "Competidor A"}
            style={{ color: "#1900ff" }}
            combateEstado={combateEstado}
            onCombateEstadoChange={setCombateEstado}
            tatamiId={tatamiId}
            data={horaReset}
            limpiarTatami={limpiarTatami}
          />
        </div>

        <div className="hong">
          <PlayerPanel
            key={`panel-${tatamiId}-${resetKey}-B`}
            id={"1"}
            title={competidoresActuales[1]?.nombre || "Competidor B"}
            style={{ color: "rgb(255, 0, 0)" }}
            combateEstado={combateEstado}
            onCombateEstadoChange={setCombateEstado}
            tatamiId={tatamiId}
            data={horaReset}
            limpiarTatami={limpiarTatami}
          />
        </div>
      </div>
    </>
  );
}

export default PlayerPanelPage;