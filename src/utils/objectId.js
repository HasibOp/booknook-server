import { ObjectId } from 'mongodb';
import { createError } from './httpError.js';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function toObjectId(value, label = 'id') {
  if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
    throw createError(400, `Invalid ${label}`);
  }
  return new ObjectId(value);
}
