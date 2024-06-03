export default function ProfilePlaceholder() {
    return (
        <>
            <div className="card my-4">
                <div     className="card-body">
                    <div className="row align-items-center">
                        <div className="col-3 d-flex justify-content-center ">
                            <div className="text-center placeholder-glow">
                                <span
                                    className="placeholder col-12 rounded-circle"
                                    style={{
                                        height: "150px",
                                        width: "150px",
                                    }}
                                />
                            </div>
                        </div>
                        <div className="col-9 placeholder-glow">
                            <h4
                                className="card-title placeholder col-2"
                                style={{ height: "30px" }}
                            />
                            <div className="card-text my-3">
                                <p className="placeholder-glow">
                                    <span
                                        className="placeholder col-3"
                                        style={{ height: "40px" }}
                                    />
                                </p>

                                <p className="placeholder-glow">
                                    <span
                                        className="placeholder col-12"
                                        style={{ height: "55px" }}
                                    />
                                </p>
                            </div>

                            <a
                                className="btn btn-dark disabled placeholder col-2"
                                aria-disabled="true"
                            ></a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
