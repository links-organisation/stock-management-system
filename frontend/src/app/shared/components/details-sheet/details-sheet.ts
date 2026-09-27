import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
    selector: 'app-details-sheet',
    standalone: true,
    imports: [TranslocoPipe],
    templateUrl: './details-sheet.html',
    styleUrl: './details-sheet.scss',
})
export class DetailsSheet {
    title = input<string>('');
    close = output<void>();
}
