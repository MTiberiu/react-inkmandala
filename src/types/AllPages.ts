export interface PagesDTO {
    content:string;
    excerpt:string;
    featured_image:string;
    print_image:string;
    title:string;
    id:number;
    slug:string;
    post_type:string;

}


export interface AllPages {
    data:{
        book_pages: PagesDTO[];
        books: PagesDTO[];
    }

}