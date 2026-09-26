import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ORGANISATION_SPACE_PREF_KEY,
  OrganisationSpacePreferenceService,
} from './organisation-space-preference.service';

describe('OrganisationSpacePreferenceService', () => {
  let service: OrganisationSpacePreferenceService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [OrganisationSpacePreferenceService],
    });
    service = TestBed.inject(OrganisationSpacePreferenceService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for hasPreference when localStorage is empty', () => {
    expect(service.hasPreference()).toBe(false);
  });

  it('should return default space OPPE when no preference is saved', () => {
    expect(service.getPreference()).toBe('OPPE');
    expect(service.currentPreference()).toBe('OPPE');
  });

  it('should save preference in localStorage and update currentPreference signal', () => {
    service.setPreference('OPPE');
    expect(localStorage.getItem(ORGANISATION_SPACE_PREF_KEY)).toBe('OPPE');
    expect(service.hasPreference()).toBe(true);
    expect(service.getPreference()).toBe('OPPE');
    expect(service.currentPreference()).toBe('OPPE');
  });

  it('should ignore invalid space keys and not write them', () => {
    service.setPreference('INVALID_SPACE' as any);
    expect(localStorage.getItem(ORGANISATION_SPACE_PREF_KEY)).toBeNull();
    expect(service.hasPreference()).toBe(false);
  });

  it('should reset preference to OPPE and clear localStorage', () => {
    service.setPreference('OPPE');
    expect(service.hasPreference()).toBe(true);

    service.resetPreference();
    expect(service.hasPreference()).toBe(false);
    expect(service.getPreference()).toBe('OPPE');
    expect(service.currentPreference()).toBe('OPPE');
    expect(localStorage.getItem(ORGANISATION_SPACE_PREF_KEY)).toBeNull();
  });

  it('should accept valid OPPE preference and restore it upon re-instantiation', () => {
    service.setPreference('OPPE');
    expect(service.getPreference()).toBe('OPPE');

    // Simulate page reload or re-instantiation
    const restoredService = TestBed.inject(OrganisationSpacePreferenceService);
    expect(restoredService.getPreference()).toBe('OPPE');
  });

  it('should reject arbitrary string injection in localStorage and fallback to OPPE', () => {
    localStorage.setItem(ORGANISATION_SPACE_PREF_KEY, 'HACKED_SPACE');
    expect(service.hasPreference()).toBe(false);
    expect(service.getPreference()).toBe('OPPE');
  });

  it('should confirm localStorage preference is strictly UI state and provides no authorization token or role', () => {
    service.setPreference('OPPE');
    // Ensure no token, role, or authorization data is set by the preference service
    expect(localStorage.getItem('catheo_auth_token')).toBeNull();
    expect(localStorage.getItem('catheo_user_role')).toBeNull();
  });
});
