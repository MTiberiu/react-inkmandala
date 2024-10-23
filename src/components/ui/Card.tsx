import React from 'react'
import { Link } from 'react-router-dom';
import { PagesDTO } from '../../types/AllPages';

interface PageProps {
    page: PagesDTO;
    route:string;
}
const Card:React.FC<PageProps> = ({page, route}) => {
    const {title,featured_image, slug } = page;

  return (
    <Link  to={`/${route}/${slug}`}>
    <div className="card">
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
    </div>
    </Link>
  )
}

export default Card;