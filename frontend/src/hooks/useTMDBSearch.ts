import { useState, useEffect } from 'react';
import api from '../services/api';

interface Movie {
    id: number;
    title: string;
    originalTitle: string;
    year: number | null;
    posterPath: string | null;
    mediaType: 'movie' | 'tv';
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
                // Use backend API proxy for TMDB search
                const response = await api.get('/tmdb/search', {
                    params: { query }
                });

                // Backend already returns formatted results
                setResults(response.data);
                setLoading(false);
            } catch (err: any) {
                console.error('TMDB search error:', err);
                setError(err.response?.data?.error || 'Failed to search movies');
                setResults([]);
                setLoading(false);
            }
        }, debounceMs);

        return () => clearTimeout(timeoutId);
    }, [query, debounceMs]);

    return { results, loading, error };
}
