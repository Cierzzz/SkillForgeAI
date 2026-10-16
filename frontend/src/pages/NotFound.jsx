import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div className="notfound">
      <div className="code">404</div>
      <h1>That page does not exist</h1>
      <p>The link may be old, or the page may have moved. Nothing was leaked — there is nothing here to find.</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <Link to={user ? '/dashboard' : '/'} className="btn btn-primary">
          {user ? 'Back to dashboard' : 'Back to home'}
        </Link>
        {!user && (
          <Link to="/login" className="btn">
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}