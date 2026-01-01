import { useState, useEffect } from 'react';
import axios from 'axios';

interface Movie {
    id: number;
    title: string;
    originalTitle: string;
    year: number | null;
    posterPath: string | null;
    mediaType: 'movie' | 'tv';
}

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Validate API key exists
if (!TMDB_API_KEY) {
    console.warn('VITE_TMDB_API_KEY not found. TMDB search will not work. Consider proxying through backend.');
}

export function useTMDBSearch(query: string, debounceMs = 500) {
    const [results, setResults] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const timeoutId = setTimeout(async () => {
            try {
                // Use multi search to get both movies and TV shows
                const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
                    params: {
                        api_key: TMDB_API_KEY,
                        query,
                        language: 'ru-RU',
                    },
                });

                // Filter only movies and TV shows, map to common interface
                const movies: Movie[] = response.data.results
                    .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                    .slice(0, 10)
                    .map((item: any) => ({
                        id: item.id,
                        title: item.media_type === 'movie' ? item.title : item.name,
                        originalTitle: item.media_type === 'movie' ? item.original_title : item.original_name,
                        year: item.media_type === 'movie'
                            ? (item.release_date ? new Date(item.release_date).getFullYear() : null)
                            : (item.first_air_date ? new Date(item.first_air_date).getFullYear() : null),
                        posterPath: item.poster_path,
                        mediaType: item.media_type,
                    }));

                setResults(movies);
            } catch (err) {
                setError('Ошибка при поиске фильмов');
                console.error('TMDB search error:', err);
            } finally {
                setLoading(false);
            }
        }, debounceMs);

        return () => clearTimeout(timeoutId);
    }, [query, debounceMs]);

    return { results, loading, error };
}
