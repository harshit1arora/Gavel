import React from "react";
import { Link } from "react-router-dom";

export const LogoStatic = () => {
  return (
    <Link to="/" className="flex items-center gap-2 group cursor-pointer z-50">
      <svg
        viewBox="0 0 100 100"
        className="w-7 h-7 rounded-[4px] transition-transform group-hover:scale-110 duration-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" fill="#FF5C00" />
        <polygon points="50,15 80.3,68 19.7,68" fill="#1A1C1E" />
        <polygon points="16.9,73 83.1,73 90,85 10,85" fill="#1A1C1E" />
      </svg>
      <span className="font-['DM_Sans'] font-semibold text-[17px] tracking-normal text-indigo-700 dark:text-indigo-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-300">Gavel</span>
    </Link>
  );
};
