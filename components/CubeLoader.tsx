import React from 'react';

export const CubeLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid grid-cols-3 gap-1 w-16 h-16 rotate-45">
        {[...Array(9)].map((_, i) => (
          <div 
            key={i}
            className="w-full h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] animate-cube-build"
            style={{ 
              animationDelay: `${i * 0.15}s`,
              opacity: 0 
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes cube-build {
          0% { opacity: 0; transform: scale(0) translateZ(0); }
          20% { opacity: 1; transform: scale(1) translateZ(0); }
          50% { opacity: 1; transform: scale(1) translateZ(20px); background-color: #2dd4bf; } /* Teal pulse */
          80% { opacity: 1; transform: scale(1) translateZ(0); }
          100% { opacity: 0; transform: scale(0) translateZ(0); }
        }
        .animate-cube-build {
          animation: cube-build 2.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};