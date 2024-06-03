import { useState, useEffect } from "react";
import { Fragment } from "react";
import { useParams } from "react-router-dom";

import NotFound from "./NotFoundPage";
import { fetchProfilePicture, fetchMoviePosterById } from "../services/externalApi";
import { convertRuntime } from "./MoviesMainPage";
import { getOrdinalNumber } from "./PersonPage";
import Comments from "../components/Comments/Comments";
import UserRating from "../components/Rating/Rating";
import OscarAwardImage from "../assets/oscar_award.svg";
import SliderPlaceholder from "../components/Placeholders/SliderPlaceholder";

interface Person {
    id: number;
    first_name: string;
    last_name: string;
    profile_path?: string;
    character?: string;
}

interface Genres {
    id: number;
    name: string;
}

interface Oscars {
    id: number;
    category: string;
    year: number;
    ceremony: number;
    person?: Person;
}

interface Movie {
    id: number;
    title: string;
    release_year: number;
    runtime: number;
    genres: Genres[];
    directors: Person[];
    actors: Person[];
    movie_oscar_wins: Oscars[];
    overview: string;
    posterPath?: string;
    tagline: string;
    budget: number;
    revenue: number;
}

interface MovieRec {
    id: number;
    title: string;
    release_year: number;
    poster?: string;
}


