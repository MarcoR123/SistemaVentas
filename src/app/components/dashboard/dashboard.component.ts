import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { SaleService } from '../../services/sale.service';
import { ProductService } from '../../services/product.service';
import { UserService } from '../../services/user.service';
import { CustomerSupportService } from '../../services/customer-support.service';
import { CustomerSupport } from '../../models/customer-support.model';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  PieController,
  ArcElement,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesByDateChart') salesByDateChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesByCategoryChart') salesByCategoryChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesByUserChart') salesByUserChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('supportChart') supportChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('map') mapContainer!: ElementRef<HTMLDivElement>;

  sales: any[] = [];
  products: any[] = [];
  users: any[] = [];
  clients: any[] = [];
  customerSupport: any[] = [];
  map: any;

  totalSales: number = 0;
  mostSoldProduct: string = '';
  bestSeller: string = '';
  
  selectedClientId: string = '';
  selectedUserId: string = '';

  private salesChartInstance: Chart | null = null;
  private salesByDateChartInstance: Chart | null = null;
  private salesByCategoryChartInstance: Chart | null = null;
  private salesByUserChartInstance: Chart | null = null;
  private supportChartInstance: Chart | null = null;


  constructor(
    private saleService: SaleService,
    private productService: ProductService,
    private userService: UserService,
    private customerSupportService: CustomerSupportService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.renderAllCharts();
      this.initializeMap();
    }, 100);
  }

  loadAllData(): void {
    this.saleService.getSales().subscribe((sales) => {
      this.sales = sales;
      this.updateKPIs();
      this.renderSupportChart();

  
      console.log("Ventas para geolocalización cargadas:", this.sales);
  
      // Inicializar el mapa después de que las ventas se carguen correctamente
      this.initializeMap();
  
      // Renderizar gráficos
      this.renderAllCharts();
    });
  
    this.productService.getProducts().subscribe((products) => {
      this.products = products;
    });
  
    this.userService.getUsers().subscribe((users) => {
      this.users = users;
    });

    this.customerSupportService.getAllCustomerSupport().subscribe((support) => {
      this.customerSupport = support;
      console.log('Datos de soporte al cliente:', this.customerSupport);
    });
  }


  destroyChart(chartInstance: Chart | null): void {
    if (chartInstance) {
      chartInstance.destroy();
    }
  }

  renderAllCharts(): void {
    this.renderSalesChart();
    this.renderSalesByDateChart();
    this.renderSalesByCategoryChart();
    this.renderSalesByUserChart();
    this.renderSupportChart();
  }

  updateKPIs(): void {
    // Total ventas
    this.totalSales = this.sales.reduce((total, sale) => total + sale.total_price, 0);

    // Producto más vendido
    const productCount: { [key: string]: number } = {};
    this.sales.forEach((sale) => {
      sale.products.forEach((product: any) => {
        productCount[product.product_name] =
          (productCount[product.product_name] || 0) + product.quantity;
      });
    });
    this.mostSoldProduct = Object.keys(productCount).reduce((a, b) =>
      productCount[a] > productCount[b] ? a : b
    );

    // Mejor vendedor
    const sellerCount: { [key: string]: number } = {};
    this.sales.forEach((sale) => {
      sellerCount[sale.user_name] =
        (sellerCount[sale.user_name] || 0) + sale.total_price;
    });
    this.bestSeller = Object.keys(sellerCount).reduce((a, b) =>
      sellerCount[a] > sellerCount[b] ? a : b
    );
  }

  renderSupportChart(): void {
    if (this.supportChartInstance) {
      this.supportChartInstance.destroy();
    }
  
    const canvas = this.supportChart.nativeElement;
    const context = canvas.getContext('2d');
  
    if (!context) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }
  
    // Contar las quejas y los entrenamientos
    const complaintsCount = this.customerSupport.filter(
      (support) => support.complaint === true
    ).length;
    const trainingCount = this.customerSupport.filter(
      (support) => support.training === true
    ).length;
  
    // Crear el gráfico
    this.supportChartInstance = new Chart(context, {
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
  
  applyFilters(): void {
    const filteredSales = this.sales.filter((sale) => {
      const matchesClient = this.selectedClientId === '' || sale.products.some((p: any) => p.clientId === this.selectedClientId);
      const matchesUser =
        this.selectedUserId === '' || sale.user_id === this.selectedUserId;
      return matchesClient && matchesUser;
    });

    console.log('Ventas filtradas:', filteredSales);
    // Actualizar KPIs o gráficos según los filtros
  }

  renderSalesChart(): void {
    this.destroyChart(this.salesChartInstance);

    const canvas = this.salesChart.nativeElement;
    const salesByClient: { [key: string]: number } = {};

    this.sales.forEach((sale) => {
      const clientName = sale.products[0]?.client_name || 'Desconocido';
      salesByClient[clientName] = (salesByClient[clientName] || 0) + sale.total_price;
    });

    this.salesChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(salesByClient),
        datasets: [
          {
            label: 'Ventas por Cliente',
            data: Object.values(salesByClient),
            backgroundColor: '#4285F4',
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  renderSalesByDateChart(): void {
    this.destroyChart(this.salesByDateChartInstance);
  
    const canvas = this.salesByDateChart.nativeElement;
    const salesByDate: { [date: string]: number } = {};
  
    // Agrupar las ventas por fecha
    this.sales.forEach((sale) => {
      const date = new Date(sale.date).toISOString().split('T')[0];
      salesByDate[date] = (salesByDate[date] || 0) + sale.total_price;
    });
  
    // Ordenar las fechas cronológicamente
    const sortedDates = Object.keys(salesByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
    this.salesByDateChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: sortedDates, // Usar las fechas ordenadas
        datasets: [
          {
            label: 'Ventas por Fecha',
            data: sortedDates.map((date) => salesByDate[date]), // Obtener los valores en el orden correcto
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: '#4CAF50',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Fecha',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Ventas ($)',
            },
          },
        },
      },
    });
  }
  

  renderSalesByCategoryChart(): void {
    this.destroyChart(this.salesByCategoryChartInstance);

    const canvas = this.salesByCategoryChart.nativeElement;
    const salesByCategory: { [category: string]: number } = {};

    this.sales.forEach((sale) => {
      sale.products.forEach((product: any) => {
        const category = product.client_category || 'Sin categoría';
        salesByCategory[category] = (salesByCategory[category] || 0) + product.price * product.quantity;
      });
    });

    this.salesByCategoryChartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: Object.keys(salesByCategory),
        datasets: [
          {
            data: Object.values(salesByCategory),
            backgroundColor: ['#FF6347', '#FFD700', '#4CAF50', '#4285F4'],
          },
        ],
      },
      options: { responsive: true },
    });
  }



  renderSalesByUserChart(): void {
    this.destroyChart(this.salesByUserChartInstance);

    const canvas = this.salesByUserChart.nativeElement;
    const salesByUser: { [user: string]: number } = {};

    this.sales.forEach((sale) => {
      const userName = sale.user_name || 'Desconocido';
      salesByUser[userName] = (salesByUser[userName] || 0) + sale.total_price;
    });

    this.salesByUserChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(salesByUser),
        datasets: [
          {
            label: 'Ventas por Usuario',
            data: Object.values(salesByUser),
            backgroundColor: '#4285F4',
          },
        ],
      },
      options: { responsive: true },
    });
  }

  initializeMap(): void {
    if (!this.sales || this.sales.length === 0) {
      console.warn("No hay ventas disponibles para mostrar en el mapa.");
      return;
    }
  
    this.map = L.map(this.mapContainer.nativeElement).setView([-1.8312, -78.1834], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  
    const markerCluster = L.markerClusterGroup();
  
    console.log("Ventas para el mapa:", this.sales);
  
    // Definimos un ícono personalizado
    const customIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448528.png', // Cambia la URL por el ícono que prefieras
      iconSize: [32, 32], // Tamaño del ícono
      iconAnchor: [16, 32], // Punto donde se "ancla" el ícono en las coordenadas
      popupAnchor: [0, -32], // Punto donde se abre el popup
    });
  
    this.sales.forEach((sale) => {
      if (sale.geolocation && sale.geolocation.latitude !== 0 && sale.geolocation.longitude !== 0) {
        const { latitude, longitude } = sale.geolocation;
  
        console.log(`Venta procesada: ID=${sale.id}, Coordenadas=(${latitude}, ${longitude})`);
  
        const marker = L.marker([latitude, longitude], { icon: customIcon }).bindPopup(
          `<strong>Cliente:</strong> ${sale.products[0]?.client_name || 'Desconocido'}<br>
           <strong>Total Venta:</strong> $${sale.total_price.toFixed(2)}`
        );
        markerCluster.addLayer(marker);
      } else {
        console.warn(`Venta sin geolocalización válida: ID=${sale.id}`);
      }
    });
  
    this.map.addLayer(markerCluster);
  }
  
  
}
