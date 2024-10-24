'use client';

import { useState, useEffect } from 'react';
import '../styles/global.css';  // Correcto si deseas usar el archivo en /styles/


export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalVideo, setModalVideo] = useState(null); // Estado para el video del modal
  const [noResults, setNoResults] = useState(false); // Estado para controlar los resultados vacíos
  const [language, setLanguage] = useState('es'); // Estado para el idioma

  // Selección automática del idioma según el sistema operativo o navegador
  useEffect(() => {
    const userLanguage = navigator.language || navigator.userLanguage;
    if (userLanguage.startsWith('es')) {
      setLanguage('es');
    } else {
      setLanguage('en');
    }
  }, []);

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

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        {language === 'es' ? 'Buscar en archivos JSON' : 'Search JSON Files'}
      </h1>
      <button onClick={toggleLanguage} style={styles.button}>
        {language === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
      </button>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === 'es' ? 'Escribe una palabra' : 'Enter a word'}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          {language === 'es' ? 'Buscar' : 'Search'}
        </button>
      </form>

      {noResults ? (
        <p style={styles.noResults}>
          {language === 'es' ? 'No se encontraron resultados para' : 'No results found for'} "{query}".
        </p>
      ) : (
        <p style={styles.resultCount}>
          {language === 'es' ? `Se encontraron ${totalResults} resultados` : `${totalResults} results found`}
        </p>
      )}

      <div style={styles.grid}>
        {results.length > 0 ? (
          results.map((result, index) => (
            <div key={index} style={styles.resultItem}>
              <img
                src={result.thumbnail}
                alt="Thumbnail"
                style={styles.thumbnail}
                onClick={() => openModal(result.youtubeLink)}
              />
              <div>
                <p style={styles.videoTitle}>
                  <strong>{result.fileName}</strong>
                </p>
                <p>{result.text}</p>
              </div>
            </div>
          ))
        ) : (
          !noResults && <p style={styles.noResults}>{language === 'es' ? 'No hay resultados' : 'No results'}</p>
        )}
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={styles.pageButton}
          >
            {language === 'es' ? 'Anterior' : 'Previous'}
          </button>
          <span style={styles.pageInfo}>
            {language === 'es' ? `Página ${currentPage} de ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={styles.pageButton}
          >
            {language === 'es' ? 'Siguiente' : 'Next'}
          </button>
        </div>
      )}

      {modalVideo && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalCloseButton} onClick={closeModal}>
              {language === 'es' ? 'Cerrar' : 'Close'}
            </button>
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
