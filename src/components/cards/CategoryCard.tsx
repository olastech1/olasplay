import { Link } from "react-router-dom";
import { Category } from "@/types/music";

interface CategoryCardProps {
  category: Category;
}

const gradients = [
  "from-primary to-secondary",
  "from-secondary to-accent",
  "from-accent to-primary",
  "from-primary/80 to-accent/80",
  "from-secondary/80 to-primary/80",
  "from-accent/80 to-secondary/80",
];

const CategoryCard = ({ category }: CategoryCardProps) => {
  const randomGradient = gradients[Math.abs(category.name.charCodeAt(0)) % gradients.length];

  return (
    <Link
      to={`/category/${category.slug}`}
      className="relative overflow-hidden rounded-2xl p-6 group hover-lift"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${randomGradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
      <div className="absolute inset-0 bg-noise opacity-30" />
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
        <p className="text-sm text-foreground/80 mt-1">
          {category.songCount.toLocaleString()} songs
        </p>
      </div>
    </Link>
  );
};

export default CategoryCard;
