import React from "react";
import { Lock, Unlock } from "lucide-react";

const LoadingSecrets = ({ message = "" }) => {
  return (
    <div className="relative flex flex-col items-center p-8">
      {/* Animated lock icons */}
      <div className="relative w-20 h-20">
        <Lock className="absolute inset-0 w-20 h-20 text-blue-400 animate-pulse" />
        <Unlock className="absolute inset-0 w-20 h-20 text-blue-400 opacity-0 animate-[unlock_2s_ease-in-out_infinite]" />
      </div>
      {/* Loading text */}
      <h2 className="mt-6 text-2xl font-bold text-white animate-pulse">
        {message}
      </h2>
      {/* Animated dots */}
      <div className="flex gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      {/* Circular progress */}
      <div className="mt-8 relative">
        <div className="w-32 h-32 rounded-full border-4 border-gray-700 border-t-blue-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gray-800" />
        </div>
      </div>
    </div>
  );
};

export default LoadingSecrets;
