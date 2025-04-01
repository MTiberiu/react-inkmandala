import React, { useState, useEffect } from 'react';
import MetaHead from '../components/metaHead/MetaHead';
import { useParams } from 'react-router-dom';
import { usePrint } from '../contexts/PrintContext';
import './Page.css';
import onepx from '../assets/1px.png'; // 
import CanvasWrapper from "../components/colorapp/CanvasWrapper";
import ControlsPanel from "../components/colorapp/ControlsPanel"


const Page: React.FC = () => {
  const { slug } = useParams<{ slug: string }>(); // Get slug from the URL
  const [page, setPage] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { handlePrintPDF } = usePrint();

  const [effects, setEffects] = useState({
    pulse: false,
    ripple: false
  })

  function handlePrint() {
    handlePrintPDF(page.print_image)
  }
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
    return (
      <>
        <div>
          <div className="single-book">
            <h1 className="loading-skeleton loading-title">Loading</h1>
            <div className="loading-skeleton loading-image img-container">
              <img
                width="100%"
                height="auto"
                src={onepx}
                alt="Loading"
              />

            </div>
            <div className='actions'>
              <button onClick={() => handlePrint()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-printer"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" /><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" /><path d="M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" /></svg></button>
              <button><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-file-type-png"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M20 15h-1a2 2 0 0 0 -2 2v2a2 2 0 0 0 2 2h1v-3" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M11 21v-6l3 6v-6" /></svg></button>
              <button onClick={() => handlePrint()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-file-type-pdf"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M17 18h2" /><path d="M20 15h-3v6" /><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /></svg></button>

            </div>
          </div>
        </div>
      </>
    );
  }

  if (!page) {
    return <p>Book page not found.</p>;
  }
  function downloadFile() {
    window.open(page.print_image)
  }

  const canonical = `https://inkmandala.com/pages/page/${page.slug}`
  return (
    <>
      <MetaHead title={page.title}  canonical={canonical} seoTitle='Mandala Coloring Page - Free pdf printable sheet to color'/>
      <ControlsPanel effects={effects} setEffects={setEffects} />
      <div style={{ width: '100%', height: '100vh' }}>
      <CanvasWrapper imageUrl={page.featured_image_sizes["1536x1536"]} effects={effects} />
    </div>
      <div>
        <div className="single-book">
          <h1>{page.title}</h1>
          <div className="img-container">
            {page.featured_image && (
              <img
                width="100%"
                height="auto"
                src={page.featured_image}
                alt={page.title}
              />
            )}
          </div>
          <div style={{ maxWidth: '420px' }} dangerouslySetInnerHTML={{ __html: page.excerpt }} />
          <div className='actions'>
            <button onClick={() => handlePrint()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-printer"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" /><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" /><path d="M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" /></svg></button>
            <button onClick={() => downloadFile()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-file-type-png"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M20 15h-1a2 2 0 0 0 -2 2v2a2 2 0 0 0 2 2h1v-3" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M11 21v-6l3 6v-6" /></svg></button>
            <button onClick={() => handlePrint()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-file-type-pdf"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M17 18h2" /><path d="M20 15h-3v6" /><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /></svg></button>
          </div>

          {/* Add other book page details here */}
        </div>
      </div>
    </>
  );
};

export default Page;
