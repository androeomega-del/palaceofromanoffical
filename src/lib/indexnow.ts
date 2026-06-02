// IndexNow — single ping submits multiple URLs to Bing, Yandex, Seznam, Naver.
// Google doesn't participate, but Bing-indexed pages still ship usable signals.
// Key file must be hosted at https://<host>/<key>.txt returning the key as body.

export const INDEXNOW_KEY = "9e80e9bed6f10d24fa31be6356050d31";
export const INDEXNOW_HOST = "palaceofromanofficial.com";
export const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;

export async function submitIndexNow(urls: string[]): Promise<{
  ok: boolean;
  status: number;
  submitted: number;
  body: string;
}> {
  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList: urls,
    }),
  });
  const body = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, submitted: urls.length, body };
}
