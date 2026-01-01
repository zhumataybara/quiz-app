/**
 * Validate required environment variables
 * Exits process if critical variables are missing
 */
export function validateEnv() {
    const required = {
        TMDB_API_KEY: process.env.TMDB_API_KEY,
        DATABASE_URL: process.env.DATABASE_URL,
    };

    const missing = [];

    for (const [key, value] of Object.entries(required)) {
        if (!value) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => {
            console.error(`   - ${key}`);
        });
        console.error('\nPlease set these variables in your .env file');
        if (missing.includes('TMDB_API_KEY')) {
            console.error('Get your TMDB API key from: https://www.themoviedb.org/settings/api');
        }
        process.exit(1);
    }

    console.log('✅ Environment variables validated');
}
