import PDFDocument from 'pdfkit';
import { HistoriaUsuarioRepository, MetricasSprintResponseDTO } from '../domain/scrum-contracts';

export class ExportPDFService {
  constructor(private huRepository: HistoriaUsuarioRepository) {}

  async generarReporteSprint(
    sprintId: string,
    numero: number,
    metricas: MetricasSprintResponseDTO,
    opciones?: {
      incluirTrazabilidad?: boolean;
      incluirRetrospectiva?: boolean;
      incluirImpedimentos?: boolean;
    },
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const colorAzul = '#003e70';
      const colorGris = '#f0f0f0';
      const leftMargin = 40;
      const pageWidth = 525;

      function drawHeader(text: string, y: number) {
        doc.rect(leftMargin, y, pageWidth, 24).fill(colorAzul);
        doc.fillColor('#fff').fontSize(11).font('Helvetica-Bold').text(text, leftMargin + 8, y + 6);
        doc.fillColor('#000').font('Helvetica');
      }

      function drawRow(label: string, value: string, y: number, shade = false) {
        if (shade) doc.rect(leftMargin, y - 4, pageWidth, 22).fill('#f8f8f8');
        doc.fillColor('#333').fontSize(10).font('Helvetica').text(label, leftMargin + 8, y, { width: 200 });
        doc.fillColor('#000').font('Helvetica-Bold').text(value, leftMargin + 220, y);
        doc.fillColor('#000').font('Helvetica');
      }

      doc.fontSize(18).font('Helvetica-Bold').fillColor(colorAzul).text('Reporte de Sprint', leftMargin, 40, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(13).fillColor('#555').font('Helvetica').text(`Sprint #${numero}`, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#999').text(`ID: ${sprintId}`, { align: 'center' });
      doc.moveDown(0.3);

      doc.moveTo(leftMargin, doc.y).lineTo(leftMargin + pageWidth, doc.y).stroke('#ccc');
      doc.moveDown(0.5);

      const yStart = doc.y;
      drawHeader('Resumen del Sprint', yStart);
      let y = yStart + 30;
      drawRow('Velocidad Planeada:', `${metricas.velocidadPlaneada} SP`, y);
      y += 20;
      drawRow('Velocidad Real:', `${metricas.velocidadReal} SP`, y, true);
      y += 20;
      drawRow('Cumplimiento:', `${metricas.porcentajeCumplimiento}%`, y);
      y += 20;
      drawRow('Promedio últimos 3:', `${metricas.promedio3Sprints || 'N/A'} SP`, y, true);
      y += 28;

      drawHeader('Estado de Historias de Usuario', y);
      y += 30;
      drawRow('Total:', `${metricas.huTotales} HUs`, y);
      y += 20;
      drawRow('Completadas:', `${metricas.huCompletadas} HUs`, y, true);
      y += 20;
      drawRow('En Progreso:', `${metricas.huEnProgreso} HUs`, y);
      y += 20;
      drawRow('Bloqueadas:', `${metricas.huBloqueadas} HUs`, y, true);
      y += 28;

      if (opciones?.incluirTrazabilidad) {
        if (y > 650) { doc.addPage(); y = 40; }
        drawHeader('Trazabilidad', y);
        y += 24;
        doc.fontSize(10).fillColor('#555').font('Helvetica').text('Ver detalles en el histórico de trazabilidad.', leftMargin + 8, y);
        y += 20;
      }

      if (opciones?.incluirRetrospectiva) {
        if (y > 650) { doc.addPage(); y = 40; }
        drawHeader('Retrospectiva', y);
        y += 24;
        doc.fontSize(10).fillColor('#555').font('Helvetica').text('Ver detalles en el acta de retrospectiva.', leftMargin + 8, y);
        y += 20;
      }

      if (opciones?.incluirImpedimentos) {
        if (y > 650) { doc.addPage(); y = 40; }
        drawHeader('Impedimentos', y);
        y += 24;
        doc.fontSize(10).fillColor('#555').font('Helvetica').text('Ver detalles en el registro de impedimentos.', leftMargin + 8, y);
        y += 20;
      }

      doc.moveDown(2);
      doc.moveTo(leftMargin, doc.y).lineTo(leftMargin + pageWidth, doc.y).stroke('#ccc');
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#aaa').font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-CO')}`, leftMargin, doc.y, { align: 'center' });

      doc.end();
    });
  }
}
