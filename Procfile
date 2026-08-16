web: export APP_URL=https://$RAILWAY_PUBLIC_DOMAIN && mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache && php artisan migrate --force && php artisan storage:link && php -d upload_max_filesize=20M -d post_max_size=25M -d max_execution_time=120 -d max_input_time=120 artisan serve --host=0.0.0.0 --port=$PORT
worker: php artisan queue:work --tries=3 --timeout=90
