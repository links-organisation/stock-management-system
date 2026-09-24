import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
    constructor(
        private swUpdate: SwUpdate,
        private transloco: TranslocoService,
    ) {
        if (!this.swUpdate.isEnabled) {
            return;
        }

        this.swUpdate.versionUpdates
            .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
            .subscribe(() => {
                const message = this.transloco.translate('pwa.updateAvailable');
                if (confirm(message)) {
                    document.location.reload();
                }
            });
    }
}
