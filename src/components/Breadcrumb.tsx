import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

export interface BreadcrumbSegment {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbSegment[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`mb-6 flex flex-wrap items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 ${className ?? ""}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && <FaChevronRight size={10} className="text-gray-400 dark:text-gray-600" />}
            {isLast || !item.to ? (
              <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
            ) : (
              <Link
                to={item.to}
                className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
