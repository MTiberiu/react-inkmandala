import { Helmet } from "react-helmet-async";

interface HeadProps {
  title: string;
  seoTitle?: string;
  canonical: string;
}

function MetaHead ({title, seoTitle, canonical}: HeadProps) {
return (
  <Helmet>
    <meta charSet="utf-8" />
    <title>{title} - {seoTitle}</title>
    <link rel="canonical" href={canonical} />
  </Helmet>
)
}
export default MetaHead;