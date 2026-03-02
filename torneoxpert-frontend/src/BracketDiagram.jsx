import React, { useMemo, useState, useEffect } from "react";
import "./BracketDiagram.css";

const limpiarRuta = (ruta) => {
  if (!ruta) return "";
  return ruta.replace(/\/uploads\/+/g, "/uploads/").replace(/^\/+/, "/");
};

// Constantes ajustadas para ancho dinámico
const MIN_BOX_WIDTH = 180;
const CHAR_WIDTH = 9;
const BOX_HEIGHT = 48;
const VERTICAL_SPACING = 18;
const HORIZONTAL_SPACING = 160;
const MARGIN_X = 20;
const MARGIN_Y = 20;
const PADDING_X = 24;
const SLOT_GAP = 8;

const BracketDiagram = ({ grupo = {}, onAvanzar = () => {}, onDeshacer = () => {} }) => {
  const [procesando, setProcesando] = useState(false);
  const [ultimoGanador, setUltimoGanador] = useState(null);

  useEffect(() => {
    console.log('🔄 BracketDiagram actualizado:', {
      grupoLlave: grupo.grupoLlave,
      competidores: grupo.competidores?.length,
      rondas: grupo.rondasGeneradas?.length,
      ganadores: Object.keys(grupo.estadoActual?.ganadores || {}).length,
      timestamp: new Date().toISOString()
    });
  }, [grupo.rondasGeneradas, grupo.estadoActual]);

  // 🐛 FIX: Validación robusta antes de procesar rondasGeneradas
  const rounds = useMemo(() => {
    // ✅ VALIDACIÓN 1: Verificar que rondasGeneradas existe y es un array
    if (!grupo.rondasGeneradas || !Array.isArray(grupo.rondasGeneradas)) {
      console.warn('⚠️ rondasGeneradas no es válido:', grupo.rondasGeneradas);
      console.warn('📦 Grupo completo:', grupo);
      return [];
    }

    // ✅ VALIDACIÓN 2: Verificar que competidores existe
    if (!grupo.competidores || !Array.isArray(grupo.competidores)) {
      console.warn('⚠️ competidores no es válido:', grupo.competidores);
      return [];
    }

    console.log("🔵 RAW rondasGeneradas:", grupo.rondasGeneradas);
    console.log("🟣 Competidores:", grupo.competidores);

    // ✅ VALIDACIÓN 3: Filtrar rondas que no tienen combates
    const rondasValidas = grupo.rondasGeneradas.filter(ronda => 
      ronda && ronda.combates && Array.isArray(ronda.combates)
    );
    // 🟦 CASO ESPECIAL → SOLO 1 COMPETIDOR
    if (grupo.competidores.length === 1) {
      const unico = grupo.competidores[0];

      console.log("🟩 Generando llave de un solo competidor:", unico);

      return [
        [
          {
            id: "single-0-0",
            name: unico.nombre,
            a: null,
            b: null,
            ganador: unico.nombre,
            idA: unico,
            idB: null
          }
        ]
      ];
    }
    if (rondasValidas.length === 0) {
      console.warn('⚠️ No hay rondas válidas con combates');
      return [];
    }

    return rondasValidas.map((rondaObj, roundIndex) =>
      rondaObj.combates.map((combate, combateIndex) => {
        console.log(`\n============================`);
        console.log(`🟡 RONDA ${roundIndex} - COMBATE ${combateIndex}`);
        console.log("➡️ combate.c1:", combate.c1);
        console.log("➡️ combate.c2:", combate.c2);

        // NORMALIZAR C1 - BUSCAR COMPETIDOR REAL
        let c1Obj = null;
        if (combate.c1) {
          if (typeof combate.c1 === 'object' && combate.c1.id) {
            c1Obj = grupo.competidores?.find(c => c.id === combate.c1.id) || combate.c1;
          } 
          else if (typeof combate.c1 === 'string') {
            c1Obj = grupo.competidores?.find(c => c.id === combate.c1);
          }
          else if (typeof combate.c1 === 'object' && combate.c1.nombre) {
            c1Obj = combate.c1;
          }
        }

        // NORMALIZAR C2 - BUSCAR COMPETIDOR REAL
        let c2Obj = null;
        if (combate.c2) {
          if (typeof combate.c2 === 'object' && combate.c2.id) {
            c2Obj = grupo.competidores?.find(c => c.id === combate.c2.id) || combate.c2;
          } 
          else if (typeof combate.c2 === 'string') {
            c2Obj = grupo.competidores?.find(c => c.id === combate.c2);
          }
          else if (typeof combate.c2 === 'object' && combate.c2.nombre) {
            c2Obj = combate.c2;
          }
        }

        console.log("✅ c1Obj final:", c1Obj);
        console.log("✅ c2Obj final:", c2Obj);

        return {
          id: `r${roundIndex}-c${combateIndex}`,
          a: c1Obj?.nombre || null,
          b: c2Obj?.nombre || null,
          ganador: grupo.estadoActual?.ganadores?.[`${roundIndex}-${combateIndex}`] || null,
          idA: c1Obj,
          idB: c2Obj,
        };
      })
    );
  }, [grupo.rondasGeneradas, grupo.competidores, grupo.estadoActual]);

  // Calcular el ancho necesario para cada ronda
  const roundWidths = useMemo(() => {
    if (!Array.isArray(rounds) || rounds.length === 0) return [];
    
    return rounds.map((round, roundIndex) => {
      let maxLength = 0;
      
      round.forEach(slot => {
        const aLength = slot.a?.length || 0;
        const bLength = slot.b?.length || 0;
        const nameLength = slot.name?.length || 0;
        maxLength = Math.max(maxLength, aLength, bLength, nameLength);
      });
      
      const calculatedWidth = Math.max(
        MIN_BOX_WIDTH,
        maxLength * CHAR_WIDTH + PADDING_X * 2
      );
      
      console.log(`📏 Ronda ${roundIndex} - Max chars: ${maxLength}, Width: ${calculatedWidth}px`);
      return calculatedWidth;
    });
  }, [rounds]);

  const initialColumnWidth = useMemo(() => {
    if (!grupo.competidores || grupo.competidores.length === 0) return MIN_BOX_WIDTH;
    
    const maxLength = grupo.competidores.reduce((max, comp) => 
      Math.max(max, comp.nombre?.length || 0), 0
    );
    
    return Math.max(MIN_BOX_WIDTH, maxLength * CHAR_WIDTH + PADDING_X * 2);
  }, [grupo.competidores]);

  const maxRoundSlots = useMemo(() => {
    if (!Array.isArray(rounds) || rounds.length === 0) return 0;
    return rounds.reduce((m, r) => Math.max(m, Array.isArray(r) ? r.length : 0), 0);
  }, [rounds]);

  const competidoresCount = grupo.competidores?.length || 0;
  const maxSlots = Math.max(maxRoundSlots, competidoresCount);

  const svgHeight = MARGIN_Y * 2 + maxSlots * (BOX_HEIGHT + VERTICAL_SPACING);
  
  const totalColumnsWidth = useMemo(() => {
    let total = initialColumnWidth;
    roundWidths.forEach(width => {
      total += HORIZONTAL_SPACING + width;
    });
    return total;
  }, [initialColumnWidth, roundWidths]);
  
  const svgWidth = MARGIN_X * 2 + totalColumnsWidth;

  const getBoxPosition = (roundIndex, positionIndex) => {
    if (roundIndex === -1) {
      return {
        x: MARGIN_X,
        y: MARGIN_Y + positionIndex * (BOX_HEIGHT + VERTICAL_SPACING),
        width: initialColumnWidth
      };
    }

    let x = MARGIN_X + initialColumnWidth + HORIZONTAL_SPACING;
    for (let i = 0; i < roundIndex; i++) {
      x += roundWidths[i] + HORIZONTAL_SPACING;
    }

    const currentWidth = roundWidths[roundIndex] || MIN_BOX_WIDTH;

    if (roundIndex === 0) {
      return {
        x: x,
        y: MARGIN_Y + positionIndex * (BOX_HEIGHT + VERTICAL_SPACING),
        width: currentWidth
      };
    }

    if (roundIndex === 1) {
      const yTop = MARGIN_Y + (positionIndex * 2) * (BOX_HEIGHT + VERTICAL_SPACING);
      const yBottom = MARGIN_Y + (positionIndex * 2 + 1) * (BOX_HEIGHT + VERTICAL_SPACING);
      const y = (yTop + yBottom) / 2 - BOX_HEIGHT / 2;
      
      return {
        x: x,
        y: y,
        width: currentWidth
      };
    }

    if (roundIndex === 2) {
      const yTop = MARGIN_Y + 0 * (BOX_HEIGHT + VERTICAL_SPACING);
      const yBottom = MARGIN_Y + 3 * (BOX_HEIGHT + VERTICAL_SPACING);
      const y = (yTop + yBottom) / 2 - BOX_HEIGHT / 2;
      
      return {
        x: x,
        y: y,
        width: currentWidth
      };
    }

    const groupSize = Math.pow(2, roundIndex);
    const firstIndex = positionIndex * groupSize;
    
    const yTop = MARGIN_Y + firstIndex * (BOX_HEIGHT + VERTICAL_SPACING);
    const yBottom = MARGIN_Y + (firstIndex + groupSize - 1) * (BOX_HEIGHT + VERTICAL_SPACING);
    const y = (yTop + yBottom) / 2 - BOX_HEIGHT / 2;

    return { x, y, width: currentWidth };
  };

  const handleLimpiarLlave = async () => {
    if (!confirm(`¿Estás seguro de borrar la llave "${grupo.grupoLlave}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      await window.storage.delete(grupo.grupoLlave);
      alert('✅ Llave borrada correctamente');
      window.location.reload();
    } catch (error) {
      console.error('Error borrando llave:', error);
      alert('❌ Error al borrar la llave');
    }
  };

  const handleAdvance = async (slot, winnerName, roundIndex, positionIndex) => {
    try {
      setProcesando(true);
      setUltimoGanador({ roundIndex, positionIndex, nombre: winnerName });

      console.log('🎯 handleAdvance llamado:', { 
        slot, 
        winnerName, 
        roundIndex, 
        positionIndex,
        idA: slot.idA,
        idB: slot.idB
      });

      let ganadorObj = null;
      
      if (slot.idA && slot.idA.nombre === winnerName) {
        ganadorObj = slot.idA;
      } else if (slot.idB && slot.idB.nombre === winnerName) {
        ganadorObj = slot.idB;
      } else {
        console.error('❌ No se pudo encontrar el objeto ganador');
        return;
      }

      console.log('✅ Ganador objeto:', ganadorObj);

      await onAvanzar(slot, ganadorObj, roundIndex, positionIndex);

      setTimeout(() => {
        setProcesando(false);
        setUltimoGanador(null);
      }, 1000);

    } catch (err) {
      console.error("Error avanzando ganador:", err);
      setProcesando(false);
      setUltimoGanador(null);
    }
  };

  const handleUndo = (slot, roundIndex, positionIndex) => {
    try {
      console.log('↩️ handleUndo llamado:', { roundIndex, positionIndex });
      onDeshacer(slot, roundIndex, positionIndex);
    } catch (err) {
      console.error("onDeshacer error:", err);
    }
  };

  // 🏆 Caso especial: solo un competidor → gana automáticamente
if (grupo.competidores && grupo.competidores.length === 1) {
  const unico = grupo.competidores[0];

  return (
    <div className="bracket-container bracket-horizontal">
      <div className="bracket-header">
        <h3>Llave - {grupo.grupo || "Sin nombre"}</h3>
        <small>1 competidor (gana automáticamente)</small>
      </div>

      <svg width="100%" height="200">
        <g transform="translate(40, 40)">
          <rect
            width="200"
            height="60"
            rx="12"
            ry="12"
            className="bracket-box winner"
          />
          <text
            x="100"
            y="35"
            fontSize="18"
            textAnchor="middle"
            style={{ fontWeight: 700 }}
          >
            {unico.nombre}
          </text>
        </g>

        <text
          x="140"
          y="130"
          fontSize="20"
          fill="#c9a400"
          style={{ fontWeight: 800 }}
        >
          🏆 GANADOR AUTOMÁTICO
        </text>
      </svg>
    </div>
  );
}

  // 🐛 FIX: Mejorar mensaje de error con más detalles de debug
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return (
      <div className="bracket-empty">
        <p>⚠️ No se pudieron cargar las rondas de esta llave</p>
        <small>Grupo: {grupo.grupo || grupo.grupoLlave || "Sin nombre"}</small>
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', fontSize: '13px', color: '#856404' }}>
          <strong>🔍 Información de debug:</strong>
          <ul style={{ textAlign: 'left', marginTop: '10px', paddingLeft: '20px' }}>
            <li>Competidores: {competidoresCount}</li>
            <li>Rondas generadas: {grupo.rondasGeneradas?.length || 0}</li>
            <li>Rondas válidas: {rounds.length}</li>
            <li>rondasGeneradas es array: {Array.isArray(grupo.rondasGeneradas) ? 'Sí' : 'No'}</li>
            <li>competidores es array: {Array.isArray(grupo.competidores) ? 'Sí' : 'No'}</li>
          </ul>
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', overflow: 'auto', maxHeight: '150px' }}>
            <strong>Estructura del grupo:</strong>
            <pre>{JSON.stringify({
              grupoLlave: grupo.grupoLlave,
              grupo: grupo.grupo,
              rondasGeneradas: grupo.rondasGeneradas,
              competidores: grupo.competidores?.map(c => ({ id: c.id, nombre: c.nombre }))
            }, null, 2)}</pre>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          🔄 Recargar página
        </button>
      </div>
    );
  }

  return (
    <div className="bracket-container bracket-horizontal">
      <div className="bracket-header">
        <h3>Llave - {grupo.grupo || "Sin nombre"}</h3>
        {grupo.competidores ? <small>{grupo.competidores.length} competidores</small> : null}
        
        {procesando && (
          <span style={{
            marginLeft: '15px',
            padding: '6px 12px',
            backgroundColor: '#ffc107',
            color: '#000',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            animation: 'pulse 1s infinite'
          }}>
            ⚡ Procesando...
          </span>
        )}
      </div>

      <svg
        width="100%"
        height={Math.max(svgHeight, 200)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMinYMin meet"
      >
        {/* COLUMNA 0 → COMPETIDORES */}
        {grupo.competidores?.map((comp, idx) => {
          comp.color = idx % 2 === 0 ? "blue" : "red";
          const pos = getBoxPosition(-1, idx);
          return (
            <g key={`slot-inicial-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
              <rect
                x={0}
                y={0}
                width={pos.width}
                height={BOX_HEIGHT}
                className={idx % 2 === 0 ? "bracket-box blue" : "bracket-box red"}
                rx="12"
                ry="12"
              />
              <text
                x={pos.width / 2}
                y={BOX_HEIGHT / 2 + 5}
                fontSize="15"
                textAnchor="middle"
                style={{ fontWeight: 600, pointerEvents: "none" }}
              >
                {comp.nombre}
              </text>
            </g>
          );
        })}

        {/* Column headers */}
        {rounds.map((ronda, ri) => {
          const pos = getBoxPosition(ri, 0);
          const headerX = pos.x + pos.width / 2;

          return (
            <text
              key={`header-${ri}`}
              x={headerX}
              y={MARGIN_Y - 8}
              fontSize="14"
              textAnchor="middle"
              fill="#333"
              style={{ fontWeight: 700 }}
            >
              {ronda.ronda}
            </text>
          );
        })}

        {/* Conectores iniciales -> Ronda 1 */}
        {grupo.competidores?.map((comp, idx) => {
          if (!rounds[0]) return null;
          const from = getBoxPosition(-1, idx);
          const toSlotIndex = Math.floor(idx / 2);
          const to = getBoxPosition(0, toSlotIndex);

          const x1 = from.x + from.width;
          const y1 = from.y + BOX_HEIGHT / 2;
          const x2 = to.x;
          const y2 = to.y + BOX_HEIGHT / 2;

          return (
            <g key={`init-connector-${idx}`}>
              <path
                d={`M ${x1} ${y1}
                    C ${x1 + 40} ${y1},
                      ${x2 - 40} ${y2},
                      ${x2} ${y2}`}
                fill="none"
                stroke="#bbb"
                strokeWidth="2.5"
              />
            </g>
          );
        })}

        {/* Slots de rondas */}
        {rounds.map((round, roundIndex) => {
          if (!Array.isArray(round)) return null;

          return round.map((slot, positionIndex) => {
            const pos = getBoxPosition(roundIndex, positionIndex);
            const BOX_WIDTH = pos.width;

            const isSingle = !!slot.name && !slot.a && !slot.b;
            const aName = slot.a || null;
            const bName = slot.b || null;
            const singleName = slot.name || null;
            const winner = slot.ganador;

            const winnerNombre = winner ? (typeof winner === 'object' ? winner.nombre : winner) : null;

            if (!bName && aName && !singleName) {
              slot.name = aName;
              delete slot.a;
              delete slot.b;
            }

            const isRecienActualizado = ultimoGanador &&
              ultimoGanador.roundIndex === roundIndex &&
              ultimoGanador.positionIndex === positionIndex;

            return (
              <g
                key={`r${roundIndex}-c${positionIndex}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: isSingle ? (winner ? "default" : "pointer") : "default" }}
              >
                {isRecienActualizado && (
                  <rect
                    x={-4}
                    y={-4}
                    width={BOX_WIDTH + 8}
                    height={BOX_HEIGHT + 8}
                    fill="none"
                    stroke="#ffc107"
                    strokeWidth="4"
                    rx="16"
                    ry="16"
                    opacity="0.8"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.8;0.3;0.8"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}

                {isSingle ? (
                  <>
                    <rect
                      x={0}
                      y={0}
                      width={BOX_WIDTH}
                      height={BOX_HEIGHT}
                      className={winner ? "bracket-box winner" : (positionIndex % 2 === 0 ? "bracket-box blue" : "bracket-box red")}
                      rx="12"
                      ry="12"
                    />
                    <text
                      x={BOX_WIDTH / 2}
                      y={BOX_HEIGHT / 2 + 5}
                      fontSize="16"
                      textAnchor="middle"
                      fill={singleName ? "#000" : "#999"}
                      style={{ fontWeight: singleName === winner ? "700" : "600", pointerEvents: "none" }}
                    >
                      {singleName || "—"}
                    </text>

                    {!winner && (
                      <rect
                        x={0}
                        y={0}
                        width={BOX_WIDTH}
                        height={BOX_HEIGHT}
                        fill="transparent"
                        onClick={() => handleAdvance(slot, singleName, roundIndex, positionIndex)}
                        style={{ cursor: "pointer" }}
                        rx="12"
                        ry="12"
                      />
                    )}
                  </>
                ) : (
                  <>
                    <g>
                      <rect
                        x={0}
                        y={0}
                        width={BOX_WIDTH / 2 - SLOT_GAP / 2}
                        height={BOX_HEIGHT}
                        className={aName === winnerNombre ? "bracket-box winner" : "bracket-box blue"}
                        rx="12"
                        ry="12"
                      />
                      <text
                        x={(BOX_WIDTH / 2 - SLOT_GAP / 2) / 2}
                        y={BOX_HEIGHT / 2 + 5}
                        fontSize="14"
                        textAnchor="middle"
                        fill={aName ? "#000" : "#999"}
                        style={{ fontWeight: aName === winner ? "700" : "600", pointerEvents: "none" }}
                        lengthAdjust="spacingAndGlyphs"
                        textLength={(BOX_WIDTH / 2 - SLOT_GAP / 2) - 16}
                      >
                        {aName || "—"}
                      </text>

                      {aName && !winner && aName !== "—" && (
                        <rect
                          x={0}
                          y={0}
                          width={BOX_WIDTH / 2 - SLOT_GAP / 2}
                          height={BOX_HEIGHT}
                          fill="transparent"
                          onClick={() => handleAdvance(slot, aName, roundIndex, positionIndex)}
                          style={{ cursor: "pointer" }}
                          rx="12"
                          ry="12"
                        />
                      )}
                    </g>

                    <g>
                      <rect
                        x={BOX_WIDTH / 2 + SLOT_GAP / 2}
                        y={0}
                        width={BOX_WIDTH / 2 - SLOT_GAP / 2}
                        height={BOX_HEIGHT}
                        className={bName === winnerNombre ? "bracket-box winner" : "bracket-box red"}
                        rx="12"
                        ry="12"
                      />
                      <text
                        x={BOX_WIDTH / 2 + SLOT_GAP / 2 + (BOX_WIDTH / 2 - SLOT_GAP / 2) / 2}
                        y={BOX_HEIGHT / 2 + 5}
                        fontSize="14"
                        textAnchor="middle"
                        fill={bName ? "#000" : "#999"}
                        style={{ fontWeight: bName === winner ? "700" : "600", pointerEvents: "none" }}
                        lengthAdjust="spacingAndGlyphs"
                        textLength={(BOX_WIDTH / 2 - SLOT_GAP / 2) - 16}
                      >
                        {bName || "—"}
                      </text>

                      {bName && !winner && bName !== "—" && (
                        <rect
                          x={BOX_WIDTH / 2 + SLOT_GAP / 2}
                          y={0}
                          width={BOX_WIDTH / 2 - SLOT_GAP / 2}
                          height={BOX_HEIGHT}
                          fill="transparent"
                          onClick={() => handleAdvance(slot, bName, roundIndex, positionIndex)}
                          style={{ cursor: "pointer" }}
                          rx="12"
                          ry="12"
                        />
                      )}
                    </g>
                  </>
                )}

                {winner && (
                  <g
                    onClick={(e) => handleUndo(slot, roundIndex, positionIndex)}
                    style={{ cursor: "pointer" }}
                  >
                    {(() => {
                      const winnerNombre = typeof winner === 'object' ? winner.nombre : winner;
                      const isA = slot.a === winnerNombre;
                      const isB = slot.b === winnerNombre;
                      const isSingle = !!slot.name;
                      
                      if (isSingle) {
                        return (
                          <>
                            <rect
                              x={BOX_WIDTH / 2 - 45}
                              y={BOX_HEIGHT / 2 - 12}
                              width={90}
                              height={24}
                              fill="#ffd700"
                              rx="12"
                              ry="12"
                              opacity="0.95"
                              filter="drop-shadow(0 2px 8px rgba(255, 215, 0, 0.4))"
                            />
                            <text
                              x={BOX_WIDTH / 2 - 28}
                              y={BOX_HEIGHT / 2 + 6}
                              fontSize="16"
                              textAnchor="middle"
                              style={{ pointerEvents: "none" }}
                            >
                              🏆
                            </text>
                            <text
                              x={BOX_WIDTH / 2 + 10}
                              y={BOX_HEIGHT / 2 + 5}
                              fontSize="11"
                              textAnchor="middle"
                              fill="#000"
                              style={{ fontWeight: "800", pointerEvents: "none", letterSpacing: "0.5px" }}
                            >
                              GANADOR
                            </text>
                          </>
                        );
                      }

                      if (!isA && !isB) {
                        console.warn('⚠️ Ganador no coincide con ningún slot:', { winnerNombre, slotA: slot.a, slotB: slot.b });
                        return null;
                      }

                      const slotACenter = (BOX_WIDTH / 2 - SLOT_GAP / 2) / 2;
                      const slotBCenter = BOX_WIDTH / 2 + SLOT_GAP / 2 + (BOX_WIDTH / 2 - SLOT_GAP / 2) / 2;
                      
                      const badgeX = isA ? (slotACenter - 35) : (slotBCenter - 35);

                      return (
                        <>
                          <rect
                            x={badgeX}
                            y={BOX_HEIGHT / 2 - 10}
                            width={70}
                            height={20}
                            fill="#ffd700"
                            rx="10"
                            ry="10"
                            opacity="0.95"
                            filter="drop-shadow(0 2px 6px rgba(255, 215, 0, 0.4))"
                          />
                          <text
                            x={badgeX + 10}
                            y={BOX_HEIGHT / 2 + 5}
                            fontSize="14"
                            textAnchor="middle"
                            style={{ pointerEvents: "none" }}
                          >
                            🏆
                          </text>
                          <text
                            x={badgeX + 40}
                            y={BOX_HEIGHT / 2 + 4}
                            fontSize="9"
                            textAnchor="middle"
                            fill="#000"
                            style={{ fontWeight: "800", pointerEvents: "none", letterSpacing: "0.3px" }}
                          >
                            GANADOR
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
              </g>
            );
          });
        })}

        {/* Líneas conectores entre rondas */}
        {rounds.map((round, roundIndex) => {
          if (roundIndex >= rounds.length - 1) return null;
          
          return round.map((_, positionIndex) => {
            const currentPos = getBoxPosition(roundIndex, positionIndex);
            const nextRoundIndex = roundIndex + 1;
            const nextPositionIndex = Math.floor(positionIndex / 2);
            const nextPos = getBoxPosition(nextRoundIndex, nextPositionIndex);
            
            return (
              <g key={`connector-${roundIndex}-${positionIndex}`}>
                <line
                  x1={currentPos.x + currentPos.width}
                  y1={currentPos.y + BOX_HEIGHT / 2}
                  x2={currentPos.x + currentPos.width + HORIZONTAL_SPACING / 2}
                  y2={currentPos.y + BOX_HEIGHT / 2}
                  stroke="#999"
                  strokeWidth={2}
                />
                <line
                  x1={currentPos.x + currentPos.width + HORIZONTAL_SPACING / 2}
                  y1={currentPos.y + BOX_HEIGHT / 2}
                  x2={currentPos.x + currentPos.width + HORIZONTAL_SPACING / 2}
                  y2={nextPos.y + BOX_HEIGHT / 2}
                  stroke="#999"
                  strokeWidth={2}
                />
                <line
                  x1={currentPos.x + currentPos.width + HORIZONTAL_SPACING / 2}
                  y1={nextPos.y + BOX_HEIGHT / 2}
                  x2={nextPos.x}
                  y2={nextPos.y + BOX_HEIGHT / 2}
                  stroke="#999"
                  strokeWidth={2}
                />
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};

export default BracketDiagram;