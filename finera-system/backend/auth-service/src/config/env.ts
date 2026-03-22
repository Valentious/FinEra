/**
 * Load env from finera-system root and database folder
 */
import { config } from 'dotenv';
import { resolve } from 'path';

const root = resolve(process.cwd(), '../..');
config({ path: resolve(root, '.env') });
config({ path: resolve(root, 'database', '.env') });
config(); // fallback to local .env
