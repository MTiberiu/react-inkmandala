import { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import { PagesDTO } from '../types/AllPages'

const Books = () => {
    const [books, setBooks] = useState<PagesDTO[]>([])

    useEffect(() => {

        const apiBaseUrl = import.meta.env.VITE_API_URL;

        fetch(`${apiBaseUrl}/books`)
            .then((response) => response.json())
            .then((data) => {
                setBooks(data.data)
                console.log('data', data)
            })

    }, [])

    return (
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
        </section>
    )
}

export default Books;