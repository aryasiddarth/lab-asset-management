import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div>
      <h1>404 - Page not found</h1>
      <p>
        <Link to="/">Go back to dashboard</Link>
      </p>
    </div>
  );
}

export default NotFoundPage;
