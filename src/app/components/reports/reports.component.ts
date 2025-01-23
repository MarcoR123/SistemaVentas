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
          attachments: sale.attachments !== 'null' ? sale.attachments : null, // Validación
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
        attachments: support.attachments !== 'null' ? support.attachments : null, // Validación
      };
    })
  );
}


  /**
   * Rellenar las listas de filtros con vendedores y clientes únicos
   */
  populateFilters(): void {
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
  
    this.vendedores = ['Todos', ...Array.from(allVendedores)];
    this.clientes = ['Todos', ...Array.from(allClientes)];

    console.log('Ventas cargadas:', this.salesData);
    console.log('Usuarios cargados:', this.usersData);
    console.log('Soporte cargado:', this.supportData);
    console.log('Vendedores:', this.vendedores);
    console.log('Clientes:', this.clientes);

  }
  
  

  /**
   * Filtrar datos según los criterios seleccionados
   */
  filterData(): void {
    const selectedData = this.getSelectedData();

    console.log('Datos sin filtrar:', selectedData);
    console.log('Vendedor seleccionado:', this.selectedVendedor);
    console.log('Cliente seleccionado:', this.selectedClientName);
    console.log('Fecha de inicio:', this.startDate);
    console.log('Fecha fin:', this.endDate);

  
    this.filteredData = selectedData.filter((item) => {
      const itemDate = new Date(item.date);
      const startDateValid = !this.startDate || itemDate >= new Date(this.startDate);
  
      // Ajustar el endDate sumando un día para incluir toda la fecha seleccionada
      const adjustedEndDate = this.endDate ? new Date(this.endDate) : null;
      if (adjustedEndDate) {
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      }
      const endDateValid = !this.endDate || (adjustedEndDate && itemDate < adjustedEndDate);
  
      // Validación de vendedor y cliente (ignorando mayúsculas/minúsculas)
      const vendedorValid = this.selectedVendedor === 'Todos' || item.user_name?.toLowerCase().trim() === this.selectedVendedor.toLowerCase().trim();
      const clienteValid = this.selectedClientName === 'Todos' || item.client_name?.toLowerCase().trim() === this.selectedClientName.toLowerCase().trim();
  
      return startDateValid && endDateValid && vendedorValid && clienteValid;
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
  
    // Agregar logo de Salesland desde la URL
    const logoUrl =
      'https://firebasestorage.googleapis.com/v0/b/sistema-ventas-pxygt3.firebasestorage.app/o/users%2Fuploads%2FLOGO%20SALESLAND.png?alt=media&token=4d1ca45e-fd00-4647-a2ec-7ae8dc16b862';
    fetch(logoUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const imageId = workbook.addImage({ base64, extension: 'png' });
          worksheet.addImage(imageId, 'A1:D5');
  
          // Ajustar espacio para el logo
          worksheet.mergeCells('A1:D5');
  
          // Configurar encabezados y columnas según el reporte seleccionado
          let headers: string[];
          let columns: { key: string; width: number }[];
          if (this.selectedReport === 'ventas') {
            headers = [
              'Fecha de Venta',
              'Producto',
              'Cliente',
              'Categoría',
              'Vendedor',
              'Cantidad',
              'Precio Unitario',
              'Latitud',
              'Longitud',
              'Estado',
              'Total',
              'Adjunto',
            ];
            columns = [
              { key: 'date', width: 20 },
              { key: 'product_name', width: 30 },
              { key: 'client_name', width: 25 },
              { key: 'client_category', width: 20 },
              { key: 'user_name', width: 20 },
              { key: 'quantity', width: 10 },
              { key: 'price', width: 15 },
              { key: 'lat', width: 15 },
              { key: 'long', width: 15 },
              { key: 'status', width: 15 },
              { key: 'total_price', width: 15 },
              { key: 'attachments', width: 25 },
            ];
          } else if (this.selectedReport === 'vendedores') {
            headers = ['Nombre', 'Correo Electrónico', 'Rol', 'Región Asignada', 'Cliente'];
            columns = [
              { key: 'name', width: 30 },
              { key: 'email', width: 30 },
              { key: 'role', width: 20 },
              { key: 'assigned_region', width: 25 },
              { key: 'clientName', width: 25 },
            ];
          } else {
            headers = [
              'Fecha',
              'Producto',
              'Cliente',
              'Usuario',
              'Comentarios',
              'Capacitación',
              'Queja',
              'Latitud',
              'Longitud',
              'Adjunto',
            ];
            columns = [
              { key: 'date', width: 20 },
              { key: 'product_name', width: 30 },
              { key: 'client_name', width: 25 },
              { key: 'user_name', width: 20 },
              { key: 'comments', width: 35 },
              { key: 'training', width: 10 },
              { key: 'complaint', width: 10 },
              { key: 'lat', width: 15 },
              { key: 'long', width: 15 },
              { key: 'attachments', width: 25 },
            ];
          }
  
          // Establecer encabezados en la fila 8
          worksheet.getRow(8).values = headers;
  
          // Aplicar estilo a los encabezados
          worksheet.getRow(8).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0070C0' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
  
          // Configurar columnas
          worksheet.columns = columns;
  
          // Añadir datos a partir de la fila 9
          this.filteredData.forEach((data) => {
            if (this.selectedReport === 'ventas') {
              const hyperLink = data.attachments
                ? {
                    text: 'Ver imagen',
                    hyperlink: data.attachments,
                  }
                : 'Sin adjunto';
              const row = worksheet.addRow({
                date: new Date(data.date).toLocaleDateString(),
                product_name: data.product_name,
                client_name: data.client_name,
                client_category: data.client_category,
                user_name: data.user_name,
                quantity: data.products[0]?.quantity || 0,
                price: `$${data.products[0]?.price?.toFixed(2) || '0.00'}`,
                lat: data.lat.toFixed(6),
                long: data.long.toFixed(6),
                status: data.status || 'N/A',
                total_price: `$${data.total_price?.toFixed(2) || '0.00'}`,
                attachments: hyperLink,
              });
              if (hyperLink !== 'Sin adjunto') {
                const cell = row.getCell('attachments');
                cell.value = hyperLink;
                cell.font = { color: { argb: 'FF0000FF' }, underline: true };
              }
            } else if (this.selectedReport === 'vendedores') {
              worksheet.addRow({
                name: data.name || 'Sin nombre',
                email: data.email || 'Sin correo',
                role: data.role || 'Sin rol',
                assigned_region: data.assigned_region || 'Sin región',
                clientName: data.clientName || 'Sin cliente',
              });
            } else {
              const hyperLink = data.attachments
                ? {
                    text: 'Ver imagen',
                    hyperlink: data.attachments,
                  }
                : 'Sin adjunto';
              const row = worksheet.addRow({
                date: new Date(data.date).toLocaleDateString(),
                product_name: data.product_name || 'N/A',
                client_name: data.client_name || 'N/A',
                user_name: data.user_name || 'N/A',
                comments: data.comments || 'Sin comentarios',
                training: data.training ? 'Sí' : 'No',
                complaint: data.complaint ? 'Sí' : 'No',
                lat: data.lat?.toFixed(6),
                long: data.long?.toFixed(6),
                attachments: hyperLink,
              });
              if (hyperLink !== 'Sin adjunto') {
                const cell = row.getCell('attachments');
                cell.value = hyperLink;
                cell.font = { color: { argb: 'FF0000FF' }, underline: true };
              }
            }
          });
  
          // Estilo de todas las filas
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 8) {
              row.eachCell((cell) => {
                cell.border = {
                  top: { style: 'thin' },
                  left: { style: 'thin' },
                  bottom: { style: 'thin' },
                  right: { style: 'thin' },
                };
                cell.alignment = { vertical: 'middle', wrapText: true };
              });
            }
          });
  
          // Guardar archivo
          workbook.xlsx.writeBuffer().then((buffer) => {
            FileSaver.saveAs(new Blob([buffer]), `Informe_de_${this.selectedReport}.xlsx`);
          });
        };
        reader.readAsDataURL(blob);
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
  
    const topMargin = 20; // Margen superior inicial
    const lineHeight = 8; // Espaciado entre líneas
    const maxWidth = 170; // Ancho máximo para texto
    const pageWidth = doc.internal.pageSize.width; // Ancho de la página
    const pageHeight = doc.internal.pageSize.height; // Altura de la página
    let yPos = topMargin; // Posición Y inicial
  
    // Agregar logo centrado
    const logoUrl =
      'https://firebasestorage.googleapis.com/v0/b/sistema-ventas-pxygt3.firebasestorage.app/o/users%2Fuploads%2FLOGO%20SALESLAND.png?alt=media&token=b37f22c1-3e16-40a1-82f8-daecda6ce88f';
    const logoWidth = 60; // Ancho del logo
    const logoHeight = 20; // Altura del logo
  
    const addLogo = (callback: () => void) => {
      const img = new Image();
      img.src = logoUrl;
      img.onload = () => {
        const xPos = (pageWidth - logoWidth) / 2; // Centrado horizontal
        doc.addImage(img, 'PNG', xPos, yPos, logoWidth, logoHeight);
        yPos += logoHeight + 15;
        callback();
      };
    };
  
    addLogo(() => {
      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`Informe de ${this.selectedReport}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
  
      // Contenido
      this.filteredData.forEach((entry, index) => {
        if (yPos + lineHeight * 12 > pageHeight - 20) {
          doc.addPage();
          yPos = topMargin + logoHeight + 15; // Nuevo margen tras agregar logo
        }
  
        // Encabezado del registro
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Registro #${index + 1}`, 20, yPos);
        yPos += lineHeight;
  
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
  
        if (this.selectedReport === 'ventas') {
          doc.text(`Fecha de Venta: ${new Date(entry.date).toLocaleDateString()}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Producto: ${entry.product_name || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Cliente: ${entry.client_name || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Categoría: ${entry.client_category || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Vendedor: ${entry.user_name || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Cantidad: ${entry.products?.[0]?.quantity || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Precio Unitario: $${entry.products?.[0]?.price?.toFixed(2) || '0.00'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Total: $${entry.total_price?.toFixed(2) || '0.00'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Latitud: ${entry.lat?.toFixed(6) || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Longitud: ${entry.long?.toFixed(6) || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Estado: ${entry.status || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
        } else if (this.selectedReport === 'vendedores') {
          doc.text(`Nombre: ${entry.name || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Correo Electrónico: ${entry.email || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Rol: ${entry.role || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Región Asignada: ${entry.assigned_region || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Cliente: ${entry.clientName || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
        } else if (this.selectedReport === 'soporte') {
          doc.text(`Fecha: ${new Date(entry.date).toLocaleDateString()}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Producto: ${entry.product_name || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Cliente: ${entry.client_name || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Usuario: ${entry.user_name || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Comentarios: ${entry.comments || 'Sin comentarios'}`, 20, yPos, { maxWidth });
          yPos += lineHeight;
          doc.text(`Capacitación: ${entry.training ? 'Sí' : 'No'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Queja: ${entry.complaint ? 'Sí' : 'No'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Latitud: ${entry.lat?.toFixed(6) || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
          doc.text(`Longitud: ${entry.long?.toFixed(6) || 'N/A'}`, 20, yPos);
          yPos += lineHeight;
        }
  
        // Hipervínculo para el adjunto
        if (entry.attachments && entry.attachments.startsWith('http')) {
          doc.setTextColor(0, 0, 255);
          doc.textWithLink('Ver imagen', 20, yPos, { url: entry.attachments });
          yPos += lineHeight;
          doc.setTextColor(0, 0, 0);
        } else {
          doc.text(`Adjunto: Sin adjunto`, 20, yPos);
          yPos += lineHeight;
        }
  
        yPos += 5; // Espacio entre registros
      });
  
      // Guardar el PDF
      doc.save(`Informe_de_${this.selectedReport}.pdf`);
    });
  }
}  