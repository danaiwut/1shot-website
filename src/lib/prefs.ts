// Visitor display preferences, applied by an inline script in the root layout before first paint.
// Kept out of the "use client" components so the server layout receives the real strings.

export const THEME_KEY = "1shot-theme";
export const MOTION_KEY = "1shot-motion";

/** Theme: dark-red unless the visitor picked light-red. */
export const THEME_SCRIPT = `try{document.documentElement.dataset.theme=localStorage.getItem("${THEME_KEY}")==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

/** Motion: off if the visitor paused it or the OS asks for reduced motion. */
export const MOTION_SCRIPT = `try{if(localStorage.getItem("${MOTION_KEY}")==="off"||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.motion="off"}catch(e){}`;
