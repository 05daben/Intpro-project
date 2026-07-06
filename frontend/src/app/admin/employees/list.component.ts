import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { first, finalize } from 'rxjs/operators';
import { EmployeeService, AlertService } from '@app/_services';
import { Employee } from '@app/_models';

@Component({
    templateUrl: 'list.component.html',
    standalone: false
})
export class ListComponent implements OnInit {
    employees?: Employee[];
    loading = true;

    constructor(
        private employeeService: EmployeeService,
        private alertService: AlertService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loading = true;
        this.cdr.detectChanges();
        this.employeeService.getAll()
            .pipe(
                first(),
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: emps => {
                    this.employees = emps;
                    this.cdr.detectChanges();
                },
                error: error => {
                    this.alertService.error(error);
                    this.cdr.detectChanges();
                }
            });
    }

    deleteEmployee(empId: string) {
        const emp = this.employees?.find(x => x.empId === empId);
        if (!emp) return;

        if (confirm(`Are you sure you want to delete employee record: ${emp.firstName} ${emp.lastName}?`)) {
            this.employeeService.delete(empId)
                .pipe(first())
                .subscribe(() => {
                    this.employees = this.employees?.filter(x => x.empId !== empId);
                    this.cdr.detectChanges();
                });
        }
    }
}
