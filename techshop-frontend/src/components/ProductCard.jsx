import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="border p-3 block">
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.price}₫</p>
    </Link>
  );
}
