import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import { PagesDTO } from "../types/AllPages";

const Book: React.FC = () => {
    const { slug } = useParams<{ slug: string }>(); // Extract slug from the URL
    const [book, setBook] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const apiBaseUrl = import.meta.env.VITE_API_URL;

        // Fetch the book by slug, not by query string
        fetch(`${apiBaseUrl}/books/book/${slug}`)
            .then((response) => response.json())
            .then((data) => {
                console.log("data", data)
                setBook(data); // Use the first result
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching book:", error);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return <p>Loading book details...</p>;
    }

    if (!book) {
        return <p>Book not found.</p>;
    }
    return (
        <>
        <div className="single-book">
            <h1>{book.title}</h1>
            {book.featured_image && (
                <div style={{width:'100%', maxWidth:'620px'}}>
                <div className="card-img">
                    <img
                        src={book.featured_image}
                        alt={book.title}
                        className="card-thumbnail"
                    />
                </div>
                </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: book.content }} />
        </div>
        <section>

            <div className="book-list">
                <ul className="cards">
                    {book.related_pages.map((relatedBook: PagesDTO) => {
                        return (
                            <li key={relatedBook.id} className="card-item">
                                <Card page={relatedBook} route="pages/page" />
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
        </>
    );
};

export default Book;
