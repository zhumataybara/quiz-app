import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

import { getCache, setCache, cacheKeys } from './redis.js';

/**
 * Search movies by query
 * @param {string} query - Search query
 * @param {string} language - Language code (default: 'ru-RU')
 * @returns {Promise<Array>} - Array of movie results
 */
export async function searchMovies(query, language = 'ru-RU') {
    const cacheKey = cacheKeys.TMDB_SEARCH(`${query}:${language}`, 1);

    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached) {
        console.log(`Cache hit for search: ${query}`);
        return cached;
    }

    try {
        // Check if API key is configured
        if (!TMDB_API_KEY) {
            console.error('TMDB_API_KEY is not configured! Set it in environment variables.');
            return [];
        }

        // Use multi search to get both movies and TV shows
        const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
                api_key: TMDB_API_KEY,
                query,
                language,
                include_adult: false
            }
        });

        const results = response.data.results
            .filter(item => {
                // Only keep movies and TV shows with sufficient votes
                return (item.media_type === 'movie' || item.media_type === 'tv') && item.vote_count > 100;
            })
            .map(item => {
                const isMovie = item.media_type === 'movie';
                return {
                    id: item.id,
                    title: isMovie ? item.title : item.name,
                    originalTitle: isMovie ? item.original_title : item.original_name,
                    year: item.release_date
                        ? new Date(item.release_date).getFullYear()
                        : item.first_air_date
                            ? new Date(item.first_air_date).getFullYear()
                            : null,
                    posterPath: item.poster_path,
                    overview: item.overview,
                    voteCount: item.vote_count,
                    popularity: item.popularity,
                    mediaType: item.media_type // 'movie' or 'tv'
                };
            })
            .sort((a, b) => b.popularity - a.popularity); // Sort by popularity descending

        // Save to cache for 24 hours
        await setCache(cacheKey, results, 86400);

        console.log(`TMDB search for "${query}" returned ${results.length} results`);
        return results;
    } catch (error) {
        console.error('TMDB search error:', error.message);
        if (error.response) {
            console.error('TMDB API response:', error.response.status, error.response.data);
        }
        return [];
    }
}

/**
 * Get movie details by ID
 * @param {number} movieId - TMDB movie ID
 * @param {string} language - Language code
 * @returns {Promise<Object|null>} - Movie details
 */
export async function getMovieDetails(movieId, language = 'ru-RU') {
    const cacheKey = cacheKeys.TMDB_MOVIE(`${movieId}:${language}`);

    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached) {
        console.log(`Cache hit for movie: ${movieId}`);
        return cached;
    }

    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
            params: {
                api_key: TMDB_API_KEY,
                language
            }
        });

        const movieData = {
            id: response.data.id,
            title: response.data.title,
            originalTitle: response.data.original_title,
            year: response.data.release_date ? new Date(response.data.release_date).getFullYear() : null,
            posterPath: response.data.poster_path,
            overview: response.data.overview,
            runtime: response.data.runtime,
            genres: response.data.genres
        };

        // Save to cache for 1 week
        await setCache(cacheKey, movieData, 604800);

        return movieData;
    } catch (error) {
        console.error('TMDB get movie details error:', error.message);
        return null;
    }
}
