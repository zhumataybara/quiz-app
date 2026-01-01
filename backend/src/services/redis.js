import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

let client = null;
let isConnected = false;

if (redisUrl) {
    client = createClient({
        url: redisUrl
    });

    client.on('error', (err) => {
        // Suppress errors if connection fails to avoid crashing
        console.warn('Redis Client Error:', err.message);
        isConnected = false;
    });

    client.on('connect', () => {
        console.log('Redis Client Connected');
        isConnected = true;
    });

    // Attempt connection but don't crash if it fails
    client.connect().catch(() => {
        console.log('Failed to connect to Redis. Running without cache.');
    });
} else {
    console.log('REDIS_URL not set. Running without cache.');
}

export const cacheKeys = {
    GAME: (id) => `game:${id}`,
    TMDB_SEARCH: (query, page) => `tmdb:search:${query}:${page}`,
    TMDB_MOVIE: (id) => `tmdb:movie:${id}`,
    TMDB_CONFIG: 'tmdb:config'
};

export const getCache = async (key) => {
    if (!isConnected || !client) return null;
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
};

export const setCache = async (key, value, ttlSeconds = 3600) => {
    if (!isConnected || !client) return;
    try {
        await client.set(key, JSON.stringify(value), {
            EX: ttlSeconds
        });
    } catch (e) {
        console.error('Redis Set Error', e);
    }
};

export const deleteCache = async (key) => {
    if (!isConnected || !client) return;
    try {
        await client.del(key);
    } catch (e) { }
};

export default client;
