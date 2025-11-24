import { arrayBufferToBase64, base64ToArrayBuffer } from './encoding.js';

const MAX_SUPPORTED_ITERATIONS = 100000;
const PBKDF2_ITERATIONS = MAX_SUPPORTED_ITERATIONS;
const DERIVED_KEY_LENGTH = 32; // bytes
const HASH_FUNCTION = 'SHA-256';

const textEncoder = new TextEncoder();

function getRandomSalt(length = 16) {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

async function deriveKey(password, salt, iterations) {
  if (iterations > MAX_SUPPORTED_ITERATIONS) {
    throw new Error('PBKDF2 iteration count exceeds supported limit');
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: HASH_FUNCTION
    },
    keyMaterial,
    DERIVED_KEY_LENGTH * 8
  );

  return derivedBits;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function base64ToUint8Array(value) {
  return new Uint8Array(base64ToArrayBuffer(value));
}

async function legacyHashPassword(password) {
  const hashBuffer = await crypto.subtle.digest(
    HASH_FUNCTION,
    textEncoder.encode(password)
  );
  return arrayBufferToBase64(hashBuffer);
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password must be a non-empty string');
  }

  const salt = getRandomSalt();
  const derivedBits = await deriveKey(password, salt, PBKDF2_ITERATIONS);

  return {
    algorithm: 'PBKDF2',
    hash: arrayBufferToBase64(derivedBits),
    salt: arrayBufferToBase64(salt.buffer),
    iterations: PBKDF2_ITERATIONS,
    hashLength: DERIVED_KEY_LENGTH,
    hashFunction: HASH_FUNCTION
  };
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }

  if (typeof storedHash === 'string') {
    const legacyHash = await legacyHashPassword(password);
    return timingSafeEqual(
      base64ToUint8Array(legacyHash),
      base64ToUint8Array(storedHash)
    );
  }

  if (storedHash.algorithm !== 'PBKDF2') {
    throw new Error('Unsupported password hash algorithm');
  }

  const iterations = typeof storedHash.iterations === 'number' && storedHash.iterations > 0
    ? storedHash.iterations
    : PBKDF2_ITERATIONS;

  if (iterations > MAX_SUPPORTED_ITERATIONS) {
    throw new Error('Stored password hash exceeds supported PBKDF2 iterations');
  }

  const saltBytes = base64ToUint8Array(storedHash.salt);
  const derivedBits = await deriveKey(password, saltBytes, iterations);
  const providedHash = new Uint8Array(derivedBits);
  const expectedHash = base64ToUint8Array(storedHash.hash);

  return timingSafeEqual(providedHash, expectedHash);
}
