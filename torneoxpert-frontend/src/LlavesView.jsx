import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Llaves from "./Llaves";
import { Link } from "react-router-dom";
import "./LLavesView.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function LlavesGeneralView() {

  const [bracketsCombate, setBracketsCombate] = useState([]);
  const [bracketsForma, setBracketsForma] = useState([]);
  const [todosCompetidores, setTodosCompetidores] = useState([]);
  const [competidoresFiltrados, setCompetidoresFiltrados] = useState([]);
  const [exhibiciones, setExhibiciones] = useState([]);
  const [rivalManual, setRivalManual] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroGenero, setFiltroGenero] = useState("");
  const [filtroEdad, setFiltroEdad] = useState("");
  const [filtroGraduacion, setFiltroGraduacion] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [mostrarFormas, setMostrarFormas] = useState(false);
  const [dnisState, setDnisState] = useState([]);

  const llavesRef = useRef(null);

  const navigate = useNavigate();
  const volverAlMenu = () => navigate("/");

  // Fetch inicial
  useEffect(() => {

    fetch(`${API_URL}/api/brackets`)
      .then(res => res.json())
      .then(data => {
        setBracketsCombate(data.brackets || []);
        setExhibiciones(data.exhibiciones || []);
      })
      .catch(err => console.error("Error al cargar brackets:", err));

    fetch(`${API_URL}/api/brackets-forma`)
      .then(res => res.json())
      .then(data => setBracketsForma(data.brackets || []))
      .catch(err => console.error("Error al cargar brackets-forma:", err));

    fetch(`${API_URL}/api/competidores`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTodosCompetidores(data);
        else if (Array.isArray(data.competidores)) setTodosCompetidores(data.competidores);
        else setTodosCompetidores([]);
      })
      .catch(err => console.error("Error al cargar competidores:", err));

  }, []);

  // Filtro de competidores
  useEffect(() => {

    const filtrados = todosCompetidores.filter((c) => {

      const coincideNombre = c.nombre?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideGenero = filtroGenero ? c.genero?.toLowerCase() === filtroGenero.toLowerCase() : true;
      const coincideEdad = filtroEdad ? c.edad === Number(filtroEdad) : true;
      const coincideGraduacion = filtroGraduacion ? c.graduacion?.toLowerCase() === filtroGraduacion.toLowerCase() : true;
      const coincideCategoria = filtroCategoria ? c.categoria?.toLowerCase() === filtroCategoria.toLowerCase() : true;

      return coincideNombre && coincideGenero && coincideEdad && coincideGraduacion && coincideCategoria;

    });

    setCompetidoresFiltrados(filtrados);

  }, [todosCompetidores, busqueda, filtroGenero, filtroEdad, filtroGraduacion, filtroCategoria]);

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

      <div className="panel-central">

        <h1>Llaves de Competencia</h1>

        {/* Switch Combate / Formas */}
        <div className="switch-container">

          <label className="switch">
            <input
              type="checkbox"
              checked={mostrarFormas}
              onChange={() => setMostrarFormas(!mostrarFormas)}
            />
            <span className="slider round"></span>
          </label>

          <span>{mostrarFormas ? "Mostrando Formas" : "Mostrando Combate"}</span>

        </div>

        <Link className="btn-volver" to="/brackets">
          Combate Exhibicion
        </Link>

        <div className="buscador-container">

          <h2>Buscar competidor</h2>

          <label>
            Nombre:
            <input
              type="text"
              placeholder="Nombre"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </label>

          <label>
            Graduación:
            <select value={filtroGraduacion} onChange={e => setFiltroGraduacion(e.target.value)}>
              <option value="">Todas las graduaciones</option>
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
              <option value="Negro VI Dan">Negro VI Dan</option>
            </select>
          </label>

          <label>
            Categoría:
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
              <option value="">Todas las categorías</option>
              <option value="Infantil">Infantil</option>
              <option value="Juvenil">Juvenil</option>
              <option value="Adultos">Adultos</option>
              <option value="Veteranos">Veteranos</option>
            </select>
          </label>

          <label>
            Género:
            <select value={filtroGenero} onChange={e => setFiltroGenero(e.target.value)}>
              <option value="">Todos los géneros</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </label>

          <label>
            Edad:
            <input
              type="number"
              placeholder="Edad"
              value={filtroEdad}
              onChange={e => setFiltroEdad(e.target.value)}
              min="0"
            />
          </label>

          <div className="resultados-busqueda">

            {competidoresFiltrados.length === 0 ? (

              <p>No se encontraron competidores.</p>

            ) : (

              <div className="scrollable-list">

                <ul>

                  {competidoresFiltrados.map(c => (

                    <li key={c.id} className="competidor-item">

                      <strong>{c.nombre}</strong>

                      <span>
                        {c.genero} • {c.categoria} • {c.graduacion} • {c.edad} años
                      </span>

                    </li>

                  ))}

                </ul>

              </div>

            )}

          </div>

        </div>

        {/* Llaves */}
        {!mostrarFormas ? (

          <>
            {bracketsCombate.length === 0 ? (
              <p>No hay llaves de combate para mostrar.</p>
            ) : (
              <Llaves
                ref={llavesRef}
                competidoresCompletos={todosCompetidores}
                brackets={bracketsCombate}
                modo="combate"
              />
            )}
          </>

        ) : (

          <>
            {bracketsForma.length === 0 ? (
              <p>No hay llaves de formas para mostrar.</p>
            ) : (
              <Llaves brackets={bracketsForma} modo="forma" />
            )}
          </>

        )}

        {/* Botón volver */}
        <div className="botones-container">

          <button
            className="btn-volver"
            onClick={volverAlMenu}
          >
            Volver al menú
          </button>

        </div>

      </div>

    </div>

  );

}

export default LlavesGeneralView;