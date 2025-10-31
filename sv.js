const CACHE = "budget-v6.1";
const FILES_TO_CACHE = [
  "/Expense-Planner/",
  "/Expense-Planner/index.html",
  "/Expense-Planner/style.css",
  "/Expense-Planner/script.js",
  "/Expense-Planner/manifest.json",
  "/Expense-Planner/icon-192.png",
  "/Expense-Planner/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      if (res) return res;
      return fetch(e.request).catch(() => {
        return caches.match("/Expense-Planner/index.html");
      });
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE) return caches.delete(cache);
        })
      );
    })
  );
  self.clients.claim();
});
