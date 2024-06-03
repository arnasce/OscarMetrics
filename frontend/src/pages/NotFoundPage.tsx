import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";

export default function NotFoundPage() {
    return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="text-center row">
                <p className="fs-3">
                    <span className="text-danger">Oops!</span> Page not found.
                </p>
                <p className="lead">
                    The page you’re looking for doesn’t exist.
                </p>
                <div className="d-flex justify-content-center">
                    <a href="/" className="btn btn-outline-dark">
                        <FontAwesomeIcon icon={faHouse} />
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
}
