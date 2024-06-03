import ReactDOM from "react-dom/client";
import React, { useEffect, useState } from "react";
import {
    createBrowserRouter,
    RouterProvider,
    RouteObject,
} from "react-router-dom";
import MoviesMainPage from "./pages/MoviesMainPage.tsx";
import Movie from "./pages/MoviePage.tsx";
import Person from "./pages/PersonPage.tsx";
import NotFound from "./pages/NotFoundPage.tsx";
import NavBar from "./components/NavigationBar/NavBar.tsx";
import Footer from "./components/Footer/Footer.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import UserMoviesListPage from "./pages/UserMoviesListPage.tsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "./styles/styles.css";
import Cookies from "js-cookie";

const sessionExists = Cookies.get("sessionid");

interface LoggedUser {
    id: number;
    username: string;
}

const fetchUserData = async () => {
    try {
        const response = await fetch(import.meta.env.VITE_API_URL + "me", {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": Cookies.get("csrftoken") ?? "",
            },
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data: LoggedUser = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};

function App() {
    const [user, setUser] = useState<LoggedUser | null>(null);

    useEffect(() => {
        if (sessionExists) {
            fetchUserData().then((data) => {
                if (data) {
                    setUser(data);
                }
            });
        }
    }, []);

    const auth_routes_hidden: RouteObject[] = [
        { path: "login", element: <LoginPage setUser={setUser} /> },
        { path: "register", element: <RegisterPage /> },
    ];

    const auth_routes: RouteObject[] = [
        { path: "profile/:userId", element: <ProfilePage user={user} /> },
        { path: "lists/:listId", element: <UserMoviesListPage user={user} /> },
    ];

    const routes: RouteObject[] = [
        { path: "/", element: <MoviesMainPage user={user} /> },
        { path: "movies", element: <MoviesMainPage user={user} /> },
        { path: "movies/:movieId", element: <Movie user={user} /> },
        { path: "person/:personId", element: <Person /> },
        { path: "*", element: <NotFound /> },

        ...(sessionExists ? [] : auth_routes_hidden),
        ...(sessionExists ? auth_routes : []),
    ];

    const router = createBrowserRouter(routes);

    return (
        <div className="container" style={{ maxWidth: "1000px" }}>
            <NavBar user={user} />
            <RouterProvider router={router} />
            <Footer />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    // <React.StrictMode>
        <App />
    // </React.StrictMode>
);
