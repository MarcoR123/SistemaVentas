import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx'; // Para exportar a Excel
import * as FileSaver from 'file-saver'; // Para guardar archivos
import jsPDF from 'jspdf'; // Para exportar a PDF
import autoTable from 'jspdf-autotable'; // Plugin para tablas en PDF
import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  selectedReport: string = 'ventas';
  salesData: any[] = [];
  filteredData: any[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;
  clientId: string = '';
  selectedVendedor: string = 'Todos';
  vendedores: string[] = ['Todos'];
  noDataMessage: string = '';


  constructor(private saleService: SaleService, private authService: AuthService) {}

  ngOnInit(): void {
    this.clientId = this.authService.getClientId() || '';
    this.loadSalesData();
  }

  // Cargar las ventas filtradas por clientId
  loadSalesData(): void {
    this.saleService.getSalesByClientId(this.clientId).subscribe(
      (data) => {
        this.salesData = data;
        this.filteredData = data;
        this.populateVendedores();
      },
      (error) => {
        console.error('Error al cargar las ventas:', error);
        this.filteredData = [];
      }
    );
  }

  // Rellenar lista de vendedores únicos
  populateVendedores(): void {
    const vendedoresUnicos = new Set(this.salesData.map((sale) => sale.user_name));
    this.vendedores = ['Todos', ...Array.from(vendedoresUnicos)];
  }

  // Filtrar por fecha y vendedor
  filterData(): void {
    this.filteredData = this.salesData.filter((sale) => {
      const saleDate = new Date(sale.date).setHours(0, 0, 0, 0); // Ignorar la hora, solo la fecha
      const start = this.startDate ? new Date(this.startDate).setHours(0, 0, 0, 0) : null;
      const end = this.endDate ? new Date(this.endDate).setHours(0, 0, 0, 0) : null;
  
      const withinDateRange =
        (!start || saleDate >= start) && (!end || saleDate <= end);
  
      const matchesSeller =
        this.selectedVendedor === 'Todos' || sale.user_name === this.selectedVendedor;
  
      return withinDateRange && matchesSeller;
    });
  
    if (this.filteredData.length === 0) {
      this.noDataMessage = 'No se encontraron datos para los filtros seleccionados.';
    } else {
      this.noDataMessage = '';
    }
  }
  
  
  

  // Exportar a Excel con formato y títulos
  exportToExcel(): void {
    const formattedData = this.filteredData.map((sale) => ({
      'Fecha de Venta': sale.date ? new Date(sale.date).toLocaleDateString() : 'N/A',
      'Nombre del Producto': sale.products[0]?.product_name || 'N/A',
      'Cantidad': sale.products[0]?.quantity || 0,
      'Precio Unitario': sale.products[0]?.price || 0,
      'Precio Total': sale.total_price || 0,
      'Marca': sale.products[0]?.client_name || 'N/A',
      'Ubicación': `${sale.geolocation.latitude || ''}, ${sale.geolocation.longitude || ''}`,
      'Categoría': sale.products[0]?.client_category || 'N/A',
      'Vendedor': sale.user_name || 'N/A',
      'Factura (Attachments)': sale.attachments || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Informe');

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, `Informe_de_${this.selectedReport}.xlsx`);
  }

  // Exportar a PDF con formato y títulos
  exportToPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Informe de ${this.selectedReport === 'ventas' ? 'Ventas' : 'Vendedores y su Marca'}`, 10, 10);

    const headers =
      this.selectedReport === 'ventas'
        ? [['Fecha de Venta', 'Nombre del Producto', 'Cantidad', 'Precio Unitario', 'Precio Total', 'Marca', 'Ubicación', 'Categoría', 'Vendedor', 'Attachments']]
        : [['Vendedor', 'Marca']];

    const rows = this.filteredData.map((sale) =>
      this.selectedReport === 'ventas'
        ? [
            sale.date ? new Date(sale.date).toLocaleDateString() : 'N/A',
            sale.products[0]?.product_name || 'N/A',
            sale.products[0]?.quantity || 0,
            sale.products[0]?.price || 0,
            sale.total_price || 0,
            sale.products[0]?.client_name || 'N/A',
            `${sale.geolocation.latitude || ''}, ${sale.geolocation.longitude || ''}`,
            sale.products[0]?.client_category || 'N/A',
            sale.user_name || 'N/A',
            sale.attachments || 'N/A',
          ]
        : [sale.user_name || 'N/A', sale.products[0]?.client_name || 'N/A']
    );

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
    });

    doc.save(`Informe_de_${this.selectedReport}.pdf`);
  }
}
