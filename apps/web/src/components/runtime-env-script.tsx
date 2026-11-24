import { connection } from 'next/server';
import { RUNTIME_ENV_ELEMENT_ID, serverRuntimeEnv } from '@/utils/runtimeEnv';

// Publishes the per-instance origins to the browser as a JSON script data block.
// It renders before any bundle script, so a client module reading runtimeEnv() at
// import time can read and cache `#__ITSAPLAN_ENV__` directly from the DOM.
// Using `type="application/json"` satisfies React 19's `isScriptDataBlock`, so
// client-side rendering never emits the `<script>` warning/error.
// `connection()` keeps the values out of a prerender: a page rendered at build time
// would carry the building machine's environment into the HTML.
// `<` is escaped because the JSON is written into an inline script element, where a
// `</script>` inside a value would end the element.
export function RuntimeEnvDataScript() {
  const json = JSON.stringify(serverRuntimeEnv()).replace(/</g, '\\u003c');
  return (
    <script
      id={RUNTIME_ENV_ELEMENT_ID}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default async function RuntimeEnvScript() {
  await connection();
  return <RuntimeEnvDataScript />;
}
