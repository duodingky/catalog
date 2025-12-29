import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKey = fs.readFileSync('./keys/private.pem');

const token = jwt.sign(
  {
    sub: 'integrator-001',
    scope: ['products', 'categories', 'brands'],
    permissions: ['read', 'write'],
    iss: 'auth.example.com',
    aud: 'api.example.com',
  },
  privateKey,
  { algorithm: 'RS256', expiresIn: '365d' }
);

console.log('Static JWT:', token);