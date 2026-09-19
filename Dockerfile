FROM php:8.3-apache

# Enable Apache rewrite rules for the existing .htaccess
RUN a2enmod rewrite \
    && sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Let Dokploy env vars reach PHP (e.g. OVITEC_ADMIN_PASSWORD)
RUN echo 'PassEnv OVITEC_ADMIN_PASSWORD\nPassEnv OVITEC_DATA_DIR' > /etc/apache2/conf-available/ovitec-env.conf \
    && a2enconf ovitec-env

WORKDIR /var/www/html

# Copy the entire website
COPY . /var/www/html/

# Make the directories writable by Apache/PHP
RUN mkdir -p /var/www/html/data /var/www/html/uploads/products \
    && chown -R www-data:www-data /var/www/html/data /var/www/html/uploads

EXPOSE 80
