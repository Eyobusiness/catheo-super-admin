export type OrganisationUserStatut = 'actif' | 'inactif';

export interface OrganisationProfil {
  id: number | string;
  code: string;
  libelle: string;
  description?: string;
}

export interface OrganisationUser {
  id: number | string;
  uuid?: string;
  name: string;
  email: string;
  telephone?: string;
  statut: OrganisationUserStatut;
  user_type?: string;
  organisation_id?: number | string;
  profil_id?: number | string;
  profil?: OrganisationProfil;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrganisationUserDto {
  name: string;
  email: string;
  telephone?: string;
  password?: string;
  profil_id: number | string;
  statut?: OrganisationUserStatut;
  user_type?: string;
}

export interface UpdateOrganisationUserDto {
  name?: string;
  email?: string;
  telephone?: string;
  password?: string;
  profil_id?: number | string;
  statut?: OrganisationUserStatut;
}

export interface OrganisationUsersFilterParams {
  search?: string;
  statut?: OrganisationUserStatut | 'tous';
  profil_id?: number | string;
  page?: number;
  per_page?: number;
}
