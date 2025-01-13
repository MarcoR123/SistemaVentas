import { Component, OnInit } from '@angular/core';
import { SaleService } from '../../services/sale.service';
import { UserService } from '../../services/user.service';
import { CustomerSupportService } from '../../services/customer-support.service';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { ClientService } from '../../services/client.service';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

@Component({
    selector: 'app-reports',
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.css'],
    standalone: false
})
export class ReportsComponent implements OnInit {
  selectedReport: string = 'ventas'; // "ventas", "vendedores" o "soporte"
  salesData: any[] = [];
  usersData: any[] = [];
  supportData: any[] = [];
  filteredData: any[] = [];
  vendedores: string[] = ['Todos']; // Lista de vendedores
  clientes: string[] = ['Todos']; // Lista de clientes
  selectedVendedor: string = 'Todos'; // Vendedor seleccionado
  selectedClientName: string = 'Todos'; // Cliente seleccionado
  noDataMessage: string = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  constructor(
    private saleService: SaleService,
    private userService: UserService,
    private supportService: CustomerSupportService,
    private productService: ProductService,
    private clientService: ClientService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReportData(); // Cargar datos según el reporte seleccionado
  }

  /**
   * Cargar datos según el tipo de informe seleccionado
   */
  loadReportData(): void {
    if (this.selectedReport === 'ventas') {
      this.loadAllSalesData();
    } else if (this.selectedReport === 'vendedores') {
      this.loadUsersData();
    } else if (this.selectedReport === 'soporte') {
      this.loadSupportData();
    }
  }

  /**
   * **Cargar datos de ventas con todos los nombres relacionados**
   */
  loadAllSalesData(): void {
    this.saleService.getSales().subscribe({
      next: (data) => {
        this.mapSalesData(data).then((mappedSales) => {
          this.salesData = mappedSales;
          this.filteredData = mappedSales;
          this.populateFilters();
        });
      },
      error: (error) => {
        console.error('Error al cargar ventas:', error);
        this.noDataMessage = 'Error al cargar las ventas.';
      },
    });
  }

  /**
   * Mapear datos de ventas
   */
  async mapSalesData(data: any[]): Promise<any[]> {
    return Promise.all(
      data.map(async (sale) => {
        const product = sale.products[0]?.product_id
          ? await this.productService.getProductById(sale.products[0].product_id).toPromise()
          : null;
        const client = product?.clientId
          ? await this.clientService.getClientById(product.clientId).toPromise()
          : null;
        const user = sale.user_id ? await this.userService.getUserById(sale.user_id).toPromise() : null;

        return {
          ...sale,
          product_name: product?.name || 'Producto Desconocido',
          client_name: client?.nombre || 'Cliente Desconocido',
          client_category: client?.categoria || 'Sin categoría',
          user_name: user?.name || 'Usuario Desconocido',
          lat: sale.geolocation?.latitude || 0,
          long: sale.geolocation?.longitude || 0,
        };
      })
    );
  }

  /**
   * Cargar datos de usuarios
   */
  loadUsersData(): void {
    const role = this.authService.getRole() || '';
    const clientId = this.authService.getClientId() || '';
  
    if (role === 'Administrador') {
      this.userService.getUsers().subscribe({
        next: (data) => {
          this.usersData = data;
          this.filteredData = data;
          this.populateFilters();
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
        },
      });
    } else {
      this.userService.getUsersByClientId(clientId).subscribe({
        next: (data) => {
          this.usersData = data;
          this.filteredData = data;
          this.populateFilters();
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
        },
      });
    }
  }


