import posterPlaceholder from  '../assets/movie_poster_placeholder.png';
import profilePicturePlaceholder from '../assets/profile_pic_placeholder.png';

export function fetchProfilePicture( {personId}: {personId: number}): Promise<string> {
    return fetch(import.meta.env.VITE_TMDB_API_ENDPOINT + 'person/' + personId + '?api_key=' + import.meta.env.VITE_TMDB_API_KEY)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((personData) => {
            if (personData.profile_path)
                return 'https://image.tmdb.org/t/p/w342' + personData.profile_path;
            else
                return profilePicturePlaceholder;
        })
        .catch(error => {
            console.error('Error fetching profile picture:', error);
            return profilePicturePlaceholder;
        });
}

export function fetchMoviePoster({ title, year }: { title: string; year: number }): Promise<string> {
    return fetch(`${import.meta.env.VITE_TMDB_API_ENDPOINT}/search/movie?query=${title}&year=${year}&api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.results.length > 0 && data.results[0].poster_path) {
                return `https://image.tmdb.org/t/p/w342${data.results[0].poster_path}`;
            } else {
                return posterPlaceholder;
            }
        })
        .catch(error => {
            console.error('Error fetching movie poster:', error);
            return posterPlaceholder;
        });
}

export function fetchMoviePosterById({ movieId }: { movieId: number }): Promise<string> {
    return fetch(`${import.meta.env.VITE_TMDB_API_ENDPOINT}/movie/${movieId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.poster_path) {
                return `https://image.tmdb.org/t/p/w342${data.poster_path}`;
            } else {
                return posterPlaceholder;
            }
        })
        .catch(error => {
            console.error('Error fetching movie poster:', error);
            return posterPlaceholder;
        });
}
