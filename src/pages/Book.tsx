import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

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
        <div className="single-book">
            <h1>{book.title}</h1>
            {book.featured_image && (
                <img src={book.featured_image} alt={book.title} />
            )}
            <div dangerouslySetInnerHTML={{ __html: book.content }} />
        </div>
    );
};

export default Book;
