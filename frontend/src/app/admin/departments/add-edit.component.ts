import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { DepartmentService, AlertService } from '@app/_services';

@Component({
    templateUrl: 'add-edit.component.html',
    standalone: false
})
export class AddEditComponent implements OnInit {
    form!: FormGroup;
    id?: number;
    title!: string;
    loading = false;
    submitting = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private departmentService: DepartmentService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        const idParam = this.route.snapshot.params['id'];
        this.id = idParam ? parseInt(idParam) : undefined;
        this.title = this.id ? 'Edit Department' : 'Add Department';

        this.form = this.formBuilder.group({
            name: ['', Validators.required],
            description: ['', Validators.required]
        });

        if (this.id) {
            this.loading = true;
            this.departmentService.getById(this.id.toString())
                .pipe(first())
                .subscribe({
                    next: dept => {
                        this.form.patchValue(dept);
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
        
        const saveObservable = this.id
            ? this.departmentService.update(this.id, this.form.value)
            : this.departmentService.create(this.form.value);

        saveObservable
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Department saved successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }
}
