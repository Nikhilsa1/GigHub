import { ApiError } from '../utils/http.js';

/**
 * Tiny declarative validator (zero dependencies).
 *
 * Rule keys: type ('string'|'number'|'boolean'|'array'|'email'|'objectId'|'date'),
 *            required, min, max, minLength, maxLength, enum, trim, default
 *
 * Unknown fields are stripped (mass-assignment protection), values are coerced and
 * the sanitised result replaces req.body / req.query.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function checkField(name, raw, rule, errors) {
  let value = raw;
  const missing = value === undefined || value === null || value === '';

  if (missing) {
    if (rule.required) errors.push({ field: name, message: `${name} is required` });
    return rule.default;
  }

  switch (rule.type) {
    case 'string':
    case 'email':
      value = String(value);
      if (rule.trim !== false) value = value.trim();
      if (rule.type === 'email') {
        value = value.toLowerCase();
        if (!EMAIL_RE.test(value)) errors.push({ field: name, message: 'Invalid email address' });
      }
      if (rule.minLength && value.length < rule.minLength) errors.push({ field: name, message: `${name} must be at least ${rule.minLength} characters` });
      if (rule.maxLength && value.length > rule.maxLength) errors.push({ field: name, message: `${name} must be at most ${rule.maxLength} characters` });
      break;
    case 'number':
      value = Number(value);
      if (Number.isNaN(value)) { errors.push({ field: name, message: `${name} must be a number` }); break; }
      if (rule.min !== undefined && value < rule.min) errors.push({ field: name, message: `${name} must be ≥ ${rule.min}` });
      if (rule.max !== undefined && value > rule.max) errors.push({ field: name, message: `${name} must be ≤ ${rule.max}` });
      break;
    case 'boolean':
      value = value === true || value === 'true';
      break;
    case 'array':
      if (!Array.isArray(value)) { errors.push({ field: name, message: `${name} must be an array` }); break; }
      if (rule.max !== undefined && value.length > rule.max) errors.push({ field: name, message: `${name} can have at most ${rule.max} items` });
      break;
    case 'objectId':
      value = String(value);
      if (!OBJECT_ID_RE.test(value)) errors.push({ field: name, message: `${name} is not a valid id` });
      break;
    case 'date': {
      const d = new Date(typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value);
      if (Number.isNaN(d.getTime())) errors.push({ field: name, message: `${name} must be a valid date` });
      if (rule.future && d.getTime() <= Date.now()) errors.push({ field: name, message: `${name} must be in the future` });
      value = d;
      break;
    }
    default:
      break;
  }

  if (rule.enum && !rule.enum.includes(value)) errors.push({ field: name, message: `${name} must be one of: ${rule.enum.join(', ')}` });
  return value;
}

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const input = req[source] || {};
    const errors = [];
    const output = {};
    for (const [name, rule] of Object.entries(schema)) {
      const v = checkField(name, input[name], rule, errors);
      if (v !== undefined) output[name] = v;
    }
    if (errors.length) return next(ApiError.badRequest(errors[0].message, errors));
    if (source === 'query') req.validatedQuery = output; else req[source] = output;
    next();
  };
}

export const validateIdParam = (param = 'id') => (req, _res, next) => {
  if (!OBJECT_ID_RE.test(req.params[param] || '')) return next(ApiError.notFound('Resource not found'));
  next();
};
