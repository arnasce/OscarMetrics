import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as solidStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
import Cookies from "js-cookie";

interface StarRatingProps {
    rating: number;
    onChange?: (rating: number) => void;
}

function StarRating({ rating, onChange }: StarRatingProps) {
    const [currentRating, setCurrentRating] = useState(rating);
    const [hoverRating, setHoverRating] = useState(0);

    const handleHover = (hoveredRating: number) => {
        setHoverRating(hoveredRating);
    };

    const handleClick = (newRating: number) => {
        setCurrentRating(newRating);
        if (onChange) onChange(newRating);
    };

    const stars = Array(5).fill(0);

    return (
        <div className="star-rating">
            {stars.map((_, index) => (
                <span
                    key={index}
                    className={
                        index < currentRating ? "star-filled" : "star-empty"
                    }
                    onMouseEnter={() => handleHover(index + 1)}
                    onMouseLeave={() => handleHover(0)}
                >
                    <FontAwesomeIcon
                        icon={
                            index < (hoverRating || currentRating)
                                ? solidStar
                                : regularStar
                        }
                        onClick={() => handleClick(index + 1)}
                        size="lg"
                        style={{
                            marginRight: "12px",
                            transform: "scale(1.25)",
                        }}
                        className="star-icon"
                    />
                </span>
            ))}
        </div>
    );
}

interface UserRating {
    id: number;
    user: number;
    rating: number;
}

export default function UserRating({ movieId, user }: { movieId: number, user: any }) {
    const [userRating, setUserRating] = useState<UserRating | undefined>();
    const [showRatingForm, setShowRatingForm] = useState<boolean>(false);

    const csrfToken = Cookies.get("csrftoken");

    useEffect(() => {
        if (user?.id) {
            fetch(`${import.meta.env.VITE_API_URL}movies/${movieId}/ratings/${user.id}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken ?? "",
                    },
                }
            )
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                } else {
                    return response.json();
                }
            })
            .then((data: UserRating) => {
                if (data.id === null)
                    setUserRating(undefined);
                else
                    setUserRating(data);
            })
            .catch((error) => {
                console.error("Error fetching rating:", error);
            });
        }
    }, [user?.id, movieId]);

    const handleRatingChange = (newRating: number) => {
        if (user) {
            if (userRating) {
                updateRating(newRating);
            } else {
                addRating(newRating);
            }
        } else {
            console.error("User not logged in");
        }
    };

    const addRating = (rating: number) => {
        fetch(`${import.meta.env.VITE_API_URL}movies/${movieId}/ratings`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken ?? "",
            },
            body: JSON.stringify({ user_id: user?.id, rating: rating }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                setUserRating({ id: data.id, user: user!.id, rating });
            })
            .catch((error) => {
                console.error("Error adding rating:", error);
            });
    };

    const updateRating = (rating: number) => {
        fetch(
            import.meta.env.VITE_API_URL +
                `movies/${movieId}/ratings/${userRating?.id}/update`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken ?? "",
                },
                body: JSON.stringify({ rating: rating }),
            }
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                setUserRating({ ...userRating!, rating });
            })
            .catch((error) => {
                console.error("Error updating rating:", error);
            });
    };

    const deleteRating = () => {
        if (userRating?.id) {
            fetch(
                `${import.meta.env.VITE_API_URL}movies/${movieId}/ratings/${
                    userRating.id
                }/delete`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken ?? "",
                    },
                }
            )
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then((data) => {
                    setUserRating(undefined);
                })
                .catch((error) => {
                    console.error("Error deleting rating:", error);
                });
        }
    };

    useEffect(() => {
        setShowRatingForm(!userRating);
    }, [userRating]);

    return (
        <div>
            {user && (
                <div>
                    <h5>Your Rating</h5>
                    {showRatingForm && (
                        <StarRating rating={0} onChange={handleRatingChange} />
                    )}
                    {!showRatingForm && userRating && (
                        <div className="row align-items-center">
                            <div className="col-auto">
                                <StarRating
                                    rating={userRating.rating}
                                    onChange={handleRatingChange}
                                />
                            </div>
                            <div className="col-auto">
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={deleteRating}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
