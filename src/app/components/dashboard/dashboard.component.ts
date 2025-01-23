import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { SaleService } from '../../services/sale.service';
import { ProductService } from '../../services/product.service';
import { ClientService } from '../../services/client.service';
import { UserService } from '../../services/user.service';
import { CustomerSupportService } from '../../services/customer-support.service';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, PieController, ArcElement, Tooltip, Legend } from 'chart.js';
import * as L from 'leaflet';
import 'leaflet.markercluster';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, PieController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('supportChart') supportChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('map') mapContainer!: ElementRef<HTMLDivElement>;

  sales: any[] = [];
  products: any[] = [];
  clients: any[] = [];
  users: any[] = [];
  customerSupportReports: any[] = [];
  filteredSales: any[] = [];
  map: any;

  totalSales: number = 0;
  totalProducts: number = 0;
  totalUsers: number = 0;
  totalClients: number = 0;
  totalComplaints: number = 0;
  totalTrainings: number = 0;

  bestSeller: string = 'N/A';
  mostSoldProduct: string = 'N/A';
  mostComplainedProduct: string = 'N/A';

  selectedClientId: string = '';
  selectedUserId: string = '';

  private salesChartInstance: any; // Referencia al gráfico de ventas
  private supportChartInstance: any; // Referencia al gráfico de soporte

  // Declarar defaultIcon como propiedad de clase
  defaultIcon = L.icon({
    iconUrl: 'assets/marker-icon.png',
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [25, 41], // Tamaño del ícono
    iconAnchor: [12, 41], // Punto de anclaje
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  constructor(
    private saleService: SaleService,
    private productService: ProductService,
    private clientService: ClientService,
    private userService: UserService,
    private customerSupportService: CustomerSupportService
  ) {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.renderSalesChart();
      this.renderSupportChart();
      this.initializeMap();
    }, 100); // Pequeño retraso para asegurar la carga
  }

  loadAllData(): void {
    this.saleService.getSales().subscribe((sales) => {
      this.sales = sales;
      this.filteredSales = sales;
      this.calculateSalesKPIs();
      this.renderSalesChart();
      this.addSalesToMap();
    });

    this.productService.getProducts().subscribe((products) => {
      this.products = products;
      this.totalProducts = products.length;
    });

    this.clientService.getClients().subscribe((clients) => {
      this.clients = clients;
      this.totalClients = clients.length;
    });

    this.userService.getUsers().subscribe((users) => {
      this.users = users;
      this.totalUsers = users.length;
    });

    this.customerSupportService.getAllCustomerSupport().subscribe((reports) => {
      this.customerSupportReports = reports;
      this.calculateSupportKPIs();
      this.renderSupportChart();
    });
  }

  initializeMap(): void {
    this.map = L.map(this.mapContainer.nativeElement).setView([-1.8312, -78.1834], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    const markerCluster = L.markerClusterGroup();
    this.sales.forEach((sale) => {
      if (sale.geolocation) {
        const { latitude, longitude } = sale.geolocation;
        const marker = L.marker([latitude, longitude], { icon: this.defaultIcon }).bindPopup(
          `<strong>Cliente:</strong> ${sale.client_name || 'Desconocido'}<br>
          <strong>Total Venta:</strong> $${sale.total_price.toFixed(2)}`
        );
        markerCluster.addLayer(marker);
      }
    });

    this.map.addLayer(markerCluster);
  }

  addSalesToMap(): void {
    this.sales.forEach((sale) => {
      if (sale.geolocation) {
        const { latitude, longitude } = sale.geolocation;
        L.marker([latitude, longitude], { icon: this.defaultIcon })
          .addTo(this.map)
          .bindPopup(`<strong>Cliente:</strong> ${sale.client_name || 'Desconocido'}<br>
                      <strong>Total Venta:</strong> $${sale.total_price.toFixed(2)}`);
      }
    });
  }

  

  calculateSalesKPIs(): void {
    this.totalSales = this.filteredSales.reduce((sum, sale) => sum + sale.total_price, 0);

    const salesByProduct: { [productId: string]: number } = {};
    const salesByUser: { [userId: string]: number } = {};

    this.filteredSales.forEach((sale) => {
      const productId = sale.products[0]?.product_id;
      const userId = sale.user_id;

      salesByProduct[productId] = (salesByProduct[productId] || 0) + sale.products[0]?.quantity || 0;
      salesByUser[userId] = (salesByUser[userId] || 0) + sale.total_price;
    });

    const bestProductId = Object.keys(salesByProduct).reduce((a, b) =>
      salesByProduct[a] > salesByProduct[b] ? a : b,
      ''
    );
    const bestUserId = Object.keys(salesByUser).reduce((a, b) =>
      salesByUser[a] > salesByUser[b] ? a : b,
      ''
    );

    this.mostSoldProduct = this.products.find((p) => p.id === bestProductId)?.name || 'Desconocido';
    this.bestSeller = this.users.find((u) => u.id === bestUserId)?.name || 'Desconocido';
  }

  calculateSupportKPIs(): void {
    const complaintsByProduct: { [productId: string]: number } = {};
    this.totalComplaints = 0;
    this.totalTrainings = 0;

    const filteredSupportReports = this.customerSupportReports.filter((report) => {
      const matchesClient = !this.selectedClientId || report.client_id === this.selectedClientId;
      const matchesUser = !this.selectedUserId || report.user_id === this.selectedUserId;
      return matchesClient && matchesUser;
    });

    filteredSupportReports.forEach((report) => {
      if (report.complaint) {
        this.totalComplaints++;
        const productId = report.product_id;
        complaintsByProduct[productId] = (complaintsByProduct[productId] || 0) + 1;
      }
      if (report.training) {
        this.totalTrainings++;
      }
    });

    const mostComplainedProductId = Object.keys(complaintsByProduct).reduce((a, b) =>
      complaintsByProduct[a] > complaintsByProduct[b] ? a : b,
      ''
    );

    this.mostComplainedProduct = this.products.find((p) => p.id === mostComplainedProductId)?.name || 'Desconocido';
  }

  filterData(): void {
    this.filteredSales = this.sales.filter((sale) => {
      const matchesClient = !this.selectedClientId || sale.products[0]?.clientId === this.selectedClientId;
      const matchesUser = !this.selectedUserId || sale.user_id === this.selectedUserId;
      return matchesClient && matchesUser;
    });

    this.calculateSalesKPIs();
    this.renderSalesChart();
  }

  resetFilters(): void {
    this.selectedClientId = '';
    this.selectedUserId = '';
    this.filteredSales = this.sales;
    this.calculateSalesKPIs();
    this.calculateSupportKPIs();
    this.renderSalesChart();
  }

  renderSalesChart(): void {
    const canvas = this.salesChart.nativeElement;

    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }

    const salesByClient: { [key: string]: number } = {};

    this.filteredSales.forEach((sale) => {
      const clientName = sale.products[0]?.client_name || 'Desconocido';
      salesByClient[clientName] = (salesByClient[clientName] || 0) + sale.total_price;
    });

    const clientNames = Object.keys(salesByClient);
    const totalAmounts = Object.values(salesByClient);

    this.salesChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: clientNames,
        datasets: [
          {
            label: 'Ventas por Cliente',
            data: totalAmounts,
            backgroundColor: '#4285F4',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  renderSupportChart(): void {
    const canvas = this.supportChart.nativeElement;

    if (this.supportChartInstance) {
      this.supportChartInstance.destroy();
    }

    const complaintsCount = this.totalComplaints;
    const trainingCount = this.totalTrainings;

    this.supportChartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Quejas', 'Entrenamientos'],
        datasets: [
          {
            data: [complaintsCount, trainingCount],
            backgroundColor: ['#FF6347', '#4CAF50'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }
}
