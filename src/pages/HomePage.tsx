import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import BooksList from "../components/BooksList";
import PagesList from "../components/PagesList";

import { AllPages } from "../types/AllPages";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
  const [allPosts, setAllPosts] = useState<AllPages>({
    data: {
      book_pages: [],
      books: []
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL;
    console.log("apiBaseUrl", apiBaseUrl)

    // Fetch all book pages with embedded media
    fetch(`${apiBaseUrl}/all-posts`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch book pages");
        }

        return response.json();
      })
      .then((data) => {
        setAllPosts(data);

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching book pages:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading book pages...</p>;
  }
  console.log("data", allPosts)
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title> Free Premium Mandala Coloring Books & Pages</title>
        <link rel="canonical" href="https://inkmandala.com" />
      </Helmet>


      <div className="homepage">
        <section>
          <BooksList books={allPosts.data.books} />
        </section>
        <Link to="./books/">More Books </Link>
        <section>
          <PagesList bookPages={allPosts.data.book_pages} />
        </section>
        <Link to="./pages/">More Pages </Link>
      </div>
    </>
  );
};

export default HomePage;
