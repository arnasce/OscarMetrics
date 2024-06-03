import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import userProfilePicturePlaceholder from "../assets/profile_pic_placeholder.png";
import ProfilePlaceholder from "../components/Placeholders/ProfilePlaceholder";
import { fetchMoviePosterById } from "../services/externalApi";
import Cookies from "js-cookie";

interface Profile {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture: string;
    date_joined: string;
    bio: string;
}

interface RecMovies {
    id: number;
    title: string;
    release_year: number;
    estimated_rating: number;
    poster: string;
}

interface UserMovieLists {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export default function ProfilePage({ user }: { user: any }) {
    const { userId } = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<Profile>();
    const [showProfileEdit, setShowProfileEdit] = useState<boolean>(false);
    const [showMovieRecs, setShowMovieRecs] = useState<boolean>(false);
    const [showMovieLists, setShowMovieLists] = useState<boolean>(false);

    useEffect(() => {
        fetch(import.meta.env.VITE_API_URL + `profile/${userId}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data: Profile) => setProfile(data));
    }, [userId]);

    if (!profile) return <ProfilePlaceholder />;

    return (
        <>
            <div className="card my-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-3 d-flex justify-content-center ">
                            <div className="text-center">
                                <img
                                    src={
                                        profile.profile_picture
                                            ? `${
                                                    import.meta.env
                                                        .VITE_BACKEND_URL
                                                }${profile.profile_picture}`
                                            : userProfilePicturePlaceholder
                                    }
                                    className="img-fluid profile-avatar rounded-circle mr-4"
                                    alt={`${profile.username} profile image`}
                                />
                            </div>
                        </div>
                        <div className="col-9">
                            <h4 className="card-title me-3">
                                {profile.username}
                            </h4>
                            <p>{profile.first_name} {profile.last_name}</p>
                            <div className="card-text my-3">
                                <div>
                                    <b>Member since</b>
                                </div>
                                <p>{profile.date_joined}</p>

                                <div>
                                    <b>Bio</b>
                                </div>
                                <p>{profile.bio ? profile.bio : "User has not provided bio"}</p>
                            </div>
                            {user?.id == userId && (
                                <>
                                <button
                                    type="button"
                                    className="btn btn-outline-dark profile-button me-2"
                                    onClick={() => {
                                        setShowProfileEdit(
                                            (prevShowProfileEdit) => !prevShowProfileEdit
                                        )
                                        }    
                                    }
                                >
                                    Edit Profile
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-dark profile-button me-2"
                                    onClick={() => {
                                        setShowMovieRecs(
                                            (prevShowMovieRecs) => !prevShowMovieRecs
                                        );
                                        }    
                                    }
                                >
                                    Recommend Movies
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-dark profile-button me-2"
                                    onClick={() => {
                                        setShowMovieLists(
                                            (prevShowMovieLists) => !prevShowMovieLists
                                        );
                                        }    
                                    }
                                >
                                    View Movie Lists
                                </button>

                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {showProfileEdit && <EditProfile userData={profile} setNewUserData={setProfile}/>}
            {showMovieRecs && <MovieRecommendations userId={userId} />}
            {showMovieLists && <MovieLists userId={userId} />}
        </>
    );
}

function MovieLists({ userId }: { userId: string | undefined }) {
    const [userMovieLists, setUserMovieLists] = useState<UserMovieLists[]>([]);
    const [showNewListForm, setShowNewListForm] = useState<boolean>(false);
    
    const [newListName, setNewListName] = useState<string>("");
    const [newListDescription, setNewListDescription] = useState<string>("");

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editingListId, setEditingListId] = useState<number | null>(null);
  
    const fetchUserLists = () => {
        fetch(import.meta.env.VITE_API_URL + `profile/${userId}/lists`, 
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

    useEffect(() => {
        fetchUserLists();
    }, []);

    const handleCreateNewList = async () => {
        try {
            const response = await fetch(import.meta.env.VITE_API_URL + `profile/${userId}/lists/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                },
                body: JSON.stringify({
                    name: newListName,
                    description: newListDescription,
                    user: userId
                }),
            });

