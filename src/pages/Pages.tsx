import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import Card from '../components/ui/Card';
import { PagesDTO } from '../types/AllPages';

const Pages = () => {
    const [pages, setPages] = useState<PagesDTO[]>([]);
    const [totalPages, setTotalPages] = useState<number>(1); // Stare pentru totalul paginilor
    const [perPage] = useState<number>(2);  // Număr de posturi pe pagină

    // Folosim useSearchParams pentru a citi și actualiza parametrii din URL
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10); // Extragem pagina curentă din URL sau 1 dacă nu e setată

    useEffect(() => {
        const apiBaseUrl = import.meta.env.VITE_API_URL;

        // Fetch datele pentru pagina curentă
        fetch(`${apiBaseUrl}/pages?page=${currentPage}&per_page=${perPage}`)
            .then((response) => response.json())
            .then((data) => {
                setPages(data.data);
                setTotalPages(data.total_pages); // Setăm numărul total de pagini din răspunsul API
            });
    }, [currentPage]); // Re-fetch datele când se schimbă pagina curentă

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setSearchParams({ page: (currentPage + 1).toString() }); // Actualizăm URL-ul pentru pagina următoare
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setSearchParams({ page: (currentPage - 1).toString() }); // Actualizăm URL-ul pentru pagina anterioară
        }
    };

    return (
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
                <button onClick={goToPreviousPage} disabled={currentPage === 1}>
                    Previous
                </button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <button onClick={goToNextPage} disabled={currentPage === totalPages}>
                    Next
                </button>
            </div>
        </section>
    );
};

export default Pages;
