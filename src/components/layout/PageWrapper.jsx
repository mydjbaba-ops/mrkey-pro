import React from "react";

export default function PageWrapper({ title, children }) {
  return (
    <div className="mx-auto max-w-[480px] px-4 pb-[110px] pt-4">
      {title && (
        <h1 className="mb-4 text-xl font-extrabold tracking-tight text-text-primary">
          {title}
        </h1>
      )}
      {children}
    </div>
  );
}
