import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
@Pipe({
  name: 'currencyCfa',
  standalone: true,
})
export class CurrencyCfaPipe implements PipeTransform {
  public transform(value: number | string | null | undefined, suffix: string = 'FCFA'): string {
    if (value === null || value === undefined || value === '') {
      return `0 ${suffix}`;
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return `0 ${suffix}`;
    }

    // Format with thousands separator (space in French locale)
    const formatted = new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(num);

    return `${formatted} ${suffix}`;
  }
}
