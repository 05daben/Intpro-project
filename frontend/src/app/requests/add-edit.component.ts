import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { RequestService, AlertService } from '@app/_services';

@Component({
    templateUrl: 'add-edit.component.html',
    standalone: false
})
export class AddEditComponent implements OnInit {
    form!: FormGroup;
    submitting = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private requestService: RequestService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.form = this.formBuilder.group({
            type: ['Hardware Procurement', Validators.required],
            // Hardware fields
            device: ['MacBook Pro M3'],
            ram: ['16GB'],
            // Software fields
            software: ['Figma Pro'],
            license: ['1 Year'],
            // Access fields
            system: ['Production Server'],
            roleAccess: ['Read Only'],
            // General justification
            justification: ['', Validators.required]
        });
    }

    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) return;

        this.submitting = true;

        const val = this.form.value;
        let items: any = {};
        
        if (val.type === 'Hardware Procurement') {
            items = { device: val.device, RAM: val.ram, justification: val.justification };
        } else if (val.type === 'Software Access') {
            items = { software: val.software, license: val.license, justification: val.justification };
        } else {
            items = { system: val.system, roleAccess: val.roleAccess, justification: val.justification };
        }

        const payload = {
            type: val.type,
            items,
            date: new Date().toISOString().split('T')[0]
        };

        this.requestService.create(payload)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Service request submitted successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['/requests']);
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }
}
