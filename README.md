# TheaterOfTheTags
Shared management of tag-based data




# WS service

Requires installation outside of node:
```sh
apt install y-websocket-server
```

start with a command like:
```sh
PORT=1234 /usr/bin/y-websocket-server
```

in the dev environment, this script should be started by npm according to package.json .

## .env

The .env file needs to tell the front-end where to find the ws service.

a local deployment should also find the ws service at localhost, and have its port match the PORT env variable set in the command that started y-websocket-server

```
VITE_YJS_WS_URL=ws://localhost:1234
```

in contrast, a demo or production server needs to find the ws server at its url

```
VITE_YJS_WS_URL=wss://tags.avomath.com/yjs
```

# nginx

If you don't have a cert yet, start with an nginx file like this

```
server {
    listen 80;
    server_name tags.avomath.com/;

    location /.well-known/acme-challenge/ {
            root /var/www/html;
    }

    location / {
      return 301 https://$host$request_uri ;
    }
}
```

Then once the certificate is installed, start the actual page

```
server {
    listen 443 ssl http2;
    server_name tags.avomath.com/;

    ssl_certificate /etc/letsencrypt/live/tags.avomath.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tags.avomath.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /yjs/ {
        proxy_pass http://localhost:1234/;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
    }
}
```

That setup should connect standard-port traffic from the browser to the http and ws services started by npm.
