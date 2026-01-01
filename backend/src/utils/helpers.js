/**
 * Generate a unique 6-character room code
 * Format: ABC123 (3 uppercase letters + 3 numbers)
 */
export function generateRoomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let code = '';
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 3; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return code;
}

/**
 * Handle duplicate nickname by adding suffix
 * Example: "Жанна" -> "Жанна #1234"
 */
export function handleDuplicateNickname(nickname, existingNicknames) {
    if (!existingNicknames.includes(nickname)) {
        return nickname;
    }

    let counter = 1;
    let newNickname = `${nickname} ${counter}`;

    while (existingNicknames.includes(newNickname)) {
        counter++;
        newNickname = `${nickname} ${counter}`;
    }

    return newNickname;
}

/**
 * Calculate leaderboard from players array
 */
export function calculateLeaderboard(players) {
    const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
    return sorted.map((player, index) => ({
        ...player,
        rank: index + 1
    }));
}

/**
 * Check if answer matches any of the correct answers
 * @param {number} submittedTmdbId - The TMDB ID submitted by player
 * @param {Array} correctAnswers - Array of correct answer objects with tmdbId field
 * @returns {boolean} - True if submitted ID matches any correct answer
 */
export function checkAnswer(submittedTmdbId, correctAnswers) {
    if (!correctAnswers || correctAnswers.length === 0) {
        return false;
    }
    return correctAnswers.some(answer => answer.tmdbId === submittedTmdbId);
}
