const CACHE_NAME = "budget-planner-v6"; // Увеличена версия для принудительного обновления
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  // Иконки
  "./icons/icon-192.jpg",
  "./icons/icon-512.jpg",
  // Внешние библиотеки
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js",
];

// Установка: кэшируем все основные ресурсы
self.addEventListener("install", (event) => {
  console.log("SW: Установка. Кэширование оболочки...");
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Активация: удаляем старые версии кэша
self.addEventListener("activate", (event) => {
  console.log("SW: Активация. Удаление старых кэшей...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("SW: Удаление старого кэша:", cacheNameName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Обработка запросов: Стратегия "Cache, falling back to Network"
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
