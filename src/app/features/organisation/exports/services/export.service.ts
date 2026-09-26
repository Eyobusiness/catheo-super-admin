import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/services/api-client.service';
import {
  ExportActivitesFilters,
  ExportCaisseFilters,
  ExportMembresFilters,
  ExportPelerinagesFilters,
} from '../models/export.model';
import { CatechumeneItem } from '../../catheo-population/models/catheo-population.model';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'organisation/exports';

  /**
   * Télécharge le flux CSV réel des membres depuis le backend.
   * GET /api/v1/organisation/exports/membres
   */
  public exportMembresCsv(filters?: ExportMembresFilters): Observable<Blob> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.statut) params['statut'] = filters.statut;
      if (filters.sexe) params['sexe'] = filters.sexe;
      if (filters.fonction) params['fonction'] = filters.fonction;
    }
    return this.api.downloadBlob(`${this.endpoint}/membres`, { params });
  }

  /**
   * Télécharge le flux CSV réel des activités depuis le backend.
   * GET /api/v1/organisation/exports/activites
   */
  public exportActivitesCsv(filters?: ExportActivitesFilters): Observable<Blob> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.statut) params['statut'] = filters.statut;
      if (filters.type_activite) params['type_activite'] = filters.type_activite;
    }
    return this.api.downloadBlob(`${this.endpoint}/activites`, { params });
  }

  /**
   * Télécharge le flux CSV réel des participants d'un pèlerinage.
   * GET /api/v1/organisation/exports/pelerinages/{campagne}/participants
   */
  public exportParticipantsPelerinageCsv(
    campagneId: number | string,
    filters?: Omit<ExportPelerinagesFilters, 'campagne_id'>
  ): Observable<Blob> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.statut_inscription) params['statut_inscription'] = filters.statut_inscription;
      if (filters.statut_participation) params['statut_participation'] = filters.statut_participation;
      if (filters.type_export) params['type_export'] = filters.type_export;
    }
    return this.api.downloadBlob(
      `${this.endpoint}/pelerinages/${campagneId}/participants`,
      { params }
    );
  }

  /**
   * Télécharge le flux CSV réel des paiements d'un pèlerinage.
   * GET /api/v1/organisation/exports/pelerinages/{campagne}/paiements
   */
  public exportPaiementsPelerinageCsv(
    campagneId: number | string,
    filters?: { statut?: string; mode_paiement?: string }
  ): Observable<Blob> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.statut) params['statut'] = filters.statut;
      if (filters.mode_paiement) params['mode_paiement'] = filters.mode_paiement;
    }
    return this.api.downloadBlob(
      `${this.endpoint}/pelerinages/${campagneId}/paiements`,
      { params }
    );
  }

  /**
   * Télécharge le flux CSV réel de la caisse / opérations.
   * GET /api/v1/organisation/exports/caisse
   */
  public exportCaisseCsv(filters?: ExportCaisseFilters): Observable<Blob> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.type_operation) params['type_operation'] = filters.type_operation;
      if (filters.date_debut) params['date_debut'] = filters.date_debut;
      if (filters.date_fin) params['date_fin'] = filters.date_fin;
    }
    return this.api.downloadBlob(`${this.endpoint}/caisse`, { params });
  }

  /**
   * Déclenche le téléchargement d'un Blob dans le navigateur.
   */
  public downloadBlobFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  public downloadBlob(blob: Blob, filename: string): void {
    this.downloadBlobFile(blob, filename);
  }

  /**
   * Déclenche le téléchargement direct d'un contenu texte CSV avec UTF-8 BOM.
   */
  public downloadCsv(content: string, filename: string): void {
    const csvWithBom = content.startsWith('\uFEFF') ? content : '\uFEFF' + content;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlobFile(blob, filename);
  }

  /**
   * Construit la chaîne CSV formatée avec UTF-8 BOM, séparateur ; et échappement des guillemets.
   */
  public buildCsvContent(
    headers: string[],
    rows: (string | number | null | undefined)[][]
  ): string {
    const formatCell = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(formatCell).join(';');
    const rowLines = rows.map((r) => r.map(formatCell).join(';'));
    return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  }

  /**
   * Générateur CSV côté frontend robuste :
   * - Encodage UTF-8 avec BOM (\uFEFF) pour compatibilité totale avec Excel
   * - Séparateur point-virgule (;)
   * - Échappement des guillemets (doublés "")
   * - Gestion des sauts de ligne et valeurs nulles
   */
  public generateCsv(
    filename: string,
    headers: string[],
    rows: (string | number | null | undefined)[][]
  ): void {
    const csvContent = this.buildCsvContent(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlobFile(blob, filename);
  }

  /**
   * Alias de compatibilité pour exportParticipantsPelerinageCsv
   */
  public exportPelerinageParticipantsCsv(
    campagneId: number | string,
    filters?: Omit<ExportPelerinagesFilters, 'campagne_id'>
  ): Observable<Blob> {
    return this.exportParticipantsPelerinageCsv(campagneId, filters);
  }

  /**
   * Exporte la population CATHEO active au format CSV.
   */
  public exportCatheoPopulationCsv(
    items: CatechumeneItem[],
    organisationCode: string
  ): void {
    const headers = [
      'Matricule',
      'Nom',
      'Prénoms',
      'Genre',
      'Section Pastorale',
      'Niveau',
      'Classe',
      'Statut Inscription',
    ];

    const rows = items.map((item) => [
      item.catechumene?.matricule || item.code_inscription || '',
      item.catechumene?.nom || '',
      item.catechumene?.prenoms || '',
      item.catechumene?.sexe || '',
      item.section?.nom || item.section?.code || '',
      item.niveau?.nom || '',
      item.classe?.nom || 'Non assigné',
      item.statut_inscription || 'Inscrit',
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `catheo_population_${organisationCode.toLowerCase()}_${dateStr}.csv`;
    this.generateCsv(filename, headers, rows);
  }
}
