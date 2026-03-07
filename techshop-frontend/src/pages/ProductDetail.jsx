import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import productApi from "../api/productApi";
import reviewApi from "../api/reviewApi";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productApi.getById(id),
      reviewApi.getByProduct(id),
      reviewApi.getRating(id),
    ])
      .then(([pRes, rRes, ratRes]) => {
        setProduct(pRes.data);
        setReviews(rRes.data || []);
        setRating(ratRes.data || {});
      })
      .catch(() => nav("/products"))
      .finally(() => setLoading(false));
  }, [id]);

  i; // thêm vào phần loading
  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <img src={product.imageUrl} alt={product.name} />
        </div>

        <div>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
        </div>
      </div>
    </div>
  );
}
