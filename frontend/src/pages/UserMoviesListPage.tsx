import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchMoviePosterById } from "../services/externalApi";
import { convertRuntime } from "./MoviesMainPage";
import Cookies from "js-cookie";

interface User {
    id: number;
    username: string;
}

interface Genre {
    id: number;
    name: string;
}

interface Movies {
    id: number;
    title: string;
    release_year: number;
    runtime: number;
    genres: Genre[];
    poster: string;
    overview: string;
}

interface MoviesList {
    id: number;
    user: User;
    name: string;
    description: string;
    movies: Movies[];
}

export default function UserMoviesListPage({ user }: { user: User | null }) {
    const { listId } = useParams<{ listId: string }>();
    
    const [moviesList, setMoviesList] = useState<MoviesList>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    const fetchMoviesInList = async () => {
        try {
            const response = await fetch(import.meta.env.VITE_API_URL + `lists/${listId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                },
            });
    
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
    
            const data: MoviesList = await response.json();
    
            const moviePosterPromises = data.movies.map((movie: Movies) =>
                fetchMoviePosterById({ movieId: movie.id })
                    .then((moviePoster) => ({ ...movie, poster: moviePoster }))
                    .catch((error) => {
                        console.error(`Error fetching movie poster for ${movie.title}`, error);
                        return movie;
                    })
            );
    
            const updatedMovies = await Promise.all(moviePosterPromises);
    
            setMoviesList({
                ...data,
                movies: updatedMovies
            });
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching movie recommendations:", error);
        }
    };
    
    useEffect(() => {
        fetchMoviesInList();
    }, []);

    const handleDeleteMovieFromList = async (listId: number, movieId: number) => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL +
                    `lists/${listId}/remove/${movieId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                    },
                }
            );

            if (response.ok) {
                fetchMoviesInList();
            } else {
                const message = await response.json();
                console.error("Error deleting comment:", message.error);
            }
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };

    return (
        <div style={{ paddingLeft: "2rem" }}>
            {isLoading ? (
                <div className="d-flex justify-content-center my-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    <h3 className="mt-5 mb-4">
                        {moviesList?.name}
                        <span className="fw-normal fs-4 ms-3">
                            by <a href={`/profile/${moviesList?.user.id}`}>{moviesList?.user.username}</a>
                        </span>
                    </h3>
    
                    <p>{moviesList?.description}</p>
                    <hr className="my-5"></hr>
    
                    {moviesList && moviesList.movies.map((movie, index) => (
                        <div className="mx-auto" key={movie.id}>
                            <div className="card mb-1" style={{ border: "none" }}>
                                <div className="row my-3">
                                    <div className="col-2">
                                        <a href={`/movies/${movie.id}`}>
                                            <img
                                                src={movie.poster}
                                                className="card-img-top rounded-3"
                                                alt={movie.title}
                                            />
                                        </a>
                                    </div>
                                    <div className="col-10">
                                    <div className="d-flex align-items-center mb-3">
                                            <h4 className="movie-title mb-0 me-3">
                                                {index + 1}. <a href={`/movies/${movie.id}`}>{movie.title}</a>
                                                <span className="fw-normal fs-4 ms-2">({movie.release_year})</span>
                                            </h4>
                                            {user?.id === moviesList.user.id &&
                                            <button 
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() =>
                                                    handleDeleteMovieFromList(moviesList.id, movie.id)
                                                }
                                                >
                                                Remove
                                            </button>
                                            }
                                        </div>
                                        <p>
                                            {convertRuntime(movie.runtime)}
                                            <span className="separator-ward-text"/>
                                            {movie.genres.map((genre) => genre.name).join(", ")}
                                        </p>
                                        
                                        <p>{movie.overview}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
    
}