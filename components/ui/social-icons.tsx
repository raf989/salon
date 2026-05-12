import type { SVGProps } from "react";

// Inline SVGs for Instagram and TikTok. We don't pull these from lucide-react
// because lucide ships variants whose stroke widths and proportions don't
// match the rest of the app's icon language. These match the dashboard
// profile card and the public provider profile sidebar.

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-3.5"
      aria-hidden
      {...props}
    >
      <path d="M19.6 7.7a5.7 5.7 0 0 1-3.7-1.4 5.6 5.6 0 0 1-1.8-3.1h-3v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V10a5.6 5.6 0 0 0-.8-.1 5.6 5.6 0 1 0 5.6 5.6V9.4a8.6 8.6 0 0 0 5.5 1.9V8.4c-0.3 0-.7-.1-1 .1V7.7Z" />
    </svg>
  );
}

export function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-3.5"
      aria-hidden
      {...props}
    >
      <path d="M20.7 4 2.9 10.9c-1 .4-1 1.7 0 2l4.4 1.4 1.7 5.4c.2.7 1 .9 1.5.4l2.4-2.2 4.3 3.2c.6.4 1.4.1 1.6-.6l3-13.1c.2-.9-.7-1.7-1.5-1.4ZM10.1 14.7l-.2 3.4-1.3-4.2 8.7-5.5-7.2 6.3Z" />
    </svg>
  );
}
