import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../src/docs/swagger';

const outPath = path.resolve(__dirname, '../openapi.json');
fs.writeFileSync(outPath, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
console.log(`✔ openapi.json generado en ${outPath}`);
