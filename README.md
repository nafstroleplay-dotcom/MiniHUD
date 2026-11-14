# minihud

HUD gelap-emas. Jalan di QBox, qb-core, atau standalone (deteksi otomatis lewat Config.Framework).
NUI dibangun dengan Vite (vanilla JS).

## Pasang
1. Taruh folder `minihud` di `resources/`.
2. Build NUI:
   cd resources/minihud/web
   npm install
   npm run build
3. Tambahkan `ensure minihud` di server.cfg (setelah framework kamu).

## Framework
- QBox / qb-core: job, cash, bank, lapar, haus, stres dibaca otomatis.
- Standalone: lapar/haus 100 dan stres 0 secara default; job & uang disembunyikan.
  Isi dari script lain lewat export:
    exports.minihud:SetStatus('hunger', 80)   -- hunger | thirst | stress
    exports.minihud:SetInfo({ job = 'Polisi - Sersan', cash = 500, bank = 12000 })
  Kamu bisa menyembunyikan tile lapar/haus/stres lewat /hudsettings.

## Stres
Stres dihitung HUD sendiri (Config.Stress di config.lua): naik saat menembak dan ngebut sebagai pengemudi,
turun pelan saat santai. QBox/qb-core: ditulis ke metadata.stress. Kalau qb-hud masih jalan, matikan salah satunya.

## Pratinjau di browser
cd web && npm run dev -> http://localhost:5173 (tekan S untuk panel pengaturan)

## Pemakaian
- /hud           sembunyikan/tampilkan HUD
- /hudsettings   panel pengaturan (gaya status, visibilitas, elemen)
- Atur command, satuan, framework di config.lua.
- Radio & mic membaca state pma-voice; bensin membaca state.fuel (ox_fuel) atau native.
- Kalau ikon tabrakan dengan minimap, ubah --map-right di web/src/style.css.

## Minimap kustom
File di `stream/` (minimap.gfx, minimap.ytd, circlemap.ytd, squaremap.ytd) otomatis di-stream oleh resource ini.
`client/minimap.lua` memasang mask `radarmasksm` dari .ytd sesuai bentuk yang dipilih dan mengatur posisinya.
- Pilih bentuk lewat Config.Minimap.shape: 'circle' (default) atau 'square'.
- Atur posisi/ukuran tiap bentuk di Config.Minimap.shapes (config.lua). Matikan dengan enabled = false.
- Kalau minimap tidak berubah sama sekali, cek F8 untuk pesan "gagal dimuat".
- Kalau pill street/radio tabrakan dengan minimap, ubah --map-right (style.css) dan .loc bottom.

## Seatbelt (ikon di speedometer)
Ikon sabuk muncul di baris bawah speedometer (sebelum gigi) saat sabuk terpasang, hilang saat dilepas.
- Default `Config.Seatbelt.builtin = false`: HUD hanya membaca status dari script seatbelt-mu, lewat statebag
  `LocalPlayer.state.seatbelt` (nama diatur di `Config.Seatbelt.statebag`) atau event `seatbelt:client:ToggleSeatbelt`
  (boleh membawa argumen true/false).
- Kalau script seatbelt-mu memakai cara lain, panggil `TriggerEvent('seatbelt:client:ToggleSeatbelt', true/false)` dari sana.
- `builtin = true`: HUD memasang tombol B sendiri (ubah di `Config.Seatbelt.key`); matikan script seatbelt lain supaya tidak dobel.

## Stamina (kotak biru paling kanan di bar status)
Menggantikan kotak oksigen. Nilainya dari stamina lari pemain.
- `Config.Stamina.mode = 'used'` (default): bar bertambah saat lari, turun lagi saat istirahat.
- `mode = 'remaining'`: kebalikannya, bar berkurang saat lari (sisa stamina). Kalau arahnya terasa terbalik di game, ganti mode ini.
- Kotak berkedip merah saat sisa stamina sudah hampir habis (<= 15%).
- Toggle tampil/sembunyi ada di /hudsettings > Status visibility.

## Warna & posisi (di /hudsettings)
- Appearance > Accent color: pilih warna aksen (default hijau) atau warna bebas.
- Appearance > Edit HUD layout: geser tiap elemen dengan drag, lalu Done. Reset mengembalikan posisi awal.
  Posisi disimpan per pemain dalam satuan layar (vw/vh), jadi ikut menyesuaikan resolusi.

## Ukuran HUD (di /hudsettings)
- HUD size > All elements: slider 50%-150% untuk memperbesar/memperkecil semua elemen sekaligus.
- Slider per elemen (Server info, Street & compass, Radio & mic, Status, Speedometer) untuk atur sendiri-sendiri.
  Ukuran akhir = All elements x slider elemen. Tombol Reset mengembalikan semuanya ke 100%.
- Minimap punya slider sendiri (HUD size > Minimap), ukuran akhir = All elements x slider Minimap x Config.Minimap.size. Pill Street dan Radio/mic ikut menyesuaikan ukurannya (posisinya tetap, geser sendiri kalau perlu).
- Minimap bisa digeser: /hudsettings > Edit HUD layout, lalu seret kotak "Minimap" (muncul hanya di mode edit). Posisi baru diterapkan ke minimap asli saat kotak dilepas. Reset mengembalikan ke posisi awal.
- Tiap elemen membesar/mengecil dari sisi tempat dia menempel (kanan-atas, kiri-bawah, tengah-bawah, dst), jadi tidak lari dari pojoknya.
- Disimpan per pemain (localStorage NUI), sama seperti warna & posisi.

## Logo (paling atas panel info pemain)
- Atur di config.lua > Config.Logo: `url` (link gambar https://..., atau nama file lokal), `text` (cadangan), `height`, `enabled`.
- File lokal: taruh mis. `logo.png` di `web/dist/` lalu isi `url = 'logo.png'` (sudah masuk `files` di fxmanifest).
- Logo hanya diatur dari config.lua (tidak ada pengaturan ganti logo di /hudsettings); tampil/sembunyi masih bisa lewat HUD elements > Logo.
- Kalau url kosong atau gambar gagal dimuat, yang tampil adalah teks dari `Config.Logo.text`.
- Logo ikut bergerak/berukuran bersama blok Server info (Edit HUD layout & HUD size).

