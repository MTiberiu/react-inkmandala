import { useEffect, useState } from 'react'
import MetaHead from '../components/metaHead/MetaHead'
import { useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card'
import { PagesDTO } from '../types/AllPages'
import Pagination from '../components/ui/Pagination'

const Books = () => {
  const [books, setBooks] = useState<PagesDTO[]>([])
  const [totalPages, setTotalPages] = useState<number>(1);
  const [perPage] = useState<number>(20);

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {

    const apiBaseUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiBaseUrl}/books?page=${currentPage}&per_page=${perPage}`)
      .then((response) => response.json())
      .then((data) => {
        setBooks(data.data)
        setTotalPages(data.total_pages);
        console.log('data', data)
      })
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage])

  const canonical = currentPage === 1
  ? 'https://inkmandala.com/books'
  : `https://inkmandala.com/books?page=${currentPage}`;

  return (
    <>
      <MetaHead title="Mandala Coloring Books" canonical={canonical} seoTitle='Free pdf printable books to color' />
      <section>
        <div className="book-list">
          <ul className="cards">
            {books.map((book) => {
              return (
                <li key={book.id} className="card-item">
                  <Card page={book} route="books/book" />
                </li>
              )
            })}
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

export default Books;