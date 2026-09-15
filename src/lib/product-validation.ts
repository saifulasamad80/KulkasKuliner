export const MENU_ID_PATTERN = /^[0-9a-f-]{36}$/i;

type FieldResult<T> = { valid: true; value: T } | { valid: false };

function ok<T>(value: T): FieldResult<T> {
  return { valid: true, value };
}
const invalid: FieldResult<never> = { valid: false };

/** A required, trimmed string within [min, max] chars (e.g. product `name`). */
export function validateRequiredText(raw: unknown, min: number, max: number): FieldResult<string> {
  if (typeof raw !== 'string') return invalid;
  const trimmed = raw.trim();
  return trimmed.length >= min && trimmed.length <= max ? ok(trimmed) : invalid;
}

export function validatePositiveInteger(raw: unknown): FieldResult<number> {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? ok(value) : invalid;
}

export function validateNonNegativeInteger(raw: unknown): FieldResult<number> {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? ok(value) : invalid;
}

/**
 * A trimmed string bounded by `max` chars (e.g. `image_url`, `description`).
 * When `requireString` is false (the default, used for product creation) a
 * non-string/missing value quietly normalizes to `''` instead of failing;
 * when true (used for PATCH, where the field is only checked if the caller
 * explicitly sent it) a non-string value is rejected.
 */
export function normalizeBoundedText(
  raw: unknown,
  { max, requireString = false }: { max: number; requireString?: boolean }
): FieldResult<string> {
  if (typeof raw !== 'string') {
    return requireString ? invalid : ok('');
  }
  const trimmed = raw.trim();
  return trimmed.length <= max ? ok(trimmed) : invalid;
}

/**
 * A nullable identifier/text field (e.g. `menu_id`, `variant_name`,
 * `menu_name`): `null` or `undefined` normalizes to `null`; a string is
 * trimmed and checked against `min`/`max`/`pattern`; any other type is
 * rejected.
 */
export function normalizeNullableText(
  raw: unknown,
  { min = 0, max = Infinity, pattern }: { min?: number; max?: number; pattern?: RegExp } = {}
): FieldResult<string | null> {
  if (raw === null || raw === undefined) return ok(null);
  if (typeof raw !== 'string') return invalid;
  const trimmed = raw.trim();
  if (trimmed.length < min || trimmed.length > max) return invalid;
  if (pattern && !pattern.test(trimmed)) return invalid;
  return ok(trimmed);
}
