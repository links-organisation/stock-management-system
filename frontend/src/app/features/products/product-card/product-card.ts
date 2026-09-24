import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Product } from '../../../core/models/product.model';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [FcfaPipe, TranslocoPipe],
    templateUrl: './product-card.html',
    styleUrl: './product-card.scss',
})
export class ProductCard {
    product = input.required<Product>();
    canManage = input(false);
    edit = output<Product>();
    remove = output<Product>();
}
