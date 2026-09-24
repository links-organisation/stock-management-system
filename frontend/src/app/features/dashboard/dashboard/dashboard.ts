import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummary } from '../../../core/models/dashboard.model';
import { KpiCard } from '../kpi-card/kpi-card';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [DecimalPipe, RouterLink, KpiCard, FcfaPipe, TranslocoPipe],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
})
export class Dashboard {
    summary = signal<DashboardSummary | null>(null);
    isLoading = signal(true);
    errorMessage = signal('');

    private transloco = inject(TranslocoService);

    constructor(private dashboardService: DashboardService) {
        this.dashboardService.getSummary().subscribe({
            next: (summary) => {
                this.summary.set(summary);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set(this.transloco.translate('dashboard.loadError'));
                this.isLoading.set(false);
            },
        });
    }
}
