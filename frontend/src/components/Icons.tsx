import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
    </Icon>
  )
}

export function SproutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4-3-7-8-7 0 4 3 7 8 7z" />
      <path d="M12 14c0-4 3-7 8-7 0 4-3 7-8 7z" />
    </Icon>
  )
}

export function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 21V5" />
      <path d="M9 8h6" />
    </Icon>
  )
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="m8 12 3 3 5-6" />
    </Icon>
  )
}

export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </Icon>
  )
}
