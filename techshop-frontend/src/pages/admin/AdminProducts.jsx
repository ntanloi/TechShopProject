import { useEffect, useState } from "react";
import productApi from "../../api/productApi";
import categoryApi from "../../api/categoryApi";
import { Search } from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = () => {
    setLoading(true);
    const req = search
      ? productApi.search(search, { page, size: 10 })
      : productApi.getAll({ page, size: 10 });

    req
      .then((r) => {
        setProducts(r.data?.content || []);
        setTotalPages(r.data?.totalPages || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, search]);
  useEffect(() => {
    categoryApi.getAll().then((r) => setCategories(r.data || []));
  }, []);

  <div>
    <div className="relative max-w-sm">
      <Search className="absolute left-2 top-2 h-4 w-4" />
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>

    <table>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.price}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {Array.from({ length: totalPages }, (_, i) => (
      <button key={i} onClick={() => setPage(i)}>
        {i + 1}
      </button>
    ))}
  </div>;
}
