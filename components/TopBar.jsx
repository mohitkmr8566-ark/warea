// components/TopBar.jsx
export default function TopBar() {
  return (
    <div className="w-full">
      {/* Sale Banner */}
      <div className="w-full bg-pink-100 text-center py-2 text-xs sm:text-sm font-medium tracking-wide">
        <span className="text-yellow-500">✨</span>
        <span> SALE! SALE! SALE!</span>
        <span className="text-yellow-500">✨</span>
      </div>

      {/* Free Shipping Banner */}
      <div className="w-full bg-orange-50 text-center py-2 text-xs sm:text-sm font-medium tracking-wide">
        ✨ Free Shipping on Orders Above ₹599 ✨
      </div>
    </div>
  );
}
