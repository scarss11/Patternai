export type Role = 'admin' | 'member';
export type Visibility = 'private' | 'shared' | 'company';
export type MemberStatus = 'pending' | 'active' | 'disabled';

export interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  can_view_shared: boolean;
  can_download: boolean;
  can_share: boolean;
  can_create_guides: boolean;
  status: MemberStatus;
  invited_by: string | null;
  created_at: string;
}

export interface Guide {
  id: string;
  organization_id: string;
  title: string;
  category: string;
  content_md: string;
  pdf_path: string | null;
  visibility: Visibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GuideShare {
  id: string;
  guide_id: string;
  shared_with: string;
  permission: 'view' | 'download';
  shared_by: string;
  created_at: string;
}

export interface GuideShareLink {
  id: string;
  guide_id: string;
  token: string;
  created_by: string;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
}

/** Permisos editables por el admin en la pestaña Equipo (switches del mockup). */
export interface MemberPermissions {
  can_view_shared: boolean;
  can_download: boolean;
  can_share: boolean;
  can_create_guides: boolean;
}
