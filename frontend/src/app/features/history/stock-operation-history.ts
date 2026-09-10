import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OperationType, StockOperation } from '../../core/models/stock-operation.model';
import { StockOperationService } from '../../core/services/stock-operation.service';

@Component({
  selector: 'app-stock-operation-history',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './stock-operation-history.html',
  styleUrl: './stock-operation-history.scss',
})
export class StockOperationHistory implements OnInit {
  operations: StockOperation[] = [];
  isLoading = true;
  errorMessage = '';

  typeFilter: OperationType | '' = '';

  constructor(private stockOperationService: StockOperationService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.stockOperationService.getAll(this.typeFilter ? { type: this.typeFilter } : {}).subscribe({
      next: (operations) => {
        this.operations = operations;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Could not load the operations history.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
