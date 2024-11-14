import React from 'react'
import { Link } from 'react-router-dom';
import { PagesDTO } from '../../types/AllPages';
import { usePrint } from '../../contexts/PrintContext';

interface PageProps {
    page: PagesDTO;
    route:string;
}
const Card:React.FC<PageProps> = ({page, route}) => {
    const {title, featured_image, print_image, slug } = page;
    const {handlePrintPDF} = usePrint();
    const handlePrint = () => {
        handlePrintPDF(print_image) 
    }

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
      {print_image ? <button onClick={handlePrint}>Printează PDF</button> : null}
    </div>
   
  )
}

export default Card;