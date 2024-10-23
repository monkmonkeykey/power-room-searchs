'use client';

import { useState, FormEvent } from 'react';

// Definir las interfaces para los resultados y los datos del modal
interface Result {
  text: string;
  fileName: string;
  date: string;
  youtubeLink: string;
  thumbnail: string;
  jsonFileData: { text: string }[]; // Ajusta según tu estructura de jsonFileData
}

interface ModalTextData {
  currentText: string;
  previousTexts: string[];
  nextTexts: string[];
}

// Función auxiliar para agregar timeout a fetch
const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeout);

    fetch(url, options)
      .then(response => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// Función auxiliar para hacer reintentos en caso de fallo
const retryFetch = async (url: string, options: RequestInit = {}, retries = 3, timeout = 10000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      if (response.ok) return response; // Si es exitoso, retornamos la respuesta
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed: ${error.message}`);
      if (i < retries - 1) {
        // Espera de 1 segundo antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  throw new Error('All fetch attempts failed');
};

export default function Home() {
  const [query, setQuery] = useState<string>(''); // Tipo string
  const [results, setResults] = useState<Result[]>([]); // Array de Result
  const [totalResults, setTotalResults] = useState<number>(0); // Tipo number
  const [currentPage, setCurrentPage] = useState<number>(1); // Tipo number
  const [totalPages, setTotalPages] = useState<number>(1); // Tipo number
  const [modalTextData, setModalTextData] = useState<ModalTextData | null>(null); // Estado para mostrar el texto y sus contextos anteriores
  const [modalVideo, setModalVideo] = useState<string | null>(null); // Estado para mostrar el video
  const [noResults, setNoResults] = useState<boolean>(false); // Estado para controlar los resultados vacíos
  const [language, setLanguage] = useState<'es' | 'en'>('es'); // Estado para el idioma (es: español, en: inglés)

  // Función para buscar resultados en base a una query
  const search = async (page = 1) => {
    if (query === '') return;

    try {
      const res = await retryFetch(`/api/search?query=${query}&page=${page}`, {}, 3, 10000); // 3 reintentos, timeout de 10s
      const data = await res.json();

      if (data.results.length === 0) {
        setNoResults(true); // No se encontraron resultados
      } else {
        setResults(data.results);
        setTotalResults(data.totalResults);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setNoResults(false); // Reinicia la bandera de "sin resultados"
      }
    } catch (error) {
      console.error('Search failed:', error.message);
      alert('Hubo un problema al realizar la búsqueda. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para manejar el envío de la búsqueda
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    search(1);
  };

  // Función para cambiar la página
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    search(newPage);
  };

  // Función para abrir el modal de video
  const openVideoModal = (videoUrl: string) => {
    setModalVideo(videoUrl); // Configura la URL del video en el estado modalVideo
  };

  // Función para abrir el modal con el texto y los tres objetos anteriores y posteriores en el mismo archivo JSON
  const openTextModal = (result: Result, index: number) => {
    const jsonFileData = result.jsonFileData || [];
    console.log('Datos JSON:', jsonFileData);

    if (!Array.isArray(jsonFileData)) {
      console.error('jsonFileData no es un array válido:', jsonFileData);
      return;
    }

    // Obtener los 3 textos anteriores y posteriores en el archivo JSON
    const start = Math.max(0, index - 3); // Muestra hasta 3 arrays antes
    const end = Math.min(index + 3, jsonFileData.length - 1); // Muestra hasta 3 arrays después

    // Obtenemos los textos contextuales
    const previousTexts = jsonFileData.slice(start, index);
    const followingTexts = jsonFileData.slice(index + 1, end + 1);

    // Verificar y actualizar el estado del modal con los textos previos y el texto actual
    setModalTextData({
      currentText: result.text, // Texto del resultado actual
      previousTexts: previousTexts.map((item) => item.text), // Mapear solo los textos
      nextTexts: followingTexts.map((item) => item.text), // Mapear solo los textos posteriores
    });

    console.log('Datos del modal:', { currentText: result.text, previousTexts, followingTexts });
  };

  // Función para cerrar cualquier modal
  const closeModal = () => {
    setModalVideo(null);
    setModalTextData(null);
  };

  const changeLanguage = (lang: 'es' | 'en') => {
    setLanguage(lang); // Cambia el idioma
  };

  // Traducciones según el idioma seleccionado
  const translations = {
    es: {
      title: "power · room",
      placeholder: "Escribe una palabra",
      searchButton: "Buscar",
      noResults: `No se encontraron resultados para "${query}". Intenta con otro término.`,
      resultCount: `Se encontraron ${totalResults} resultados.`,
      prevPage: "Anterior",
      nextPage: "Siguiente",
      closeButton: "Cerrar",
    },
    en: {
      title: "Search in JSON files",
      placeholder: "Type a word",
      searchButton: "Search",
      noResults: `No results found for "${query}". Try another term.`,
      resultCount: `${totalResults} results found.`,
      prevPage: "Previous",
      nextPage: "Next",
      closeButton: "Close",
    }
  };

  const t = translations[language];

  // Función para subrayar la palabra de búsqueda en los resultados
  const highlightQuery = (text: string) => {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span style="text-decoration:underline;">$1</span>');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>{t.title}</h1>
        {/* Botones de cambio de idioma */}
        <div style={styles.langSwitch}>
          <button style={styles.langButton} onClick={() => changeLanguage('es')}>Español</button>
          <button style={styles.langButton} onClick={() => changeLanguage('en')}>English</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>{t.searchButton}</button>
        </form>
      </header>

      {noResults ? (
        <p style={styles.noResults}>{t.noResults}</p>
      ) : (
        <p style={styles.resultCount}>{t.resultCount}</p>
      )}

      {/* Resultados de la búsqueda */}
      <div style={styles.grid}>
        {results.length > 0 ? (
          results.map((result, index) => (
            <div key={index} style={styles.resultItem}>
              <img 
                src={result.thumbnail} 
                alt="Thumbnail" 
                style={styles.thumbnail} 
                onClick={() => openVideoModal(result.youtubeLink)} // Abre el modal de video al hacer clic
              />
              <div>
                <p 
                  style={styles.resultText} 
                  dangerouslySetInnerHTML={{ __html: highlightQuery(result.text) }} 
                  onClick={() => openTextModal(result, index)} // Llamada a openTextModal con jsonFileData
                ></p>
                <p><strong>{result.fileName}</strong> - {result.date}</p> {/* Mostrar nombre de archivo y fecha */}
              </div>
            </div>
          ))
        ) : (
          !noResults && <p>No hay resultados</p>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={styles.pageButton}>
            {t.prevPage}
          </button>
          <span style={styles.pageInfo}>Página {currentPage} de {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={styles.pageButton}>
            {t.nextPage}
          </button>
        </div>
      )}

      {/* Modal para el video */}
      {modalVideo && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalCloseButton} onClick={closeModal}>{t.closeButton}</button>
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

      {/* Modal para el texto de la búsqueda con los 3 textos anteriores y posteriores del mismo JSON */}
      {modalTextData && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalCloseButton} onClick={closeModal}>{t.closeButton}</button>
            <div>
              {/* Mostrar los textos anteriores */}
              {modalTextData.previousTexts.map((text, index) => (
                <p key={index}>{text}</p>
              ))}
              {/* Mostrar el texto del resultado actual */}
              <p><strong>Texto actual:</strong> {modalTextData.currentText}</p>
              {/* Mostrar los textos posteriores */}
              {modalTextData.nextTexts.map((text, index) => (
                <p key={index}>{text}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
  },
  langSwitch: {
    display: 'flex',
    gap: '10px',
  },
  langButton: {
    padding: '10px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
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
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  resultCount: {
    textAlign: 'center',
    fontSize: '18px',
    marginBottom: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  resultItem: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '10px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  thumbnail: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  resultText: {
    cursor: 'pointer',
    textDecoration: 'none', // Quitar subrayado
    color: 'inherit', // Mantener el color del texto original
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
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
  },
  pageInfo: {
    fontSize: '16px',
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
    borderRadius: '8px',
    position: 'relative',
    width: '80%',
    maxHeight: '80vh',
    overflowY: 'scroll',
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
};
