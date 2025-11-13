#!/bin/bash
# Скрипт для продвижения изменений из local (main) в stage

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 ПРОДВИЖЕНИЕ: local (main) → stage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверяем, что мы на main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  Переключаемся на main..."
    git checkout main
fi

# Проверяем, что нет несохраненных изменений
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Ошибка: Есть несохраненные изменения!"
    echo "Сначала закоммитьте изменения:"
    echo "  git add -A"
    echo "  git commit -m 'your message'"
    exit 1
fi

echo "✅ Переключаемся на stage..."
git checkout stage

echo "✅ Мержим изменения из main..."
git merge main --no-edit

echo "✅ Отправляем в GitHub..."
git push origin stage

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ГОТОВО! Изменения добавлены в STAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Следующий шаг: Проверьте стабильность на stage"
echo "Если все ок, запустите: ./promote-to-production.sh"
echo ""

# Возвращаемся на local (main)
git checkout main
