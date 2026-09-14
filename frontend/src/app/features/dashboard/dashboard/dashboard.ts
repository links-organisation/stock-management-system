import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummary } from '../../../core/models/dashboard.model';
import { KpiCard } from '../kpi-card/kpi-card';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [DecimalPipe, RouterLink, KpiCard, FcfaPipe],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
    summary: DashboardSummary | null = null;
    isLoading = true;
    errorMessage = '';

    constructor(
        private dashboardService: DashboardService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.dashboardService.getSummary().subscribe({
            next: (summary) => {
                this.summary = summary;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.errorMessage = 'Could not load dashboard data.';
                this.isLoading = false;
                this.cdr.detectChanges();
            },
        });
    }
}
