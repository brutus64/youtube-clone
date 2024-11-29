## SSL/TLS Set up:
1. Install Certbot
```
sudo apt-get remove certbot
sudo snap install --classic certbot
```
2. Get Cert
```
sudo certbot certonly --standalone -d thewang.cse356.compas.cs.stonybrook.edu
```
Should Look like:
```
Certificate is saved at: /etc/letsencrypt/live/thewang.cse356.compas.cs.stonybrook.edu/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/thewang.cse356.compas.cs.stonybrook.edu/privkey.pem
This certificate expires on YYYY-MM-DD.
```
3. Setup in docker compose
```
 - /etc/letsencrypt/live:/etc/letsencrypt/live:
```
4. Setup nginx
```
ssl_certificate /etc/letsencrypt/live/thewang.cse356.compas.cs.stonybrook.edu/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/thewang.cse356.compas.cs.stonybrook.edu/privkey.pem;
```