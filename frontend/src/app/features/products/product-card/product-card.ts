import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [FcfaPipe],
    templateUrl: './product-card.html',
    styleUrl: './product-card.scss',
})
export class ProductCard {
    @Input({ required: true }) product!: Product;
    @Input() canManage = false;
    @Output() edit = new EventEmitter<Product>();
    @Output() remove = new EventEmitter<Product>();
}
