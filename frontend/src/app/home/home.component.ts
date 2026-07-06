import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { first, finalize } from 'rxjs/operators';
import { AccountService, StatsService, AlertService } from '@app/_services';
import { Role } from '@app/_models';
import { environment } from '@environments/environment';

@Component({
    templateUrl: 'home.component.html',
    standalone: false
})
export class HomeComponent implements OnInit {
    stats: any = null;
    loading = true;
    Role = Role;
    downloadUrl = `${environment.apiUrl}/documentation-pdf`;

    constructor(
        private accountService: AccountService,
        private statsService: StatsService,
        private alertService: AlertService,
        private cdr: ChangeDetectorRef
    ) {}

    get account() {
        return this.accountService.accountValue;
    }

    ngOnInit() {
        this.loading = true;
        this.cdr.detectChanges();
        this.statsService.getStats()
            .pipe(
                first(),
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: data => {
                    this.stats = data;
                    this.cdr.detectChanges();
                },
                error: error => {
                    this.alertService.error('Could not load dashboard statistics.');
                    this.cdr.detectChanges();
                }
            });
    }
}
