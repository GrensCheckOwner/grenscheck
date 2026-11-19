
import {
    ScrollViewStyleReset,
    useServerDocumentContext,
} from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  const {
    headNodes,
    bodyNodes,
    htmlAttributes,
    bodyAttributes,
  } = useServerDocumentContext();

  return (
    <html lang="nl" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3462295623784193"
          crossOrigin="anonymous"
        />

        <ScrollViewStyleReset />
        {headNodes}
      </head>

      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
