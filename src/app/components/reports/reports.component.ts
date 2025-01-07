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
})
export class ReportsComponent implements OnInit {
  selectedReport: string = 'ventas'; // "ventas", "vendedores" o "soporte"
  salesData: any[] = [];
  usersData: any[] = [];
  supportData: any[] = [];
  filteredData: any[] = [];
  clientId: string = '';
  selectedVendedor: string = 'Todos';
  selectedClientName: string = 'Todos';
  vendedores: string[] = ['Todos'];
  clientes: string[] = ['Todos'];
  startDate: Date | null = null;
  endDate: Date | null = null;
  noDataMessage: string = '';

  constructor(
    private saleService: SaleService,
    private userService: UserService,
    private supportService: CustomerSupportService,
    private productService: ProductService,
    private clientService: ClientService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.clientId = this.authService.getClientId() || '';
    this.loadReportData();
  }

  // Cargar datos según el tipo de informe seleccionado
  loadReportData(): void {
    const role = this.authService.getRole() || '';
    if (this.selectedReport === 'ventas') {
      role === 'Administrador' ? this.loadAllSalesData() : this.loadSalesData();
    } else if (this.selectedReport === 'vendedores') {
      this.loadUsersData(role);
    } else if (this.selectedReport === 'soporte') {
      this.loadSupportData();
    }
  }

  // Cargar datos de ventas
  loadAllSalesData(): void {
    this.saleService.getSales().subscribe({
      next: (data) => {
        this.salesData = data;
        this.filteredData = data;
        this.populateFilters();
      },
      error: (error) => {
        console.error('Error al cargar ventas:', error);
        this.filteredData = [];
      },
    });
  }

  loadSalesData(): void {
    this.saleService.getSalesByClientId(this.clientId).subscribe({
      next: (data) => {
        this.salesData = data;
        this.filteredData = data;
        this.populateFilters();
      },
      error: (error) => {
        console.error('Error al cargar ventas:', error);
        this.filteredData = [];
      },
    });
  }

  // Cargar datos de vendedores
  loadUsersData(role: string): void {
    const loadData = role === 'Administrador' ? this.userService.getUsers() : this.userService.getUsersByClientId(this.clientId);
    loadData.subscribe({
      next: (data) => {
        this.usersData = data.map((user) => ({
          ...user,
          clientName: user.clientName || 'Desconocido',
        }));
        this.filteredData = this.usersData;
        this.populateFilters();
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.filteredData = [];
      },
    });
  }

  // Cargar datos de soporte al cliente con mapeo de nombres de producto, cliente y usuario
  async loadSupportData(): Promise<void> {
    const role = this.authService.getRole() || '';
    const loadData = role === 'Administrador' ? this.supportService.getAllCustomerSupport() : this.supportService.getCustomerSupportByClientId(this.clientId);
    
    loadData.subscribe({
      next: async (data) => {
        this.supportData = await this.mapSupportData(data);
        this.filteredData = this.supportData;
        this.populateFilters();
      },
      error: (error) => {
        console.error('Error al cargar soporte al cliente:', error);
        this.filteredData = [];
      },
    });
  }
  
  async mapSupportData(data: any[]): Promise<any[]> {
    return Promise.all(
      data.map(async (support) => {
        const product = support.product_id ? await this.productService.getProductById(support.product_id).toPromise() : null;
        const client = support.clientId ? await this.clientService.getClientById(support.clientId).toPromise() : null;
        const user = support.user_id ? await this.userService.getUserById(support.user_id).toPromise() : null;
        return {
          ...support,
          product_name: product?.name || 'N/A',
          client_name: client?.nombre || 'N/A',
          user_name: user?.name || 'N/A',
        };
      })
    );
  }

  // Popular filtros de vendedores y clientes únicos
  populateFilters(): void {
    if (this.selectedReport === 'ventas') {
      this.vendedores = ['Todos', ...Array.from(new Set(this.salesData.map((sale) => sale.user_name)))];
      this.clientes = ['Todos', ...Array.from(new Set(this.salesData.map((sale) => sale.products[0]?.client_name || 'N/A')))];
    } else if (this.selectedReport === 'vendedores') {
      this.vendedores = ['Todos', ...Array.from(new Set(this.usersData.map((user) => user.name)))];
      this.clientes = ['Todos', ...Array.from(new Set(this.usersData.map((user) => user.clientName || 'N/A')))];
    } else if (this.selectedReport === 'soporte') {
      this.vendedores = ['Todos', ...Array.from(new Set(this.supportData.map((support) => support.user_name || 'N/A')))];
      this.clientes = ['Todos', ...Array.from(new Set(this.supportData.map((support) => support.client_name || 'N/A')))];
    }
  }

