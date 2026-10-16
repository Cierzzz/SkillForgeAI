/** Inline SVG icons - no icon font, no external request (nothing to scrape). */
const Svg = ({ children, size = 20, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
    {children}
  </svg>
);

export const IconHome = (p) => (<Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></Svg>);
export const IconQuiz = (p) => (<Svg {...p}><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5" /></Svg>);
export const IconChat = (p) => (<Svg {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z" /></Svg>);
export const IconResume = (p) => (<Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></Svg>);
export const IconTrends = (p) => (<Svg {...p}><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5M12 16V8M16 16v-3" /></Svg>);
export const IconUser = (p) => (<Svg {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></Svg>);
export const IconShield = (p) => (<Svg {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="m9 12 2 2 4-4" /></Svg>);
export const IconSpark = (p) => (<Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></Svg>);
export const IconLock = (p) => (<Svg {...p}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Svg>);
export const IconRefresh = (p) => (<Svg {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></Svg>);
export const IconLogout = (p) => (<Svg {...p}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M15 16l4-4-4-4M19 12H9" /></Svg>);
export const IconDownload = (p) => (<Svg {...p}><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 21h16" /></Svg>);
export const IconCopy = (p) => (<Svg {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></Svg>);
export const IconPrint = (p) => (<Svg {...p}><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v7H6z" /></Svg>);
export const IconPlus = (p) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);
export const IconTrash = (p) => (<Svg {...p}><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6 7l1 13h10l1-13" /></Svg>);
export const IconSend = (p) => (<Svg {...p}><path d="M4 12 20 4l-4 16-4-7z" /><path d="m12 13 8-9" /></Svg>);
export const IconCheck = (p) => (<Svg {...p}><path d="m5 13 4 4L19 7" /></Svg>);
export const IconAlert = (p) => (<Svg {...p}><path d="M12 8v5M12 17h.01" /><circle cx="12" cy="12" r="9" /></Svg>);
export const IconKey = (p) => (<Svg {...p}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8 3 3-2 2-2-2-2 2" /></Svg>);
export const IconMenu = (p) => (<Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>);
export const IconEye = (p) => (<Svg {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Svg>);
export const IconTarget = (p) => (<Svg {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></Svg>);
export const IconBrain = (p) => (<Svg {...p}><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0V7a3 3 0 0 0-3-3Z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 0" /></Svg>);