function MovieHeader({ movie, user }: { movie: Movie, user: any }) {
    return (
        <div className="mx-auto" key={movie.id}>
            <div className="card mb-1" style={{ border: "none" }}>
                <div className="row">
                    <div className="col-4">
                        <img
                            loading="lazy"
                            className="img-poster rounded-3 my-5"
                            src={movie.posterPath}
                            alt={"Photo of " + movie.title}
                        />
                    </div>
                    <div className="col-8 my-5">
                        <h2 className="movie-title mt-2">
                            {movie.title}
                            <span className="fw-normal fs-4 ms-2">
                                ({movie.release_year})
                            </span>
                        </h2>

                        <div className="mb-2">
                            Directed by
                            {movie.directors.map((director, index) => (
                                <Fragment key={director.id}>
                                    {!!index && ","}
                                    <a
                                        href={`/person/${director.id}`}
                                        className="ms-1"
                                    >
                                        {`${director.first_name} ${director.last_name}`}
                                    </a>
                                </Fragment>
                            ))}
                        </div>
                        <div className="tagline mb-3">{movie.tagline}</div>

                        <div className="">
                            <UserRating movieId={movie.id} user={user} />
                        </div>
                        <hr></hr>

                        <MovieInfoTabs movie={movie} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MovieDetails({ movie }: { movie: Movie }) {
    const formatAmount = (amount: number): string => {
        return amount > 0 ? "$" + amount.toLocaleString("en-US") : "No data";
    };

    let budget: string = formatAmount(movie.budget);
    let revenue: string = formatAmount(movie.revenue);

    return (
        <div className="row">
            <div className="col-6">
                <div>
                    <b>Oscars Won</b>
                </div>
                <div>{movie.movie_oscar_wins.length}</div>
                <div>
                    <b>Runtime</b>
                </div>
                {convertRuntime(movie.runtime)}
                <div>
                    <b>Genres</b>{" "}
                </div>
                {movie.genres.map((genre) => (
                    <span className="badge bg-secondary me-2" key={genre.id}>
                        {genre.name}
                    </span>
                ))}
            </div>

            <div className="col-6">
                <div>
                    <b>Budget</b>
                </div>
                {budget}
                <div>
                    <b>Revenue</b>
                </div>
                <div>{revenue}</div>
            </div>
        </div>
    );
}

function MovieInfoTabs({ movie }: { movie: Movie }) {
    const [index, setIndex] = useState(0);

    return (
        <>
            <div className="Indicators mb-3">
                <button
                    className={`movie-tab-button me-2  text-left ${
                        index === 0 ? "active" : ""
                    }`}
                    onClick={() => setIndex(0)}
                >
                    <h5>Overview</h5>
                </button>
                <button
                    className={`movie-tab-button ${
                        index === 1 ? "active" : ""
                    }`}
                    onClick={() => setIndex(1)}
                >
                    <h5>Details</h5>
                </button>
            </div>

            {index === 0 ? (
                <>
                    <div>
                        {movie.overview ? movie.overview : "No overview found"}
                    </div>
                </>
            ) : (
                <MovieDetails movie={movie} />
            )}
        </>
    );
}

export function OscarWinsPanel({ movie }: { movie: Movie }) {
    return (
        <div>
            {movie.movie_oscar_wins.map((award, index) => (
                <div className="card with-box-shadow mb-3" key={award.id}>
                    <div className="card-body" style={{ border: "none" }}>
                        <div className="row align-items-center">
                            <div
                                className="col-1 d-flex justify-content-center "
                                style={{ paddingLeft: "20px" }}
                            >
                                <img
                                    className="oscar-award-image"
                                    src={OscarAwardImage}
                                    alt="Oscar Award"
                                />
                            </div>
                            <div className="col-9">
                                <h5 className="card-title">{award.category}</h5>
                                <p className="card-text">
                                    {award.person && 
                                        <>
                                        <a href={`/person/${award.person.id}`}>
                                            {award.person.first_name} {award.person.last_name}
                                        </a>
                                        <span className="separator-ward-text"></span>
                                        </>
                                    }
                                    
                                    {award.ceremony}
                                    {getOrdinalNumber(award.ceremony)} Academy
                                    Awards Ceremony
                                    <span className="separator-ward-text"></span>
                                    {award.year}
                                </p>
                            </div>
                            <div
                                className="col-2"
                                style={{ paddingRight: "25px" }}
                            >
                                <h1 className="display-2 text-end">
                                    {index + 1}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CastScroller({ movie }: { movie: Movie }) {
    const [person, setPerson] = useState<Person[]>([]);

    useEffect(() => {
        const updatedActorsPromises = movie.actors.map((actor) =>
            fetchProfilePicture({ personId: actor.id })
                .then((profilePicture) => ({
                    ...actor,
                    profile_path: profilePicture,
                }))
                .catch((error) => {
                    console.error(
                        `Error fetching profile picture for ${actor.first_name} ${actor.last_name}:`,
                        error
                    );
                    return actor;
                })
        );

        Promise.all(updatedActorsPromises)
            .then((updatedActors) => setPerson(updatedActors))
            .catch((error) =>
                console.error("Error fetching profile pictures:", error)
            );
    }, [movie]);

    return (
        <>
        {person.length === 0 ? 
            <div>No actors found</div>
        :
        <div className="row">
            <ul className="cards-actors">
                {person.map((actor, index) => (
                    <li key={index} className="card-actor">
                        <a href={`/person/${actor.id}`}>
                            <img
                                src={actor.profile_path}
                                className="card-img-top rounded-3"
                                alt={`${actor.first_name} ${actor.last_name}`}
                            ></img>
                        </a>
                        <div className="card-body">
                            <h5 className="card-title mt-1">
                                <a
                                    href={`/person/${actor.id}`}
                                >{`${actor.first_name} ${actor.last_name}`}</a>
                            </h5>
                            {actor.character && (
                                <span>as {actor.character}</span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
        }
        </>
    );
}

function ShowRecommendedMovies({ movieId }: { movieId: number }) {
    const [moviesRec, setMoviesRec] = useState<MovieRec[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    useEffect(() => {
        fetch(import.meta.env.VITE_API_URL + `movies/${movieId}/recommendation`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data: MovieRec[]) => {
                const moviePosterPromises = data.map((movie) =>
                    fetchMoviePosterById({ movieId: movie.id })
                        .then((moviePoster) => ({ ...movie, poster: moviePoster }))
                        .catch((error) => {
                            console.error(`Error fetching profile picture for ${movie.title}`, error);
                            return movie;
                        })
                );
                
                Promise.all(moviePosterPromises)
                    .then((updatedMoviesRec) => {
                        setMoviesRec(updatedMoviesRec);
                        setIsLoading(false);
                    })
                    .catch((error) => {
                        console.error("Error fetching profile pictures:", error);
                    });
            })
            .catch((error) => console.error("Error fetching movie recommendations:", error));
    }, []);

    if (isLoading)
        return (
            <SliderPlaceholder/>
        );
    else
        return (
            <>
            <div className="row">
                <ul className="cards-actors">
                    {moviesRec.map((movie) => (
                        <li key={movie.id} className="card-actor">
                            <a href={`/movies/${movie.id}`}>
                                <img
                                    src={movie.poster}
                                    className="card-img-top rounded-3"
                                    alt={movie.title}
                                ></img>
                            </a>
                            <div className="card-body">
                                <h5 className="card-title mt-1">
                                    <a href={`/movies/${movie.id}`}>
                                        {movie.title}
                                    </a>
                                    <span className="ms-1">
                                        ({movie.release_year})
                                    </span>
                                </h5>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            </>
        );
}

export default function MovieFetch({ user }: {user: any}) {
    const { movieId } = useParams<{ movieId: string }>();
    const [movie, setMovie] = useState<Movie>();
    const [notFound, setNotFound] = useState<boolean>(false);

    useEffect(() => {
        fetch(import.meta.env.VITE_API_URL + `movies/${movieId}`)
            .then((response) => {
                if (!response.ok) {
                    setNotFound(true);
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(async (data: Movie) => {
                const poster_path = await fetchMoviePosterById({
                   movieId: data.id
                });

                setMovie({ ...data, posterPath: poster_path });
            })
            .catch((error) => console.error("Error fetching movie:", error));
    }, [movieId]);

    if (notFound) {
        return <NotFound />;
    } else if (!movie) {
        return <></>;
    } else {
        return (
            <div style={{ paddingLeft: "2rem" }}>
                <MovieHeader movie={movie} user={user} />
                <h4 className="mb-3 mt-3 mb-2">Oscar Wins</h4>
                <OscarWinsPanel movie={movie} />
                <h4 className="mb-3 mt-5">Cast</h4>
                <CastScroller movie={movie} />
                <h4 className="mb-3 mt-5 mb-4">Similar Movies</h4>
                <ShowRecommendedMovies movieId={movie.id} />
                <h4 className="mb-3 mt-5 mb-4">Reviews</h4>
                <Comments movieId={movie.id} user={user} />
            </div>
        );
    }
}
