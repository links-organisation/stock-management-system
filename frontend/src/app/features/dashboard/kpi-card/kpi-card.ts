import { Component, input } from '@angular/core';

@Component({
    selector: 'app-kpi-card',
    standalone: true,
    templateUrl: './kpi-card.html',
    styleUrl: './kpi-card.scss',
})
export class KpiCard {
    label = input('');
    value = input<string | null>('');
    tone = input<'default' | 'success' | 'danger'>('default');
}
