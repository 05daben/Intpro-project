import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { ServiceRequest } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class RequestService {
    constructor(private http: HttpClient) {}

    getAll() {
        return this.http.get<ServiceRequest[]>(`${environment.apiUrl}/requests`);
    }

    create(params: any) {
        return this.http.post(`${environment.apiUrl}/requests`, params);
    }

    updateStatus(id: number, status: string) {
        return this.http.put(`${environment.apiUrl}/requests/${id}/status`, { status });
    }

    delete(id: number) {
        return this.http.delete(`${environment.apiUrl}/requests/${id}`);
    }
}
