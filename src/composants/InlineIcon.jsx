const paths = {
  "fa-anchor": ["M12 5v16m-6-8a6 6 0 0 0 12 0M5 11H2l3 3 3-3H5m14 0h3l-3 3-3-3h3", "M9 5a3 3 0 1 0 6 0 3 3 0 0 0-6 0"],
  "fa-arrow-left": ["M19 12H5m7 7-7-7 7-7"],
  "fa-arrow-right": ["M5 12h14m-7-7 7 7-7 7"],
  "fa-arrow-right-to-bracket": ["M10 17l5-5-5-5m5 5H3", "M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"],
  "fa-arrow-up-right-from-square": ["M14 4h6v6m0-6-9 9", "M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"],
  "fa-arrows-rotate": ["M20 7v5h-5", "M4 17v-5h5", "M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3"],
  "fa-ban": ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "m5 5 14 14"],
  "fa-bell": ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4"],
  "fa-bell-slash": ["M18 8a6 6 0 0 0-9-5", "M6 8c0 7-3 7-3 9h15", "m2 2 20 20", "M10 21h4"],
  "fa-bolt": ["m13 2-3 9h7L9 22l2-9H4z"],
  "fa-calendar": ["M4 5h16v16H4z", "M8 3v4m8-4v4M4 10h16"],
  "fa-calendar-clock": ["M4 5h16v16H4z", "M8 3v4m8-4v4M4 10h16", "M12 14v3l2 1"],
  "fa-calendar-days": ["M4 5h16v16H4z", "M8 3v4m8-4v4M4 10h16", "M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"],
  "fa-chart-line": ["M3 3v18h18", "m7 14 4-4 4 3 6-7"],
  "fa-check": ["m5 12 4 4L19 6"],
  "fa-check-double": ["m2 12 4 4L16 6", "m9 12 4 4 9-10"],
  "fa-chevron-down": ["m6 9 6 6 6-6"],
  "fa-chevron-left": ["m15 18-6-6 6-6"],
  "fa-chevron-right": ["m9 18 6-6-6-6"],
  "fa-circle-check": ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "m7 12 3 3 7-7"],
  "fa-circle-exclamation": ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M12 8v5m0 4h.01"],
  "fa-circle-info": ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M12 11v5m0-9h.01"],
  "fa-circle-question": ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M9.5 9a2.5 2.5 0 1 1 4.7 1.2c-.8 1.1-2.2 1.2-2.2 3.3m0 3h.01"],
  "fa-clipboard-check": ["M9 5h6l1 2h3v14H5V7h3l1-2", "m8 14 2.5 2.5L16 11"],
  "fa-clipboard-list": ["M9 5h6l1 2h3v14H5V7h3l1-2", "M9 12h6m-6 4h6"],
  "fa-clock-rotate-left": ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5", "M12 7v5l3 2"],
  "fa-code-branch": ["M6 3v12a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V9", "M12 9l4-4 4 4", "M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4", "M16 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4", "M16 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4"],
  "fa-coins": ["M12 7c4 0 7-1.3 7-3s-3-3-7-3-7 1.3-7 3 3 3 7 3", "M5 4v5c0 1.7 3 3 7 3s7-1.3 7-3V4", "M5 9v5c0 1.7 3 3 7 3", "M19 9v3", "M17 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
  "fa-download": ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5M12 15V3"],
  "fa-eye": ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6"],
  "fa-file-circle-exclamation": ["M13 3H6v18h12v-8", "M13 3v6h6", "M19 14v3m0 3h.01"],
  "fa-file-circle-plus": ["M13 3H6v18h12v-8", "M13 3v6h6", "M16 17h6m-3-3v6"],
  "fa-file-contract": ["M6 3h8l4 4v14H6z", "M14 3v5h5", "M9 12h6m-6 3h6m-6 3h3"],
  "fa-file-csv": ["M6 3h8l4 4v14H6z", "M14 3v5h5", "M9 12h6m-6 3h6m-6 3h4"],
  "fa-file-import": ["M13 3H6v18h12v-8", "M13 3v6h6", "M12 18H4m4-4-4 4 4 4"],
  "fa-file-lines": ["M6 3h8l4 4v14H6z", "M14 3v5h5", "M9 12h6m-6 3h6m-6 3h6"],
  "fa-file-pdf": ["M6 3h8l4 4v14H6z", "M14 3v5h5", "M9 17c2-4 3-7 4-7s0 6 3 6c1 0 2-1 3-2"],
  "fa-file-pen": ["M6 3h8l4 4v6", "M14 3v5h5", "M6 3v18h7", "m14 18 5-5 2 2-5 5-3 1z"],
  "fa-file-signature": ["M6 3h8l4 4v6", "M14 3v5h5", "M6 3v18h7", "m13 17 2-2 3 3-2 2-4 1z"],
  "fa-filter": ["M4 5h16l-6 7v6l-4 2v-8z"],
  "fa-floppy-disk": ["M5 3h12l4 4v14H3V3z", "M7 3v6h10V3", "M7 21v-8h10v8"],
  "fa-folder-open": ["M3 6h7l2 2h9v11H3z", "m3 14 2-3h15l1 3"],
  "fa-folder-tree": ["M3 6h7l2 2h9v12H3z", "M8 12v5m0-3h4m0-2v5m4-3h2"],
  "fa-gauge-high": ["M4 18a9 9 0 1 1 16 0", "M12 13l5-5", "M12 18h.01"],
  "fa-hourglass-half": ["M6 3h12M6 21h12M7 3c0 5 5 5 5 9s-5 4-5 9m10-18c0 5-5 5-5 9s5 4 5 9"],
  "fa-id-card": ["M3 5h18v14H3z", "M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4", "M5 16a3 3 0 0 1 6 0m3-6h4m-4 4h4"],
  "fa-key": ["M21 2 11 12", "M7 14a5 5 0 1 0 0 10 5 5 0 0 0 0-10", "m14 9 3 3m-6 0 3 3"],
  "fa-layer-group": ["m12 3 9 5-9 5-9-5z", "m3 12 9 5 9-5", "m3 16 9 5 9-5"],
  "fa-list-check": ["M10 6h10M10 12h10M10 18h10", "m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2"],
  "fa-lock": ["M5 11h14v10H5z", "M8 11V7a4 4 0 0 1 8 0v4", "M12 15v2"],
  "fa-magnifying-glass": ["M21 21l-4.3-4.3", "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14"],
  "fa-paper-plane": ["m22 2-7 20-4-9-9-4z", "M22 2 11 13"],
  "fa-pen": ["m15 5 4 4M4 20l4-.8L20 7a2.8 2.8 0 0 0-4-4L4 15z"],
  "fa-pen-to-square": ["M13 5H5v15h15v-8", "m15 4 5 5M10 14l8-8 3 3-8 8-4 1z"],
  "fa-plus": ["M12 5v14m-7-7h14"],
  "fa-right-to-bracket": ["M10 17l5-5-5-5m5 5H3", "M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"],
  "fa-rotate": ["M20 7v5h-5", "M4 17v-5h5", "M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3"],
  "fa-rotate-right": ["M20 7v5h-5", "M4 17v-5h5", "M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3"],
  "fa-scale-balanced": ["M12 3v18m-7 0h14M5 6h14", "m5 6-3 7h6z", "m19 6-3 7h6z", "M8 13a3 3 0 0 0 6 0"],
  "fa-screwdriver-wrench": ["m14 7 3-3a5 5 0 0 0-6 6L4 17a2 2 0 0 0 3 3l7-7a5 5 0 0 0 6-6l-3 3z"],
  "fa-shield-halved": ["M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11", "M12 2v20"],
  "fa-spinner": ["M20 12a8 8 0 1 1-2.34-5.66"],
  "fa-stamp": ["M8 14h8l2 5H6z", "M9 14V9a3 3 0 1 1 6 0v5", "M5 21h14"],
  "fa-table-columns": ["M4 4h16v16H4z", "M12 4v16", "M7 8h2m-2 4h2m6-4h2m-2 4h2"],
  "fa-trash": ["M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6", "M10 11v6m4-6v6"],
  "fa-trash-can": ["M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6", "M10 11v6m4-6v6"],
  "fa-triangle-exclamation": ["m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2 2 0 0 0-4 0z", "M12 9v4m0 4h.01"],
  "fa-upload": ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5m5-5v12"],
  "fa-user-gear": ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M4 21a8 8 0 0 1 12-7", "M18 16v2m0 4v-2m-3-1h2m4 0h2m-5-4 1.5 1.5m3 3L22 23m0-7-1.5 1.5m-3 3L16 22"],
  "fa-users": ["M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6", "M17 10a2.5 2.5 0 1 0 0-5", "M3 20a6 6 0 0 1 12 0", "M16 14a5 5 0 0 1 5 5"],
  "fa-wand-magic-sparkles": ["m15 4 1-3m4 7 3-1m-7 7 1 3", "m3 21 11-11", "m5 5 1 2 2 1-2 1-1 2-1-2-2-1 2-1z"],
  "fa-xmark": ["m18 6-12 12M6 6l12 12"],
};

export default function InlineIcon({ className = "", ...props }) {
  const classes = className.split(/\s+/).filter(Boolean);
  const name = classes.find((token) =>
    token.startsWith("fa-") && !["fa-solid", "fa-regular", "fa-brands", "fa-spin"].includes(token),
  );
  const decorativeClasses = classes.filter((token) => !token.startsWith("fa-"));
  const spin = classes.includes("fa-spin");
  const iconPaths = paths[name] || paths["fa-circle-info"];

  return (
    <i className={`inline-fa-icon ${decorativeClasses.join(" ")}`.trim()} aria-hidden="true" {...props}>
      <svg
        viewBox="0 0 24 24"
        className={spin ? "inline-fa-icon-spin" : undefined}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        {iconPaths.map((path, index) => <path d={path} key={`${name}-${index}`} />)}
      </svg>
    </i>
  );
}
