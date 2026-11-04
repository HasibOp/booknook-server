import { CATEGORIES, MAX_COPIES } from '../config/constants.js';
import { createError } from './httpError.js';

const TEXT_FIELDS = {
  title: { label: 'Title', max: 150 },
  author: { label: 'Author name', max: 100 },
  description: { label: 'Description', min: 10, max: 1000 },
};

function isHttpUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const { protocol } = new URL(value.trim());
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateBook(body, { partial = false } = {}) {
  const input = body && typeof body === 'object' ? body : {};
  const shouldCheck = (key) => !partial || input[key] !== undefined;
  const clean = {};
  const errors = [];

  for (const [key, { label, min = 1, max }] of Object.entries(TEXT_FIELDS)) {
    if (!shouldCheck(key)) continue;
    const value = typeof input[key] === 'string' ? input[key].trim() : '';
    if (value.length < min) {
      errors.push(
        min === 1
          ? `${label} is required`
          : `${label} must be at least ${min} characters`,
      );
    } else if (value.length > max) {
      errors.push(`${label} must be at most ${max} characters`);
    } else {
      clean[key] = value;
    }
  }

  if (shouldCheck('category')) {
    if (CATEGORIES.includes(input.category)) clean.category = input.category;
    else errors.push(`Category must be one of: ${CATEGORIES.join(', ')}`);
  }

  if (shouldCheck('image')) {
    if (isHttpUrl(input.image)) clean.image = input.image.trim();
    else errors.push('Book image must be a valid image URL');
  }

  if (shouldCheck('totalCopies')) {
    const copies = Number(input.totalCopies);
    if (Number.isInteger(copies) && copies >= 1 && copies <= MAX_COPIES)
      clean.totalCopies = copies;
    else
      errors.push(
        `Total copies must be a whole number from 1 to ${MAX_COPIES}`,
      );
  }

  if (errors.length) throw createError(400, errors.join('. '));
  if (partial && Object.keys(clean).length === 0)
    throw createError(400, 'Nothing to update');

  return clean;
}
