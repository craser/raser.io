import { Html, Head, Main, NextScript } from 'next/document'
import { THEME_BOOT_SCRIPT } from '@/lib/theme/themes'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Applies a stored theme before first paint, so it doesn't flash the default. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}/>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
