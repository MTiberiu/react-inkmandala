import { Helmet } from "react-helmet-async";

interface HeadProps {
  title: string;
  seoTitle?: string;
}

function MetaHead ({title, seoTitle}: HeadProps) {
return (
  <Helmet>
    <meta charSet="utf-8" />
    <title>{title} - {seoTitle}</title>
  </Helmet>
)
}
export default MetaHead;