import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { first, finalize } from 'rxjs/operators';
import { DepartmentService, AlertService } from '@app/_services';
import { Department } from '@app/_models';

@Component({
    templateUrl: 'list.component.html',
    standalone: false
})
export class ListComponent implements OnInit {
    departments?: Department[];
    loading = true;

    constructor(
        private departmentService: DepartmentService,
        private alertService: AlertService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loading = true;
        this.cdr.detectChanges();
        this.departmentService.getAll()
            .pipe(
                first(),
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: depts => {
                    this.departments = depts;
                    this.cdr.detectChanges();
                },
                error: error => {
                    this.alertService.error(error);
                    this.cdr.detectChanges();
                }
            });
    }

    deleteDept(id: number) {
        const dept = this.departments?.find(x => x.id === id);
        if (!dept) return;
        
        if (confirm(`Are you sure you want to delete department: ${dept.name}?`)) {
            this.departmentService.delete(id)
                .pipe(first())
                .subscribe(() => {
                    this.departments = this.departments?.filter(x => x.id !== id);
                    this.cdr.detectChanges();
                });
        }
    }
}
