import { useEffect, useState } from "react";
import productApi from "../api/productApi";
import categoryApi from "../api/categoryApi";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryApi.getAll().then((r) => setCategories(r.data || []));
  }, []);

  useEffect(() => {
    productApi
      .getAll({ page: 0, size: 12 })
      .then((r) => setProducts(r.data?.content || []));
  }, []);

  return (
    <div>
      <h1>Products</h1>
      <p>{products.length} items</p>
    </div>
  );
}
