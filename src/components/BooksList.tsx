import React from "react";
import { PagesDTO } from "../types/AllPages";
import Card from "./ui/Card";

// Define props interface for BookList
interface BookListProps {
    books: PagesDTO[];  // books is an array of Pages
}

const BooksList: React.FC<BookListProps> = ({ books }) => {
    // Handle case where there are no books
    if (!books || books.length === 0) {
        return <p>No books found.</p>;
    }

    return (
        <div className="book-list">
            <h2>Latest Books</h2>
            <ul className="cards">
                {books.map((book) => {
                    return (
                        <li key={book.id} className="card-item">
                            <Card page={book} route="books/book" />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default BooksList;
