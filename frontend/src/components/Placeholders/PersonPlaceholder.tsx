export default function PersonPlaceholder() {
    return (
        <div className="row d-flex ">
            <div className="col-4">
                <div className="col-12 mt-5 mb-4 fw-normal placeholder-glow">
                    <span
                        className="placeholder col-12"
                        style={{ height: "448px" }}
                    />
                </div>

                <p className="placeholder-glow">
                    <span className="placeholder col-12" />
                </p>
                <p className="placeholder-glow">
                    <span className="placeholder col-12" />
                </p>
            </div>
            <div className="col-8 my-5">
                <h2 className="mb-4 placeholder-glow">
                    <span className="placeholder col-6" />
                </h2>
                <p className="placeholder-glow">
                    <span
                        className="placeholder col-12"
                        style={{ height: "200px" }}
                    />
                </p>
            </div>
        </div>
    );
}
