import { useEffect, useState } from "react";
import productApi from "../../api/productApi";
import categoryApi from "../../api/categoryApi";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    productApi
      .getAll({ page: 0, size: 10 })
      .then((r) => setProducts(r.data?.content || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    categoryApi.getAll().then((r) => setCategories(r.data || []));
  }, []);

  return (
    <div>
      <h1>Admin Products</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        products.map((p) => <div key={p.id}>{p.name}</div>)
      )}
    </div>
  );
}
