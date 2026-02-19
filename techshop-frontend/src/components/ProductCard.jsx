import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const price = product.salePrice || product.price;
  const originalPrice = product.salePrice ? product.price : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Link to={`/products/${product.id}`} className="border p-3 block">
      <img src={product.imageUrl} alt={product.name} />

      {product.brand && <p>{product.brand}</p>}

      <h3>{product.name}</h3>

      <p>{Number(price).toLocaleString("vi-VN")}₫</p>

      {originalPrice && (
        <p style={{ textDecoration: "line-through" }}>
          {Number(originalPrice).toLocaleString("vi-VN")}₫
        </p>
      )}

      {discount > 0 && <span>-{discount}%</span>}
    </Link>
  );
}
