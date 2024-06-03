import Navbar from "react-bootstrap/Navbar";
import "./NavBar.css";
import logo from "./logo.svg";
import Cookies from "js-cookie";

import { useState } from "react";

export default function NavigationBar({ user }: {user: any}) {
    return (
        <>
            <Navbar className="navbar navbar-expand-lg">
                <div className="container-fluid">
                    <a
                        className="navbar-brand ps-2 d-flex justify-content-center"
                        href="/"
                    >
                        <img id="logo" src={logo}></img>
                    </a>
                    <span className="navbar-text">
                        <div className="user-info">
                            {user ? (
                                <div className="d-flex align-items-center">
                                    <p className="me-3">
                                        Hello{" "}
                                        <a href={`/profile/${user.id}`}>
                                            <b>{user.username}</b>
                                        </a>
                                        !
                                    </p>

                                    <a href={`/profile/${user.id}`}>
                                        <button
                                            type="button"
                                            className="btn btn-outline-dark me-2"
                                        >
                                            Profile
                                        </button>
                                    </a>
                                    <LogoutButton />
                                </div>
                            ) : (
                                <a href="/login">Login</a>
                            )}
                        </div>
                    </span>
                </div>
            </Navbar>
        </>
    );
}

export function LogoutButton() {
    const [error, setError] = useState("");

    const handleLogout = async () => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL + "logout",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                    },
                }
            );

            if (response.ok) {
                window.location.href = "/";
            } else {
                setError("Failed to logout. Please try again.");
            }
        } catch (err) {
            setError("Failed to fetch. Please try again.");
            console.error(err);
        }
    };

    return (
        <>
            <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleLogout}
            >
                Logout
            </button>
            {error && <div style={{ color: "red" }}>{error}</div>}
        </>
    );
}