            if (response.ok) {
                fetchUserLists();
                setShowNewListForm(false);
                setNewListName("");
                setNewListDescription("");
            } else {
                console.error("Failed to create new list");
            }
        } catch (error) {
            console.error("Error creating new list", error);
        }
    };

    const toggleEditMode = (listId: number, currentName: string, currentDescription: string) => {
        setIsEditing(!isEditing);
        setEditingListId(listId);
        setNewListName(currentName);
        setNewListDescription(currentDescription);
    };

    const handleEditMovieList = async (listId: number, editedName: string, editedDescription: string) => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL +
                    `profile/${userId}/lists/${listId}/update`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                    },
                    body: JSON.stringify({
                        name: editedName,
                        description: editedDescription,
                    }),
                }
            );

            if (response.ok) {
                const message = await response.json();
                fetchUserLists();
                setIsEditing(false);
            } else if (response.status !== 200) {
                const message = await response.json();
            }
        } catch (err) {
            console.error("Error editing movie list:", err);
        }
    };

    const handleDeleteMovieList = async (listId: number) => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL +
                    `profile/${userId}/lists/${listId}/delete`,
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
                fetchUserLists();
            } else {
                const message = await response.json();
                console.error("Error deleting comment:", message.error);
            }
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };
    
    return (
        <>
            <h4 className="mt-5 mb-4">Your Movie Lists</h4>

            <button
                type="button"
                className="btn btn-outline-dark profile-button me-2"
                onClick={() => setShowNewListForm(!showNewListForm)}
            >
                + New List
            </button>


            {showNewListForm && (
                <div className="mt-4">
                    <div className="mb-3">
                        <label className="form-label">List Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            rows={3}
                            value={newListDescription}
                            onChange={(e) => setNewListDescription(e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        className="btn btn-dark"
                        onClick={handleCreateNewList}
                    >
                        Create List
                    </button>
                </div>
            )}

            <div className="row my-4">
                {userMovieLists && userMovieLists.map(list => 
                    <div key={list.id} className="card mb-2" >
                        <div className="card-body">
                            {isEditing === true &&
                            editingListId === list.id ? (
                                <>     
                                    <input
                                        className="form-control"
                                        id="list-name"
                                        value={newListName}
                                        onChange={(e) => 
                                            setNewListName(e.target.value)
                                        }
                                    />
    
                                    <textarea
                                        className="form-control my-2"
                                        id="list-description"
                                        rows={6}
                                        value={newListDescription}
                                        onChange={(e) =>
                                            setNewListDescription(e.target.value)
                                        }
                                    />
                                    
                                    <div className="buttons my-3">
                                        <button
                                            className="btn btn-outline-success me-2"
                                            onClick={() =>
                                                handleEditMovieList(
                                                    list.id,
                                                    newListName,
                                                    newListDescription
                                                )
                                            }
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            className="btn btn-outline-danger"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setNewListName("");
                                                setNewListDescription("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                <div className="d-flex justify-content-between">
                                    <a href={`/lists/${list.id}`}>
                                        <h5>{list.name}</h5>
                                    </a>

                                    <div className="text-muted small">
                                        {list.updated_at != list.created_at && (
                                            <>
                                                Updated {list.updated_at}
                                                <span className="separator-ward-text"></span>
                                            </>
                                        )}
                                        Created {list.created_at}
                                    </div>
                                </div>
                                <p>{list.description}</p>
                                </>
                            )}

                            {isEditing === false && (
                            <>  
                                <button
                                    className="btn btn-outline-dark me-2"
                                    onClick={() =>
                                        toggleEditMode(
                                            list.id,
                                            list.name,
                                            list.description
                                        )
                                    }
                                    >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                        handleDeleteMovieList(list.id)
                                    }
                                    >
                                    Delete
                                </button>
                            </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

function MovieRecommendations({ userId }: { userId: string | undefined }) {
    const [recMovies, setRecMovies] = useState<RecMovies[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, seterrorMessage] = useState<string>("");

    useEffect(() => {
        fetch(import.meta.env.VITE_API_URL + `profile/${userId}/recommendation`, 
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                },
            })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    const error = data.error;
                    seterrorMessage(error);
                    throw new Error(error);
                }
                return data;
            })
            .then((data: RecMovies[]) => {
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
                        setRecMovies(updatedMoviesRec);
                        setIsLoading(false);
                    })
                    .catch((error) => {
                        console.error("Error fetching profile pictures:", error);
                        setIsLoading(false);
                    });
            })
            .catch((error) => {
                console.error("Error fetching movie recommendations:", error);
                setIsLoading(false);
            });
    }, [userId]);

    return (
        <>
            <h4 className="mt-5 mb-4">Personal recommendations</h4>

            {errorMessage ? (
                <div className="alert alert-danger mb-4">
                    {errorMessage}
                </div>
            ) : (
                <>
                    {isLoading ? (
                        <div className="d-flex justify-content-center my-5">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="row col-12">
                            {recMovies && recMovies.map(movie => (
                                <div key={movie.id} className="col-3 mb-3">
                                    <a href={`/movies/${movie.id}`}>
                                        <img
                                            src={movie.poster}
                                            className="card-img-top rounded-3"
                                            alt={movie.title}
                                        />
                                    </a>
                                    <h5 className="mt-1">{movie.title}</h5>
                                    <span className="me-2">Estimated score</span>
                                    <p className="badge text-bg-dark">{movie.estimated_rating.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
}

interface ProfileUpdate {
    first_name?: string;
    last_name?: string;
    bio?: string;
    current_password?: string;
    new_password?: string;
    new_password_repeat?: string;
}

function EditProfile({ userData, setNewUserData }: { userData: Profile, setNewUserData: (userData: Profile) => void; }) {
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [isError, setIsError] = useState<boolean>(false);
    const [profileInfo, setProfileInfo] = useState<ProfileUpdate>({
        first_name: userData.first_name,
        last_name: userData.last_name,
        bio: userData.bio,
        current_password: "",
        new_password: "",
        new_password_repeat: "",
    });

    const handleProfileEdit = async () => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL + `profile/${userData.id}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                    },
                    body: JSON.stringify({
                        first_name: profileInfo?.first_name,
                        last_name: profileInfo?.last_name,
                        current_password: profileInfo?.current_password,
                        new_password: profileInfo?.new_password,
                        new_password_repeat: profileInfo?.new_password_repeat,
                        bio: profileInfo?.bio,
                    }),
                }
            );

            if (response.ok) {
                const message = await response.json();
                setStatusMessage(message.success);
                setNewUserData({
                    ...userData,
                    first_name: profileInfo.first_name || "",
                    last_name: profileInfo.last_name || "",
                    bio: profileInfo.bio || "",
                });
                setIsError(false);
            } else if (response.status !== 200) {
                const message = await response.json();
                setStatusMessage(message.error);
                setIsError(true);
            }
        } catch (err) {
            setStatusMessage("Failed to fetch. Please try again.");
            console.error(err);
        }
    };

    return (
        <>
            {statusMessage && (
                <div
                    className={`ms-2 alert ${
                        isError ? "alert-danger" : "alert-success"
                    } mb-4`}
                >
                    {statusMessage}
                </div>
            )}

            <h5 className="mb-3 my-2">Change personal details</h5>
            <div className="mb-3">
                <label className="form-label" htmlFor="firstname">
                    First name
                </label>
                <input
                    type="firstname"
                    className="form-control"
                    id="firstname"
                    placeholder="First name"
                    value={profileInfo?.first_name}
                    onChange={
                        (e) => setProfileInfo({
                            ...profileInfo, 
                            first_name: e.target.value 
                        })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label" htmlFor="lastname">
                    Last name
                </label>
                <input
                    type="lastname"
                    className="form-control"
                    id="lastname"
                    placeholder="Last name"
                    value={profileInfo?.last_name}
                    onChange={
                        (e) => setProfileInfo({
                            ...profileInfo, 
                            last_name: e.target.value
                        })
                    }
                />
            </div>

            <div className="mb-3">
                <label className="form-label" htmlFor="bio">
                    Bio
                </label>
                <textarea
                    className="form-control"
                    id="bio"
                    placeholder="Bio"
                    rows={3}
                    value={profileInfo?.bio}
                    onChange={
                        (e) => setProfileInfo({
                            ...profileInfo, 
                            bio: e.target.value
                        })
                    }
                />
            </div>

            <h5 className="mb-3 my-4">Change password</h5>

            <div className="mb-3">
                <label htmlFor="current-password" className="form-label">
                    Current password
                </label>
                <input
                    type="password"
                    className="form-control"
                    id="current-password"
                    placeholder="Current password"
                    value={profileInfo?.current_password}
                    onChange={
                        (e) => setProfileInfo({
                            ...profileInfo, 
                            current_password: e.target.value
                        })
                    }
                />
            </div>

            <div className="mb-3">
                <label htmlFor="new-password" className="form-label">
                    New password
                </label>
                <input
                    type="password"
                    className="form-control"
                    id="new-password"
                    placeholder="New password"
                    value={profileInfo?.new_password}
                    onChange={
                        (e) => setProfileInfo({
                            ...profileInfo, 
                            new_password: e.target.value
                        })
                    }
                />
                <div id="passwordHelpBlock" className="form-text">
                    Your password can’t be too similar to your other
                    personal information.<br></br>
                    Your password must contain at least 8 characters.
                    <br></br>
                    Your password can’t be a commonly used password.
                    <br></br>
                    Your password can’t be entirely numeric.<br></br>
                </div>
            </div>

            <div className="mb-3">
                <label htmlFor="new-password-repeat" className="form-label">
                    Repeat new password
                </label>
                <input
                    type="password"
                    className="form-control"
                    id="new-password-repeat"
                    placeholder="Repeat new password"
                    value={profileInfo?.new_password_repeat}
                    onChange={
                        (e) => setProfileInfo({
                            ...profileInfo, 
                            new_password_repeat: e.target.value
                        })
                    }
                />
            </div>

            <button
                type="submit"
                className="btn btn-dark"
                onClick={handleProfileEdit}
            >
                Save changes
            </button>
        </>
    );
}
