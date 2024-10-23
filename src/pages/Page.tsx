import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Page: React.FC = () => {
    const { slug } = useParams<{ slug: string }>(); // Get slug from the URL
    const [page, setPage] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const apiBaseUrl = import.meta.env.VITE_API_URL;

        fetch(`${apiBaseUrl}/pages/page/${slug}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch book page');
                }
                console.log('response', response)
                return response.json();
            })
            .then(data => {
                console.log("data", data)
                setPage(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching book page:', error);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return <p>Loading book page...</p>;
    }

    if (!page) {
        return <p>Book page not found.</p>;
    }
    console.log('bookPage', page)
    return (
        <div className="single-book-page">
            <h1>{page.title}</h1>
            {page.featured_image && (
                <img src={page.featured_image} alt={page.title} />
            )}
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
            {/* Add other book page details here */}
        </div>
    );
};

export default Page;
