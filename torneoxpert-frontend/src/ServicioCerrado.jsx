import React from 'react';
import './form.css';

export default function ServicioCerrado() {
  return (
    <main>
      <section>
        <div className="form-container" style={{
          textAlign: 'center',
          padding: '50px 20px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            fontSize: '80px',
            marginBottom: '20px'
          }}>
            🔒
          </div>
          
          <h1 className="form-title" style={{
            fontSize: '2.5em',
            marginBottom: '20px',
            color: '#333'
          }}>
            Registros Cerrados
          </h1>
          
          <p style={{
            fontSize: '1.2em',
            color: '#666',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Las inscripciones para este evento han finalizado.
          </p>
          
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '30px',
            borderRadius: '10px',
            marginTop: '30px'
          }}>
            <h2 style={{
              fontSize: '1.8em',
              marginBottom: '15px',
              color: '#2c3e50'
            }}>
              ¡Gracias por usar nuestros servicios!
            </h2>
            <p style={{
              fontSize: '1.3em',
              fontWeight: 'bold',
              color: '#3498db',
              margin: '10px 0'
            }}>
              MSJ TEC
            </p>
            <p style={{
              fontSize: '1.3em',
              fontWeight: 'bold',
              color: '#e74c3c'
            }}>
              Torneo Xpert
            </p>
          </div>
          
          <button
            className="btn-primary"
            style={{
              marginTop: '30px',
              padding: '15px 40px',
              fontSize: '1.1em'
            }}
            onClick={() => window.location.href = '/'}
          >
            Volver al Inicio
          </button>
        </div>
      </section>
    </main>
  );
}