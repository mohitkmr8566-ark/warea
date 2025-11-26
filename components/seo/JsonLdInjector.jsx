// components/seo/JsonLdInjector.jsx
import React from "react";

/**
 * jsonld - object or array of objects to be injected as application/ld+json
 * single prop for flexible use across pages
 */
export default function JsonLdInjector({ jsonld }) {
  if (!jsonld) return null;
  // allow either array or single object
  const payload = Array.isArray(jsonld) ? jsonld : [jsonld];
  return (
    <>
      {payload.map((p, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(p) }}
        />
      ))}
    </>
  );
}
