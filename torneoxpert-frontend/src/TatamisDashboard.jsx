import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function TatamisDashboard() {
  const [tatamis, setTatamis] = useState([]);
  const [llavesCombate, setLlavesCombate] = useState([]);
  const [llavesForma, setLlavesForma] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLlaves, setLoadingLlaves] = useState(false);
  const [llaveSeleccionada, setLlaveSeleccionada] = useState(null);
  const [tatamiABorrar, setTatamiABorrar] = useState(null);
  const navigate = useNavigate();
  const volverAlMenu = () => navigate("/");

  // Cargar lista de tatamis
  const cargarTatamis = () => {
    fetch("/api/lista-tatamis")
      .then(res => res.json())
      .then(data => setTatamis(data))
      .catch(err => console.error("Error obteniendo tatamis:", err));
  };

  // Cargar llaves de combate DESDE EL NUEVO ENDPOINT
  const cargarLlavesCombate = () => {
    setLoadingLlaves(true);
    fetch("/api/bracket")// ← Cambiado de "/api/brackets"(sin rondas) a "/api/bracket(con rondas generadas)"
      .then(res => res.json())
      .then(data => {
        console.log("Llaves de combate cargadas:", data.brackets);
        setLlavesCombate(data.brackets || []);
      })
      .catch(err => {
        console.error("Error obteniendo llaves de combate:", err);
        setLlavesCombate([]);
      })
      .finally(() => setLoadingLlaves(false));
  };

  // Cargar llaves de forma DESDE EL NUEVO ENDPOINT
  const cargarLlavesForma = () => {
    setLoadingLlaves(true);
    fetch("/api/bracket-forma")// ← Cambiado de "/api/brackets-forma"(sin rondas) a "/api/bracket-forma"(con rondas)
      .then(res => res.json())
      .then(data => {
        console.log("Llaves de forma cargadas:", data.brackets);
        setLlavesForma(data.brackets || []);
      })
      .catch(err => {
        console.error("Error obteniendo llaves de forma:", err);
        setLlavesForma([]);
      })
      .finally(() => setLoadingLlaves(false));
  };

  // Crear nuevo tatami
  const crearTatami = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/crear-tatami`, {
        method: 'POST'
      });
      const data = await response.json();
      cargarTatamis();
    } catch (error) {
      console.error("Error creando tatami:", error);
    } finally {
      setLoading(false);
    }
  };

  // Borrar tatami
  const borrarTatami = async (tatamiId) => {
    try {
      const response = await fetch(`/api/borrar-tatami`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tatami_id: tatamiId })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Tatami borrado:", data);
        alert(`Tatami ${tatamiId} borrado exitosamente`);
        cargarTatamis();
      } else {
        try {
          const error = await response.json();
          alert(`Error al borrar tatami: ${error.error}`);
        } catch (parseError) {
          alert(`Error al borrar tatami: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Error al borrar tatami:", error);
      alert("Error de conexión al intentar borrar el tatami");
    } finally {
      setTatamiABorrar(null);
    }
  };

  // Confirmar borrado
  const confirmarBorrado = (tatami) => {
    setTatamiABorrar(tatami);
  };

  const cancelarBorrado = () => {
    setTatamiABorrar(null);
  };

  useEffect(() => {
    cargarTatamis();
    cargarLlavesCombate();
    cargarLlavesForma();
  }, []);

  // Función auxiliar para determinar la ronda actual BASADA EN EL NUEVO SISTEMA
  const determinarRondaActual = (llave) => {
    if (!llave.estadoActual) return "No iniciada";
    
    if (llave.estadoActual.finalizado) {
      return "🏆 Finalizada";
    }
    
    const rondaActual = llave.estadoActual.rondaActual || 1;
    const totalRondas = llave.rondasGeneradas?.length || 0;
    
    return `Ronda ${rondaActual} de ${totalRondas}`;
  };

  // Función para obtener información detallada de los competidores
  const obtenerInfoCompetidores = (llave) => {
    if (!llave.competidores || llave.competidores.length === 0) {
      return { total: 0, lista: [] };
    }

    const competidoresInfo = llave.competidores.map(comp => ({
      id: comp.id,
      nombre: comp.nombre,
      dni: comp.dni,
      escuela: comp.escuela,
      graduacion: comp.graduacion,
      categoria: comp.categoria,
      dorsal: comp.dorsal,
    }));

    return {
      total: competidoresInfo.length,
      lista: competidoresInfo
    };
  };

  // Función para obtener el ganador actual si existe
  const obtenerGanadorActual = (llave) => {
    if (llave.estadoActual?.finalizado && llave.estadoActual.ganadores?.final) {
      const ganadorId = llave.estadoActual.ganadores.final;
      const ganador = llave.competidores.find(c => c.id === ganadorId);
      return ganador ? ganador.nombre : "Ganador no identificado";
    }
    return null;
  };

  // Función para abrir panel de jueces con una llave específica
  const abrirPanelJuecesConLlave = (tatami, llave, modo) => {
    const infoCompetidores = obtenerInfoCompetidores(llave);
    const ganador = obtenerGanadorActual(llave);
    
    // Crear objeto con toda la información necesaria
    const llaveInfo = {
      tatamiId: tatami.id,
      tatamiNombre: tatami.nombre || `Tatami ${tatami.id}`,
      grupoLlave: llave.grupoLlave,
      modalidad: modo,
      competidores: infoCompetidores.lista,
      totalCompetidores: infoCompetidores.total,
      categoria: llave.competidores?.[0]?.categoria || "Sin categoría",
      rondaActual: determinarRondaActual(llave),
      ganadorActual: ganador,
      // Información de la estructura de la llave del nuevo sistema
      rondasGeneradas: llave.rondasGeneradas,
      estadoActual: llave.estadoActual,
      tatamiAsignado: llave.tatamiAsignado
    };

    console.log("Enviando información al PlayerPanel:", llaveInfo);

    // Codificar la información para pasarla por URL
    const llaveInfoCodificado = encodeURIComponent(JSON.stringify(llaveInfo));
    
    window.open(
      `/player-panel?grupo=${llaveInfoCodificado}`,
      "_blank"
    );
  };

  // Función para mostrar detalles de una llave específica
  const mostrarDetallesLlave = (llave, modo) => {
    setLlaveSeleccionada({ llave, modo });
  };

  // Función para obtener competidores para transmisión (primer combate de la primera ronda)
  const obtenerCompetidoresParaTransmision = (llave) => {
    if (!llave.rondasGeneradas || llave.rondasGeneradas.length === 0) {
      return llave.competidores || [];
    }

    const primeraRonda = llave.rondasGeneradas[0];
    if (!primeraRonda.combates || primeraRonda.combates.length === 0) {
      return llave.competidores || [];
    }

    const primerCombate = primeraRonda.combates[0];
    const competidoresMap = {};
    
    // Crear mapa de competidores por ID
    (llave.competidores || []).forEach(comp => {
      competidoresMap[comp.id] = comp;
    });

    // Obtener competidores del primer combate
    const competidoresTransmision = [];
    
    if (primerCombate.c1 && competidoresMap[primerCombate.c1]) {
      competidoresTransmision.push(competidoresMap[primerCombate.c1]);
    }
    
    if (primerCombate.c2 && competidoresMap[primerCombate.c2]) {
      competidoresTransmision.push(competidoresMap[primerCombate.c2]);
    }

    // Si no hay combates definidos, tomar los primeros competidores
    if (competidoresTransmision.length === 0) {
      return (llave.competidores || []).slice(0, 2);
    }

    return competidoresTransmision;
  };

  // Función para iniciar transmisión
  const iniciarTransmision = async (llave, modo) => {
    try {
      // 1. Obtener competidores para el primer combate
      const competidoresTransmision = obtenerCompetidoresParaTransmision(llave);
      
      console.log("Competidores para transmisión:", competidoresTransmision.map(c => c.nombre));
      
      // 2. Preparar datos para transmisión
      const datosTransmision = {
        grupo: llave.grupoLlave,
        categoria: llave.competidores?.[0]?.categoria || "Sin categoría",
        combateActual: {
          competidor1: competidoresTransmision[0] || null,
          competidor2: competidoresTransmision[1] || null
        },
        proximosCompetidores: (llave.competidores || []).slice(2, 4).map(comp => ({
          nombre: comp?.nombre,
          graduacion: comp?.graduacion,
          escuela: comp?.escuela
        })),
        competidores: llave.competidores || [],
        modalidad: modo === "forma" ? "formas" : "combate",
        estado: "transmitiendo",
        timestamp: new Date().toISOString(),
        // Nueva información de la llave
        rondasGeneradas: llave.rondasGeneradas,
        estadoActual: llave.estadoActual
      };

      // 3. Enviar al servidor
      const response = await fetch("https://www.torneoxpert.digital/api/iniciar-transmision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosTransmision)
      });

      if (response.ok) {
        console.log("Transmisión iniciada con nueva estructura de llave");
        
        // 4. Abrir TatamiView con DNIs
        const dnisTransmision = competidoresTransmision.map(c => c.dni).join(",");
        const modoTransmision = modo === "forma" ? "formas" : "combate";
        
        // Nota: Descomenta si necesitas abrir TatamiView
        {/*window.open(
          `/tatami?dnis=${dnisTransmision}&mode=${modoTransmision}&grupo=${llave.grupoLlave}`,
          "_blank"
        );*/}
      }
    } catch (error) {
      console.error("Error al iniciar transmisión:", error);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Panel de Tatamis</h1>

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={crearTatami}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "16px",
            cursor: "pointer",
            marginRight: "1rem"
          }}
        >
          {loading ? "Creando..." : "➕ Crear nuevo Tatami"}
        </button>

        <button
          onClick={() => {
            cargarLlavesCombate();
            cargarLlavesForma();
          }}
          disabled={loadingLlaves}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#6f42c1",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          {loadingLlaves ? "Actualizando..." : "🔄 Actualizar Llaves"}
        </button>
      </div>

      {/* Resumen detallado de llaves disponibles */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: '#e7f3ff', padding: '1rem', borderRadius: '8px' }}>
          <h3>Llaves de Combate</h3>
          <p><strong>Total:</strong> {llavesCombate.length} grupos</p>
          <p><strong>Competidores:</strong> {llavesCombate.reduce((total, llave) => total + (llave.competidores?.length || 0), 0)}</p>
          <p><strong>Finalizadas:</strong> {llavesCombate.filter(llave => llave.estadoActual?.finalizado).length}</p>
          <p><strong>Categorías:</strong> {[...new Set(llavesCombate.flatMap(llave => llave.competidores?.map(c => c.categoria) || []))].join(', ') || 'N/A'}</p>
        </div>
        
        <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '8px' }}>
          <h3>Llaves de Forma</h3>
          <p><strong>Total:</strong> {llavesForma.length} grupos</p>
          <p><strong>Competidores:</strong> {llavesForma.reduce((total, llave) => total + (llave.competidores?.length || 0), 0)}</p>
          <p><strong>Finalizadas:</strong> {llavesForma.filter(llave => llave.estadoActual?.finalizado).length}</p>
          <p><strong>Categorías:</strong> {[...new Set(llavesForma.flatMap(llave => llave.competidores?.map(c => c.categoria) || []))].join(', ') || 'N/A'}</p>
        </div>
      </div>

      {/* Modal de confirmación para borrar tatami */}
      {tatamiABorrar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '90%',
            width: '400px',
            textAlign: 'center'
          }}>
            <h3>¿Borrar Tatami?</h3>
            <p>¿Estás seguro de que quieres borrar el <strong>Tatami {tatamiABorrar.id}</strong>?</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
              Esta acción no se puede deshacer.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => borrarTatami(tatamiABorrar.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Sí, Borrar
              </button>
              <button
                onClick={cancelarBorrado}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de llave */}
      {llaveSeleccionada && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            width: '600px'
          }}>
            <h2>Detalles de Llave: {llaveSeleccionada.llave.grupoLlave}</h2>
            <p><strong>Modalidad:</strong> {llaveSeleccionada.modo}</p>
            <p><strong>Total competidores:</strong> {llaveSeleccionada.llave.competidores?.length || 0}</p>
            <p><strong>Ronda actual:</strong> {determinarRondaActual(llaveSeleccionada.llave)}</p>
            <p><strong>Total rondas:</strong> {llaveSeleccionada.llave.rondasGeneradas?.length || 0}</p>
            
            {llaveSeleccionada.llave.estadoActual?.finalizado && (
              <p><strong>🏆 Ganador:</strong> {obtenerGanadorActual(llaveSeleccionada.llave)}</p>
            )}
            
            <h3>Competidores:</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {llaveSeleccionada.llave.competidores?.map((comp, index) => (
                <div key={comp.id} style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  margin: '0.5rem 0',
                  borderRadius: '4px',
                  background: '#f9f9f9'
                }}>
                  <strong>{index + 1}. {comp.nombre}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    <div>DNI: {comp.dni} | Dorsal: {comp.dorsal || 'N/A'}</div>
                    <div>Escuela: {comp.escuela} | Graduación: {comp.graduacion}</div>
                    <div>Categoría: {comp.categoria}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <h3>Estructura de Rondas:</h3>
            <div style={{ fontSize: '0.9rem' }}>
              {llaveSeleccionada.llave.rondasGeneradas?.map((ronda, index) => (
                <div key={index} style={{ marginBottom: '0.5rem' }}>
                  <strong>{ronda.ronda || `Ronda ${index + 1}`}:</strong> {ronda.combates?.length || 0} combates
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setLlaveSeleccionada(null)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {tatamis.length === 0 ? (
        <p>No hay tatamis disponibles todavía</p>
      ) : (
        <div>
          <h2>Tatamis Disponibles</h2>
          <div className="tatami-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1rem'
          }}>
            {tatamis.map(tatami => (
              <div key={tatami.id} className="tatami-card" style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1rem',
                background: '#f9f9f9',
                position: 'relative'
              }}>
                {/* Botón de borrar en la esquina superior derecha */}
                <button
                  onClick={() => confirmarBorrado(tatami)}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                  title="Borrar tatami"
                >
                  ×
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong>Tatami {tatami.id}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.2rem' }}>
                      <strong>Estado:</strong> {tatami.estado}
                    </div>
                    {tatami.categoria_actual && (
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>
                        <strong>Categoría actual:</strong> {tatami.categoria_actual}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="tatami-actions" style={{ marginTop: '1rem' }}>
                  {/* Selector de llaves para Panel de Jueces */}
                  <select
                    onChange={(e) => {
                      const [tipo, index] = e.target.value.split('-');
                      if (tipo && index !== undefined) {
                        const llaves = tipo === 'combate' ? llavesCombate : llavesForma;
                        const llave = llaves[parseInt(index)];
                        if (llave) {
                          iniciarTransmision(llave, tipo);
                          abrirPanelJuecesConLlave(tatami, llave, tipo);
                        }
                      }
                      e.target.value = ''; // Resetear el selector
                    }}
                    style={{
                      padding: '0.3rem 0.8rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      width:'100%',
                      margin: '0.2rem',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">🎯 Panel de Jueces</option>
                    
                    {/* Opciones de combate */}
                    <optgroup label="🥊 Combate">
                      {llavesCombate.map((llave, index) => (
                        <option key={`combate-${index}`} value={`combate-${index}`}>
                          {llave.grupoLlave} ({llave.competidores?.length || 0} comp.) - {determinarRondaActual(llave)}
                        </option>
                      ))}
                    </optgroup>
                    
                    {/* Opciones de forma */}
                    <optgroup label="🧘 Forma">
                      {llavesForma.map((llave, index) => (
                        <option key={`forma-${index}`} value={`forma-${index}`}>
                          {llave.grupoLlave} ({llave.competidores?.length || 0} comp.) - {determinarRondaActual(llave)}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Lista de llaves disponibles con información de competidores */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Llaves disponibles:
                  </div>
                  
                  {/* Llaves de combate */}
                  {llavesCombate.slice(0, 2).map((llave, index) => {
                    const infoComp = obtenerInfoCompetidores(llave);
                    const ganador = obtenerGanadorActual(llave);
                    return (
                      <div 
                        key={`combate-${index}`} 
                        style={{ 
                          background: '#e7f3ff', 
                          padding: '0.5rem', 
                          margin: '0.3rem 0',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => mostrarDetallesLlave(llave, 'combate')}
                        title="Click para ver detalles"
                      >
                        <div style={{ color: '#0056b3', fontWeight: 'bold' }}>
                          🥊 {llave.grupoLlave}
                          {ganador && <span style={{color: '#28a745', marginLeft: '0.5rem'}}>🏆</span>}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                          {infoComp.total} competidores • {determinarRondaActual(llave)}
                          {ganador && <div style={{color: '#28a745'}}>Ganador: {ganador}</div>}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Llaves de forma */}
                  {llavesForma.slice(0, 2).map((llave, index) => {
                    const infoComp = obtenerInfoCompetidores(llave);
                    const ganador = obtenerGanadorActual(llave);
                    return (
                      <div 
                        key={`forma-${index}`} 
                        style={{ 
                          background: '#fff3cd', 
                          padding: '0.5rem', 
                          margin: '0.3rem 0',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => mostrarDetallesLlave(llave, 'forma')}
                        title="Click para ver detalles"
                      >
                        <div style={{ color: '#856404', fontWeight: 'bold' }}>
                          🧘 {llave.grupoLlave}
                          {ganador && <span style={{color: '#28a745', marginLeft: '0.5rem'}}>🏆</span>}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                          {infoComp.total} competidores • {determinarRondaActual(llave)}
                          {ganador && <div style={{color: '#28a745'}}>Ganador: {ganador}</div>}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(llavesCombate.length > 2 || llavesForma.length > 2) && (
                    <div style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      ...y {Math.max(0, llavesCombate.length - 2) + Math.max(0, llavesForma.length - 2)} llaves más disponibles
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        <div className="botones-container">
          <button className="btn-volver" onClick={volverAlMenu}>Volver al menú</button>
        </div>
    </div>
  );
}

export default TatamisDashboard;