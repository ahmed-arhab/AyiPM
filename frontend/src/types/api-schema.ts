// Helpers for deriving the API types in this folder from api.generated.ts, which `npm run generate:api` writes from
// the backend's OpenAPI spec. Not exported from '@/types'.
import type { components } from './api.generated';

/** A schema from the backend's OpenAPI spec, such as `ApiSchema<'EmployeeResponse'>`. */
export type ApiSchema<Name extends keyof components['schemas']> = components['schemas'][Name];

/**
 * `T` with some fields narrowed to the values the frontend handles, for fields the backend sends as plain strings.
 * Stops compiling when `T` loses one of the fields or the narrower type no longer fits it.
 */
export type Narrowed<T, Fields extends { [K in keyof Fields]: K extends keyof T ? T[K] : never }> = Omit<T, keyof Fields> & Fields;
