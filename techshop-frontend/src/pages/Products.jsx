import { useEffect, useState } from "react";
import productApi from "../api/productApi";
import categoryApi from "../api/categoryApi";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category") || "";

  useEffect(() => {
    categoryApi.getAll().then((r) => setCategories(r.data || []));
  }, []);

  useEffect(() => {
    productApi
      .getAll({ page: 0, size: 12 })
      .then((r) => setProducts(r.data?.content || []));
  }, []);

  useEffect(() => {
    const params = { page: 0, size: 12 };

    const fetch = search
      ? productApi.search(search, params)
      : categoryId
        ? productApi.getByCategory(categoryId, params)
        : productApi.getAll(params);

    fetch.then((r) => setProducts(r.data?.content || []));
  }, [search, categoryId]);

  return (
    <div>
      <h1>Products</h1>
      <p>{products.length} items</p>
      <input placeholder="Search..." />
      <select>
        {categories.map((c) => (
          <option key={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
