// components/TopBar.jsx
export default function TopBar() {
  return (
    <div className="w-full">
      {/* Top sale line - constrained to page width and centered */}
      <div className="bg-pink-100 text-center py-2 text-xs sm:text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4">
          <span className="text-yellow-500">✨</span>
          <span className="font-semibold mx-2">SALE! SALE! SALE!</span>
          <span className="text-yellow-500">✨</span>
        </div>
      </div>

      {/* Free shipping line - constrained to page width and centered */}
      <div className="bg-orange-50 text-center py-2 text-xs sm:text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4">
          ✨ Free Shipping on Orders Above ₹599 ✨
        </div>
      </div>
    </div>
  );
}
