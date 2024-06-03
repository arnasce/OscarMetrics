import { useState, useEffect } from "react";
import { Fragment } from "react";

import { ScrollRestoration } from "react-router-dom";

import { fetchMoviePosterById } from "../services/externalApi";
import MoviesListPlaceholder from "../components/Placeholders/MoviesListPlaceholder";
import ShowSearchBar, { useDebounce } from "../components/SearchBar/Search";
import Cookies from "js-cookie";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";


export interface Person {
    id: number;
    first_name: string;
    last_name: string;
}

export interface Genre {
    id: number;
    name: string;
}

export interface Movie {
    id: number;
    title: string;
    release_year: number;
    runtime: number;
    genres: Genre[];
    directors: Person[];
    actors: Person[];
    overview: string;
    posterPath?: string;
}

interface LoggedUser {
    id: number;
    username: string;
}

interface UserMovieLists {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

interface StatusMessage {
    message: string;
    isError: boolean;
}

export function convertRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes} min`;
    else return `${hours} h ${remainingMinutes} min`;
}

function MovieDetails({ movie, loggedUser, userMovieLists }: { movie: Movie, loggedUser: LoggedUser | undefined, userMovieLists: UserMovieLists[]  }) {
    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(
        null
    );

    const handleAddMovieToList = async (listId: number, movieId: number) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}profile/${loggedUser?.id}/lists/${listId}/add/${movieId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                    },
                    body: JSON.stringify({
                        list_id: listId,
                        movie_id: movieId,
                    }),
                }
            );
    
            if (response.ok) {
                const message = await response.json();
                setStatusMessage({ message: message.success, isError: false });
            } else {
                const message = await response.json();
                setStatusMessage({ message: message.error, isError: true });
            }
        } catch (error) {
            console.error("Error adding movie to list:", error);
        }
    };


    return (
        <div className="mx-auto" key={movie.id}>
            <div className="card mb-1" style={{ border: "none" }}>
                <div className="row">
                    <div className="col-4">
                        <a href={`/movies/${movie.id}`}>
                            <img
                                loading="lazy"
                                className="img-poster rounded-3 my-5"
                                src={movie.posterPath}
                                alt={"Photo of " + movie.title}
                            />
                        </a>
                    </div>
                    <div className="col-8 my-5">
                        <h2 className="mt-2">
                            <a href={`/movies/${movie.id}`}>{movie.title}</a>
                        </h2>

                        <div className="mb-1">
                            {movie.release_year} |{" "}
                            {convertRuntime(movie.runtime)}
                        </div>
                        <div className="mb-3">
                            {movie.genres.map((genre) => genre.name).join(", ")}
                        </div>
                        <div>{movie.overview}</div>
                        
                        {loggedUser &&
                        <>
                        <div className="btn-group">
                            <button
                            className="btn btn-dark btn-sm dropdown-toggle mt-3"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            >
                                Add to List
                            </button>                   

                            <ul className="dropdown-menu">
                                {userMovieLists.length !== 0 ? userMovieLists.map(list => 
                                    <li key={list.id}>
                                        <a
                                        className="dropdown-item"
                                        href=""
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAddMovieToList(list.id, movie.id);
                                            
                                            }
                                        }
                                        >
                                            {list.name}
                                        </a>
                                    </li>
                                ) : <>
                                    <li className="fw-bold">No lists found. </li>
                                    <li>Add lists from profile.</li>
                                    </>
                                }
                            </ul>
                        </div>
                        {statusMessage && (
                            <div className="d-flex align-items-center mt-2">
                                {statusMessage.isError ? (
                                    <FontAwesomeIcon 
                                        icon={faTriangleExclamation} 
                                        style={{
                                            color: "red", 
                                            transform: "scale(1.25)",
                                        }} 
                                        className="me-2" />
                                ) : (
                                    <FontAwesomeIcon 
                                        icon={faCircleCheck} 
                                        style={{
                                            color: "green",
                                            transform: "scale(1.25)",
                                        }} 
                                        className="me-2" />
                                )}
                                <h5 className="mt-2">{statusMessage.message}</h5>
                            </div>
                        )}
                        </>
                        }

                        <hr></hr>
                        
                        <div className="mt-3 mb-2">
                            <div>
                                <b>Director</b>{" "}
                            </div>
                            {movie.directors.map((director, index) => (
                                <Fragment key={director.id}>
                                    {!!index && ", "}
                                    <a href={`/person/${director.id}`}>
                                        {`${director.first_name} ${director.last_name}`}
                                    </a>
                                </Fragment>
                            ))}
                        </div>
                        <div className="mt-1">
                            <div>
                                <b>Cast</b>{" "}
                            </div>
                            {movie.actors.map((actor, index) => (
                                <Fragment key={actor.id}>
                                    {!!index && ", "}
                                    <a href={`/person/${actor.id}`}>
                                        {`${actor.first_name} ${actor.last_name}`}
                                    </a>
                                </Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface MovieListPaginationProps {
    pageNumber: number;
    setPageNumber: (pageNumber: number) => void;
    totalPages: number;
}

function MovieListPagination({
    pageNumber,
    setPageNumber,
    totalPages,
}: MovieListPaginationProps) {
    function handlePreviousPage() {
        if (pageNumber > 1) {
            setPageNumber(pageNumber - 1);
        }
    }

    function handleNextPage() {
        if (pageNumber < totalPages) setPageNumber(pageNumber + 1);
    }

    return (
        <div className="d-flex justify-content-center me-5 mt-2">
            <nav aria-label="Page navigation example">
                <ul className="pagination">
                    <li className="page-item">
                        <button
                            className="page-link"
                            onClick={handlePreviousPage}
                        >
                            Previous
                        </button>
                    </li>
                    {pageNumber > 1 && (
                        <li className="page-item">
                            <button
                                className="page-link"
                                onClick={() => setPageNumber(1)}
                            >
                                1
                            </button>
                        </li>
                    )}
                    <li className="page-item disabled">
                        <button className="page-link">...</button>
                    </li>
                    <li className="page-item">
                        <button className="page-link">{pageNumber}</button>
                    </li>
                    <li className="page-item disabled">
                        <button className="page-link">...</button>
                    </li>
                    {pageNumber < totalPages && (
                        <li className="page-item">
                            <button
                                className="page-link"
                                onClick={() => setPageNumber(totalPages)}
                            >
                                {totalPages}
                            </button>
                        </li>
                    )}
                    <li className="page-item">
                        <button className="page-link" onClick={handleNextPage}>
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

export interface GetSearchResultsProps {
    query: string;
    yearRange: [number, number] | undefined;
    runtimeRange: [number, number] | undefined;
    setResults: (results: Movie[]) => void;
    setLoading: (loading: boolean) => void;
    pageNumber: number;
    setPageNumber: (pageNumber: number) => void;
    setTotalPages: (totalPages: number) => void;
    selectedGenres: number[];
}

export function GetSearchResults({
    query,
    yearRange,
    runtimeRange,
    setResults,
    setLoading,
    pageNumber,
    setPageNumber,
    setTotalPages,
    selectedGenres,
}: GetSearchResultsProps) {
    const minYearQuery = yearRange ? `&start_year=${yearRange[0]}` : ""
    const maxYearQuery = yearRange ? `&end_year=${yearRange[1]}` : ""

    const minRuntimeQuery = runtimeRange ? `&runtime_min=${runtimeRange[0]}` : ""
    const maxRuntimeQuery = runtimeRange ? `&runtime_max=${runtimeRange[1]}` : ""

    const genresQuery = selectedGenres
        .map((genreId) => `&genre=${genreId}`)
        .join("&");

    setLoading(true);

    fetch(
        import.meta.env.VITE_API_URL +
            `search?query=${query}${minYearQuery}${maxYearQuery}${minRuntimeQuery}${maxRuntimeQuery}${genresQuery}&page=${pageNumber}`
    )
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            return response.json();
        })
        .then((data: { items: Movie[]; count: number }) => {
            const moviePromises = data.items.map((movie) =>
                fetchMoviePosterById({
                    movieId: movie.id
                })
                    .then((moviePoster) => ({
                        ...movie,
                        posterPath: moviePoster,
                    }))
                    .catch((error) => {
                        console.error(
                            `Error fetching profile picture for ${movie.title}:`,
                            error
                        );
                        return movie;
                    })
            );

            Promise.all(moviePromises).then((movies) => {
                setResults(movies);
                setLoading(false);
                setTotalPages(Math.ceil(data.count / 8));
                return { movies, nextPage: pageNumber + 1, count: data.count };
            });
        })
        .catch((error) => console.error("Error fetching movies:", error));
}

export default function MoviesMainPage({ user }: {user: any}) {
    const [results, setResults] = useState<Movie[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [query, setQuery] = useState<string>("");
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [yearRange, setYearRange] = useState<[number, number] | undefined>();
    const [runtimeRange, setRuntimeRange] = useState<[number, number] | undefined>();

    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
    const debouncedQuery = useDebounce(query, 500);
    const debouncedYearRange = useDebounce(yearRange, 300);
    const debouncedRuntimeRange = useDebounce(runtimeRange, 300);
    const debouncedPageNumber = useDebounce(pageNumber, 250);

    const [userMovieLists, setUserMovieLists] = useState<UserMovieLists[]>([])

    useEffect(() => {
        setLoading(true);
        setPageNumber(1);
    }, [debouncedQuery, debouncedYearRange, debouncedRuntimeRange, selectedGenres]);
    
    useEffect(() => {
        GetSearchResults({
            query: debouncedQuery,
            yearRange: debouncedYearRange,
            runtimeRange: debouncedRuntimeRange,
            selectedGenres,
            setResults,
            setLoading,
            pageNumber: debouncedPageNumber,
            setPageNumber,
            setTotalPages,
        });        
    }, [debouncedQuery, debouncedYearRange, debouncedRuntimeRange, selectedGenres, debouncedPageNumber]);

    useEffect(() => {
        if (user){
            fetch(import.meta.env.VITE_API_URL + `profile/${user.id}/lists`, 
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                },
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data: UserMovieLists[]) => {
                setUserMovieLists(data);
            })
            .catch((error) => console.error("Error fetching movie lists", error));
        }
    }, [user]);

    return (
        <ul>
            <div className="d-flex justify-content-center mt-3">
                <ShowSearchBar
                    query={query}
                    setQuery={setQuery}
                    setYearRange={setYearRange}
                    selectedGenres={selectedGenres}
                    setSelectedGenres={setSelectedGenres}
                    setRuntimeRange={setRuntimeRange}
                />
            </div>

            {loading ? (
                <div className="row">
                    <MoviesListPlaceholder />
                    <MoviesListPlaceholder />
                </div>
            ) : (
                <div className="row">
                    {results.length > 0 ? (
                        results.map((movie) => (
                            <MovieDetails key={movie.id} movie={movie} loggedUser={user} userMovieLists={userMovieLists}/>
                        ))
                    ) : (
                        <div className="pe-5 mt-5 mb-5 text-center">
                            No results found
                        </div>
                    )}
                </div>
            )}

            <MovieListPagination
                pageNumber={pageNumber}
                setPageNumber={setPageNumber}
                totalPages={totalPages}
            />

            <ScrollRestoration />
        </ul>
    );
}
