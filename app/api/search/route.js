import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Función para normalizar texto, eliminando acentos y convirtiendo a minúsculas
const normalizeText = (text) => {
  return text
    .normalize("NFD") // Descompone el texto en caracteres base + diacríticos
    .replace(/[\u0300-\u036f]/g, "") // Remueve los diacríticos (acentos)
    .toLowerCase(); // Convierte a minúsculas
};

// Función para generar el nombre limpio del archivo
const cleanFileName = (fileName) => {
  // Reemplazar guiones bajos por espacios y eliminar la extensión
  let cleanedFileName = fileName.replace(/_/g, ' ').replace('.json', '');
  // Eliminar el contenido entre el último "[" y "]"
  cleanedFileName = cleanedFileName.replace(/\[.*?\]$/, '');
  return cleanedFileName.trim(); // Eliminar espacios extra
};

// Función para extraer la fecha del nombre del archivo
const extractDateFromFileName = (fileName) => {
  const months = {
    enero: '01',
    febrero: '02',
    marzo: '03',
    abril: '04',
    mayo: '05',
    junio: '06',
    julio: '07',
    agosto: '08',
    septiembre: '09',
    octubre: '10',
    noviembre: '11',
    diciembre: '12'
  };

  // Expresión regular para buscar el patrón "Día Mes Año"
  const dateRegex = /(\d{1,2}) de (\w+) de (\d{4})/;
  const match = fileName.match(dateRegex);

  if (match) {
    const day = match[1].padStart(2, '0'); // Día con dos dígitos
    const month = months[match[2].toLowerCase()]; // Convertir mes a número
    const year = match[3];
    
    // Retornar la fecha en formato DD/MM/AA
    return `${day}/${month}/${year.slice(-2)}`;
  }
  return null; // No se encontró una fecha
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = 12; // Mostrar solo 10 resultados por página

    if (!query) {
      return NextResponse.json({ message: "Query is required" }, { status: 400 });
    }

    const normalizedQuery = normalizeText(query);

    const directoryPath = path.join(process.cwd(), 'data');
    const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.json'));

    let allResults = [];

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      const jsonData = fs.readFileSync(filePath, 'utf-8');
      
      let data;
      try {
        data = JSON.parse(jsonData);
      } catch (error) {
        console.error(`Error parsing JSON file ${file}:`, error);
        return;
      }

      // Filtrar resultados, normalizando el texto también
      const results = data.filter(entry => 
        normalizeText(entry.text).includes(normalizedQuery)
      );

      // Extraer texto entre corchetes y generar el link embed de YouTube con el tiempo de inicio
      const youtubeLinkMatch = file.match(/\[(.*?)\]/);
      const videoId = youtubeLinkMatch ? youtubeLinkMatch[1] : '';

      // Limpiar nombre del archivo
      const cleanedFileName = cleanFileName(file);
      
      // Extraer la fecha si existe
      const fileDate = extractDateFromFileName(cleanedFileName);

      const fileResults = results.map(result => ({
        text: result.text, // Solo muestra el texto de la coincidencia
        fileName: cleanedFileName, // Nombre del video limpio
        youtubeLink: `https://www.youtube.com/embed/${videoId}?start=${Math.floor(result.start)}`, // Generar el link embed con el tiempo
        thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`, // URL de la miniatura del video
        date: fileDate // Fecha extraída del nombre del archivo en formato DD/MM/AA (opcional)
      }));

      allResults = [...allResults, ...fileResults];
    });

    const totalResults = allResults.length;
    const paginatedResults = allResults.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      results: paginatedResults,
      totalResults,
      totalPages: Math.ceil(totalResults / pageSize),
      currentPage: page
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
