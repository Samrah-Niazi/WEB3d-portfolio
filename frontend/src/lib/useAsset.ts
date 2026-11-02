import { useEffect, useState } from "react";

// true / false once checked, null while the check is still running.
// Dev and static hosts answer missing files with index.html, so a text/html response means "not there".
export function useAssetStatus(url: string): boolean | null {
  const [exists, setExists] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    fetch(url, { method: "HEAD" })
      .then((r) => live && setExists(r.ok && !(r.headers.get("content-type") ?? "").includes("text/html")))
      .catch(() => live && setExists(false));
    return () => {
      live = false;
    };
  }, [url]);
  return exists;
}

// True when a file exists in /public.
export function useAsset(url: string): boolean {
  return useAssetStatus(url) === true;
}
