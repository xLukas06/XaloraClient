# XaloraClient • The modern client panel for Pterodactyl
All features:

Resource Management (Use it to create servers etc)
Coins (AFK Page Earning, Linkvertise earning)
Renewal (Require coins for renewal)
Coupons (which give resources & coins to a user)
Servers (create, view, and edit servers)
Payments (buy via Stripe)
Login Queue (prevent overload)
User System (auth, regen password, etc)
Store (buy resources with coins)
Dashboard (view resources)
Join for Rewards (join Discord servers for coins).
Admin (set/add/remove coins & resources, create/revoke coupons)
API (for bots & other things)
Install Guide
1. Configuring XaloraClient
Pterodactyl method (easiest)
Warning: You need Pterodactyl already set up on a domain for this method to work

1.1 Upload the file above onto a Pterodactyl NodeJS server Download the egg from Parkervcp's GitHub Repository

1.2 Unarchive the file and set the server to use NodeJS 16

Direct method
1.1 Install Node.js 16 or newer, it's recommended to install it with nvm :

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
reopen a new ssh session (e.g., restart putty)
nvm install 16
check the node version with node -v and switch between versions with nvm use <version>
1.2 Download XaloraClient files in /var/www/XaloraClient :

git clone https://github.com/XaloraLabs/XaloraClient.git /var/www/XaloraClient
1.3 Installing required node modules (and build dependencies to avoid errors) :

apt-get update && apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev build-essential
cd /var/www/XaloraClient && npm i
After configuring settings.json, to start the server, use node index.js
To run in the background, use PM2 (see PM2 section)

2. Setting up webserver
2.1 Rename exemple_settings.json to settings.json and configure settings.json (specify panel domain/apikey and discord auth settings for it to work)

2.2 Start the server (Ignore the 2 strange errors that might come up)

2.3 Login to your DNS manager, point the domain you want your dashboard to be hosted on to your VPS IP address. (Example: dashboard.domain.com 192.168.0.1)

2.4 Run apt install nginx && apt install certbot on the vps

2.5 Run ufw allow 80 and ufw allow 443 on the vps

2.6 Run certbot certonly -d <Your XaloraClient Domain> then do 1 and put your email

2.7 Run nano /etc/nginx/sites-enabled/XaloraClient.conf

2.8 Paste the configuration at the bottom of this and replace with the IP of the pterodactyl server including the port and with the domain you want your dashboard to be hosted on.

2.9 Run systemctl restart nginx and try open your domain.

Updating ⚠️
From Heliactyl or Dashactyl v0.4 to Xalora:

Store certain information such as your api keys, discord auth settings, etc in a .txt file or somewhere safe
Download database.sqlite (This is the Database which includes important data about the user and servers)
Delete all files in the directory of the server (or delete and remake the folder if done in ssh)
Upload the latest Xalora release and unzip it
Upload database.sqlite and reconfigure config.toml
Move to a newer Xalora release:

Delete everything except settings.yml, database.sqlite
Upload the latest XaloraClient release and unzip it
reconfigure settings.json and upload your old database.sqlite
All done now start XaloraClient again
Running in background and on startup
Installing pm2:

Run npm install pm2 -g on the vps
Starting the Dashboard in Background:

Change directory to your XaloraClient folder Using cd command, Example: cd /var/www/xalora
To run xalora, use pm2 start index.js --name "Xalora"
To view logs, run pm2 logs Xalora
Making the dashboard runs on startup:

Make sure your dashboard is running in the background with the help of pm2
You can check if Xalora is running in background with pm2 list
Once you confirmed that Xalora is running in background, you can create a startup script by running pm2 startup and pm2 save
Note: Supported init systems are systemd, upstart, launchd, rc.d
To stop your Xalora from running in the background, use pm2 unstartup
To stop a currently running Xalora instance, use pm2 stop Xalora

Credits
1.1 Our backend is heavily inspired by Heliactyl, and we extend our gratitude to their team for their exceptional work.

Explore Heliactyl: https://github.com/OpenHeliactyl/Heliactyl/

Nginx Proxy Config
