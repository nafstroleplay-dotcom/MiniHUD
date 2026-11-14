fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'minihud'
description 'HUD gelap-emas (QBox / qb-core / standalone), NUI dibangun dengan Vite'
version '2.1.0'

shared_script 'config.lua'
client_scripts {
    'client/bridge.lua',
    'client/minimap.lua',
    'client/main.lua',
}
server_script 'server/main.lua'

ui_page 'web/dist/index.html'

files {
    'web/dist/index.html',
    'web/dist/assets/*',
    'web/dist/logo.*',
}
