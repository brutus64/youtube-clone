import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres';
import * as schema from './schema.js'

const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error("Database URL was not set");
}

//make sure to comment out migration after every migration
const migrationClient = postgres(url); //typescript now confirms that it is not undefined after if check
migrate(drizzle(migrationClient), {
    "migrationsFolder": "./src/drizzle/migrations"
});

const queryClient = postgres(url);

export const db = drizzle(queryClient, {schema, logger: true});