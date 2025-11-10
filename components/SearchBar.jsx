"use client";

import { useCallback } from "react";

export default function SearchBar({
  value = "",
  onChange = () => {},
  placeholder = "Search products...",
}) {
  // ✅ Wrap in useCallback to prevent unnecessary re-renders
  const handleInput = useCallback(
    (e) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="w-full">
      <input
        type="search"
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        aria-label="Search products"
        className="
          w-full px-4 py-2 rounded-md border border-gray-300
          focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1
          placeholder:text-gray-400 text-sm sm:text-base bg-white
        "
        enterKeyHint="search"
        autoComplete="off"
      />
    </div>
  );
}
