import { Pipe, PipeTransform } from '@angular/core';

const STATUS_DICTIONARY: Record<string, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  suspendu: 'Suspendu',
  en_attente: 'En attente',
  expire: 'Expiré',
  paye: 'Payé',
  partiel: 'Partiellement payé',
  annule: 'Annulé',
  brouillon: 'Brouillon',
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
  cloture: 'Clôturé',
  valide: 'Validé',
  rejete: 'Rejeté',
};

@Pipe({
  name: 'statusLabel',
  standalone: true,
})
export class StatusLabelPipe implements PipeTransform {
  public transform(value: string | null | undefined): string {
    if (!value) return '-';
    const key = value.toLowerCase().trim();
    return STATUS_DICTIONARY[key] || value;
  }
}
