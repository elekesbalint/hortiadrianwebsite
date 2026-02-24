'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, Suspense } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

function PageViewTracker() {
  const pathname = usePathname()
  useEffect(() => {
    if (!GA_ID || typeof window === 'undefined' || !(window as unknown as { gtag?: (a: string, b: string, c?: object) => void }).gtag) return
    ;(window as unknown as { gtag: (a: string, b: string, c?: object) => void }).gtag('event', 'page_view', { page_path: pathname || '/' })
  }, [pathname])
  return null
}

export function GoogleAnalytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}
