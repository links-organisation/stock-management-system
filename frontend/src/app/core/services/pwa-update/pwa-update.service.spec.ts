import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { TranslocoService } from '@jsverse/transloco';
import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
    let versionUpdates: Subject<VersionEvent>;
    let translateSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        versionUpdates = new Subject<VersionEvent>();
        translateSpy = vi.fn().mockReturnValue('A new version is available. Reload now?');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function create(isEnabled: boolean): void {
        TestBed.configureTestingModule({
            providers: [
                { provide: SwUpdate, useValue: { isEnabled, versionUpdates } },
                { provide: TranslocoService, useValue: { translate: translateSpy } },
            ],
        });
        TestBed.inject(PwaUpdateService);
    }

    it('does nothing when the service worker is disabled', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        create(false);

        versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);

        expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('prompts with the translated message when a VERSION_READY event arrives', () => {
        // Note: this deliberately stops short of asserting document.location.reload()
        // actually runs - jsdom's Location#reload is a non-configurable, non-writable
        // own property that cannot be spied on or stubbed by any known technique, so
        // that final line of the confirm-then-reload branch is not directly observable
        // here. The confirm() call is the meaningful decision point this test pins down.
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        create(true);

        versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);

        expect(translateSpy).toHaveBeenCalledWith('pwa.updateAvailable');
        expect(confirmSpy).toHaveBeenCalledWith('A new version is available. Reload now?');
    });

    it('does not throw when the user dismisses the prompt', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        create(true);

        expect(() => versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent)).not.toThrow();
        expect(confirmSpy).toHaveBeenCalled();
    });

    it('ignores non-VERSION_READY events', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        create(true);

        versionUpdates.next({ type: 'VERSION_DETECTED' } as unknown as VersionEvent);

        expect(confirmSpy).not.toHaveBeenCalled();
    });
});