 /**
 * Cargar datos de soporte al cliente con mapeo de nombres de producto, cliente y usuario
 */
 loadSupportData(): void {
  const role = this.authService.getRole() || '';
  const clientId = this.authService.getClientId() || '';

  if (role === 'Administrador') {
    this.supportService.getAllCustomerSupport().subscribe({
      next: async (data) => {
        const mappedData = await this.mapSupportData(data);
        this.supportData = mappedData;
        this.filteredData = mappedData;
        this.populateFilters();
      },
      error: (error) => {
        console.error('Error al cargar soporte al cliente:', error);
        this.noDataMessage = 'Error al cargar los datos de soporte.';
      },
    });
  } else {
    this.supportService.getCustomerSupportByClientId(clientId).subscribe({
      next: async (data) => {
        const mappedData = await this.mapSupportData(data);
        this.supportData = mappedData;
        this.filteredData = mappedData;
        this.populateFilters();
      },
      error: (error) => {
        console.error('Error al cargar soporte al cliente:', error);
        this.noDataMessage = 'Error al cargar los datos de soporte.';
      },
    });
  }
}

async mapSupportData(data: any[]): Promise<any[]> {
  return Promise.all(
    data.map(async (support) => {
      const product = support.product_id
        ? await this.productService.getProductById(support.product_id).toPromise()
        : null;
      const client = support.clientId
        ? await this.clientService.getClientById(support.clientId).toPromise()
        : null;
      const user = support.user_id
        ? await this.userService.getUserById(support.user_id).toPromise()
        : null;

      return {
        ...support,
        product_name: product?.name || 'N/A',
        client_name: client?.nombre || 'N/A',
        user_name: user?.name || 'N/A',
        lat: support.geolocation?.latitude || 0,
        long: support.geolocation?.longitude || 0,
        
      };
    })
  );
}


  /**
   * Rellenar las listas de filtros con vendedores y clientes únicos
   */
  populateFilters(): void {
    // Crear conjuntos para evitar duplicados
    const allVendedores = new Set<string>();
    const allClientes = new Set<string>();
  
    // Agregar vendedores y clientes de ventas
    this.salesData.forEach((sale) => {
      if (sale.user_name) allVendedores.add(sale.user_name);
      if (sale.client_name) allClientes.add(sale.client_name);
    });
  
    // Agregar vendedores y clientes de soporte
    this.supportData.forEach((support) => {
      if (support.user_name) allVendedores.add(support.user_name);
      if (support.client_name) allClientes.add(support.client_name);
    });
  
    // Agregar vendedores de la lista de usuarios (vendedores)
    this.usersData.forEach((user) => {
      if (user.name) allVendedores.add(user.name);
      if (user.clientName) allClientes.add(user.clientName);
    });
  
    // Convertir los conjuntos en listas
    this.vendedores = ['Todos', ...Array.from(allVendedores)];
    this.clientes = ['Todos', ...Array.from(allClientes)];
  }
  

  /**
   * Filtrar datos según los criterios seleccionados
   */
  filterData(): void {
    const selectedData = this.getSelectedData();
  
    this.filteredData = selectedData.filter((item) => {
      const itemDate = new Date(item.date);
      const startDateValid = !this.startDate || itemDate >= new Date(this.startDate);
      
      // Sumamos un día al `endDate` para incluir toda la fecha seleccionada
      const adjustedEndDate = this.endDate ? new Date(this.endDate) : null;
      if (adjustedEndDate) {
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      }
  
      const endDateValid = !this.endDate || (adjustedEndDate && itemDate < adjustedEndDate);
  
      return startDateValid && endDateValid;
    });
  
    this.noDataMessage = this.filteredData.length === 0 ? 'No se encontraron datos para los filtros seleccionados.' : '';
  }
  
  
  
  
  resetFilters(): void {
    this.startDate = null;
  this.endDate = null;
    this.selectedVendedor = 'Todos'; // Limpia el filtro de vendedor
    this.selectedClientName = 'Todos'; // Limpia el filtro de cliente
    this.filteredData = this.getSelectedData(); // Recupera todos los datos sin filtros
    this.noDataMessage = '';
  }
  

  /**
   * Obtener datos filtrados según el tipo de reporte
   */
  getSelectedData(): any[] {
    if (this.selectedReport === 'ventas') return this.salesData;
    if (this.selectedReport === 'vendedores') return this.usersData;
    return this.supportData;
  }

