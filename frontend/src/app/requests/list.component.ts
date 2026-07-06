import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { first, finalize } from 'rxjs/operators';
import { RequestService, AccountService, AlertService } from '@app/_services';
import { ServiceRequest, Role } from '@app/_models';

@Component({
    templateUrl: 'list.component.html',
    standalone: false
})
export class ListComponent implements OnInit {
    requests?: ServiceRequest[];
    loading = true;
    Role = Role;

    constructor(
        private requestService: RequestService,
        private accountService: AccountService,
        private alertService: AlertService,
        private cdr: ChangeDetectorRef
    ) {}

    get account() {
        return this.accountService.accountValue;
    }

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.loading = true;
        this.cdr.detectChanges();
        this.requestService.getAll()
            .pipe(
                first(),
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: reqs => {
                    this.requests = reqs;
                    this.cdr.detectChanges();
                },
                error: error => {
                    this.alertService.error(error);
                    this.cdr.detectChanges();
                }
            });
    }

    updateStatus(id: number, status: string) {
        this.requestService.updateStatus(id, status)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success(`Request status updated to ${status}`);
                    this.loadRequests();
                },
                error: error => this.alertService.error(error)
            });
    }

    deleteRequest(id: number) {
        if (confirm('Are you sure you want to delete this service request?')) {
            const req = this.requests?.find(x => x.id === id);
            if (req) req.isDeleting = true;

            this.requestService.delete(id)
                .pipe(first())
                .subscribe({
                    next: () => {
                        this.requests = this.requests?.filter(x => x.id !== id);
                        this.alertService.success('Request deleted successfully');
                        this.cdr.detectChanges();
                    },
                    error: error => {
                        this.alertService.error(error);
                        if (req) req.isDeleting = false;
                        this.cdr.detectChanges();
                    }
                });
        }
    }

    getItemSummary(items: any): string {
        if (!items) return 'No details';
        try {
            const parsed = typeof items === 'string' ? JSON.parse(items) : items;
            return Object.entries(parsed)
                .map(([key, val]) => `${key}: ${val}`)
                .join(', ');
        } catch {
            return String(items);
        }
    }
}
