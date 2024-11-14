import { Component, EventEmitter, Input, Output } from '@angular/core';
import { graphModel, kpiModel, PaymentFilter } from '../../models/stadistics';
import { StadisticsService } from '../../services/stadistics.service';
import { KpiComponent } from '../commons/kpi/kpi.component';
import { BarchartComponent } from '../commons/barchart/barchart.component';
import { PiechartComponent } from '../commons/piechart/piechart.component';
import {PaymentReportDto, PaymentStatus, PayMethod} from '../../models/payments.report.model';

@Component({
  selector: 'app-total-payments',
  standalone: true,
  imports: [KpiComponent, BarchartComponent, PiechartComponent],
  templateUrl: './total-payments.component.html',
  styleUrls: ['./total-payments.component.scss']
})
export class TotalPaymentsComponent {
  @Input() filters: PaymentFilter = {} as PaymentFilter;
  @Output() notifyParent: EventEmitter<string> = new EventEmitter<string>();

  colors = [
    '#62B68F', // Mercado Pago
    '#FF919E', // Transferencia
    '#82B1FF', // Otros
    '#BB83D1',
    '#FFAB91',
    '#A2D9A5',
    '#95A0D9',
    '#FFA29A',
    '#7ECEC6',
    '#FFF59D',
    '#FFE082',
    '#DCE775',
    '#C4C4C4',
    '#BCAAAC',
    '#90CAF9'
  ];

  // KPI variables
  kpi1: kpiModel = {} as kpiModel;
  kpi2: kpiModel = {} as kpiModel;
  kpi3: kpiModel = {} as kpiModel;
  kpi4: kpiModel = {} as kpiModel;

  // Graph variables
  graph1: graphModel = {} as graphModel;
  graph2: graphModel = {} as graphModel;

  // Constructor
  constructor(private stadisticsService: StadisticsService) {
    // Initialize KPIs and Graphs
    this.kpi1 = { title: "Métodos de Pago", desc: "", value: "0", icon: "bi bi-graph-up", color: "bg-success" };
    this.kpi2 = { title: "Pagos Aprobados vs Rechazados", desc: "", value: "0%", icon: "bi bi-arrow-down-circle", color: "bg-info" };
    this.kpi3 = { title: "Promedio de Monto por Método", desc: "", value: "0", icon: "bi bi-person-circle", color: "bg-warning" };
    this.kpi4 = { title: "Tasa de Retención de Pagos", desc: "", value: "0%", icon: "bi bi-person-circle", color: "bg-warning" };

    this.graph1 = { title: "Informe de Total Cobrado", subtitle: "", data: [], options: null };
    this.graph2 = { title: "Deuda Total de Propietarios", subtitle: "", data: [], options: null };
  }

  // Fetch report data
  getData() {
    this.getRerportPayments();
  }

