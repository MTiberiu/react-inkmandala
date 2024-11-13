import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import printJS from 'print-js';

const Page: React.FC = () => {
    const { slug } = useParams<{ slug: string }>(); // Get slug from the URL
    const [page, setPage] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const handlePrintPDF = (featured_image: string) => {
        printJS({
            printable: featured_image,
            type: 'image',
            style: `
            @page { margin: 0; }
    img {
      width: 100%;
      margin: 0;
      display: block;
      padding: 0;
    }
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
  `
        });
    };



    useEffect(() => {
        const apiBaseUrl = import.meta.env.VITE_API_URL;

        fetch(`${apiBaseUrl}/pages/page/${slug}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch book page');
                }
                return response.json();
            })
            .then(data => {
                setPage(data);
                console.log('Page data:', data);
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

    return (
        <div>
            <Link to="/">Home</Link>
            <div className="single-book">
            <h1>{page.title}</h1>
            <div>
                <div style={{ width: '100%', maxWidth: '620px' }}>
                        {page.featured_image && (
                            <img
                                width="100%"
                                height="auto"
                                src={page.featured_image}
                                alt={page.title}
                            />
                        )}
                 </div>
                <div dangerouslySetInnerHTML={{ __html: page.content }} />
                <button onClick={() => handlePrintPDF(page.featured_image)}>Printeaza Page</button>
            </div>
                {/* Add other book page details here */}
            </div>
        </div>
    );
};

export default Page;
