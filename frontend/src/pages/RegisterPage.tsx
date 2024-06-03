import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export default function Login() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL + "register",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": Cookies.get("csrftoken") ?? "",
                    },
                    body: JSON.stringify({ email, username, password }),
                }
            );

            if (response.ok) {
                setError("");
                navigate("/login");
            } else if (response.status !== 200) {
                const errorMessage = await response.json();
                setError(errorMessage.error);
            }
        } catch (err) {
            setError("Failed to fetch. Please try again.");
            console.error(err);
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-6">
                <div className="display-5 text-center mb-3">Register</div>
                {error && (
                    <div className="alert alert-danger mb-4">{error}</div>
                )}

                <div className="form-floating mb-3">
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label className="form-label" htmlFor="email">
                        Email address
                    </label>
                </div>

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
                    onClick={handleRegister}
                >
                    Register
                </button>
            </div>
        </div>
    );
}
