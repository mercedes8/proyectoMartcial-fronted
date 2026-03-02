import React, { useState, useEffect, useCallback } from 'react';
import './Tatamimanager.css';

const TatamiManager = ({ initialTatamiData = null, tatamiId, onDataUpdate }) => {
  // Estados del componente
  const [tatamiData, setTatamiData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allCompetitors, setAllCompetitors] = useState([]);
  const [filteredCompetitors, setFilteredCompetitors] = useState([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // URL base para las imágenes
  const BASE_URL = 'https://torneoxpert.digital';

  // Función para agrupar competidores por ID y combinar modalidades
  const groupCompetitorsByModalidad = useCallback((competitors) => {
    const grouped = {};
    
    competitors.forEach(competitor => {
      if (!grouped[competitor.dorsal]) {
        // Crear nuevo competidor con array de modalidades
        grouped[competitor.dorsal] = {
          ...competitor,
          modalidades: []
        };
      }
      // Agregar modalidad si no existe
      if (competitor.modalidad && !grouped[competitor.dorsal].modalidades.includes(competitor.modalidad)) {
        grouped[competitor.dorsal].modalidades.push(competitor.modalidad);
      }
    });

    return Object.values(grouped);
  }, []);

  // Cargar todos los competidores desde la base de datos
  const fetchAllCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/competidores');
      if (!response.ok) {
        throw new Error('Error al cargar competidores');
      }
      const competitors = await response.json();
      
      // SOLUCIÓN: Agrupar competidores por ID
      const groupedCompetitors = groupCompetitorsByModalidad(competitors);
      
      setAllCompetitors(groupedCompetitors);
      
    } catch (err) {
      console.error('Error fetching competitors:', err);
      setError('Error al cargar la lista de competidores');
    } finally {
      setLoading(false);
    }
  }, [groupCompetitorsByModalidad]);

  // Renderizar badges de modalidades
  const renderModalidadesBadge = (competitor) => {
    const modalidades = competitor.modalidades || [competitor.modalidad];
    
    return (
      <div className="modalidades-badges">
        {modalidades.map((modalidad, index) => (
          <span 
            key={index}
            className={`modalidad-badge ${modalidad}`}
          >
            {modalidad === 'combate' ? '🥊 Combate' : '🥋 Formas'}
          </span>
        ))}
      </div>
    );
  };

  // Manejar errores de carga de imágenes
  const handleImageError = useCallback((imageType, competitorId) => {
    setImageErrors(prev => ({
      ...prev,
      [`${imageType}_${competitorId}`]: true
    }));
  }, []);

  // Función para obtener la URL completa de la imagen
  const getImageUrl = (competitor, imageType) => {
    if (imageType === 'competitor' && competitor.fotoPerfil) {
      if (!imageErrors[`competitor_${competitor.id}`]) {
        if (competitor.fotoPerfil.startsWith('http')) {
          return competitor.fotoPerfil;
        }
        return `${BASE_URL}/uploads/${competitor.fotoPerfil}`;
      }
    }
    
    if (imageType === 'school' && competitor.logoEscuela) {
      if (!imageErrors[`school_${competitor.id}`]) {
        if (competitor.logoEscuela.startsWith('http')) {
          return competitor.logoEscuela;
        }
        const cleanLogoPath = competitor.logoEscuela.replace('/uploads//uploads/', '/uploads/');
        return `${BASE_URL}${cleanLogoPath}`;
      }
    }
    
    return null;
  };

  // Renderizar avatar del competidor
  const renderCompetitorAvatar = (competitor, size = 'medium') => {
    const imageUrl = getImageUrl(competitor, 'competitor');
    const sizeClass = `avatar-${size}`;
    
    if (imageUrl) {
      return (
        <div className={`competitor-avatar ${sizeClass}`}>
          <img 
            src={imageUrl} 
            alt={competitor.nombre}
            onError={() => handleImageError('competitor', competitor.id)}
          />
        </div>
      );
    }
    
    // Fallback a avatar con iniciales y color por género
    const fallbackColor = competitor.genero === 'femenino' 
      ? 'linear-gradient(135deg, #e91e63, #ad1457)' 
      : 'linear-gradient(135deg, #2196f3, #1565c0)';
    
    return (
      <div 
        className={`competitor-avatar ${sizeClass} avatar-fallback`}
        style={{ background: fallbackColor }}
      >
        {competitor.nombre ? competitor.nombre.charAt(0).toUpperCase() : 'C'}
      </div>
    );
  };

  // Renderizar logo de la escuela
  const renderSchoolLogo = (competitor, size = 'small') => {
    const logoUrl = getImageUrl(competitor, 'school');
    const sizeClass = `school-logo-${size}`;
    
    if (logoUrl) {
      return (
        <div className={`school-logo ${sizeClass}`}>
          <img 
            src={logoUrl} 
            alt={`Escuela ${competitor.escuela}`}
            onError={() => handleImageError('school', competitor.id)}
          />
        </div>
      );
    }
    
    // Fallback a ícono por defecto
    return (
      <div className={`school-logo ${sizeClass} school-logo-fallback`}>
        <i className="fas fa-school"></i>
      </div>
    );
  };

  // Obtener color de graduación
  const getGraduationColor = (graduacion) => {
    const colors = {
      'blanco': '#ffffff',
      'amarillo': '#ffeb3b',
      'verde': '#4caf50',
      'azul': '#2196f3',
      'rojo': '#b00202',
      'negro': '#000000'
    };
    
    for (const [color, hex] of Object.entries(colors)) {
      if (graduacion.toLowerCase().includes(color)) {
        return hex;
      }
    }
    
    return '#6c757d';
  };

  // Inicializar datos del tatami y cargar competidores
  useEffect(() => {
    const initializeData = () => {
      setLoading(true);
      try {
        const savedData = localStorage.getItem(`tatami-${tatamiId}`);
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setTatamiData(parsedData);
          setMatches(parsedData.matches || []);
        } else if (initialTatamiData) {
          setTatamiData(initialTatamiData);
          setMatches(initialTatamiData.matches || []);
          saveToLocalStorage(initialTatamiData);
        }
      } catch (err) {
        setError('Error al cargar los datos del tatami');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    fetchAllCompetitors();
  }, [tatamiId, initialTatamiData, fetchAllCompetitors]);

  // Guardar datos en localStorage
  const saveToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem(`tatami-${tatamiId}`, JSON.stringify(data));
    } catch (err) {
      console.error('Error guardando en localStorage:', err);
    }
  }, [tatamiId]);

  // Manejar búsqueda
  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredCompetitors([]);
      return;
    }

    const searchLower = term.toLowerCase();
    const filtered = allCompetitors.filter(competitor => 
      competitor.nombre?.toLowerCase().includes(searchLower) ||
      competitor.dorsal?.toLowerCase().includes(searchLower) ||
      competitor.dni?.toLowerCase().includes(searchLower) ||
      competitor.escuela?.toLowerCase().includes(searchLower) ||
      competitor.categoria?.toLowerCase().includes(searchLower) ||
      competitor.graduacion?.toLowerCase().includes(searchLower) ||
      competitor.instructor?.toLowerCase().includes(searchLower) // ← NUEVO FILTRO
    );
    
    setFilteredCompetitors(filtered);
  };

  // Función para seleccionar un competidor
  const handleSelectCompetitor = (competitor) => {
    setSelectedCompetitor(competitor);
    setSearchTerm('');
    setFilteredCompetitors([]);
  };

  // Cerrar detalles del competidor
  const handleCloseDetails = () => {
    setSelectedCompetitor(null);
  };

  // Renderizar estado de carga
  if (loading && !searchTerm) {
    return (
      <div className="tatami-manager loading">
        <div className="loader"></div>
        <p>Cargando datos del tatami...</p>
      </div>
    );
  }

  // Renderizar estado de error
  if (error && !searchTerm) {
    return (
      <div className="tatami-manager error">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tatami-manager">
      {/* Header del tatami */}
      {tatamiData && !searchTerm && !selectedCompetitor && (
        <div className="tatami-header">
          <div className="tatami-info">
            <div className="tatami-details">
            </div>
          </div>
          <div className="tatami-stats">
            <div className="stat">
              <span className="stat-value">{matches.length}</span>
              <span className="stat-label">Combates</span>
            </div>
            <div className="stat">
              <span className="stat-value">{allCompetitors.length}</span>
              <span className="stat-label">Competidores</span>
            </div>
          </div>
        </div>
      )}

      {/* Panel de búsqueda */}
      <div className="search-container">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por nombre, dorsal, DNI, escuela, categoría, instructor o graduación..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => {
                setSearchTerm('');
                setFilteredCompetitors([]);
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="search-results">
            {loading ? (
              <div className="search-loading">
                <div className="small-loader"></div>
                <span>Buscando competidores...</span>
              </div>
            ) : filteredCompetitors.length > 0 ? (
              <div className="competitors-list">
                <div className="search-results-header">
                  <h4>Resultados de búsqueda ({filteredCompetitors.length})</h4>
                </div>
                {filteredCompetitors.map(competitor => (
                  <div 
                    key={competitor.id} 
                    className="competitor-item"
                    onClick={() => handleSelectCompetitor(competitor)}
                  >
                    {renderCompetitorAvatar(competitor, 'small')}
                    <div className="competitor-info">
                      <div className="competitor-main">
                        <span className="competitor-name">{competitor.nombre}</span>
                        <span className="competitor-dorsal">Dorsal: {competitor.dorsal}</span>
                        {renderModalidadesBadge(competitor)}
                      </div>
                      <div className="competitor-details">
                        <span className="competitor-dni">DNI: {competitor.dni}</span>
                        <div className="school-info">
                          {renderSchoolLogo(competitor, 'x-small')}
                          <span className="competitor-school">{competitor.escuela}</span>
                        </div>
                        <span className="competitor-category">{competitor.categoria}</span>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right"></i>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <i className="fas fa-search"></i>
                <p>No se encontraron competidores</p>
                <span>Intenta con otro término de búsqueda</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detalles del competidor seleccionado */}
      {selectedCompetitor && (
        <div className="competitor-detail-panel">
          <div className="detail-header">
            <button className="back-button" onClick={handleCloseDetails}>
              <i className="fas fa-arrow-left"></i>
              Volver
            </button>
            <h2>Detalles del Competidor</h2>
          </div>
          <div className="competitor-detail-content">
            <div className="competitor-profile">
              {renderCompetitorAvatar(selectedCompetitor, 'large')}
              <div className="profile-info">
                <h3>{selectedCompetitor.nombre}</h3>
                <div className="school-with-logo">
                  {renderSchoolLogo(selectedCompetitor, 'medium')}
                  <div className="school-details">
                    <span className="school-name">{selectedCompetitor.escuela}</span>
                    <span className="instructor">Instructor: {selectedCompetitor.instructor}</span>
                  </div>
                </div>
                <div 
                  className="graduation-badge large"
                  style={{ 
                    backgroundColor: getGraduationColor(selectedCompetitor.graduacion),
                    color: selectedCompetitor.graduacion?.toLowerCase().includes('blanco') ? '#000' : '#fff'
                  }}
                >
                  {selectedCompetitor.graduacion}
                </div>
                {renderModalidadesBadge(selectedCompetitor)}
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Dorsal:</span>
                <span className="info-value">{selectedCompetitor.dorsal}</span>
              </div>
              <div className="info-item">
                <span className="info-label">DNI:</span>
                <span className="info-value">{selectedCompetitor.dni}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Categoría:</span>
                <span className="info-value">{selectedCompetitor.categoria}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Edad:</span>
                <span className="info-value">{selectedCompetitor.edad} años</span>
              </div>
              <div className="info-item">
                <span className="info-label">Género:</span>
                <span className="info-value">
                  {selectedCompetitor.genero === 'femenino' ? 'Femenino' : 'Masculino'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Altura:</span>
                <span className="info-value">{selectedCompetitor.altura} cm</span>
              </div>
              <div className="info-item">
                <span className="info-label">Peso:</span>
                <span className="info-value">{selectedCompetitor.peso} kg</span>
              </div>
              <div className="info-item">
                <span className="info-label">Estado:</span>
                <span className={`info-value status-${selectedCompetitor.estado}`}>
                  {selectedCompetitor.estado}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal cuando no hay búsqueda ni competidor seleccionado */}
      {!searchTerm && !selectedCompetitor && (
        <div className="tatami-content">
          <div className="content-section">
            <h2>Competidores Registrados ({allCompetitors.length})</h2>
            {allCompetitors.length > 0 ? (
              <div className="all-competitors-grid">
                {allCompetitors.map(competitor => (
                  <div 
                    key={competitor.id} 
                    className="competitor-card"
                    onClick={() => handleSelectCompetitor(competitor)}
                  >
                    {renderCompetitorAvatar(competitor, 'medium')}
                    <div className="card-content">
                      <h4>{competitor.nombre}</h4>
                      <div className="card-details">
                        <span className="dorsal">#{competitor.dorsal}</span>
                        <span className="category">{competitor.categoria}</span>
                        {renderModalidadesBadge(competitor)}
                        <div className="school-card">
                          {renderSchoolLogo(competitor, 'x-small')}
                          <span>{competitor.escuela}</span>
                        </div>
                      </div>
                      <div 
                        className="graduation-badge small"
                        style={{ 
                          backgroundColor: getGraduationColor(competitor.graduacion),
                          color: competitor.graduacion?.toLowerCase().includes('blanco') ? '#000' : '#fff'
                        }}
                      >
                        {competitor.graduacion}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-users"></i>
                <h3>No hay competidores registrados</h3>
                <p>Los competidores aparecerán aquí cuando se registren</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TatamiManager;