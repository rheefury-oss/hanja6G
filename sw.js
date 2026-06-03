// ── 버전을 올리면 모든 기기의 캐시가 강제 갱신됩니다 ──
const CACHE = 'hanja-quiz-v2';
const STATIC = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // 아이콘·manifest만 미리 캐싱 (index.html은 네트워크 우선이므로 제외)
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // 이전 버전 캐시 전부 삭제
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const isNavigate = e.request.mode === 'navigate' ||
                     new URL(e.request.url).pathname.endsWith('.html');

  if (isNavigate) {
    // ── HTML: 네트워크 우선 → 오프라인 시 캐시 폴백 ──
    // index.html은 항상 서버에서 최신본을 가져오고, 가져온 결과를 캐시에 저장
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // ── 정적 파일(아이콘·manifest): 캐시 우선 → 없으면 네트워크 ──
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
