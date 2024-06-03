export default function MoviesListPlaceholder() {
    return (
        <div className="mx-auto">
            <div className="card mb-1" style={{ border: "none" }}>
                <div className="row">
                    <div className="col-4 my-5 fw-normal placeholder-glow">
                        <span
                            className="placeholder col-12"
                            style={{ height: "464px" }}
                        ></span>
                    </div>
                    <div className="col-8 my-5">
                        <div className="fs-2 fw-normal placeholder-glow">
                            <span className="placeholder col-7"></span>
                        </div>

                        <div className="mb-1 fw-normal placeholder-glow">
                            <span className="placeholder col-2"></span>
                        </div>

                        <div className="mb-3 fw-normal placeholder-glow">
                            <span className="placeholder col-4"></span>
                        </div>

                        <div className="fw-normal placeholder-glow">
                            <span
                                className="placeholder col-12"
                                style={{ height: "150px" }}
                            ></span>
                        </div>

                        <div className="mt-3 mb-2 placeholder-glow">
                            <span className="placeholder col-3"></span>
                        </div>
                        <div className="mt-1 placeholder-glow">
                            <span className="placeholder col-10"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
