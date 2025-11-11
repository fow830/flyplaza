#!/bin/bash

# FlyPlaza - GitHub Setup Script
# Этот скрипт поможет быстро создать и загрузить проект на GitHub

echo "🚀 FlyPlaza GitHub Setup"
echo "========================"
echo ""
echo "📋 Шаг 1: Создайте репозиторий на GitHub"
echo "   1. Откройте: https://github.com/new"
echo "   2. Название: flyplaza"
echo "   3. Описание: Platform for finding the cheapest flight tickets ✈️"
echo "   4. Выберите: Public"
echo "   5. НЕ добавляйте README, .gitignore или лицензию"
echo "   6. Нажмите 'Create repository'"
echo ""
echo "📋 Шаг 2: Введите ваш GitHub username:"
read -p "GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Ошибка: username не может быть пустым"
    exit 1
fi

echo ""
echo "🔗 Добавляю remote origin..."
git remote add origin "https://github.com/$GITHUB_USERNAME/flyplaza.git"

echo "📤 Отправляю код на GitHub..."
git push -u origin flyplaza

echo ""
echo "✅ Готово! Проект доступен по адресу:"
echo "   https://github.com/$GITHUB_USERNAME/flyplaza"
echo ""
echo "🌟 Дополнительные команды:"
echo "   git remote -v              # Проверить remote"
echo "   git log --oneline          # История коммитов"
echo "   git branch -a              # Список веток"

