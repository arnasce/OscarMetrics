import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { convertRuntime } from "../../pages/MoviesMainPage";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "./styles.css";
import { OverlayTrigger, Popover } from "react-bootstrap";

const createSliderWithTooltip = Slider.createSliderWithTooltip;
const SliderRange = createSliderWithTooltip(Slider.Range);

interface Genre {
    id: number;
    name: string;
}

export function useDebounce<T>(value: T, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value]);

    return debouncedValue;
}

interface fetchGenresProps {
    setGenres: (genres: Genre[]) => void;
}

function fetchGenres({ setGenres }: fetchGenresProps) {
    fetch(import.meta.env.VITE_API_URL + `genres`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            return response.json();
        })
        .then((data: Genre[]) => {
            setGenres(data);
        })
        .catch((error) => console.error("Error fetching movies:", error));
}

interface GenrePickerProps {
    selectedGenres: number[];
    setSelectedGenres: (selectedGenres: number[]) => void;
}

function GenrePicker({ selectedGenres, setSelectedGenres }: GenrePickerProps) {
    const [genres, setGenres] = useState<Genre[]>([]);

    useEffect(() => {
        fetchGenres({ setGenres });
    }, []);

    const handleGenreToggle = (genreId: number) => {
        let updatedSelectedGenres = [...selectedGenres];
        const genreIndex = updatedSelectedGenres.indexOf(genreId);

        if (genreIndex !== -1) {
            updatedSelectedGenres.splice(genreIndex, 1);
        } else {
            updatedSelectedGenres.push(genreId);
        }

        setSelectedGenres(updatedSelectedGenres);
    };

    return (
        <div className="row align-items-center py-3">
            <div className="col-auto">
                <OverlayTrigger
                    trigger={["hover", "focus"]}
                    key="bottom"
                    placement="bottom"
                    overlay={
                        <Popover id={`popover-positioned-bottom`}>
                            <Popover.Body>
                                Press on genre names to filter movies, showing only those
                                that match all selected genres.
                            </Popover.Body>
                        </Popover>
                    }
                >
                    <a className="ms-2 me-3">Pick genres</a>
                </OverlayTrigger>

                {genres
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((genre) => (
                        <span key={genre.id} className="d-inline-block m-1">
                            <input
                                type="checkbox"
                                className="btn-check m-1"
                                id={`btn-check-${genre.id}`}
                                autoComplete="off"
                                checked={selectedGenres.includes(genre.id)}
                                onChange={() => handleGenreToggle(genre.id)}
                            />
                            <label
                                className="btn btn-outline-dark"
                                htmlFor={`btn-check-${genre.id}`}
                            >
                                {genre.name}
                            </label>
                        </span>
                    ))}
            </div>
        </div>
    );
}

interface ReleaseYearSliderProps {
    setYearRange: (yearRange: [number, number]) => void;
}

function ReleaseYearSlider({
    setYearRange,
}: ReleaseYearSliderProps) {
    function handleYearRangeChange(newRange: [number, number]) {
        setYearRange(newRange);
    }

    return (
        <div className="row align-items-center ps-2">
            <div className="col-2">Release year</div>
            <div className="col-10">
                <SliderRange
                    min={1927}
                    max={2023}
                    defaultValue={[1927, 2023]}
                    onChange={handleYearRangeChange}
                    allowCross={false}
                />
            </div>
        </div>
    );
}

interface ShowSearchBarProps {
    query: string;
    setQuery: (query: string) => void;
    setYearRange: (yearRange: [number, number]) => void;
    selectedGenres: number[];
    setSelectedGenres: (selectedGenres: number[]) => void;
    setRuntimeRange: (runtimeRange: [number, number]) => void;
}

export default function ShowSearchBar({
    query,
    setQuery,
    setYearRange,
    selectedGenres,
    setSelectedGenres,
    setRuntimeRange,
}: ShowSearchBarProps) {
    return (
        <div>
            <form
                id="search-bar"
                className="pr-5 d-flex justify-content-center mb-4"
            >
                <div className="input-group search-bar">
                    <input
                        value={query}
                        onChange={(e) => {
                            e.preventDefault();
                            setQuery(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.preventDefault();
                        }}
                        type="search"
                        className="form-control"
                        placeholder="Search Movie or Person"
                        aria-label="Search"
                    />
                    <span className="input-group-text">
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </span>
                </div>
            </form>

            <div className="mb-4">
                <ReleaseYearSlider
                    setYearRange={setYearRange}
                />
            </div>

            <div className="mb-3">
                <RuntimeSlider
                    setRuntimeRange={setRuntimeRange}
                />
            </div>

            <div className="d-flex justify-content-center">
                <GenrePicker
                    selectedGenres={selectedGenres}
                    setSelectedGenres={setSelectedGenres}
                />
            </div>
        </div>
    );
}

interface RuntimeSliderProps {
    setRuntimeRange: (runtimeRange: [number, number]) => void;
}

function RuntimeSlider({ setRuntimeRange }: RuntimeSliderProps) {
    function handleRuntimeRangeChange(newRange: [number, number]) {
        setRuntimeRange(newRange);
    }

    return (
        <div className="row align-items-center ps-2">
            <div className="col-2">Runtime</div>
            <div className="col-10">
                <SliderRange
                    min={1}
                    max={467}
                    defaultValue={[1, 467]}
                    onChange={handleRuntimeRangeChange}
                    tipFormatter={(value) => `${convertRuntime(value)}`}
                    allowCross={false}
                />
            </div>
        </div>
    );
}
