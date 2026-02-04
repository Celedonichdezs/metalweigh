'use client'

import jsPDF from 'jspdf'

interface TransactionDetail {
  id: string
  quantity: number
  unitPrice: number
  subtotal: number
  material: {
    id: string
    name: string
    code: string
  }
}

interface Client {
  id: string
  name: string
  document: string | null
  documentType: string | null
}

interface Transaction {
  id: string
  folio: string
  type: string
  status: string
  totalWeight: number
  totalAmount: number
  createdAt: string
  details: TransactionDetail[]
  client: Client
}

export function generateTransactionPDF(transaction: Transaction): void {
  // 1/4 de hoja carta = 105mm x 279mm (aprox)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 279] // 1/4 de hoja carta
  })

  // Configuración de fuentes
  doc.setFont('helvetica')
  
  // Márgenes
  const margin = 5
  const pageWidth = 105
  let yPosition = 10

  // Encabezado
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('METALWEIGH', pageWidth / 2, yPosition, { align: 'center' })
  
  yPosition += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Peso y Control', pageWidth / 2, yPosition, { align: 'center' })
  
  yPosition += 10
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 8
  
  // Información de la transacción
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE DE TRANSACCIÓN', margin, yPosition)
  
  yPosition += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  // Folio, fecha y hora
  doc.text(`Folio: ${transaction.folio}`, margin, yPosition)
  yPosition += 5
  doc.text(`Fecha: ${new Date(transaction.createdAt).toLocaleDateString('es-MX')}`, margin, yPosition)
  yPosition += 5
  doc.text(`Hora: ${new Date(transaction.createdAt).toLocaleTimeString('es-MX')}`, margin, yPosition)
  
  yPosition += 8
  
  // Información del cliente
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL CLIENTE', margin, yPosition)
  yPosition += 5
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Nombre: ${transaction.client.name}`, margin, yPosition)
  yPosition += 5
  
  if (transaction.client.document) {
    doc.text(`${transaction.client.documentType || 'Documento'}: ${transaction.client.document}`, margin, yPosition)
    yPosition += 5
  }
  
  yPosition += 8
  
  // Tabla de materiales
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE MATERIALES', margin, yPosition)
  yPosition += 5
  
  // Encabezados de tabla
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  
  const rowHeight = 4
  const col1X = margin
  const col2X = margin + 25
  const col3X = margin + 50
  const col4X = margin + 65
  const col5X = margin + 80
  
  doc.text('Material', col1X, yPosition)
  doc.text('Cantidad', col2X, yPosition)
  doc.text('Peso', col3X, yPosition)
  doc.text('Precio', col4X, yPosition)
  doc.text('Subtotal', col5X, yPosition)
  
  yPosition += rowHeight + 2
  
  // Detalles de materiales
  doc.setFont('helvetica', 'normal')
  let totalWeight = 0
  let totalAmount = 0
  
  transaction.details.forEach((detail, index) => {
    // Verificar si hay espacio para otra fila
    if (yPosition > 220) { // Dejar espacio para totales y pie de página
      doc.addPage()
      yPosition = 10
      
      // Repetir encabezados en nueva página
      doc.setFont('helvetica', 'bold')
      doc.text('Material', col1X, yPosition)
      doc.text('Cantidad', col2X, yPosition)
      doc.text('Peso', col3X, yPosition)
      doc.text('Precio', col4X, yPosition)
      doc.text('Subtotal', col5X, yPosition)
      yPosition += rowHeight + 2
      doc.setFont('helvetica', 'normal')
    }
    
    const materialName = detail.material.name.length > 20 
      ? detail.material.name.substring(0, 20) + '...'
      : detail.material.name
    
    doc.text(materialName, col1X, yPosition)
    doc.text(`${detail.quantity}`, col2X, yPosition)
    doc.text(`${detail.quantity.toFixed(2)}kg`, col3X, yPosition)
    doc.text(`$${detail.unitPrice.toFixed(2)}`, col4X, yPosition)
    doc.text(`$${detail.subtotal.toFixed(2)}`, col5X, yPosition)
    
    totalWeight += detail.quantity
    totalAmount += detail.subtotal
    yPosition += rowHeight
  })
  
  yPosition += 8
  
  // Línea separadora para totales
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5
  
  // Totales
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN', margin, yPosition)
  yPosition += 5
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Peso Total: ${totalWeight.toFixed(2)} kg`, margin, yPosition)
  yPosition += 5
  doc.text(`Monto Total: $${totalAmount.toFixed(2)}`, margin, yPosition)
  
  yPosition += 10
  
  // Espacio para firma
  doc.line(margin, yPosition, margin + 40, yPosition)
  doc.text('Firma', margin + 10, yPosition + 4)
  
  // Pie de página
  const footerY = 265
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Copyright 2026. Tecnología Inteligente para tu Negocio', pageWidth / 2, footerY, { align: 'center' })
  doc.text('Conecta, protege y optimiza: lo hacemos fácil, lo hacemos bien', pageWidth / 2, footerY + 4, { align: 'center' })
  doc.text('Contacto WhatsApp 7225468979', pageWidth / 2, footerY + 8, { align: 'center' })
  
  // Descargar el PDF
  doc.save(`transaccion-${transaction.folio}.pdf`)
}
