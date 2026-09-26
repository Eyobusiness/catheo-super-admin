import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AuditDetailModalComponent } from './audit-detail-modal.component';
import { AuditLog } from '../../models/audit.model';

describe('AuditDetailModalComponent', () => {
  let fixture: ComponentFixture<AuditDetailModalComponent>;
  let component: AuditDetailModalComponent;

  const mockLogWithSecrets: AuditLog = {
    id: 'uuid-123',
    action: 'update',
    entite_type: 'User',
    entite_id: 5,
    ip_address: '10.0.0.1',
    user_agent: 'Mozilla/5.0 TestBrowser',
    user: {
      id: 2,
      name: 'Curé Administrateur',
      email: 'cure@paroisse.org',
    },
    anciennes_valeurs: {
      name: 'Ancien Nom',
      password: 'plain_secret_password_123',
      api_token: 'secret_token_xyz',
    },
    nouvelles_valeurs: {
      name: 'Nouveau Nom',
      password: 'new_secret_password_456',
      api_token: 'new_token_abc',
    },
    created_at: '2026-09-19T21:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuditDetailModalComponent],
    });

    fixture = TestBed.createComponent(AuditDetailModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('log', mockLogWithSecrets);
    fixture.detectChanges();
  });

  it('devrait afficher les métadonnées de l’événement d’audit', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Curé Administrateur');
    expect(text).toContain('cure@paroisse.org');
    expect(text).toContain('10.0.0.1');
    expect(text).toContain('User');
    expect(text).toContain('5');
    expect(text).toContain('Mozilla/5.0 TestBrowser');
  });

  it('devrait caviarder automatiquement les données sensibles (password, token, secret)', () => {
    const oldSanitized = component['sanitizedOldValues']();
    const newSanitized = component['sanitizedNewValues']();

    expect(oldSanitized?.['name']).toBe('Ancien Nom');
    expect(oldSanitized?.['password']).toBe('********');
    expect(oldSanitized?.['api_token']).toBe('********');

    expect(newSanitized?.['name']).toBe('Nouveau Nom');
    expect(newSanitized?.['password']).toBe('********');
    expect(newSanitized?.['api_token']).toBe('********');

    // Vérifier que le texte dans le DOM ne contient pas le mot de passe en clair
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('plain_secret_password_123');
    expect(text).not.toContain('secret_token_xyz');
    expect(text).toContain('********');
  });
});
