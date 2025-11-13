#!/bin/bash
# Скрипт для коммита изменений в STAGE

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 КОММИТ В STAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверяем, что мы на stage
current_branch=$(git branch --show-current)
if [ "$current_branch" != "stage" ]; then
    echo "⚠️  Переключаемся на stage..."
    git checkout stage
fi

# Проверяем наличие изменений
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Нет изменений для коммита"
    exit 0
fi

# Показываем изменения
echo "📋 Измененные файлы:"
git status --short
echo ""

# Запрашиваем сообщение коммита
read -p "✍️  Введите сообщение коммита: " commit_message

if [ -z "$commit_message" ]; then
    echo "❌ Сообщение коммита не может быть пустым"
    exit 1
fi

echo ""
echo "✅ Добавляем изменения..."
git add -A

echo "✅ Коммитим..."
git commit -m "$commit_message"

echo "✅ Отправляем в GitHub (origin/stage)..."
git push origin stage

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ГОТОВО! Изменения закоммичены в STAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Следующий шаг: Проверьте стабильность"
echo "Если все ок, запустите: ./merge-to-production.sh"
echo ""