  getRerportPayments(): void {
    this.stadisticsService.getDinamycFilters(this.filters).subscribe(
      (data: PaymentReportDto[]) => {
        let countMP = 0;
        let countT = 0;
        let countPending = 0;
        let countApproved = 0;
        let countRejected = 0;
        let totalAmountMP = 0;
        let totalAmountT = 0;
        let totalTime = 0;
        let approvedCount = 0;
        let ticketIds = new Set();
        let recurrentPayments = 0;

        for (const payment of data) {
          if (payment.paymentMethod === 'MERCADO_PAGO') {
            countMP++;
            totalAmountMP += payment.amount;
          } else if (payment.paymentMethod === 'TRANSFERENCE') {
            countT++;
            totalAmountT += payment.amount;
          }

          if (payment.status === 'REJECTED') {
            countRejected++;
          } else if (payment.status === 'APPROVED') {
            countApproved++;
            approvedCount++;

            if (payment.createdAt && payment.status === 'APPROVED') {
              const approvalTime = new Date().getTime() - new Date(payment.createdAt).getTime();
              totalTime += approvalTime;
            }
          }

          if (ticketIds.has(payment.ticketId)) {
            recurrentPayments++;
          } else {
            ticketIds.add(payment.ticketId);
          }
        }

        const rejectionRate = (countRejected / (countMP + countT)) * 100;
        this.kpi1.value = `Tasa de Rechazo: ${rejectionRate.toFixed(2)}%`;

        const avgAmountMP = countMP > 0 ? totalAmountMP / countMP : 0;
        const avgAmountT = countT > 0 ? totalAmountT / countT : 0;
        this.kpi2.value = `Promedio Mercado Pago: $${avgAmountMP.toFixed(2)} vs. Transferencia: $${avgAmountT.toFixed(2)}`;

        const avgTime = approvedCount > 0 ? totalTime / approvedCount : 0;
        this.kpi3.value = `Tiempo Promedio Aprobación: ${this.formatDuration(avgTime)}`;

        const retentionRate = (recurrentPayments / (countMP + countT)) * 100;
        this.kpi4.value = `Tasa de Retención: ${retentionRate.toFixed(2)}%`;

        // Graph data
        this.graph1.data = this.mapPaymentStatusData(data);
        this.graph1.options = { ...this.columnChartOptions, colors: this.colors };
        this.graph1.options.height = 500;

        this.graph2.data = this.mapPayMethodData(data);
        this.graph2.options = { ...this.columnChartOptions, colors: this.colors, height: 500 };
      },
      (error: any) => {
        console.error('Error al obtener el reporte', error);
      }
    );
  }

  formatDuration(durationInMilliseconds: number): string {
    const seconds = Math.floor(durationInMilliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  mapPaymentStatusData(data: any[]): any[] {
    const countPaymentStatus: { [key in PaymentStatus]: number } = {
      [PaymentStatus.APPROVED]: 0,
      [PaymentStatus.REJECTED]: 0,
      [PaymentStatus.PENDING]: 0,
    };

    data.forEach(item => {
      if (Object.values(PaymentStatus).includes(item.status as PaymentStatus)) {
        countPaymentStatus[item.status as PaymentStatus]++;
      }
    });

    const formattedData = Object.entries(countPaymentStatus).map(([key, value]) => [
      key,
      value
    ]);

    return formattedData;
  }


  mapPayMethodData(array: any[]): any[] {
    const countPayMethod: { [key in PayMethod]: number } = {
      [PayMethod.TRANSFERENCE]: 0,
      [PayMethod.MERCADO_PAGO]: 0,
    };

    array.forEach(data => {
      if (Object.values(PayMethod).includes(data.paymentMethod as PayMethod)) {
        countPayMethod[data.paymentMethod as PayMethod]++;
      }
    });

    return Object.entries(countPayMethod).map(([key, value]) => [key, value]);
  }

  columnChartOptions = {
    backgroundColor: 'transparent',
    legend: { position: 'none' },
    chartArea: { width: '80%', height: '60%' },
    vAxis: {
      textStyle: {
        color: '#6c757d',
        fontSize: 12,
      },
      format: '#',
    },
    hAxis: {
      textStyle: { color: '#6c757d' },
      showTextEvery: 2,
    },
    animation: {
      duration: 1000,
      easing: 'out',
      startup: true,
    },
    height: 400,
    width: '100%',
    bar: { groupWidth: '70%' },
  };

  pieChartOptions = {
    backgroundColor: 'transparent',
    legend: {
      position: 'right-center',
      textStyle: { color: '#6c757d', fontSize: 17 },
    },
    chartArea: { width: '100%', height: '100%' },
    pieHole: 0,
    height: '80%',
    slices: {
      0: { color: '#00BFFF' },
      1: { color: '#8A2BE2' },
      2: { color: '#ACE1AF' },
    },
    pieSliceTextStyle: {
      color: 'black',
      fontSize: 18,
    },
  };
}
