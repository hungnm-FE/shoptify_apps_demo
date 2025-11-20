#!/bin/bash

#########################################
# CONFIG — sửa 3 dòng này theo của bạn
#########################################

APP_DIR="shopify-app"
REPO_URL="https://github.com/your/repo.git"
DOMAIN="app.yourdomain.com"
PORT=3000

#########################################
echo "=== 1. UPDATE SERVER & INSTALL DEPENDENCIES ==="
#########################################
sudo apt update -y
sudo apt install -y git nginx nodejs npm certbot python3-certbot-nginx

#########################################
echo "=== 2. CLONE OR PULL SOURCE ==="
#########################################

if [ -d "$APP_DIR" ]; then
  echo "Folder $APP_DIR exists → pulling latest code..."
  cd "$APP_DIR"
  git pull
else
  echo "Cloning project..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

#########################################
echo "=== 3. INSTALL NODE MODULES ==="
#########################################
npm install

#########################################
echo "=== 4. PRISMA MIGRATE ==="
#########################################
npx prisma db push

#########################################
echo "=== 5. BUILD APP ==="
#########################################
npm run build

#########################################
echo "=== 6. START PM2 PROCESS ==="
#########################################
sudo npm install -g pm2
pm2 delete shopify-app 2>/dev/null
pm2 start "npm run start" --name shopify-app
pm2 save

#########################################
echo "=== 7. CONFIGURE NGINX ==="
#########################################

NGINX_CONF="/etc/nginx/sites-available/shopify-app"

sudo bash -c "cat > $NGINX_CONF" << EOL
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/shopify-app
sudo nginx -t
sudo systemctl reload nginx

#########################################
echo "=== 8. SSL WITH CERTBOT ==="
#########################################
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m youremail@domain.com

#########################################
echo "=== DONE ==="
echo "Your Shopify App is live at: https://$DOMAIN"
#########################################
