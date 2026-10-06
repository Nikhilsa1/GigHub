import mongoose from 'mongoose';

/**
 * Global serialisation contract between API and client:
 *  - `_id` -> `id` (string), `__v` removed
 *  - every Date -> epoch milliseconds (number), so the client can do `deadline - Date.now()`
 *  - ObjectIds -> strings
 *  - sensitive fields (password) never leave the server
 */
function normalise(value) {
  if (value instanceof Date) return value.getTime();
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === '__v' || k === 'password') continue;
      if (k === '_id') { out.id = v?.toString(); continue; }
      out[k] = normalise(v);
    }
    return out;
  }
  return value;
}

export default function toClientJSON(schema) {
  const transform = (_doc, ret) => normalise(ret);
  schema.set('toJSON', { virtuals: false, versionKey: false, transform });
  schema.set('toObject', { virtuals: false, versionKey: false });
}

export { normalise };
