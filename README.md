# Multi Screen Preview (Yan Ekran)

Bir site adresini yazarsın; site aynı anda **masaüstü**, **telefon** ve **tablet** görünümüyle yan yana açılır. Web sitesi yaparken "mobilde nasıl görünüyor?" sorusunu tek pencerede cevaplar.

*English: a small Electron app that opens any website side by side in desktop, phone and tablet viewports, so you can check responsive layouts in one window.*

## Özellikler

- Üç panel yan yana: masaüstü, telefon, tablet. İstediğini açıp kapatabilirsin.
- Masaüstü paneli gerçek masaüstü genişliğinde (varsayılan 1440) çizilir ve panele sığacak kadar küçültülür; site tablet düzenine düşmez.
- Telefon ve tablet mobil tarayıcı gibi davranır (mobil kullanıcı kimliği, dokunmatik, mobil viewport).
- Hazır cihaz boyutları ve **özel boyut** (en × boy) seçimi. Seçimin hatırlanır.
- **Eşitle:** Ana (mavi çerçeveli) panelde gezdiğin sayfa diğer panellerde de açılır.
- Telefon ve tableti yatay / dikey çevirme.
- Giriş yaptığın oturum paneller arasında paylaşılır.

## Kurulum

[Node.js](https://nodejs.org) kurulu olmalı.

```bash
git clone https://github.com/ristaycraft-tr/multi-screen-preview.git
cd multi-screen-preview
npm install
npm start
```

Windows'ta `baslat.bat` dosyasına çift tıklamak da yeterli; ilk seferde paketi kendisi kurar.

## Kullanım

1. Üstteki kutuya adresi yaz (`example.com` gibi) ve Enter'a bas. Adres değilse Google araması yapar.
2. Panellerin başlığındaki listeden cihaz boyutunu seç, istersen "Özel boyut…" ile kendi ölçünü yaz.
3. Geri / ileri ana panele göre çalışır, yenile açık tüm panelleri yeniler.

## Dosyalar

| Dosya | Görevi |
| --- | --- |
| `main.js` | Pencere ve mobil cihaz taklidi |
| `preload.js` | Güvenli köprü |
| `index.html`, `styles.css`, `renderer.js` | Arayüz |

## Notlar

- Siteler mobil/tablet düzenini genellikle ekran genişliğine ve tarayıcı kimliğine bakarak seçer; ikisi de bu uygulamada ayarlıdır. Gerçek cihazdaki her ayrıntıyı (özel yazı tipleri, cihaza özgü hatalar) birebir yansıtmayabilir.
- Yalnızca `http` ve `https` adresleri açılır.

## Lisans

[MIT](LICENSE)
