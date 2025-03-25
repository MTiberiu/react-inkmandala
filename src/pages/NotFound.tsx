import { useLocation, Link } from 'react-router-dom';
import MetaHead from '../components/metaHead/MetaHead';

const NotFound = () => {
  const location = useLocation();
  const canonical = `https://inkmandala.com${location.pathname}`;

  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <MetaHead
        title="Page Not Found - Mandala Coloring Books & Pages"
        canonical={canonical}
        seoTitle="Free pdf printable sheets to color"
      />

      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>

      {/* 🔗 Link către homepage */}
      <Link to="/" style={{ marginTop: '1rem', display: 'inline-block', color: '#007bff' }}>
        Go back to homepage
      </Link>
    </div>
  );
};

export default NotFound;
