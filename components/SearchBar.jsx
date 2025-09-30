"use client";

export default function SearchBar({ value, onChange, placeholder = "Search products..." }) {
  return (
    <div className="w-full">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200"
        aria-label="Search products"
      />
    </div>
  );
}
