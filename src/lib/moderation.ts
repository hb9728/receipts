import Filter from 'bad-words';
const filter = new Filter();
const EXTRA = ['doxx','d0xx','nonce','incest']; 
filter.addWords(...EXTRA);

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phoneRegex = /\b(\+?\d[\d\s\-().]{7,}\d)\b/g;
const urlRegex = /\bhttps?:\/\/[^\s]+/gi;
const handleRegex = /@[a-z0-9_\.]{2,}/gi;
const postcodeRegex = /\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/gi; // uk-ish

export function redactPII(input: string) {
  let t = input.trim();
  t = t.replace(emailRegex, '[redacted-email]');
  t = t.replace(phoneRegex, '[redacted-phone]');
  t = t.replace(urlRegex, '[redacted-url]');
  t = t.replace(handleRegex, '[@redacted]');
  t = t.replace(postcodeRegex, '[redacted-postcode]');
  t = t.replace(/\s{3,}/g, ' ').slice(0, 280);
  return filter.clean(t);
}

export function isLikelyMinorDisclosure(text: string) {
  return /\b(i'?m|im|me)\s+(13|14|15|16)\b/i.test(text);
}
