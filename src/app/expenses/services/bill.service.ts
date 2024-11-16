import { inject, Injectable } from '@angular/core';
import { Bill } from '../models/bill';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import BillType from '../models/billType';
import { BillPostRequest } from '../models/bill-post-request';
import { BillDto } from '../models/billDto';
import { PaginatedResponse } from '../models/paginatedResponse';
import { PORT } from '../const';

@Injectable({
  providedIn: 'root',
})
export class BillService {
  private http = inject(HttpClient);
  private url = PORT;

  constructor() {}

  getAllBills(
    size?: number,
    page?: number,
    period?: number,
    category?: number,
    supplier?: number,
    type?: number,
    provider?: string,
    status?: string
  ): Observable<Bill[]> {
    let params = new HttpParams();

    if (size !== undefined && size > 0) {
      params = params.set('size', size.toString());
    }
    if (page !== undefined && page > 0) {
      params = params.set('page', page.toString());
    }
    if (period !== undefined && period > 0) {
      params = params.set('period', period.toString());
    }
    if (category !== undefined && category > 0) {
      params = params.set('category', category.toString());
    }
    if (supplier !== undefined && supplier > 0) {
      params = params.set('supplier', supplier.toString());
    }
    if (type !== undefined && type > 0) {
      params = params.set('type', type.toString());
    }
    if (provider) {
      params = params.set('provider', provider);
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.formatBills(
      this.http.get<PaginatedResponse<BillDto>>(`${this.url}bills`, { params })
    );
  }

  getAllBillsAndPagination(
    page?: number,
    size?: number,
    period?: number,
    category?: number,
    supplier?: number,
    type?: number,
    provider?: string,
    status?: string
  ): Observable<PaginatedResponse<BillDto>> {
    let params = new HttpParams();

    if (size !== undefined && size > 0) {
      params = params.set('size', size.toString());
    }
    if (page !== undefined && page > 0) {
      params = params.set('page', page.toString());
    }
    if (period !== undefined && period > 0) {
      params = params.set('period', period.toString());
    }
    if (category !== undefined && category > 0) {
      params = params.set('category', category.toString());
    }
    if (supplier !== undefined && supplier > 0) {
      params = params.set('supplier', supplier.toString());
    }
    if (type !== undefined && type > 0) {
      params = params.set('type', type.toString());
    }
    if (provider) {
      params = params.set('provider', provider);
    }
    if (status && status !== 'undefined') {
      params = params.set('status', status);
    }

    return this.http.get<PaginatedResponse<BillDto>>(`${this.url}bills`, { params });
  }


  getAllBillsAndPaginationAny(
    page?: number,
    size?: number,
    period?: number,
    category?: number,
    supplier?: number,
    type?: number,
    provider?: string,
    status?: string
  ): Observable<PaginatedResponse<any>> {
    let params = new HttpParams();

    if (size !== undefined && size > 0) {
      params = params.set('size', size.toString());
    }
    if (page !== undefined && page > 0) {
      params = params.set('page', page.toString());
    }
    if (period !== undefined && period > 0) {
      params = params.set('period', period.toString());
    }
    if (category !== undefined && category > 0) {
      params = params.set('category', category.toString());
    }
    if (supplier !== undefined && supplier > 0) {
      params = params.set('supplier', supplier.toString());
    }
    if (type !== undefined && type > 0) {
      params = params.set('type', type.toString());
    }
    if (provider) {
      params = params.set('provider', provider);
    }
    if (status && status !== 'undefined') {
      params = params.set('status', status);
    }

    return this.http.get<PaginatedResponse<any>>(`${this.url}bills`, { params });
  }

  getBillTypes(): Observable<BillType[]> {
    return this.http.get<BillType[]>(`${this.url}bill-type`);
  }

  getAllBillsPaged(
    size: number,
    page: number,
    period: number | null,
    category: number | null,
    type: number | null,
    status: string | null,
    supplier: number | null
  ): Observable<{
    pagination: Observable<PaginatedResponse<BillDto>>;
    bills: Observable<Bill[]>;
  }> {
    let request = `${this.url}bills?size=${size}&page=${page}`;

    if (type != null) request = request + `&type=${type}`;
    if (status != null) request = request + `&status=${status}`;
    if (category != null) request = request + `&category=${category}`;
    if (period != null) request = request + `&period=${period}`;
    if (status != null) request = request + `&status=${status}`;
    if (supplier != null) request = request + `&supplier=${supplier}`;

    let data = this.http.get<PaginatedResponse<BillDto>>(request);

    return of({ pagination: data, bills: this.formatBills(data) });
  }

  addBill(bill: BillPostRequest): Observable<BillPostRequest> {
    const snakeCaseBill = {
      description: bill.description,
      amount: Number(bill.amount),
      date: bill.date,
      status: 'Nuevo',
      category_id: Number(bill.categoryId),
      supplier_id: Number(bill.supplierId),
      supplier_employee_type: 'SUPPLIER',
      type_id: Number(bill.typeId),
      period_id: Number(bill.periodId),
      link_pdf: '',
    };
    const headers = new HttpHeaders({
      'x-user-id': '1',
    });
    return this.http.post<BillPostRequest>(this.url + 'bills', snakeCaseBill, { headers });
  }

  updateBill(updatedBill: any, id: any): Observable<Bill> {
    const headers = new HttpHeaders({
      'x-user-id': '1',
    });
    return this.http.put<Bill>(`${this.url}bills/${id}`, updatedBill, { headers });
  }
  
  formatBills(
    billsDto$: Observable<PaginatedResponse<BillDto>>
  ): Observable<Bill[]> {
    return billsDto$.pipe(
      map((response) => {
        const billsDto = response.content;
        if (!Array.isArray(billsDto)) {
          return [];
        }
        return billsDto.map(
          (billDto) =>
            new Bill(
              billDto.expenditure_id,
              billDto.date,
              billDto.amount,
              billDto.description,
              billDto.supplier,
              billDto.period,
              billDto.category,
              billDto.bill_type,
              billDto.status
            )
        );
      })
    );
  }

  validateDate(date: string, periodId: number): Observable<boolean> {
    const formattedDate = new Date(date).toISOString().replace('Z', '');
    const params = new HttpParams()
      .set('date', formattedDate)
      .set('periodId', periodId.toString());

    return this.http.get<boolean>(`${this.url}bills/valid-date`, { params });
  }

  patchBill(id: number, status: string):Observable<Bill>{
    const body: { billId: number, newStatus: string} = { "billId": id, "newStatus": status}
    const headers = new HttpHeaders({
      'x-user-id': '1',
    });

    return this.http.patch<Bill>(`${this.url}bills/status`, body , { headers })
  }
}

