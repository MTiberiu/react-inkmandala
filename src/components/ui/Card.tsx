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
      <div className='button-container'>
        {print_image ? <button onClick={handlePrint}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-printer"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" /><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" /><path d="M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" /></svg></button> : null}
      </div>
    </div>
   
  )
}

export default Card;