import { ObjectId } from 'mongodb';
import { createError } from './httpError.js';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

// Turns a route param like "665f1c..." into an ObjectId, or fails with 400
// so a bad id never reaches MongoDB.
export function toObjectId(value, label = 'id') {
  if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
    throw createError(400, `Invalid ${label}`);
  }
  return new ObjectId(value);
}
