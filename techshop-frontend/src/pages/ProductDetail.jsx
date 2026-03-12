import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import productApi from "../api/productApi";
import reviewApi from "../api/reviewApi";
import useCartStore from "../store/cartStore";
import { useAuth } from "../store/AuthContext";
import { toast } from "react-toastify";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart } = useCartStore();
  const [qty, setQty] = useState(1);

  const price = product.salePrice || product.price;

  const handleAddToCart = async () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập");
      nav("/login");
      return;
    }

    await addToCart({
      productId: product.id,
      productName: product.name,
      unitPrice: price,
      quantity: qty,
    });

    toast.success("Đã thêm vào giỏ hàng!");
  };

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
        <div>
          <p>{price}₫</p>

          <div>
            <button onClick={() => setQty(qty - 1)}>-</button>
            <span>{qty}</span>
            <button onClick={() => setQty(qty + 1)}>+</button>
          </div>

          <button onClick={handleAddToCart}>Thêm vào giỏ</button>
        </div>
      </div>
    </div>
  );
}
