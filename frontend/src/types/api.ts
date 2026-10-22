import type { ApiSchema, Narrowed } from './api-schema';
import type { UserPreferences } from './settings';

export type BootstrapPayload = Narrowed<ApiSchema<'BootstrapPayload'>, { preferences: UserPreferences | null }>;

/** What login and invite acceptance return instead of a session when a second step is needed. */
export type TwoFactorRequired = ApiSchema<'TwoFactorRequired'>;

export type TwoFactorSignIn = Narrowed<ApiSchema<'TwoFactorSignIn'>, { bootstrap: BootstrapPayload }>;

export type InviteDetails = ApiSchema<'InviteDetails'>;
