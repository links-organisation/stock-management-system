import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  @Input() label = '';
  @Input() value: string | null = '';
  @Input() tone: 'default' | 'success' | 'danger' = 'default';
}
