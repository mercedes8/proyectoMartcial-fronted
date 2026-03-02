import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Trophy, User, Swords, AlertCircle, RefreshCw } from 'lucide-react';
import "./TournamentBracket.css";

const TournamentBracket = () => {
  const [brackets, setBrackets] = useState([]);
  const [exhibiciones, setExhibiciones] = useState([]);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allCompetitors, setAllCompetitors] = useState([]);
  const navigate = useNavigate();
  const VolverAllaves = () => navigate("/llaves");
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // cargar competidores
      const compRes = await fetch('/api/competidores');
      const compData = await compRes.json();
      setAllCompetitors(compData);

      // cargar brackets SOLO COMBATE
      const response = await fetch('/api/brackets');
      const data = await response.json();

      setBrackets(data.brackets || []);
      setExhibiciones(data.exhibiciones || []);

      if (data.brackets && data.brackets.length > 0) {
        setSelectedGrupo(data.brackets[0].grupo);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    try {
      setLoading(true);

      // Generar SOLO COMBATE
      const response = await fetch('/api/generar-brackets');
      const data = await response.json();

      setBrackets(data.brackets || []);
      setExhibiciones(data.exhibiciones || []);

      if (data.brackets && data.brackets.length > 0) {
        setSelectedGrupo(data.brackets[0].grupo);
      }
    } catch (error) {
      console.error('Error generando brackets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerar = async () => {
    if (!confirm('¿Estás seguro? Esto borrará todos los ganadores guardados.')) return;

    try {
      setLoading(true);

      const response = await fetch('/api/regenerar-brackets');
      const data = await response.json();

      setBrackets(data.brackets || []);
      setExhibiciones(data.exhibiciones || []);

      if (data.brackets && data.brackets.length > 0) {
        setSelectedGrupo(data.brackets[0].grupo);
      }
    } catch (error) {
      console.error('Error regenerando brackets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarRival = async (exhibicion, rivalId) => {
    try {
      const response = await fetch('/api/exhibiciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competidor_id: exhibicion.competidor.id,
          rival_id: rivalId,
          grupo: exhibicion.grupo
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Exhibición guardada correctamente');
        fetchData();
      }
    } catch (error) {
      console.error('Error guardando exhibición:', error);
      alert('Error al guardar la exhibición');
    }
  };

  const handleRegistrarGanador = async (grupo, etapa, ganador) => {
    try {
      const response = await fetch('/api/ganador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupo,
          etapa,
          ganador
        })
      });

      const data = await response.json();

      if (data.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error registrando ganador:', error);
    }
  };

  const selectedBracket = brackets.find(b => b.grupo === selectedGrupo);

  // Función auxiliar para obtener datos completos del competidor
  const getCompetitorData = (nombre) => {
    if (!nombre || nombre === 'TBD') return null;
    return allCompetitors.find(comp => comp.nombre === nombre);
  };

  const CombateCard = ({ par, index, etapa }) => {
    if (!par) return null;

    const { a, b } = par;
    const isBye = a && !b;
    
    const competitorA = getCompetitorData(a);
    const competitorB = getCompetitorData(b);

    return (
      <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 text-sm font-semibold flex items-center justify-between">
          <span>Combate {index + 1}</span>
          <Swords className="w-4 h-4" />
        </div>

        <div className="p-3 space-y-2">
          {/* Competidor A */}
           <div className="p-2 rounded bg-blue-50 border border-blue-200">
            {competitorA ? (
              <div className="space-y-1">
                <p className="font-semibold text-gray-800">{competitorA.nombre}</p>
                <p className="text-xs text-gray-600">{competitorA.escuela} • {competitorA.graduacion}</p>
                <p className="text-xs text-gray-600">Peso: {competitorA.peso}kg • Altura: {competitorA.altura}cm • Edad: {competitorA.edad} años</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">{a || 'TBD'}</span>
              </div>
            )}
          </div>

          {/* VS o BYE */}
          {isBye ? (
            <div className="text-center py-1">
              <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                ✓ PASA AUTOMÁTICAMENTE
              </span>
            </div>
          ) : (
            <div className="text-center py-1">
              <span className="text-xs font-bold text-red-500">VS</span>
            </div>
          )}

          {/* Competidor B */}
          {b && (
            <div className="p-2 rounded bg-red-50 border border-red-200">
              {competitorB ? (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-800">{competitorB.nombre}</p>
                  <p className="text-xs text-gray-600">{competitorB.escuela} • {competitorB.graduacion}</p>
                  <p className="text-xs text-gray-600">Peso: {competitorB.peso}kg • Altura: {competitorB.altura}cm • Edad: {competitorB.edad} años</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-800">{b}</span>
                </div>
              )}
            </div>
          )}

          {/* Botones para registrar ganador */}
          {!isBye && a && b && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleRegistrarGanador(selectedBracket.grupo, etapa + (index + 1), a)}
                className="flex-1 bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600 transition"
              >
                Ganó {a.split(' ')[0]}
              </button>
              <button
                onClick={() => handleRegistrarGanador(selectedBracket.grupo, etapa + (index + 1), b)}
                className="flex-1 bg-red-500 text-white text-xs py-1 px-2 rounded hover:bg-red-600 transition"
              >
                Ganó {b.split(' ')[0]}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const EtapaSection = ({ titulo, combates, etapa }) => {
    if (!combates || combates.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          {titulo}
          <span className="text-sm font-normal text-gray-500">
            ({combates.filter(c => c).length}{' '}
            {combates.filter(c => c).length === 1 ? 'combate' : 'combates'})
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combates.map(
            (combate, i) =>
              combate && <CombateCard key={i} par={combate} index={i} etapa={etapa} />
          )}
        </div>
      </div>
    );
  };

  const ExhibicionCard = ({ exhibicion }) => {
    const [rivalSeleccionado, setRivalSeleccionado] = useState('');

    const combateGenerado = !exhibicion.requiereSeleccion;
    const competitorData = exhibicion.competidor;

    return (
      <div
    className={`relative border-2 rounded-lg p-4 shadow-md transition ${
      combateGenerado
        ? "bg-gray-300 border-gray-400 opacity-70 pointer-events-none"
        : "bg-green-100 border-green-300"
    }`}
  >

        {/* Cartel verde arriba */}
        {combateGenerado && (
          <div className="absolute top-0 left-0 right-0 bg-green-600 text-white text-center py-1 text-xs font-bold rounded-t-lg shadow">
            ✔ COMBATE GENERADO
          </div>
        )}

        <div className="flex items-center gap-2 mb-3 mt-6">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <h4 className="font-bold text-gray-800">
            {combateGenerado ? "Exhibición Confirmada" : "Exhibición Pendiente"}
          </h4>
        </div>

         <div className="mb-3">
          <div className="p-2 bg-white rounded border border-gray-200">
            <p className="font-semibold text-gray-800">{competitorData.nombre}</p>
            <p className="text-xs text-gray-600">{competitorData.escuela} • {competitorData.graduacion}</p>
            <p className="text-xs text-gray-600">Peso: {competitorData.peso}kg • Altura: {competitorData.altura}cm • Edad: {competitorData.edad} años</p>
          </div>
        </div>

        {/* Mostrar selector solo si FALTA elegir rival */}
        {!combateGenerado && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Seleccionar rival:</label>

            <select
              value={rivalSeleccionado}
              onChange={(e) => setRivalSeleccionado(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">-- Elegir competidor --</option>
              {exhibicion.todosLosCompetidores?.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.nombre} - {comp.escuela} ({comp.graduacion})
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (rivalSeleccionado) {
                  handleSeleccionarRival(exhibicion, rivalSeleccionado);
                }
              }}
              disabled={!rivalSeleccionado}
              className="w-full bg-yellow-500 text-white py-2 px-4 rounded font-semibold hover:bg-yellow-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Confirmar Rival
            </button>
          </div>
        )}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando brackets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Brackets de Torneo
          </h1>

          {/* Botones */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleRegenerar}
              className="px-4 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerar
            </button>
            <button
              onClick={VolverAllaves}
              className="px-4 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2"
            >
              Volver a Llaves
            </button>
          </div>
        </div>

        {/* Exhibiciones */}
        {exhibiciones.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              Exhibiciones Pendientes ({exhibiciones.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exhibiciones.map((exhibicion, i) => (
                <ExhibicionCard key={i} exhibicion={exhibicion} />
              ))}
            </div>
          </div>
        )}

        {/* Brackets */}
        {brackets.length === 0 && exhibiciones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">No hay brackets disponibles</h2>
            <p className="text-gray-500 mb-4">Genera los brackets para comenzar</p>
            <button
              onClick={handleGenerar}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              Generar Brackets
            </button>
          </div>
        ) : (
          selectedBracket && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
              
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TournamentBracket;