  /**
   * Exportar a Excel
   */
  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Informe de ${this.selectedReport}`);
  
    if (this.selectedReport === 'ventas') {
      worksheet.columns = [
        { header: 'Fecha de Venta', key: 'date', width: 20 },
        { header: 'Producto', key: 'product_name', width: 30 },
        { header: 'Cliente', key: 'client_name', width: 25 },
        { header: 'Categoría', key: 'client_category', width: 20 },
        { header: 'Vendedor', key: 'user_name', width: 20 },
        { header: 'Cantidad', key: 'quantity', width: 10 },
        { header: 'Precio Unitario', key: 'price', width: 15 },
        { header: 'Latitud', key: 'lat', width: 15 },
        { header: 'Longitud', key: 'long', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Total', key: 'total_price', width: 15 },
        { header: 'Adjunto', key: 'attachments', width: 30 },
      ];
  
      this.filteredData.forEach((sale) => {
        worksheet.addRow({
          date: new Date(sale.date).toLocaleDateString(),
          product_name: sale.product_name,
          client_name: sale.client_name,
          client_category: sale.client_category,
          user_name: sale.user_name,
          quantity: sale.products[0]?.quantity || 0,
          price: `$${sale.products[0]?.price?.toFixed(2) || '0.00'}`,
          lat: sale.lat.toFixed(6),
          long: sale.long.toFixed(6),
          status: sale.status || 'N/A',
          total_price: `$${sale.total_price?.toFixed(2) || '0.00'}`,
          attachments: sale.attachments ? 'Imagen adjunta' : 'Sin adjunto',
        });
      });
    } else if (this.selectedReport === 'vendedores') {
      worksheet.columns = [
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Correo Electrónico', key: 'email', width: 30 },
        { header: 'Rol', key: 'role', width: 20 },
        { header: 'Región Asignada', key: 'assigned_region', width: 25 },
        { header: 'Cliente', key: 'clientName', width: 25 },
      ];
  
      this.filteredData.forEach((user) => {
        worksheet.addRow({
          name: user.name || 'Sin nombre',
          email: user.email || 'Sin correo',
          role: user.role || 'Sin rol',
          assigned_region: user.assigned_region || 'Sin región',
          clientName: user.clientName || 'Sin cliente',
        });
      });
    } else if (this.selectedReport === 'soporte') {
      worksheet.columns = [
        { header: 'Fecha', key: 'date', width: 20 },
        { header: 'Producto', key: 'product_name', width: 30 },
        { header: 'Cliente', key: 'client_name', width: 25 },
        { header: 'Usuario', key: 'user_name', width: 20 },
        { header: 'Comentarios', key: 'comments', width: 35 },
        { header: 'Capacitación', key: 'training', width: 10 },
        { header: 'Queja', key: 'complaint', width: 10 },
        { header: 'Latitud', key: 'lat', width: 15 },
        { header: 'Longitud', key: 'long', width: 15 },
        { header: 'Adjuntos', key: 'attachments', width: 30 },
      ];
  
      this.filteredData.forEach((support) => {
        worksheet.addRow({
          date: new Date(support.date).toLocaleDateString(),
          product_name: support.product_name || 'N/A',
          client_name: support.client_name || 'N/A',
          user_name: support.user_name || 'N/A',
          comments: support.comments || 'Sin comentarios',
          training: support.training ? 'Sí' : 'No',
          complaint: support.complaint ? 'Sí' : 'No',
          lat: support.lat.toFixed(6),
          long: support.long.toFixed(6),
          attachments: support.attachments ? 'Imagen adjunta' : 'Sin adjuntos',
        });
      });
    }
  
    // Estilo de encabezado para todas las hojas
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0070C0' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  
    workbook.xlsx.writeBuffer().then((buffer) => {
      FileSaver.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `Informe_de_${this.selectedReport}.xlsx`);
    });
  }
  

  /**
   * Exportar a PDF
   */
  exportToPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  });

  const leftMargin = 20; // Margen izquierdo
  const topMargin = 15; // Margen superior inicial
  const lineHeight = 8; // Espaciado entre líneas
  const maxWidth = 170; // Ancho máximo para texto
  const pageWidth = doc.internal.pageSize.width - leftMargin * 2;
  let yPos = topMargin; // Posición Y inicial

  const title = `Informe de ${this.selectedReport}`;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, leftMargin + pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  this.filteredData.forEach((entry, index) => {
    if (yPos + lineHeight * 10 > 280) {
      doc.addPage();
      yPos = topMargin;
    }

    doc.setFontSize(14);
    doc.text(`Registro #${index + 1}`, leftMargin, yPos);
    yPos += lineHeight;

