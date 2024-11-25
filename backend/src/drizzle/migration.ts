import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error("Database URL was not set");
}

const migrationClient = postgres(url); //typescript now confirms that it is not undefined after if check
async function runMigrations(){
    await migrate(drizzle(migrationClient), {
        "migrationsFolder": "./src/drizzle/migrations"
    });
}

export default runMigrations;