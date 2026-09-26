import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CatheoPopulationService } from '../../catheo-population/services/catheo-population.service';
import { CatechumeneItem } from '../../catheo-population/models/catheo-population.model';

@Component({
  selector: 'app-catheo-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Importer depuis la Catéchèse CATHEO"
      size="lg"
      (close)="onCancel()"
    >
      <div class="import-container">
        <p class="import-intro">
          Recherchez et sélectionnez un enfant / jeune inscrit dans la catéchèse de la paroisse pour pré-remplir automatiquement son dossier d'inscription au pèlerinage.
        </p>

        <!-- Recherche rapide -->
        <div class="search-box">
          <i class="bi bi-search search-icon"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch()"
            placeholder="Rechercher par nom, prénoms, classe..."
            class="search-input"
          />
        </div>

        <!-- Liste des résultats -->
        <div class="results-wrap">
          @if (isLoading()) {
            <div class="loading-state">
              <i class="bi bi-arrow-repeat spin-icon"></i>
              <span>Chargement de la population paroissiale...</span>
            </div>
          } @else if (items().length === 0) {
            <div class="empty-state">
              <i class="bi bi-person-x"></i>
              <span>Aucun catéchumène trouvé avec ces critères.</span>
            </div>
          } @else {
            <div class="catechumene-list">
              @for (item of items(); track item.inscription_id) {
                <div class="catechumene-item" (click)="selectItem(item)">
                  <div class="item-avatar" [class.avatar-f]="item.catechumene?.sexe === 'F'">
                    <i class="bi bi-person-fill"></i>
                  </div>
                  <div class="item-info">
                    <span class="item-name">{{ item.catechumene?.nom }} {{ item.catechumene?.prenoms }}</span>
                    <span class="item-meta">
                      {{ item.catechumene?.sexe === 'M' ? 'Masculin' : 'Féminin' }}
                      @if (item.catechumene?.date_naissance; as dateN) {
                        · Né(e) le {{ dateN | date: 'dd/MM/yyyy' }}
                      }
                      @if (item.classe?.nom; as classeNom) {
                        · <strong>{{ classeNom }}</strong>
                      }
                    </span>
                  </div>
                  <app-btn variant="ghost" size="sm">
                    <span>Sélectionner</span>
                    <i class="bi bi-check-lg ml-1"></i>
                  </app-btn>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div modal-footer class="modal-footer-actions">
        <app-btn variant="secondary" (btnClick)="onCancel()">Fermer</app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .import-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .import-intro {
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      margin: 0;
      line-height: 1.4;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted, #94a3b8);
      font-size: 0.95rem;
    }
    .search-input {
      width: 100%;
      height: 42px;
      padding: 0 12px 0 38px;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 8px);
      background-color: var(--bg-surface, #ffffff);
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
      outline: none;
    }
    .search-input:focus {
      border-color: var(--primary-500, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    .results-wrap {
      max-height: 360px;
      overflow-y: auto;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      background: var(--bg-surface, #f8fafc);
      padding: 0.5rem;
    }
    .catechumene-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .catechumene-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-card, #ffffff);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .catechumene-item:hover {
      background: var(--primary-50, #eff6ff);
      border-color: var(--primary-300, #93c5fd);
      transform: translateX(2px);
    }
    .item-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--primary-100, #dbeafe);
      color: var(--primary-700, #1d4ed8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .avatar-f {
      background: #fce7f3;
      color: #be185d;
    }
    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .item-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
    }
    .item-meta {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-top: 2px;
    }
    .loading-state,
    .empty-state {
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--text-muted, #64748b);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
    .loading-state i,
    .empty-state i {
      font-size: 1.75rem;
    }
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.75rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatheoImportModalComponent implements OnInit {
  private readonly catheoService = inject(CatheoPopulationService);

  public readonly isOpen = input.required<boolean>();
  public readonly close = output<void>();
  public readonly selected = output<CatechumeneItem>();

  public readonly isLoading = signal<boolean>(false);
  public readonly items = signal<CatechumeneItem[]>([]);
  public searchQuery = '';

  public ngOnInit(): void {
    this.loadPopulation();
  }

  public loadPopulation(): void {
    this.isLoading.set(true);
    this.catheoService
      .getPopulation({ search: this.searchQuery.trim() || undefined, per_page: 30 })
      .subscribe({
        next: (res) => {
          this.items.set(res.data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  public onSearch(): void {
    this.loadPopulation();
  }

  public selectItem(item: CatechumeneItem): void {
    this.selected.emit(item);
  }

  public onCancel(): void {
    this.close.emit();
  }
}
