import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'fcfa',
})
export class FcfaPipe implements PipeTransform {
    transform(value: number | null | undefined, ...args: unknown[]): string {
        if (value === null || value === undefined) {
            return '0';//'0 FCFA';
        }

        return `${value.toLocaleString('fr-FR')} FCFA`;
    }
}
