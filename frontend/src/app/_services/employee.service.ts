import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Employee } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
    constructor(private http: HttpClient) {}

    getAll() {
        return this.http.get<Employee[]>(`${environment.apiUrl}/employees`);
    }

    getById(empId: string) {
        return this.http.get<Employee>(`${environment.apiUrl}/employees/${empId}`);
    }

    create(params: any) {
        return this.http.post(`${environment.apiUrl}/employees`, params);
    }

    update(empId: string, params: any) {
        return this.http.put(`${environment.apiUrl}/employees/${empId}`, params);
    }

    delete(empId: string) {
        return this.http.delete(`${environment.apiUrl}/employees/${empId}`);
    }
}
