'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalVideo, setModalVideo] = useState(null); // Estado para el video del modal
  const [noResults, setNoResults] = useState(false); // Nuevo estado para controlar los resultados vacíos

  const search = async (page = 1) => {
    if (query === '') return;

    try {
      const res = await fetch(`/api/search?query=${query}&page=${page}`);
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      const data = await res.json();

      if (data.results.length === 0) {
        setNoResults(true);  // No se encontraron resultados
      } else {
        setResults(data.results);
        setTotalResults(data.totalResults);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setNoResults(false);  // Reinicia la bandera de "sin resultados"
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    search(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    search(newPage);
  };

  const openModal = (videoUrl) => {
    setModalVideo(videoUrl); // Abre el modal con la URL del video
  };

  const closeModal = () => {
    setModalVideo(null); // Cierra el modal
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Buscar en archivos JSON</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe una palabra"
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Buscar</button>
      </form>

      {noResults ? ( // Si no hay resultados, muestra la leyenda
        <p style={styles.noResults}>
          No se encontraron resultados para "{query}". Intenta con otro término.
        </p>
      ) : (
        <p style={styles.resultCount}>Se encontraron {totalResults} resultados.</p>
      )}

      <div style={styles.grid}>
        {results.length > 0 ? (
          results.map((result, index) => (
            <div key={index} style={styles.resultItem}>
              <img 
                src={result.thumbnail} 
                alt="Thumbnail" 
                style={styles.thumbnail} 
                onClick={() => openModal(result.youtubeLink)} // Abre el modal al hacer clic
              />
              <div>
                <p style={styles.videoTitle}><strong>{result.fileName}</strong></p> {/* Nombre del video limpio */}
                <p>{result.text}</p> {/* Texto de la coincidencia */}
              </div>
            </div>
          ))
        ) : (
          !noResults && <p style={styles.noResults}>No hay resultados</p> // Muestra solo si no hay resultados y no es por búsqueda fallida
        )}
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={styles.pageButton}>
            Anterior
          </button>
          <span style={styles.pageInfo}>Página {currentPage} de {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={styles.pageButton}>
            Siguiente
          </button>
        </div>
      )}

      {/* Modal para el video */}
      {modalVideo && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalCloseButton} onClick={closeModal}>Cerrar</button>
            <iframe 
              width="100%" 
              height="400" 
              src={modalVideo} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'GMX', // Usa la fuente personalizada
    backgroundColor: '#1f423f', // Fondo de color retro
    color: '#d2a15e', // Color de texto retro
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    fontFamily: 'GMX', // Fuente personalizada
    fontWeight: 'bold',
    fontSize: '32px',
    color: '#d2a15e', // Color del título
  },
  form: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    marginRight: '10px',
    width: '300px',
    border: '2px solid #d2a15e', // Estilo de borde retro
    color: '#1f423f',
    backgroundColor: '#d2a15e', // Fondo de input retro
    fontFamily: 'GMX',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#d2a15e', // Botón con colores retro
    color: '#1f423f', // Texto oscuro en el botón
    border: '2px solid #d2a15e', // Bordes duros sin redondear
    fontFamily: 'GMX',
    cursor: 'pointer',
  },
  resultCount: {
    textAlign: 'center',
    fontSize: '18px',
    marginBottom: '10px',
    color: '#d2a15e',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  resultItem: {
    border: '2px solid #d2a15e', // Borde recto sin esquinas redondeadas
    padding: '10px',
    textAlign: 'center',
    cursor: 'pointer',
    fontFamily: 'GMX',
    backgroundColor: '#1f423f', // Fondo acorde al estilo
  },
  thumbnail: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    border: '2px solid #d2a15e', // Bordes rectos
  },
  videoTitle: {
    marginTop: '10px',
    fontSize: '16px',
    color: '#d2a15e', // Color de título acorde
    fontFamily: 'GMX',
  },
  noResults: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#d2a15e',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20px',
  },
  pageButton: {
    padding: '10px',
    fontSize: '16px',
    marginRight: '10px',
    cursor: 'pointer',
    backgroundColor: '#d2a15e',
    color: '#1f423f',
    border: '2px solid #d2a15e', // Estilo retro sin bordes redondeados
  },
  pageInfo: {
    fontSize: '16px',
    color: '#d2a15e',
  },
  modalOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '0px', // Evita bordes redondeados
    position: 'relative',
    width: '50vw',
    height: 'auto',
    maxWidth: '1200px',
    border: '2px solid #d2a15e', // Bordes retro
  },
  modalCloseButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#f00',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    padding: '5px 10px',
  },
  modalVideo: {
    width: '100%',
    height: 'auto',
    maxHeight: '90vh',
    objectFit: 'contain',
  },
};
