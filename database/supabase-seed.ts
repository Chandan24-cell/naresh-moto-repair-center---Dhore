import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
}

const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const storePath = path.resolve(process.cwd(), 'data/store.json');
const raw = fs.readFileSync(storePath, 'utf-8');
const store = JSON.parse(raw);

const rows = [
  { key: 'dashboard_store', value: store },
  { key: 'brand', value: { name: 'Naresh Moto Repair Center', tagline: 'Two Wheeler Repair Shop | Dhore, Nepal', phone: '+977 982-9455583' } },
  { key: 'hours', value: { open: '06:00', close: '20:00', days: 'Every day' } },
];

const { error } = await client.from('site_settings').upsert(rows, { onConflict: 'key' });

if (error) {
  throw new Error(`Supabase seed failed: ${error.message}`);
}

console.log('Seeded dashboard_store and metadata rows into Supabase site_settings.');
