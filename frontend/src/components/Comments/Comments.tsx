import { useEffect, useState } from "react";
import Cookies from "js-cookie";

interface Comment {
    id: number;
    user_id: number;
    username: string;
    comment: string;
    created_at: string;
    updated_at: string;
}

interface LoggedUser {
    id: number;
    username: string;
}

interface StatusMessage {
    message: string;
    isError: boolean;
}

export default function Comments({ movieId, user }: { movieId: number, user: any }) {
    const [comments, setComments] = useState<Comment[]>([]);

    const [editedComment, setEditedComment] = useState<string>("");
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(
        null
    );

    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(
        null
    );

    const fetchComments = () => {
        fetch(import.meta.env.VITE_API_URL + `movies/${movieId}/comments`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                return response.json();
            })
            .then((data: Comment[]) => {
                setComments(data);
            })
            .catch((error) => console.error("Error fetching comments:", error));
    };

    useEffect(() => {
        fetchComments();
    }, []);

    const handleDeleteComment = async (commentId: number) => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL +
                    `movies/${movieId}/comments/${commentId}`,
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
                fetchComments();
            } else {
                const message = await response.json();
                console.error("Error deleting comment:", message.error);
            }
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };

    const toggleEditMode = (commentId: number, currentText: string) => {
        setIsEditing(!isEditing);
        setEditingCommentId(commentId);
        setEditedComment(currentText);
    };

    const handleEditComment = async (
        commentId: number,
        editedComment: string
    ) => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL +
                    `movies/${movieId}/comments/${commentId}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                    },
                    body: JSON.stringify({
                        comment: editedComment,
                    }),
                }
            );

            if (response.ok) {
                const message = await response.json();
                setStatusMessage({ message: message.success, isError: false });
                fetchComments();
                setIsEditing(false);
            } else if (response.status !== 200) {
                const message = await response.json();
                setStatusMessage({ message: message.error, isError: true });
            }
        } catch (err) {
            console.error("Error editing comment:", err);
        }
    };

    return (
        <>
            <CommentForm
                movieId={movieId}
                loggedUser={user}
                fetchComments={fetchComments}
                statusMessage={statusMessage}
                setStatusMessage={setStatusMessage}
            />

            {comments.map((comment) => (
                <div className="comment" key={comment.id}>
                    <div className="comment-cotainer mb-4">
                        <div className="d-flex justify-content-between">
                            <h5>
                                <a href={`/profile/${comment.user_id}`}>
                                    {comment.username}
                                </a>
                            </h5>
                            <p className="text-muted small">
                                {comment.updated_at != comment.created_at && (
                                    <>
                                        Edited {comment.updated_at}
                                        <span className="separator-ward-text"></span>
                                    </>
                                )}
                                Posted {comment.created_at}
                            </p>
                        </div>
                        {isEditing === true &&
                        editingCommentId === comment.id ? (
                            <>
                                <textarea
                                    className="form-control my-2"
                                    id="comment"
                                    placeholder="Add a review"
                                    rows={6}
                                    value={editedComment}
                                    onChange={(e) =>
                                        setEditedComment(e.target.value)
                                    }
                                />
                                <div className="buttons my-3">
                                    <button
                                        className="btn btn-outline-success me-2"
                                        onClick={() =>
                                            handleEditComment(
                                                comment.id,
                                                editedComment
                                            )
                                        }
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>{comment.comment}</p>
                        )}

                        {user?.id == comment.user_id &&
                            isEditing === false && (
                                <>
                                    <button
                                        className="btn btn-outline-dark me-2"
                                        onClick={() =>
                                            toggleEditMode(
                                                comment.id,
                                                comment.comment
                                            )
                                        }
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={() =>
                                            handleDeleteComment(comment.id)
                                        }
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                    </div>
                    <hr className="comment-divider"></hr>
                </div>
            ))}
        </>
    );
}

interface CommentFormProps {
    movieId: number;
    loggedUser: LoggedUser | undefined;
    fetchComments: () => void;
    statusMessage: StatusMessage | null;
    setStatusMessage: (statusMessage: StatusMessage | null) => void;
}

function CommentForm({
    movieId,
    loggedUser,
    fetchComments,
    statusMessage,
    setStatusMessage,
}: CommentFormProps) {
    const [userComment, setUserComment] = useState<string>("");

    const handleCommentSubmit = async () => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL + `movies/${movieId}/comments`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                    },
                    body: JSON.stringify({
                        movie_id: movieId,
                        user_id: loggedUser?.id,
                        comment: userComment,
                    }),
                }
            );

            if (response.ok) {
                const message = await response.json();
                setStatusMessage({ message: message.success, isError: false });
                setUserComment("");
                fetchComments();
            } else if (response.status !== 200) {
                const message = await response.json();
                setStatusMessage({ message: message.error, isError: true });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <div className="mb-5">
                {statusMessage && (
                    <div
                        className={`alert ${
                            statusMessage.isError
                                ? "alert-danger"
                                : "alert-success"
                        } mb-4`}
                    >
                        {statusMessage.message}
                    </div>
                )}
                {loggedUser != undefined ? (
                    <div className="form-group">
                        <div className="col-sm-12 mb-3">
                            <div className="text mb-3">
                                Logged in as <b>{loggedUser?.username}</b>
                            </div>
                            <textarea
                                className="form-control"
                                id="comment"
                                placeholder="Add a review"
                                rows={6}
                                value={userComment}
                                onChange={(e) => setUserComment(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <div className="col-sm-offset-3 col-sm-3">
                                <button
                                    type="submit"
                                    className="btn btn-dark"
                                    onClick={handleCommentSubmit}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text mb-5 mt-2">
                        You need to{" "}
                        <a href="/login">
                            <b>Login</b>
                        </a>{" "}
                        or{" "}
                        <a href="/register">
                            <b>Register</b>
                        </a>{" "}
                        in order to write comments
                    </div>
                )}
            </div>
        </>
    );
}
