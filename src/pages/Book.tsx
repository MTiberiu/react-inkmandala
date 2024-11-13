import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import { PagesDTO } from "../types/AllPages";
import printJS from 'print-js';
import './Book.css'

const Book: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [book, setBook] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const handlePrintAllPDF = (images: string[]) => {
        // Creează un HTML temporar
        const printHTML = images.map((src: string) => `
          <div class="page-container">
            <img src="${src}" />
          </div>
        `).join('');
      
        // Folosește printJS pentru a printa HTML-ul
        printJS({
          printable: printHTML,
          type: 'raw-html',
          style: `
            @page { margin: 0; }
            @media print {
              body, html {
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
              }
              .page-container {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background-color: red;
                overflow: hidden;
              }
              img {
                display: block;
                width: 100%;
                height: auto;
                page-break-after: always;
              }
            }
          `,
        });
      };
      
function printAllPages() {
    const allPages = book.related_pages.map((relatedBook: PagesDTO) => relatedBook.print_image)
    console.log("all pages",allPages)
    handlePrintAllPDF(allPages)
}
    useEffect(() => {
        const apiBaseUrl = import.meta.env.VITE_API_URL;

        fetch(`${apiBaseUrl}/books/book/${slug}`)
            .then((response) => response.json())
            .then((data) => {
                setBook(data);
                console.log("Book data:", data);
                printAllPages()
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching book:", error);
                setLoading(false);
            });
    }, [slug]);

    if (loading) return <p>Loading book details...</p>;
    if (!book) return <p>Book not found.</p>;

    return (
        <>
            <div className="single-book">
                <h1>{book.title}</h1>
                {book.featured_image && (
                    <div style={{ width: '100%', maxWidth: '620px' }}>
                        <div className="card-img">
                            <img src={book.featured_image} alt={book.title} className="card-thumbnail" />
                        </div>
                    </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: book.content }} />
                <button onClick={() => printAllPages()}>Printeaza Page</button>

            </div>
            <section>
                <div className="book-list">
                    <ul className="cards">
                        {book.related_pages.map((relatedBook: PagesDTO) => (
                            <li key={relatedBook.id} className="card-item">
                                    <Card page={relatedBook} route="pages/page" />
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    );
};

export default Book;
