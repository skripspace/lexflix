/* LEXFLIX service worker. Halaman selalu dari jaringan lebih dulu agar pembaruan langsung terlihat;
   salinan tersimpan dipakai saat tanpa sinyal. Artwork disimpan saat pertama dipakai. Data API tidak pernah disimpan di sini. */
var NAMA = 'lexflix-v25';
var AWAL = ["./","assets/app-5QLUV5SH.js","assets/app-GQA5CU6X.css","manifest.webmanifest","icons/lexflix-192.png"];
self.addEventListener('install', function (ev) {
  self.skipWaiting();
  ev.waitUntil(caches.open(NAMA).then(function (c) { return c.addAll(AWAL); }).catch(function () {}));
});
// Model verifikasi wajah (±8 MB) disimpan di cache tersendiri yang tidak ikut dibuang saat situs diperbarui (alamatnya berversi: wajah/v1/).
var WAJAH = 'lexflix-wajah-v1';
self.addEventListener('activate', function (ev) {
  ev.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return n !== NAMA && n !== WAJAH; }).map(function (n) { return caches.delete(n); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (ev) {
  var r = ev.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  var jalur = u.pathname.replace(self.registration.scope.replace(self.location.origin, '').replace(/\/$/, ''), '');
  if (/^\/wajah\//.test(jalur)) {
    ev.respondWith(caches.open(WAJAH).then(function (c) { return c.match(r).then(function (x) { return x || fetch(r).then(function (j) { if (j && j.status === 200) c.put(r, j.clone()); return j; }); }); }));
    return;
  }
  var statis = /^\/(art|icons|assets)\//.test(jalur);
  if (statis) {
    ev.respondWith(caches.match(r).then(function (x) {
      return x || fetch(r).then(function (j) { if (j && j.status === 200) { var s = j.clone(); caches.open(NAMA).then(function (c) { c.put(r, s); }); } return j; });
    }));
    return;
  }
  ev.respondWith((r.mode === 'navigate' ? fetch(r.url, { cache: 'no-store' }) : fetch(r)).then(function (j) {
    if (j && j.status === 200) { var s = j.clone(); caches.open(NAMA).then(function (c) { c.put(r, s); }); }
    return j;
  }).catch(function () { return caches.match(r).then(function (x) { return x || (r.mode === 'navigate' ? caches.match('./') : Response.error()); }); }));
});
