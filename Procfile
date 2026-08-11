web: export APP_URL=https://$RAILWAY_PUBLIC_DOMAIN && mkdir -p storage/framework/{sessions,views,cache} && php artisan migrate --force && php artisan storage:link && php artisan serve --host=0.0.0.0 --port=$PORT
worker: php artisan queue:work --tries=3 --timeout=90
