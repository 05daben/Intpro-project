import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { EmployeeService, DepartmentService, AlertService } from '@app/_services';
import { Department } from '@app/_models';

@Component({
    templateUrl: 'add-edit.component.html',
    standalone: false
})
export class AddEditComponent implements OnInit {
    form!: FormGroup;
    empId?: string;
    title!: string;
    loading = false;
    submitting = false;
    submitted = false;
    departments: Department[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private employeeService: EmployeeService,
        private departmentService: DepartmentService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.empId = this.route.snapshot.params['id'];
        this.title = this.empId ? 'Edit Employee Record' : 'Add Employee Record';

        this.form = this.formBuilder.group({
            empId: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            position: ['', Validators.required],
            department: ['', Validators.required],
            hireDate: ['', Validators.required]
        });

        // Load departments list for dropdown selection
        this.departmentService.getAll()
            .pipe(first())
            .subscribe(depts => this.departments = depts);

        if (this.empId) {
            this.loading = true;
            this.form.get('empId')?.disable(); // empId is primaryKey and can't be changed
            this.employeeService.getById(this.empId)
                .pipe(first())
                .subscribe({
                    next: emp => {
                        this.form.patchValue(emp);
                        this.loading = false;
                    },
                    error: error => {
                        this.alertService.error(error);
                        this.loading = false;
                    }
                });
        }
    }

    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) return;

        this.submitting = true;
        
        // Include empId in body even if form field is disabled
        const data = this.form.getRawValue();

        const saveObservable = this.empId
            ? this.employeeService.update(this.empId, data)
            : this.employeeService.create(data);

        saveObservable
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Employee record saved successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }
}
