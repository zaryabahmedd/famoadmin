// Human-readable tracking code shown to customers/riders as FAMO-XXXXX.
// Must stay byte-for-byte identical to the generator in the rider/user app
// so codes resolve to the same delivery across both apps.
export function orderCode(id) {
  return `FAMO-${id.replace(/-/g, '').slice(-5).toUpperCase()}`;
}

// Turns whatever an admin types/pastes ("FAMO-549bf", "famo549bf", "549BF"...)
// into the lowercase 5-char hex suffix used to match against deliveries.id.
export function normalizeTrackingCode(input) {
  let s = (input || '').toUpperCase().trim();
  s = s.replace(/^FAMO-?/, '');
  s = s.replace(/[^0-9A-F]/g, '');
  return s.slice(-5).toLowerCase();
}
