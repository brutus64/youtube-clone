import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres';
import * as schema from './schema.js'

const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error("Database URL was not set");
}


// const migrationClient = postgres(url); //typescript now confirms that it is not undefined after if check
// make sure to comment out migration after every migration
// async function runMigrations() {
//     migrate(drizzle(migrationClient), {
//         "migrationsFolder": "./src/drizzle/migrations"
//     });
// }

const queryClient = postgres(url);
export const db = drizzle(queryClient);
// export const db = drizzle(queryClient, {schema, logger: true});