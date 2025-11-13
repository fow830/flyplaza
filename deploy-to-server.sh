#!/usr/bin/expect -f

set timeout 600
set server "31.130.147.54"
set password "di5DZhVMh@56k."

puts "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
puts "🚀 ДЕПЛОЙ НА СЕРВЕР: production → flyplaza.ru"
puts "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

# Проверяем, что локально мы на production
set local_branch [exec git branch --show-current]
if {$local_branch ne "production"} {
    puts "⚠️  Переключаемся на ветку production локально..."
    exec git checkout production
}

puts "📦 Шаг 1/5: Подключение к серверу...\n"

spawn ssh root@$server

expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    "# " {
        puts "✅ Подключено к серверу\n"
        
        puts "📦 Шаг 2/5: Переход в директорию проекта...\n"
        send "cd /root || mkdir -p /root\r"
        expect "# "
        
        # Проверяем наличие проекта
        send "if \[\[ -d flyplaza \]\]; then echo 'EXISTS'; else echo 'NOT_EXISTS'; fi\r"
        expect {
            "EXISTS" {
                puts "✅ Проект найден\n"
                expect "# "
                send "cd flyplaza\r"
                expect "# "
                
                puts "📦 Шаг 3/5: Получение обновлений из GitHub (ветка production)...\n"
                send "git fetch origin\r"
                expect "# "
                send "git checkout production\r"
                expect "# "
                send "git pull origin production\r"
                expect "# "
                puts "✅ Код обновлен\n"
            }
            "NOT_EXISTS" {
                puts "📦 Проект не найден, клонируем с GitHub...\n"
                expect "# "
                send "git clone -b production https://github.com/fow830/flyplaza.git\r"
                expect "# "
                send "cd flyplaza\r"
                expect "# "
                puts "✅ Проект склонирован\n"
            }
        }
        
        puts "📦 Шаг 4/5: Пересборка Docker-образа...\n"
        send "docker-compose down\r"
        expect "# "
        send "docker-compose build\r"
        expect "# "
        puts "✅ Образ собран\n"
        
        puts "📦 Шаг 5/5: Запуск контейнера...\n"
        send "docker-compose up -d\r"
        expect "# "
        puts "✅ Контейнер запущен\n"
        
        puts "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        puts "✅ ДЕПЛОЙ ЗАВЕРШЕН!"
        puts "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        puts "\n🌐 Сайт доступен: https://flyplaza.ru\n"
        
        send "exit\r"
    }
}

expect eof

# Возвращаемся на stage локально
exec git checkout stage
