import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import NotFound from "./NotFoundPage.tsx";
import ProfilePlaceholder from "../components/Placeholders/PersonPlaceholder";
import {
    fetchMoviePosterById,
    fetchProfilePicture,
} from "../services/externalApi.tsx";

import OscarAwardImage from "../assets/oscar_award.svg";

interface Oscars {
    id: number;
    movie_id: number;
    movie_title: string;
    category: string;
    year: number;
    ceremony: number;
}

interface Movie {
    id: number;
    title: string;
    poster?: string;
    release_year: number;
}

interface Person {
    id: number;
    first_name: string;
    last_name: string;
    birthday: string;
    deathday?: string;
    place_of_birth: string;
    biography: string;
    profile_path?: string;
    oscar_wins: Oscars[];
    filmography: Movie[];
}

export default function PersonPage() {
    const { personId } = useParams<{ personId: string }>();
    const [person, setPerson] = useState<Person>();
    const [notFound, setNotFound] = useState<boolean>(false);

    useEffect(() => {
        fetch(import.meta.env.VITE_API_URL + `people/${personId}`)
            .then((response) => {
                if (!response.ok) {
                    setNotFound(true);
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(async (data: Person) => {
                const profile_path = await fetchProfilePicture({
                    personId: data.id,
                });
                
                const tmdbResponse = await fetch(import.meta.env.VITE_TMDB_API_ENDPOINT + 'person/' + personId + '?api_key=' + import.meta.env.VITE_TMDB_API_KEY);

                if (!tmdbResponse.ok) {
                    throw new Error("Network response was not ok");
                }

                const tmdbPersonData = await tmdbResponse.json();

                setPerson({ ...data, profile_path, deathday: tmdbPersonData.deathday});
            })
            .catch((error) => console.error("Error fetching person:", error));
    }, [personId]);

    if (notFound) {
        return <NotFound />;
    } else if (!person) {
        return <ProfilePlaceholder />;
    } else {
        return <PersonProfile person={person} />;
    }
}

function calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }
    return age;
}

function ShowMovies({ person }: { person: Person }) {
    const [movie, setMovie] = useState<Movie[]>([]);

    useEffect(() => {
        const moviePosterPromises = person.filmography.map((movie) =>
            fetchMoviePosterById({ movieId: movie.id })
                .then((moviePoster) => ({ ...movie, poster: moviePoster }))
                .catch((error) => {
                    console.error(
                        `Error fetching profile picture for ${movie.title}`,
                        error
                    );
                    
                    return movie;
                })
        );

        Promise.all(moviePosterPromises)
            .then((updatedActors) => setMovie(updatedActors))
            .catch((error) =>
                console.error("Error fetching profile pictures:", error)
            );
    }, [movie]);

    return (
        <div className="row">
            <ul className="cards-actors">
                {movie.map((movie) => (
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
    );
}

export function getOrdinalNumber(number: number) {
    let ord = "";

    if (number % 10 === 1 && number % 100 !== 11) ord = "st";
    else if (number % 10 === 2 && number % 100 !== 12) ord = "nd";
    else if (number % 10 === 3 && number % 100 !== 13) ord = "rd";
    else ord = "th";

    return ord;
}

function ShowOscars({ person }: { person: Person }) {
    return (
        <div>
            {person.oscar_wins.map((award, index) => (
                <div className="card with-box-shadow mb-3" key={award.id}>
                    <div className="card-body" style={{ border: "none" }}>
                        <div className="row align-items-center">
                            <div className="col-1  d-flex justify-content-center">
                                <img
                                    className="oscar-award-image"
                                    src={OscarAwardImage}
                                    alt="Oscar Award"
                                />
                            </div>
                            <div className="col-10">
                                <h5 className="card-title">{award.category}</h5>
                                <p className="card-text">
                                    <a href={`/movies/${award.movie_id}`}>
                                        {award.movie_title}
                                    </a>
                                    <span className="separator-ward-text"></span>
                                    {award.ceremony}
                                    {getOrdinalNumber(award.ceremony)} Academy
                                    Awards Ceremony
                                    <span className="separator-ward-text"></span>
                                    {award.year}
                                </p>
                            </div>

                            <div className="col-1">
                                <h1 className="display-2">{index + 1}</h1>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PersonProfile({ person }: { person: Person }) {
    const [showFullBiography, setShowFullBiography] = useState<boolean>(false);
    const biographyMaxLength: number = 1500;

    return (
        <div className="row d-flex" style={{ paddingLeft: "2rem" }}>
            <div className="col-4">
                <img
                    className="img-poster rounded-3 mt-5 mb-4"
                    src={person.profile_path}
                    alt={`${person.first_name}  ${person.last_name} Profile Photo`}
                />

                <h5 className="mb-3">Personal Details</h5>
                <p>
                    <b>Place of Birth:</b>{" "}
                    {person.place_of_birth
                        ? person.place_of_birth
                        : "No data found"}
                </p>
                <p>
                    <b>Born: </b>
                    {person.birthday ? person.birthday : "No data found"}
                    {!person.deathday &&
                        person.birthday &&
                        ` (${calculateAge(person.birthday)} yrs old)`}
                </p>
                {person.deathday && (
                    <p>
                        <b>Died:</b> {person.deathday}
                    </p>
                )}
            </div>
            <div className="col-8 my-4">
                <h2 className="mb-4 mt-4">
                    {person.first_name} {person.last_name}
                </h2>
                <h5>Biography</h5>
                <p>
                    {person.biography ? (
                        <>
                            {showFullBiography
                                ? person.biography
                                : person.biography.slice(0, biographyMaxLength)}
                            {person.biography.length > biographyMaxLength &&
                            !showFullBiography ? (
                                <span
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowFullBiography(true);
                                    }}
                                >
                                    ...
                                    <a href="" className="fw-bold ms-1">
                                        Read more
                                    </a>
                                </span>
                            ) : person.biography.length > biographyMaxLength ? (
                                <span
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowFullBiography(false);
                                    }}
                                >
                                    <a href="" className="fw-bold ms-1">
                                        Collapse
                                    </a>
                                </span>
                            ) : null}
                        </>
                    ) : (
                        <p>No data found</p>
                    )}
                </p>
            </div>

            {person.oscar_wins.length > 0 && (
                <>
                    <h4 className="my-3 mt-5">Oscars Won</h4>
                    <ShowOscars person={person} />
                </>
            )}

            <h4 className="my-3 mt-5">Filmography</h4>
            <ShowMovies person={person} />
        </div>
    );
}
