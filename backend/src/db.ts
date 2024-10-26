import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres';
import * as schema from './drizzle/schema.js'
const migrationClient = postgres("postgres://postgres:password@127.0.0.1:5432/mydatabase");
migrate(drizzle(migrationClient), {
    "migrationsFolder": "./src/drizzle/migrations"
});

const queryClient = postgres("postgres://postgres:password@127.0.0.1:5432/mydatabase");

export const db = drizzle(queryClient, {schema, logger: true});