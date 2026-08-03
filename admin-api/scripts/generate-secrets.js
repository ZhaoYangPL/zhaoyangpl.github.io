import { randomBytes } from 'node:crypto';
import { hashPassword } from '../src/auth.js';

const password = randomBytes(24).toString('base64url');
const passwordHash = hashPassword(password);
const sessionSecret = randomBytes(48).toString('base64url');
const contentKey = randomBytes(32).toString('base64');

console.log('Store the generated admin password in a password manager. It is shown only once.\n');
console.log(`ADMIN_PASSWORD=${password}`);
console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`PRIVATE_CONTENT_KEY=${contentKey}`);