  // Filtrar datos según los criterios seleccionados
  filterData(): void {
    this.filteredData = this.getSelectedData().filter((item) => {
      const date = item.date ? new Date(item.date).setHours(0, 0, 0, 0) : null;
      const start = this.startDate ? new Date(this.startDate).setHours(0, 0, 0, 0) : null;
      const end = this.endDate ? new Date(this.endDate).setHours(0, 0, 0, 0) : null;

      const matchesDate = !start || (date && date >= start && (!end || date <= end));
      const matchesSeller = this.selectedVendedor === 'Todos' || item.user_name === this.selectedVendedor || item.name === this.selectedVendedor || item.user_id === this.selectedVendedor;
      const matchesClient = this.selectedClientName === 'Todos' || item.clientId === this.selectedClientName || item.clientName === this.selectedClientName;

      return matchesDate && matchesSeller && matchesClient;
    });

    this.noDataMessage = this.filteredData.length === 0 ? 'No se encontraron datos para los filtros seleccionados.' : '';
  }

  getSelectedData(): any[] {
    if (this.selectedReport === 'ventas') return this.salesData;
    if (this.selectedReport === 'vendedores') return this.usersData;
    return this.supportData;
  }


  // Exportar a Excel
  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Informe de ${this.selectedReport}`);

    if (this.selectedReport === 'ventas') {
      worksheet.columns = [
        { header: 'Fecha de Venta', key: 'date', width: 15 },
        { header: 'Producto', key: 'product_name', width: 30 },
        { header: 'Cliente', key: 'client_name', width: 25 },
        { header: 'Vendedor', key: 'user_name', width: 20 },
        { header: 'Cantidad', key: 'quantity', width: 10 },
        { header: 'Precio Total', key: 'total_price', width: 15 },
      ];
    } else if (this.selectedReport === 'vendedores') {
      worksheet.columns = [
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Correo Electrónico', key: 'email', width: 30 },
        { header: 'Rol', key: 'role', width: 20 },
        { header: 'Región Asignada', key: 'assigned_region', width: 25 },
        { header: 'Cliente', key: 'clientName', width: 25 },
      ];
    } else if (this.selectedReport === 'soporte') {
      worksheet.columns = [
        { header: 'Fecha', key: 'date', width: 15 },
        { header: 'Producto', key: 'product_name', width: 30 },
        { header: 'Cliente', key: 'client_name', width: 25 },
        { header: 'Usuario', key: 'user_name', width: 20 },
        { header: 'Comentarios', key: 'comments', width: 30 },
        { header: 'Capacitación', key: 'training', width: 10 },
        { header: 'Queja', key: 'complaint', width: 10 },
      ];
    }

    this.filteredData.forEach((item) => worksheet.addRow(item));

    workbook.xlsx.writeBuffer().then((buffer) => {
      FileSaver.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `Informe_de_${this.selectedReport}.xlsx`);
    });
  }

  // Exportar a PDF
  exportToPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Informe de ${this.selectedReport}`, 10, 10);

    let headers: string[][] = [];
    let rows: string[][] = [];

    if (this.selectedReport === 'ventas') {
      headers = [['Fecha de Venta', 'Producto', 'Cliente', 'Vendedor', 'Cantidad', 'Precio Total']];
      rows = this.filteredData.map((sale) => [
        new Date(sale.date).toLocaleDateString(),
        sale.products?.[0]?.product_name || 'N/A',
        sale.products?.[0]?.client_name || 'N/A',
        sale.user_name || 'N/A',
        sale.products?.[0]?.quantity?.toString() || '0',
        sale.total_price?.toFixed(2),
      ]);
    } else if (this.selectedReport === 'vendedores') {
      headers = [['Nombre', 'Correo Electrónico', 'Rol', 'Región Asignada', 'Cliente']];
      rows = this.filteredData.map((user) => [
        user.name || 'N/A',
        user.email || 'N/A',
        user.role || 'N/A',
        user.assigned_region || 'N/A',
        user.clientName || 'N/A',
      ]);
    } else if (this.selectedReport === 'soporte') {
      headers = [['Fecha', 'Producto', 'Cliente', 'Usuario', 'Comentarios', 'Capacitación', 'Queja']];
      rows = this.filteredData.map((support) => [
        new Date(support.date).toLocaleDateString(),
        support.product_name || 'N/A',
        support.client_name || 'N/A',
        support.user_name || 'N/A',
        support.comments || 'N/A',
        support.training ? 'Sí' : 'No',
        support.complaint ? 'Sí' : 'No',
      ]);
    }

    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Informe_de_${this.selectedReport}.pdf`);
  }
}
