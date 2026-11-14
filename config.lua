Config = {}

-- 'auto' (deteksi otomatis), 'qbox', 'qb', atau 'standalone'
Config.Framework = 'auto'

Config.Interval        = 250    -- ms, update HUD saat jalan kaki
Config.VehicleInterval = 100    -- ms, update HUD saat di kendaraan
Config.SpeedUnit       = 'kmh'  -- 'kmh' atau 'mph'
Config.Command         = 'hud'          -- sembunyikan/tampilkan HUD
Config.SettingsCommand = 'hudsettings'  -- buka panel pengaturan HUD
Config.SettingsKey     = 'F11'             -- isi mis. 'F10' kalau mau pakai tombol

-- Stamina (kotak biru paling kanan di bar status)
-- mode = 'used'      : bar bertambah saat lari, turun lagi saat istirahat
-- mode = 'remaining' : bar berkurang saat lari (sisa stamina), naik lagi saat istirahat
Config.Stamina = {
    mode = 'used',
}

-- Sistem stres bawaan HUD. Stres naik saat menembak & ngebut, turun pelan saat santai.
-- QBox / qb-core: nilainya ditulis ke metadata.stress pemain (server yang menyimpan).
-- Standalone: disimpan lokal di HUD. HUD sebelumnya hanya MEMBACA stres, makanya tidak pernah naik.
-- Matikan dengan enabled = false kalau stres sudah diurus script lain (mis. qb-hud).
Config.Stress = {
    enabled = true,
    shooting = { chance = 40, min = 1, max = 3, cooldown = 1000 },    -- chance = % per tembakan (dengan cooldown ms)
    speeding = { speed = 110, min = 1, max = 2, interval = 5000 },    -- speed dalam km/h, hanya saat jadi pengemudi
    relief   = { enabled = true, amount = 1, interval = 15000, idle = 20000 }, -- turun tiap interval ms setelah idle ms tanpa pemicu
    compat   = true, -- terima event hud:server:GainStress / RelieveStress (gaya qb-hud) dari script lain
}

-- Seatbelt (tombol B). Ikon sabuk muncul di speedometer saat sabuk terpasang.
-- builtin = false : HUD cuma MEMBACA status dari script seatbelt-mu (statebag / event, lihat README)
-- builtin = true  : HUD yang menangani tombol B sendiri (matikan script seatbelt lain biar tidak dobel)
Config.Seatbelt = {
    builtin  = false,
    key      = 'B',          -- dipakai kalau builtin = true
    statebag = 'seatbelt',   -- nama statebag pemain yang dibaca (LocalPlayer.state.seatbelt)
}

-- Minimap kustom (file di folder stream/: minimap.gfx, minimap.ytd + mask .ytd)
-- shape: 'circle' (circlemap.ytd) atau 'square' (squaremap.ytd)
-- Posisi = { x, y, lebar, tinggi } relatif ke kiri-bawah layar. Ubah sedikit-sedikit sampai pas.
Config.Minimap = {
    enabled = true,
    shape   = 'square',
    size    = 1.2,   -- pengali ukuran dasar minimap (1.0 = asli). Pemain tetap bisa atur lagi di /hudsettings

    shapes = {
        circle = {
            dict     = 'circlemap',
            clipType = 1,
            minimap  = { -0.0100, -0.0300, 0.1800, 0.2580 },
            mask     = {  0.2000,  0.0000, 0.0650, 0.2000 },
            blur     = {  0.0000, -0.0300, 0.2660, 0.2370 },
        },
        square = {
            dict     = 'squaremap',
            clipType = 0,
            minimap  = { -0.0045, -0.0245, 0.1500, 0.1889 },
            mask     = {  0.0200,  0.0320, 0.1110, 0.1590 },
            blur     = { -0.0300,  0.0220, 0.2660, 0.2370 },
        },
    },
}

-- Logo di paling atas panel info pemain (kanan-atas)
-- url: link gambar (https://...), atau nama file lokal di web/dist (mis. 'logo.png'), kosong = pakai teks
-- Pemain juga bisa menimpa link ini lewat /hudsettings > Logo URL
Config.Logo = {
    enabled = true,
    url     = 'https://r2.fivemanage.com/TZ6VDvzhsSJNodFKhwPom/logo.gif',          -- contoh: 'https://i.imgur.com/xxxx.png'
    text    = '',   -- dipakai kalau url kosong / gagal dimuat
    height  = 40,          -- tinggi logo (px)
}
