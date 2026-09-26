import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  public transform(
    value: string | Date | null | undefined,
    format: 'short' | 'medium' | 'long' | 'time' = 'medium'
  ): string {
    if (!value) return '-';

    try {
      const date = typeof value === 'string' ? new Date(value) : value;
      if (isNaN(date.getTime())) return '-';

      switch (format) {
        case 'short':
          return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(date);
        case 'time':
          return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(date);
        case 'long':
          return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(date);
        case 'medium':
        default:
          return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).format(date);
      }
    } catch {
      return '-';
    }
  }
}
