#!/bin/bash
# Скрипт для мержа из STAGE в PRODUCTION

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 МЕРЖ: stage → production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Спрашиваем подтверждение
read -p "⚠️  Вы уверены, что stage стабилен? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Отменено"
    exit 0
fi

echo "✅ Переключаемся на production..."
git checkout production

echo "✅ Мержим изменения из stage..."
git merge stage --no-edit

echo "✅ Отправляем в GitHub (origin/production)..."
git push origin production

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ГОТОВО! Изменения добавлены в PRODUCTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Следующий шаг: Деплой на сервер"
echo "Запустите: ./deploy-to-server.sh"
echo ""

# Возвращаемся на stage
git checkout stage

