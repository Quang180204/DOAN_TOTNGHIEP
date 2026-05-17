export interface Product {
  product_id: number;
  product_name: string;
  price: number;
  image: string;
  description: string;
}

export interface HomeData {
  laptop: Product[];
  accessory: Product[];
}