import React from "react";
import Card from "./ui/Card";

import { PagesDTO } from "../types/AllPages";

interface BookPagesProps {
    bookPages: PagesDTO[]
}
const PagesList: React.FC<BookPagesProps> = ({ bookPages }) => {

    if (!bookPages || bookPages.length === 0) {
        return <p>No book pages found.</p>;
    }

    return (
        <div className="book-list">
            <h2>Latest Books</h2>
            <ul className="cards">
                {bookPages.map((book) => {
                    return (
                        <li key={book.id} className="card-item">
                            <Card page={book} route="pages/page"/>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default PagesList;

