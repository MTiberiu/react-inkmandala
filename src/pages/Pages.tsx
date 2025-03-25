import { useEffect, useState } from 'react';
import MetaHead from '../components/metaHead/MetaHead';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import { PagesDTO } from '../types/AllPages';
import Pagination from '../components/ui/Pagination';

const Pages = () => {
  const [pages, setPages] = useState<PagesDTO[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1); // Stare pentru totalul paginilor
  const [perPage] = useState<number>(20);  // Număr de posturi pe pagină
  const [notFound, setNotFound] = useState(false);

  // Folosim useSearchParams pentru a citi și actualiza parametrii din URL
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10); // Extragem pagina curentă din URL sau 1 dacă nu e setată

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    // Fetch datele pentru pagina curentă
    fetch(`${apiBaseUrl}/pages?page=${currentPage}&per_page=${perPage}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Page not found');
        }
        return response.json();
      })
      .then((data) => {
        setPages(data.data);
        setTotalPages(data.total_pages);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setNotFound(false); // reset dacă revenim la o pagină validă
      })
      .catch((error) => {
        console.error(error);
        setNotFound(true); // setăm flag de 404
      });
  }, [currentPage]); // Re-fetch datele când se schimbă pagina curentă




  const canonical = currentPage === 1
    ? 'https://inkmandala.com/pages'
    : `https://inkmandala.com/pages?page=${currentPage}`;

  console.log("pages", pages)
  console.log("pages", totalPages)
  const Pages = () => {
    return (
      <>
        <MetaHead title="Mandala Coloring Pages" canonical={canonical} seoTitle='Free pdf printable sheets to color' />
        <section>
          <div className="book-list">
            <ul className="cards">
              {pages.map((page) => (
                <li key={page.id} className="card-item">
                  <Card page={page} route="pages/page" />
                </li>
              ))}
            </ul>
          </div>

          {/* Butoane de paginare */}
          <div className="pagination-controls">

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setSearchParams({ page: page.toString() })}
            />
          </div>
        </section>
      </>
    )
  }
  const NotFound = () => {
    return (
      <section>
        <div className="not-found">
          <h2>404 - Page Not Found</h2>
          <p>No results found for this page.</p>
        </div>
      </section>
    )
  }
  return (
    notFound ? <NotFound /> : <Pages />
  );
};

export default Pages;
