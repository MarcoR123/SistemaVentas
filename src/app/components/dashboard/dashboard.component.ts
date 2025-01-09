import { Component, OnInit } from '@angular/core';
import { SaleService } from '../../services/sale.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  salesData: any[] = [];
  filteredData: any[] = [];
  regions: string[] = ['Guayaquil', 'Quito', 'Cuenca', 'Manabí'];
  selectedRegion: string = 'Todos';
  startDate: Date | null = null;
  endDate: Date | null = null;

  topSeller: any = null;
  topBrand: any = null;
  topProduct: any = null;

  salesByRegionData: any;
  salesBySellerData: any;

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
  };

  constructor(private saleService: SaleService) {}

  ngOnInit(): void {
    this.loadSalesData();
  }

  loadSalesData(): void {
    this.saleService.getSales().subscribe({
      next: (data) => {
        this.salesData = data;
        this.generateStatistics(data);
      },
      error: (error) => console.error('Error al cargar ventas:', error),
    });
  }

  filterData(): void {
    this.filteredData = this.salesData.filter((sale) => {
      const saleDate = new Date(sale.date);
      const isWithinRegion = this.selectedRegion === 'Todos' || sale.region === this.selectedRegion;
      const isWithinDates =
        (!this.startDate || saleDate >= new Date(this.startDate)) &&
        (!this.endDate || saleDate <= new Date(this.endDate));

      return isWithinRegion && isWithinDates;
    });
    this.generateStatistics(this.filteredData);
  }

  generateStatistics(data: any[]): void {
    this.topSeller = this.calculateTopSeller(data);
    this.topBrand = this.calculateTopBrand(data);
    this.topProduct = this.calculateTopProduct(data);
    this.salesByRegionData = this.getSalesByRegionChartData(data);
    this.salesBySellerData = this.getSalesBySellerChartData(data);
  }

  calculateTopSeller(data: any[]): any {
    const sellerSales = new Map();
    data.forEach((sale) => {
      const seller = sale.user_name || 'Desconocido';
      sellerSales.set(seller, (sellerSales.get(seller) || 0) + sale.total_price);
    });

    const topSeller = Array.from(sellerSales).reduce((prev, curr) => (curr[1] > prev[1] ? curr : prev), ['', 0]);
    return { name: topSeller[0], totalSales: topSeller[1] };
  }

  calculateTopBrand(data: any[]): any {
    const brandSales = new Map();
    data.forEach((sale) => {
      const brand = sale.products[0]?.brand || 'Sin Marca';
      brandSales.set(brand, (brandSales.get(brand) || 0) + sale.total_price);
    });

    const topBrand = Array.from(brandSales).reduce((prev, curr) => (curr[1] > prev[1] ? curr : prev), ['', 0]);
    return { brand: topBrand[0], sales: topBrand[1] };
  }

  calculateTopProduct(data: any[]): any {
    const productSales = new Map();
    data.forEach((sale) => {
      const productName = sale.products[0]?.product_name || 'Producto Desconocido';
      productSales.set(productName, (productSales.get(productName) || 0) + sale.products[0]?.quantity);
    });

    const topProduct = Array.from(productSales).reduce((prev, curr) => (curr[1] > prev[1] ? curr : prev), ['', 0]);
    return { name: topProduct[0], sales: topProduct[1] };
  }

  getSalesByRegionChartData(data: any[]): any {
    const regionSales = new Map();
    data.forEach((sale) => {
      const region = sale.region || 'Sin Región';
      regionSales.set(region, (regionSales.get(region) || 0) + sale.total_price);
    });

    const labels = Array.from(regionSales.keys());
    const salesData = Array.from(regionSales.values());

    return { labels, datasets: [{ label: 'Ventas por Región', data: salesData, backgroundColor: '#0070C0' }] };
  }

  getSalesBySellerChartData(data: any[]): any {
    const sellerSales = new Map();
    data.forEach((sale) => {
      const seller = sale.user_name || 'Desconocido';
      sellerSales.set(seller, (sellerSales.get(seller) || 0) + sale.total_price);
    });

    const labels = Array.from(sellerSales.keys());
    const salesData = Array.from(sellerSales.values());

    return { labels, datasets: [{ label: 'Ventas por Vendedor', data: salesData, backgroundColor: '#28a745' }] };
  }
}
