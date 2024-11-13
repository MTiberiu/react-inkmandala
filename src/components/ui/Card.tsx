import React from 'react'
import { Link } from 'react-router-dom';
import { PagesDTO } from '../../types/AllPages';
import printJS from 'print-js';

interface PageProps {
    page: PagesDTO;
    route:string;
}
const Card:React.FC<PageProps> = ({page, route}) => {
    const {title, featured_image, print_image, slug } = page;
    const handlePrintPDF = () => {
        printJS({
          printable: print_image ,
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

  return (

    <div className="card">
            <Link  to={`/${route}/${slug}`}>
      {featured_image && (
        <div className="card-img">
          <img
            src={featured_image}
            alt={title || "Mandala Coloring Page"} 
            className="card-thumbnail"
          />
        </div>
      )}
      <div className="card-details">
        <h3 className="card-title">{title || "Untitled"}</h3>
      </div>
      </Link>
      <button onClick={handlePrintPDF}>Printează PDF</button>
    </div>
   
  )
}

export default Card;