import React, { useState, useEffect } from "react";
import MetaHead from "../components/metaHead/MetaHead";
import { useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import { PagesDTO } from "../types/AllPages";
import { usePrint } from "../contexts/PrintContext";
import jsPDF from 'jspdf';
import './Book.css'
import HTMLFlipBook from "react-pageflip";

const Book: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { handlePrintAllPDF } = usePrint();

  const exportImagesToPDF = async () => {
    const allPages = book.related_pages.map((relatedBook: any) => relatedBook.print_image);

    // Creează un document PDF în format A4 (210x297 mm)
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Dimensiunile unei pagini A4 în mm
    const pageWidth = 210;
    const pageHeight = 297;

    for (let i = 0; i < allPages.length; i++) {
      const imgSrc = allPages[i];

      // Creăm un obiect imagine pentru a obține dimensiunile reale ale imaginii
      const img = new Image();
      img.src = imgSrc;

      // Așteptăm încărcarea imaginii pentru a obține dimensiunile sale
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Calculăm proporțiile pentru a păstra aspectul imaginii
      const imgAspectRatio = img.width / img.height;
      const pageAspectRatio = pageWidth / pageHeight;

      let renderWidth, renderHeight, offsetX, offsetY;

      if (imgAspectRatio > pageAspectRatio) {
        // Imaginea este mai lată în raport cu înălțimea paginii
        renderWidth = pageWidth;
        renderHeight = pageWidth / imgAspectRatio;
        offsetX = 0;
        offsetY = (pageHeight - renderHeight) / 2; // Centrează vertical
      } else {
        // Imaginea este mai înaltă în raport cu lățimea paginii
        renderHeight = pageHeight;
        renderWidth = pageHeight * imgAspectRatio;
        offsetX = (pageWidth - renderWidth) / 2; // Centrează orizontal
        offsetY = 0;
      }

      // Adaugă imaginea în PDF cu dimensiuni calculate și centrare
      pdf.addImage(imgSrc, 'JPEG', offsetX, offsetY, renderWidth, renderHeight);

      // Adaugă o pagină nouă dacă mai sunt imagini de adăugat
      if (i < allPages.length - 1) {
        pdf.addPage();
      }
    }

    // Descarcă PDF-ul direct
    pdf.save('imagini_exportate.pdf');
  };


  function printAllPages() {
    const allPages = book.related_pages.map((relatedBook: PagesDTO) => relatedBook.print_image)
    console.log("all pages", allPages)
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
  const canonical = `https://inkmandala.com/books/book/${book.slug}`
  return (
    <>

      <MetaHead title={book.title} canonical={canonical} seoTitle='Printable Mandala coloring book, free pdf book to color' />
      <div className="single-book">
        <h1>{book.title}</h1>
        <HTMLFlipBook
          width={540}
          height={760}
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          size="stretch"
          style={{ margin: '0 auto' }}
          className="my-flipbook"
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={10}
          autoSize={true}
          maxShadowOpacity={1}
          showCover={true}
          mobileScrollSupport={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}

        >
          <div style={{ background: 'white' }}>
            <div className="page" style={{ width: '100%', maxWidth: '640px', background: 'white' }}>
              <div className="card-img">
                <img src={book.featured_image} alt={book.title} className="card-thumbnail" />
              </div>
            </div>
          </div>
          {book.related_pages.flatMap((relatedBook: PagesDTO, index: number) => [
            <div style={{ background: 'white' }}>
              <div key={`${index}-title`} className="page" style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'center', alignContent: 'center', background: 'white' }}>
                <h2 className="page-title" style={{ fontSize: '32px' }}>{relatedBook.title}</h2>
                <p className="page-content" style={{ width: "50%", fontSize: "24px" }}>{relatedBook.excerpt}</p>
              </div>
            </div>,
            <div style={{ background: 'white' }}>
              <div key={`${index}-image`} className="page" style={{ width: '100%', maxWidth: '640px', background: 'white' }}>
                <div className="card-img">
                  <img src={relatedBook.featured_image} alt={book.title} className="card-thumbnail" />
                </div>
              </div>
            </div>

          ])}

        </HTMLFlipBook>
        <div dangerouslySetInnerHTML={{ __html: book.content }} />
        <div className='actions'>
          <button onClick={() => printAllPages()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-printer"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" /><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" /><path d="M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" /></svg></button>
          <button onClick={() => exportImagesToPDF()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-file-type-pdf"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M17 18h2" /><path d="M20 15h-3v6" /><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /></svg></button>
        </div>

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
