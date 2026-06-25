import React from 'react'
import { Document } from '@react-pdf/renderer'
import { HojaDatosPDF } from './hoja-datos-pdf'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TodasHojasPDF({ proyecto, f1, hojas }: { proyecto: any; f1: any; hojas: any[] }) {
  // HojaDatosPDF retorna un <Document> con una <Page>.
  // Para concatenar, extraemos las páginas de cada documento.
  // @react-pdf/renderer permite un Document con múltiples Page de distintas fuentes
  // renderizando cada hoja como páginas dentro de un solo Document.
  return (
    <Document
      title={`Hojas de datos — ${proyecto.nombre}`}
      author="Peregrin"
    >
      {hojas.map(hoja =>
        // Cada HojaDatosPDF retorna un Document — necesitamos sus Pages.
        // Usamos el componente interno directamente pasando las props.
        React.createElement(HojaDatosPDFPages, { key: hoja.tag, proyecto, f1, hoja })
      )}
    </Document>
  )
}

// Versión que retorna solo la Page (sin Document wrapper) para poder componer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HojaDatosPDFPages({ proyecto, f1, hoja }: { proyecto: any; f1: any; hoja: any }) {
  // Importamos las piezas internas del PDF para reutilizarlas sin el Document wrapper
  const { Page: PdfPage } = require('@react-pdf/renderer')
  // En lugar de reimplementar, simplemente re-exportamos la Page de HojaDatosPDF.
  // La forma más limpia es refactorizar HojaDatosPDF para exponer la Page por separado.
  // Por ahora usamos un approach directo: renderizar el contenido de la hoja como Page.
  return React.createElement(HojaDatosPage, { proyecto, f1, hoja })
}

// Re-exportamos el contenido de hoja como Page independiente
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HojaDatosPage({ proyecto, f1, hoja }: { proyecto: any; f1: any; hoja: any }) {
  // Trick: instanciamos HojaDatosPDF y extraemos su primera Page
  // La forma correcta en @react-pdf es tener el contenido separado del Document.
  // Aquí simplemente delegamos a una función que retorna el JSX de la Page.
  const { children } = HojaDatosPDF({ proyecto, f1, hoja }).props
  // children es el array de Pages del Document
  return Array.isArray(children) ? children[0] : children
}