    doc.setFontSize(12);

    if (this.selectedReport === 'ventas') {
      doc.text(`Fecha de Venta: ${new Date(entry.date).toLocaleDateString()}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Producto: ${entry.product_name || 'N/A'}`, leftMargin, yPos, { maxWidth });
      yPos += lineHeight;
      doc.text(`Cliente: ${entry.client_name || 'N/A'}`, leftMargin, yPos, { maxWidth });
      yPos += lineHeight;
      doc.text(`Categoría: ${entry.client_category || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Vendedor: ${entry.user_name || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Cantidad: ${entry.products?.[0]?.quantity || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Precio Unitario: $${entry.products?.[0]?.price?.toFixed(2) || '0.00'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Total: $${entry.total_price?.toFixed(2) || '0.00'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Latitud: ${entry.lat?.toFixed(6) || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Longitud: ${entry.long?.toFixed(6) || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Estado: ${entry.status || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
    } else if (this.selectedReport === 'vendedores') {
      doc.text(`Nombre: ${entry.name || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Correo Electrónico: ${entry.email || 'N/A'}`, leftMargin, yPos, { maxWidth });
      yPos += lineHeight;
      doc.text(`Rol: ${entry.role || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Región Asignada: ${entry.assigned_region || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Cliente: ${entry.clientName || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
    } else if (this.selectedReport === 'soporte') {
      doc.text(`Fecha: ${new Date(entry.date).toLocaleDateString()}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Producto: ${entry.product_name || 'N/A'}`, leftMargin, yPos, { maxWidth });
      yPos += lineHeight;
      doc.text(`Cliente: ${entry.client_name || 'N/A'}`, leftMargin, yPos, { maxWidth });
      yPos += lineHeight;
      doc.text(`Usuario: ${entry.user_name || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Comentarios: ${entry.comments || 'Sin comentarios'}`, leftMargin, yPos, { maxWidth });
      yPos += lineHeight + 5;
      doc.text(`Capacitación: ${entry.training ? 'Sí' : 'No'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Queja: ${entry.complaint ? 'Sí' : 'No'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Latitud: ${entry.lat?.toFixed(6) || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Longitud: ${entry.long?.toFixed(6) || 'N/A'}`, leftMargin, yPos);
      yPos += lineHeight;
    }

    // Adjuntos (Imágenes)
    const hasAttachment = entry.attachments && entry.attachments.startsWith('data:image');
    doc.text(`Adjunto: ${hasAttachment ? 'Sí (ver imagen)' : 'Sin adjunto'}`, leftMargin, yPos);
    yPos += lineHeight + 5;

    if (hasAttachment) {
      const imageWidth = 50;
      const imageHeight = 50;
      if (yPos + imageHeight > 280) {
        doc.addPage();
        yPos = topMargin;
      }
      doc.addImage(entry.attachments, 'JPEG', leftMargin, yPos, imageWidth, imageHeight);
      yPos += imageHeight + 10; // Añadir espacio después de la imagen
    }
  });

  doc.save(`Informe_de_${this.selectedReport}.pdf`);
}

  
  

}
