import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useNavigate } from "react-router-dom";
import BracketDiagram from "./BracketDiagram";
import "./Llaves.css";

const Llaves = forwardRef(function Llaves({ brackets: bracketsProp, onDelete, modo, onRondasActualizadas }, ref) {
  const [llavesGuardadas, setLlavesGuardadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [modalLlave, setModalLlave] = useState(null);
  const [abierto, setAbierto] = useState({});
  const [inicializado, setInicializado] = useState(false);
  const [generandoFormas, setGenerandoFormas] = useState(false);
  
  // 🆕 Estados para mover competidor
  const [modalMoverCompetidor, setModalMoverCompetidor] = useState(null);
  const [llaveDestino, setLlaveDestino] = useState('');
  const [moviendoCompetidor, setMoviendoCompetidor] = useState(false);

  const [modalCrearLlave, setModalCrearLlave] = useState(false);
  const [todosCompetidores, setTodosCompetidores] = useState([]);
  const [competidoresSeleccionados, setCompetidoresSeleccionados] = useState([]);
  const [nombreNuevaLlave, setNombreNuevaLlave] = useState("");

  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroGraduacion, setFiltroGraduacion] = useState("");
  const [filtroGenero, setFiltroGenero] = useState("");
  const [filtroPeso, setFiltroPeso] = useState("");
  const [filtroEdad, setFiltroEdad] = useState("");

  
  const abrirModalCrearLlave = async () => {
    try {
      const res = await fetch("/api/competidores");
      const data = await res.json();

      setTodosCompetidores(data);
      setCompetidoresSeleccionados([]);
      setNombreNuevaLlave("");
      setModalCrearLlave(true);
    } catch (error) {
      alert("Error cargando competidores");
    }
  };

  const crearLlaveManual = async () => {
  if (!nombreNuevaLlave.trim()) {
    alert("Debes ingresar un nombre de grupo");
    return;
  }
  if (competidoresSeleccionados.length === 0) {
    alert("Debes seleccionar al menos 1 competidor");
    return;
  }

  try {
    const res = await fetch("/api/llaves/guardar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grupoLlave: nombreNuevaLlave.trim(),
        competidores: competidoresSeleccionados,
        modalidad: modo
      })
    });

    if (!res.ok) throw new Error("Error guardando llave");

    alert("Llave creada correctamente");
    setModalCrearLlave(false);
    await cargarLlavesGuardadas();
  } catch (err) {
    alert("Error creando llave manual");
  }
};


  // Exponer funciones al padre
  useImperativeHandle(ref, () => ({
    refrescar: cargarLlavesGuardadas,
    generarLlavesForma: generarLlavesForma
  }));

  // 🔧 Cargar llaves al montar (SOLO CARGA, NO GENERACIÓN)
  useEffect(() => {
    cargarLlavesGuardadas();
  }, []);

    // 🔧 CORRECCIÓN 2: ACTIVAR POLLING para sincronización automática
  useEffect(() => {
    const intervalo = setInterval(() => {
      console.log('🔄 Refrescando llaves automáticamente...');
      cargarLlavesGuardadas();
    }, 5000); // Cada 5 segundos

    return () => clearInterval(intervalo);
  }, []);

  // =======================================================
  // 🔄 Cargar llaves desde SQLite (SOLO CARGA EXISTENTES)
  // =======================================================
  const cargarLlavesGuardadas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = modo === 'forma' ? '/api/bracket-forma' : '/api/llaves';
      const res = await fetch(endpoint);
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('📦 Llaves cargadas desde BD:', data);
      
      // 🐛 FIX: Normalizar estructura de datos para ambas modalidades
      let llaves = [];
      
      if (modo === 'forma') {
        const bracketsForma = data.brackets || [];
        llaves = bracketsForma.map(llave => ({
          ...llave,
          // ✅ CRÍTICO: Asegurar que rondasGeneradas SIEMPRE existe
          rondasGeneradas: llave.rondasGeneradas || [],
          competidores: llave.competidores || [],
          estadoActual: llave.estadoActual || {
            rondaActual: 1,
            combateActual: 1,
            ganadores: {},
            combatesCompletados: {},
            finalizado: false
          },
          // Asegurar que grupoLlave existe (puede venir como 'grupo' o 'grupoLlave')
          grupoLlave: llave.grupoLlave || llave.grupo
        }));
      } else {
        llaves = Array.isArray(data) ? data : [];
      }
      
      console.log('✅ Llaves normalizadas:', llaves);
      setLlavesGuardadas(llaves);
      setInicializado(true);
      
    } catch (error) {
      console.error('❌ Error cargando llaves:', error);
      setError(error.message);
      setLlavesGuardadas([]);
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // 🧘‍♂️ GENERAR LLAVES DE FORMA (SOLO MANUAL)
  // =======================================================
  const generarLlavesForma = async (brackets, generoFiltro = null) => {
    if (!brackets || !Array.isArray(brackets)) {
      console.error('❌ brackets no es un array válido:', brackets);
      return;
    }

    try {
      setGenerandoFormas(true);
      setError(null);

      const todosCompetidores = brackets.flatMap(grupo => grupo.competidores || []);
      
      console.log(`🧘 Generando llaves de forma para ${todosCompetidores.length} competidores`);

      const response = await fetch("/api/llaves/generar-forma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competidores: todosCompetidores,
          generoFiltro: generoFiltro
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status} generando llaves de forma: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        alert(`✅ ${result.message}\n\n` +
              `📊 Resumen:\n` +
              `• Total competidores: ${result.resumen.totalCompetidores}\n` +
              `• Competidores filtrados: ${result.resumen.competidoresFiltrados}\n` +
              `• Llaves creadas: ${result.resumen.llavesCreadas}\n` +
              `• Grupos formados: ${result.resumen.gruposFormados}`);
        
        await cargarLlavesGuardadas();
        
        if (onRondasActualizadas) {
          onRondasActualizadas();
        }
      } else {
        throw new Error(result.error || 'Error generando llaves de forma');
      }
      
    } catch (error) {
      console.error('❌ Error generando llaves de forma:', error);
      setError(error.message);
      alert(`❌ Error generando llaves de forma: ${error.message}`);
    } finally {
      setGenerandoFormas(false);
    }
  };

  // =======================================================
  // 🎲 Generar y guardar llaves de COMBATE (SOLO MANUAL)
  // =======================================================
  const generarYGuardarLlaves = async (brackets) => {
    if (!brackets || !Array.isArray(brackets)) {
      console.error('❌ brackets no es un array válido:', brackets);
      return;
    }

    for (const grupo of brackets) {
      try {
        const checkRes = await fetch(`/api/llaves/${grupo.grupo}`);
        
        if (checkRes.ok) {
          const existente = await checkRes.json();
          if (existente.success) {
            console.log(`⏭️ Llave ${grupo.grupo} ya existe en BD, saltando...`);
            continue;
          }
        }

        console.log(`💾 Creando nueva llave: ${grupo.grupo}`);
        
        const response = await fetch("/api/llaves/guardar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grupoLlave: grupo.grupo,
            competidores: grupo.competidores || [],
            modalidad: modo || 'combate'
          })
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status} al guardar llave`);
        }

        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Llave guardada: ${grupo.grupo}`);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando grupo ${grupo.grupo}:`, error);
      }
    }

    await cargarLlavesGuardadas();
  };

  // =======================================================
  // 🆕 FUNCIÓN PARA MOVER COMPETIDOR ENTRE LLAVES
  // =======================================================
  const moverCompetidor = async (competidor, llaveOrigen, llaveDestino) => {
    try {
      setMoviendoCompetidor(true);
      console.log('🚚 Moviendo competidor:', { 
        competidor, 
        llaveOrigen, 
        llaveDestino 
      });

      if (!competidor || !competidor.id) {
        throw new Error('Competidor no válido');
      }

      if (!llaveDestino) {
        throw new Error('Debe seleccionar una llave destino');
      }

      if (llaveOrigen === llaveDestino) {
        throw new Error('No puede mover el competidor a la misma llave');
      }

      // Llamar a la API para mover el competidor
      const response = await fetch("/api/llaves/mover-competidor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competidorId: competidor.id,
          competidorNombre: competidor.nombre,
          llaveOrigen: llaveOrigen,
          llaveDestino: llaveDestino
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status} moviendo competidor: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Competidor movido correctamente:', result);
        
        // Recargar las llaves para reflejar los cambios
        await cargarLlavesGuardadas();
        
        // Cerrar modal
        setModalMoverCompetidor(null);
        setLlaveDestino('');
        
        alert(`✅ Competidor "${competidor.nombre}" movido exitosamente de "${llaveOrigen}" a "${llaveDestino}"`);
        
        if (onRondasActualizadas) {
          onRondasActualizadas();
        }
      } else {
        throw new Error(result.error || 'Error moviendo competidor');
      }
      
    } catch (error) {
      console.error('❌ Error moviendo competidor:', error);
      setError(error.message);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setMoviendoCompetidor(false);
    }
  };

  // =======================================================
  // 🆕 ABRIR MODAL PARA MOVER COMPETIDOR
  // =======================================================
  const abrirModalMoverCompetidor = (competidor, llaveOrigen) => {
    setModalMoverCompetidor({
      competidor,
      llaveOrigen
    });
    setLlaveDestino('');
  };

  // =======================================================
  // 🏆 Avanzar ganador
  // =======================================================
  const avanzar = async (grupoLlave, ganador, roundIndex, positionIndex) => {
    try {
      console.log('👉 Avanzar con guardado:', { 
        grupoLlave, 
        ganador, 
        roundIndex, 
        positionIndex,
        ganadorId: ganador?.id 
      });

      if (!ganador || !ganador.id) {
        console.error('❌ Ganador no válido:', ganador);
        return;
      }

      const guardarRes = await fetch("/api/llaves/guardar-ganador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupoLlave: grupoLlave,
          rondaActual: roundIndex + 1,
          combateActual: positionIndex + 1,
          ganadorId: ganador.id,
          ganadorNombre: ganador.nombre,
          puntaje: ganador.puntaje || 0
        })
      });

      if (!guardarRes.ok) {
        const errorText = await guardarRes.text();
        throw new Error(`Error ${guardarRes.status} guardando ganador: ${errorText}`);
      }

      const guardarResult = await guardarRes.json();
      
      if (!guardarResult.success) {
        throw new Error(guardarResult.error || 'Error guardando ganador');
      }

      console.log('✅ Ganador guardado en BD:', guardarResult);

      const avanzarRes = await fetch("/api/llaves/avanzar-ganador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupoLlave: grupoLlave,
          ganadorId: ganador.id,
          rondaIndex: roundIndex,
          combateIndex: positionIndex
        })
      });

      if (!avanzarRes.ok) {
        const errorText = await avanzarRes.text();
        throw new Error(`Error ${avanzarRes.status} avanzando: ${errorText}`);
      }

      const avanzarResult = await avanzarRes.json();
      
      if (avanzarResult.success) {
        console.log('✅ Ganador avanzado correctamente');
        
        await cargarLlavesGuardadas();
        
        if (onRondasActualizadas) {
          onRondasActualizadas();
        }

        if (avanzarResult.rondas && avanzarResult.rondas[roundIndex + 1]) {
          const siguienteRonda = avanzarResult.rondas[roundIndex + 1];
          const siguienteCombateIndex = Math.floor(positionIndex / 2);
          const siguienteCombate = siguienteRonda.combates[siguienteCombateIndex];

          if (siguienteCombate && siguienteCombate.c1 && siguienteCombate.c2 && 
              siguienteCombate.c1.id && siguienteCombate.c2.id &&
              siguienteCombate.c1.nombre !== 'Por definir' && 
              siguienteCombate.c2.nombre !== 'Por definir') {
            
            setTimeout(() => {
              alert(`🎯 ¡Siguiente combate listo!\n\n` +
                    `${siguienteCombate.c1.nombre} vs ${siguienteCombate.c2.nombre}\n\n` +
                    `Ronda: ${siguienteRonda.ronda}`);
            }, 500);
          }
        }
      } else {
        throw new Error(avanzarResult.error || 'Error avanzando ganador');
      }
      
    } catch (error) {
      console.error('❌ Error en avanzar:', error);
      setError(error.message);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // =======================================================
  // ↩️ Deshacer ganador
  // =======================================================
  const deshacer = async (grupoLlave, roundIndex, positionIndex) => {
    try {
      console.log('↩️ Deshacer:', { grupoLlave, roundIndex, positionIndex });
      await cargarLlavesGuardadas();
    } catch (error) {
      console.error('Error deshaciendo:', error);
      setError(error.message);
    }
  };

  // =======================================================
  // 🔽 Toggle abrir/cerrar
  // =======================================================
  const toggle = (grupo) => {
    setAbierto(prev => ({
      ...prev,
      [grupo]: !prev[grupo]
    }));
  };

  // =======================================================
  // 📊 Ver progreso
  // =======================================================
  const verProgresoLlave = async (grupoLlave) => {
    try {
      const res = await fetch(`/api/llaves/${grupoLlave}`);
      
      if (!res.ok) {
        throw new Error(`Error ${res.status} obteniendo progreso`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        const estado = data.estadoActual;
        alert(`🔍 Progreso de ${grupoLlave}\n\n` +
              `Ronda: ${estado.rondaActual}\n` +
              `Combate: ${estado.combateActual}\n` +
              `Finalizado: ${estado.finalizado ? 'Sí ✅' : 'No ⏳'}\n` +
              `Ganadores: ${Object.keys(estado.ganadores).length}`);
      }
    } catch (error) {
      console.error('Error viendo progreso:', error);
      setError(error.message);
    }
  };
const competidoresFiltrados = todosCompetidores.filter(c => {
  const coincideNombre =
    filtroNombre.trim() === "" ||
    c.nombre.toLowerCase().includes(filtroNombre.toLowerCase());

  const coincideGraduacion =
    filtroGraduacion.trim() === "" ||
    (c.graduacion || "").toLowerCase().includes(filtroGraduacion.toLowerCase());

  const coincideGenero =
    filtroGenero.trim() === "" ||
    (c.genero || "").toLowerCase() === filtroGenero.toLowerCase();

  const coincidePeso =
    filtroPeso.trim() === "" ||
    parseFloat(c.peso) <= parseFloat(filtroPeso);

  const coincideEdad =
    filtroEdad.trim() === "" ||
    parseInt(c.edad) <= parseInt(filtroEdad);

  return (
    coincideNombre &&
    coincideGraduacion &&
    coincideGenero &&
    coincidePeso &&
    coincideEdad
  );
});

  // Renderizado
  if (loading && !inicializado) {
    return <div className="llaves-container">🔄 Cargando llaves...</div>;
  }

  if (error) {
    return (
      <div className="llaves-container">
        <div className="error-message">
          ❌ Error: {error}
          <button onClick={cargarLlavesGuardadas} className="boton boton-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="llaves-container">
      <div className="llaves-header">
        <h2 className="llaves-titulo">
          {modo === 'forma' ? '🧘 Llaves de Forma' : '🥋 Llaves de Combate'}
        </h2>
        
        <div className="llaves-header-actions">
          {modo === 'forma' && bracketsProp && bracketsProp.length > 0 && (
            <button
              className="boton boton-success"
              onClick={() => {
                const genero = prompt(
                  '¿Qué género para las llaves de forma?\n\n' +
                  'Escribe: "masculino", "femenino", o deja vacío para mixto'
                );
                if (genero !== null) {
                  const generoFiltro = genero.trim() === '' ? null : genero.trim();
                  generarLlavesForma(bracketsProp, generoFiltro);
                }
              }}
              disabled={generandoFormas}
            >
              {generandoFormas ? '🧘 Generando...' : '🧘 Generar Llaves de Forma'}
            </button>
          )}
          
          <button
            className="boton boton-primary"
            onClick={cargarLlavesGuardadas}
            disabled={loading}
          >
            {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
          </button>
          <button 
            className="boton boton-success"
            onClick={abrirModalCrearLlave}
          >
            ➕ Crear Llave Manual
          </button>
        </div>
      </div>

      {!Array.isArray(llavesGuardadas) || llavesGuardadas.length === 0 ? (
        <div className="llaves-empty">
          <p>📭 No hay llaves guardadas todavía</p>
          <small>
            {modo === 'forma' 
              ? 'Usa el botón "Generar Llaves de Forma" para crear llaves manualmente'
              : 'Las llaves deben generarse manualmente desde la sección correspondiente'
            }
          </small>
        </div>
      ) : (
        <div className="llaves-lista">
          {llavesGuardadas.map((llave) => (
            <div key={llave.grupoLlave} className="llave-card">
              <div
                className="llave-header-card"
                onClick={() => toggle(llave.grupoLlave)}
                style={{ cursor: "pointer" }}
              >
                <h3>{llave.grupoLlave}</h3>
                <div className="llave-header-info">
                  {llave.metadata && (
                    <span className="metadata-badge">
                      {llave.metadata.rangoEdad} • {llave.metadata.rangoGraduacion}
                    </span>
                  )}
                  <span className={`estado-badge ${llave.estadoActual?.finalizado ? 'finalizado' : 'en-progreso'}`}>
                    {llave.estadoActual?.finalizado ? '🏆 Finalizado' : `⏳ Ronda ${llave.estadoActual?.rondaActual || 1}`}
                  </span>
                  <span className="toggle-icon">
                    {abierto[llave.grupoLlave] ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {abierto[llave.grupoLlave] && (
                <div className="llave-contenido">
                  <div className="llave-info">
                    <span>👥 {llave.competidores?.length || 0} competidores</span>
                    <span>🥊 {llave.rondasGeneradas?.length || 0} rondas</span>
                    {llave.metadata && (
                      <span>⚧️ {llave.metadata.genero || 'mixto'}</span>
                    )}
                  </div>

                  {/* 🆕 LISTA DE COMPETIDORES CON OPCIÓN PARA MOVER */}
                  <div className="competidores-lista" style={{ marginTop: '15px', marginBottom: '15px' }}>
                    <h4>👥 Competidores:</h4>
                    <div className="competidores-grid">
                      {llave.competidores && llave.competidores.map((competidor, index) => (
                        <div key={competidor.id || index} className="competidor-item">
                          <span className="competidor-nombre">{competidor.nombre}</span>
                          <button
                            onClick={() => abrirModalMoverCompetidor(competidor, llave.grupoLlave)}
                            className="boton boton-warning boton-sm"
                            title="Mover a otra llave"
                            disabled={llave.estadoActual?.finalizado}
                          >
                            🚚 Mover
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="llave-actions">
                    <button 
                      onClick={() => verProgresoLlave(llave.grupoLlave)}
                      className="boton boton-info"
                    >
                      📊 Ver Progreso
                    </button>
                    
                    <button 
                      onClick={async () => {
                        if (!confirm(`¿Estás seguro de borrar la llave "${llave.grupoLlave}"?\n\nEsta acción no se puede deshacer.`)) return;
                        try {
                          const res = await fetch(`/api/llaves/${llave.grupoLlave}`, { method: 'DELETE' });
                          if (res.ok) {
                            alert('✅ Llave borrada correctamente');
                            await cargarLlavesGuardadas();
                          } else {
                            throw new Error('Error al borrar');
                          }
                        } catch (error) {
                          console.error('Error borrando llave:', error);
                          alert('❌ Error al borrar la llave');
                        }
                      }}
                      className="boton boton-danger"
                    >
                      🗑️ Limpiar
                    </button>

                    <button 
                      onClick={() => setModalLlave(llave)}
                      className="boton boton-primary"
                    >
                      🖥️ Ver a pantalla completa
                    </button>
                  </div>

                  <BracketDiagram
                    grupo={{
                      ...llave,
                      grupo: llave.grupoLlave
                    }}
                    onAvanzar={(slot, ganador, roundIndex, positionIndex) => 
                      avanzar(llave.grupoLlave, ganador, roundIndex, positionIndex)
                    }
                    onDeshacer={(slot, roundIndex, positionIndex) => 
                      deshacer(llave.grupoLlave, roundIndex, positionIndex)
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

{modalCrearLlave && (
  <div className="modal-overlay">
    <div className="modal-content" style={{ maxWidth: "650px" }}>
      <h3>➕ Crear Llave Manual</h3>

      {/* Nombre del grupo */}
      <label>Nombre del grupo:</label>
      <input
        value={nombreNuevaLlave}
        onChange={(e) => setNombreNuevaLlave(e.target.value)}
        className="form-input"
        placeholder="Ej: Combate Masculino 12-13"
      />

      {/* ===================== */}
      {/* FILTROS DE BÚSQUEDA */}
      {/* ===================== */}
      <h4 style={{ marginTop: "20px" }}>Filtros:</h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        {/* Buscar por nombre */}
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
          className="form-input"
        />

        {/* Graduación */}
        <select
          value={filtroGraduacion}
          onChange={(e) => setFiltroGraduacion(e.target.value)}
          className="form-input"
        >
          <option value="">Graduación (todas)</option>
          <option value="Blanco">Blanco</option>
          <option value="Blanco punta Amarilla">Blanco punta Amarilla</option>
          <option value="Amarillo">Amarillo</option>
          <option value="Amarillo punta verde">Amarillo punta verde</option>
          <option value="Verde">Verde</option>
          <option value="Verde punta azul">Verde punta azul</option>
          <option value="Azul">Azul</option>
          <option value="Azul punta roja">Azul punta roja</option>
          <option value="Rojo">Rojo</option>
          <option value="Rojo punta negra">Rojo punta negra</option>
          <option value="Negro I Dan">Negro I Dan</option>
          <option value="Negro II Dan">Negro II Dan</option>
          <option value="Negro III Dan">Negro III Dan</option>
          <option value="Negro IV Dan">Negro IV Dan</option>
          <option value="Negro V Dan">Negro V Dan</option>
          <option value="Negro VI Dan">Negro VI Dan</option>
        </select>

        {/* Género */}
        <select
          value={filtroGenero}
          onChange={(e) => setFiltroGenero(e.target.value)}
          className="form-input"
        >
          <option value="">Género (todos)</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="Mixto">Mixto</option>
        </select>

        {/* Peso */}
        <input
          type="number"
          placeholder="Peso máximo…"
          value={filtroPeso}
          onChange={(e) => setFiltroPeso(e.target.value)}
          className="form-input"
        />

        {/* Edad */}
        <input
          type="number"
          placeholder="Edad Maxima"
          value={filtroEdad}
          onChange={(e) => setFiltroEdad(e.target.value)}
          className="form-input"
        />
      </div>

      {/* =============================== */}
      {/* LISTA FILTRADA DE COMPETIDORES */}
      {/* =============================== */}

      {(() => {
        let filtrados = [...todosCompetidores];

        if (filtroNombre.trim() !== "")
          filtrados = filtrados.filter((c) =>
            c.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
          );

        if (filtroGraduacion !== "")
          filtrados = filtrados.filter((c) => c.graduacion === filtroGraduacion);

        if (filtroGenero !== "")
          filtrados = filtrados.filter((c) => c.genero === filtroGenero);

        if (filtroPeso !== "")
          filtrados = filtrados.filter((c) => Number(c.peso) <= Number(filtroPeso));

        if (filtroEdad !== "")
          filtrados = filtrados.filter((c) => Number(c.edad) <= Number(filtroEdad));

        return (
          <>
            <h4 style={{ marginTop: "20px" }}>Seleccionar competidores:</h4>

            <div
              className="competidores-grid"
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            >
              {filtrados.length === 0 ? (
                <p>No hay competidores que coincidan con los filtros.</p>
              ) : (
                filtrados.map((comp) => (
                  <label
                    key={comp.id}
                    className="competidor-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "5px 0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={competidoresSeleccionados.some(
                        (s) => s.id === comp.id
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCompetidoresSeleccionados((prev) => [...prev, comp]);
                        } else {
                          setCompetidoresSeleccionados((prev) =>
                            prev.filter((s) => s.id !== comp.id)
                          );
                        }
                      }}
                    />

                    <span>
                      {comp.nombre} — {comp.genero} — {comp.graduacion} —{" "}
                      {comp.peso}kg — {comp.edad} años
                    </span>
                  </label>
                ))
              )}
            </div>
          </>
        );
      })()}

      {/* BOTONES */}
      <div
        className="modal-actions"
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          className="boton boton-secondary"
          onClick={() => setModalCrearLlave(false)}
        >
          ❌ Cancelar
        </button>

        <button className="boton boton-success" onClick={crearLlaveManual}>
          ✔️ Crear Llave
        </button>
      </div>
    </div>
  </div>
)}



      {/* 🆕 MODAL PARA MOVER COMPETIDOR */}
      {modalMoverCompetidor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🚚 Mover Competidor</h3>
            <p>
              Moviendo: <strong>{modalMoverCompetidor.competidor.nombre}</strong>
              <br />
              Desde: <strong>{modalMoverCompetidor.llaveOrigen}</strong>
            </p>
            
            <div className="form-group">
              <label>Seleccionar llave destino:</label>
              <select 
                value={llaveDestino}
                onChange={(e) => setLlaveDestino(e.target.value)}
                className="form-select"
              >
                <option value="">-- Seleccionar llave --</option>
                {llavesGuardadas
                  .filter(llave => llave.grupoLlave !== modalMoverCompetidor.llaveOrigen)
                  .map(llave => (
                    <option key={llave.grupoLlave} value={llave.grupoLlave}>
                      {llave.grupoLlave} ({llave.competidores?.length || 0} competidores)
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setModalMoverCompetidor(null);
                  setLlaveDestino('');
                }}
                className="boton boton-secondary"
                disabled={moviendoCompetidor}
              >
                ❌ Cancelar
              </button>
              <button
                onClick={() => moverCompetidor(
                  modalMoverCompetidor.competidor,
                  modalMoverCompetidor.llaveOrigen,
                  llaveDestino
                )}
                disabled={!llaveDestino || moviendoCompetidor}
                className="boton boton-primary"
              >
                {moviendoCompetidor ? '🚚 Moviendo...' : '✅ Mover Competidor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Llaves;