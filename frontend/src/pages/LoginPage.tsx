import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

interface LoggedUser {
    id: number;
    username: string;
}

export default function Login({ setUser }: {setUser: (user: LoggedUser) => void}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCsrfToken = async () => {
            try {
                const response = await fetch(
                    import.meta.env.VITE_API_URL + "set-cookie",
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!response.ok) setError("Failed to fetch CSRF token.");
            } catch (err) {
                setError("Failed to fetch CSRF token. Please try again.");
                console.error(err);
            }
        };

        fetchCsrfToken();
    }, []);

    const handleLogin = async () => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL + "login",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                    },
                    body: JSON.stringify({ username, password }),
                }
            );

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setError("");
                navigate("/");
            } else if (response.status === 401) {
                setError("Incorrect username or password");
            }
        } catch (err) {
            setError("Failed to fetch. Please try again.");
            console.error(err);
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-6">
                <div className="display-5 text-center mb-3">Login</div>
                {error && (
                    <div className="alert alert-danger mb-4">{error}</div>
                )}
                <div className="form-floating mb-3">
                    <input
                        type="username"
                        className="form-control"
                        id="username"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <label className="form-label" htmlFor="username">
                        Username
                    </label>
                </div>
                <div className="form-floating mb-3">
                    <input
                        type="password"
                        className="form-control"
                        id="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <label className="form-label" htmlFor="password">
                        Password
                    </label>
                </div>
                <button
                    type="submit"
                    className="btn btn-dark"
                    onClick={handleLogin}
                >
                    Sign in
                </button>
                <div className="mt-3 text-center">
                    Don't have an account yet? <a href="/register">Register</a>
                </div>
            </div>
        </div>
    );
}
