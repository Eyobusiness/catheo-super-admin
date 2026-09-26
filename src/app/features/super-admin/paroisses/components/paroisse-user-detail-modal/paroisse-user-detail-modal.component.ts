import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { ParoisseUser } from '../../models/paroisse-user.model';

@Component({
  selector: 'app-paroisse-user-detail-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Détails complets de l'utilisateur"
      size="lg"
      (close)="onClose()"
    >
      @if (user(); as u) {
        <div class="user-detail-container">
          <!-- En-tête profil -->
          <div class="user-header-card">
            <div class="avatar-circle">
              <i class="bi bi-person-fill"></i>
            </div>
            <div class="user-meta">
              <h3 class="user-name">{{ u.name }}</h3>
              <div class="user-sub">
                <span class="user-username">@{{ u.username }}</span>
                <span class="dot">•</span>
                <span class="user-email">{{ u.email }}</span>
              </div>
              <div class="user-badges">
                <span class="badge-role">{{ u.profil?.nom || 'Profil ' + u.profil_id }}</span>
                <span [class]="'badge-statut ' + u.statut">{{ u.statut | uppercase }}</span>
                <span class="badge-type">{{ u.user_type }}</span>
              </div>
            </div>
          </div>

          <!-- Grille des champs complets -->
          <div class="fields-table-wrapper">
            <table class="fields-table">
              <tbody>
                <tr>
                  <td class="col-label">id (Interne)</td>
                  <td class="col-val mono">{{ u.id_interne || '-' }}</td>
                </tr>
                <tr>
                  <td class="col-label">uuid</td>
                  <td class="col-val mono">{{ u.uuid || u.id }}</td>
                </tr>
                <tr>
                  <td class="col-label">paroisse_configuration_id</td>
                  <td class="col-val mono">{{ u.paroisse_configuration_id }}</td>
                </tr>
                <tr>
                  <td class="col-label">organisation_id</td>
                  <td class="col-val mono">{{ u.organisation_id !== null ? u.organisation_id : 'null (Paroisse)' }}</td>
                </tr>
                <tr>
                  <td class="col-label">profil_id</td>
                  <td class="col-val">
                    <strong>{{ u.profil_id }}</strong>
                    @if (u.profil) {
                      <span class="text-muted"> — {{ u.profil.nom }} ({{ u.profil.code }})</span>
                    }
                  </td>
                </tr>
                <tr>
                  <td class="col-label">user_type</td>
                  <td class="col-val">{{ u.user_type }}</td>
                </tr>
                <tr>
                  <td class="col-label">username</td>
                  <td class="col-val"><strong>{{ u.username }}</strong></td>
                </tr>
                <tr>
                  <td class="col-label">name</td>
                  <td class="col-val">{{ u.name }}</td>
                </tr>
                <tr>
                  <td class="col-label">email</td>
                  <td class="col-val">{{ u.email }}</td>
                </tr>
                <tr>
                  <td class="col-label">telephone</td>
                  <td class="col-val">{{ u.telephone || '-' }}</td>
                </tr>
                <tr>
                  <td class="col-label">email_verified_at</td>
                  <td class="col-val">{{ (u.email_verified_at | date: 'dd/MM/yyyy HH:mm:ss') || 'Non vérifié' }}</td>
                </tr>
                <tr>
                  <td class="col-label">statut</td>
                  <td class="col-val">{{ u.statut }}</td>
                </tr>
                <tr>
                  <td class="col-label">dernier_login_at</td>
                  <td class="col-val">{{ (u.dernier_login_at | date: 'dd/MM/yyyy HH:mm:ss') || 'Jamais connecté' }}</td>
                </tr>
                <tr>
                  <td class="col-label">remember_token</td>
                  <td class="col-val mono">{{ u.remember_token ? 'Défini' : 'null' }}</td>
                </tr>
                <tr>
                  <td class="col-label">created_at</td>
                  <td class="col-val">{{ (u.created_at | date: 'dd/MM/yyyy HH:mm:ss') || '-' }}</td>
                </tr>
                <tr>
                  <td class="col-label">updated_at</td>
                  <td class="col-val">{{ (u.updated_at | date: 'dd/MM/yyyy HH:mm:ss') || '-' }}</td>
                </tr>
                <tr>
                  <td class="col-label">created_by</td>
                  <td class="col-val mono">{{ u.created_by !== null ? u.created_by : '-' }}</td>
                </tr>
                <tr>
                  <td class="col-label">updated_by</td>
                  <td class="col-val mono">{{ u.updated_by !== null ? u.updated_by : '-' }}</td>
                </tr>
                <tr>
                  <td class="col-label">deleted_by</td>
                  <td class="col-val mono">{{ u.deleted_by !== null ? u.deleted_by : '-' }}</td>
                </tr>
                <tr>
                  <td class="col-label">deleted_at</td>
                  <td class="col-val">{{ (u.deleted_at | date: 'dd/MM/yyyy HH:mm:ss') || 'null (Non supprimé)' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      }

      <div modal-footer class="d-flex justify-content-end">
        <app-btn variant="secondary" (btnClick)="onClose()">Fermer</app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .user-detail-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .user-header-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background-color: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }
    .avatar-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: var(--primary-100, #e0f2fe);
      color: var(--primary-700, #0369a1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .user-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .user-name {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .user-sub {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
    }
    .user-badges {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .badge-role {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      background-color: #dbeafe;
      color: #1e40af;
    }
    .badge-statut {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }
    .badge-statut.actif {
      background-color: #dcfce7;
      color: #15803d;
    }
    .badge-statut.suspendu {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .badge-statut.inactif {
      background-color: #f1f5f9;
      color: #64748b;
    }
    .badge-type {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      background-color: #f3e8ff;
      color: #7e22ce;
    }
    .fields-table-wrapper {
      max-height: 380px;
      overflow-y: auto;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }
    .fields-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .fields-table tr {
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
    }
    .fields-table tr:last-child {
      border-bottom: none;
    }
    .col-label {
      width: 35%;
      padding: 0.5rem 0.75rem;
      background-color: var(--neutral-50, #f8fafc);
      font-weight: 600;
      color: var(--text-secondary, #475569);
      font-family: monospace;
      font-size: 0.75rem;
    }
    .col-val {
      padding: 0.5rem 0.75rem;
      color: var(--text-primary, #1e293b);
    }
    .col-val.mono {
      font-family: monospace;
      font-size: 0.75rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParoisseUserDetailModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly user = input<ParoisseUser | null>(null);
  public readonly close = output<void>();

  public onClose(): void {
    this.close.emit();
  }
}
