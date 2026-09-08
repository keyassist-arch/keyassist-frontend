const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KAO_ORDER_RE = /^KAO-[0-9a-z]+$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export function isValidOrderIdentifier(id: string): boolean {
  return Boolean(id && (UUID_RE.test(id) || KAO_ORDER_RE.test(id)));
}
