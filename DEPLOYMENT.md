# 🚀 Panduan Lengkap Deploy Strapi v5 (Self-Hosted VPS Ubuntu)

Panduan ini berisi langkah-langkah *step-by-step* untuk mendeploy aplikasi **Strapi v5** (dengan database **MySQL**) di Virtual Private Server (VPS) berbasis **Ubuntu 22.04 / 24.04 LTS** menggunakan **PM2** sebagai process manager dan **Nginx** sebagai reverse proxy + SSL.

---

## 📋 Daftar Isi
1. [Spesifikasi & Kebutuhan Server](#1-spesifikasi--kebutuhan-server)
2. [Langkah 1: Persiapan Server & Swap Memory](#langkah-1-persiapan-server--swap-memory)
3. [Langkah 2: Install Node.js LTS & PM2](#langkah-2-install-nodejs-lts--pm2)
4. [Langkah 3: Install & Konfigurasi Database (MySQL)](#langkah-3-install--konfigurasi-database-mysql)
5. [Langkah 4: Deploy Kode Proyek & Setup Environment](#langkah-4-deploy-kode-proyek--setup-environment)
6. [Langkah 5: Build & Jalankan dengan PM2](#langkah-5-build--jalankan-dengan-pm2)
7. [Langkah 6: Konfigurasi Nginx Reverse Proxy](#langkah-6-konfigurasi-nginx-reverse-proxy)
8. [Langkah 7: Pasang SSL Gratis (Let's Encrypt / Certbot)](#langkah-7-pasang-ssl-gratis-lets-encrypt--certbot)
9. [Langkah 8: Uji Coba & Health Check](#langkah-8-uji-coba--health-check)
10. [Tips Pemeliharaan (Maintenance & Update Kode)](#tips-pemeliharaan-maintenance--update-kode)

---

## 1. Spesifikasi & Kebutuhan Server

| Komponen | Rekomendasi Minimum | Rekomendasi Ideal |
| :--- | :--- | :--- |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 1 Core | 2+ Cores |
| **RAM** | 2 GB (+ 2 GB Swap wajib) | 4 GB+ |
| **Penyimpanan** | 20 GB SSD | 40 GB+ NVMe SSD |
| **Node.js** | Node.js v20 LTS / v22 LTS | Node.js v20 LTS |
| **Database** | MySQL 8.0+ / MariaDB 10.11+ | MySQL 8.0+ |

---

## Langkah 1: Persiapan Server & Swap Memory

Masuk ke server via SSH:
```bash
ssh root@IP_SERVER_ANDA
```

### 1. Update paket sistem:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw
```

### 2. Buat Swap Memory (Sangat disarankan untuk RAM 2GB)
*Proses `npm run build` pada Strapi membutuhkan konsumsi RAM yang cukup tinggi. Tanpa Swap, server 2GB berisiko mengalami error Out Of Memory (Killed).*
```bash
# Buat file swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Buat swap permanen saat reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Cek swap aktif
free -h
```

---

## Langkah 2: Install Node.js LTS & PM2

Install **Node.js 20 LTS** dari NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi
node -v   # v20.x.x
npm -v    # 10.x.x
```

Install **PM2** secara global:
```bash
sudo npm install -g pm2
```

---

## Langkah 3: Install & Konfigurasi Database (MySQL)

Jika belum menginstal MySQL Server:
```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

Masuk ke MySQL:
```bash
sudo mysql
```

Jalankan perintah SQL berikut untuk membuat database dan user:
```sql
-- Buat database khusus Strapi
CREATE DATABASE strapi_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user dengan password yang kuat
CREATE USER 'strapi_user'@'localhost' IDENTIFIED BY 'PasswordRahasiaAnda123!';

-- Berikan hak akses penuh
GRANT ALL PRIVILEGES ON strapi_production.* TO 'strapi_user'@'localhost';
FLUSH PRIVILEGES;

-- Keluar
EXIT;
```

### 💡 Penting: Apakah Perlu Membuat Tabel Sendiri?

**Jawabannya: TIDAK PERLU.** Anda **hanya perlu membuat wadah databasenya saja** dalam keadaan kosong.

1. **Sinkronisasi Skema Otomatis (*Auto Schema Sync*):**
   - Saat pertama kali aplikasi dijalankan (`npm run start` via PM2), Strapi otomatis membaca model content-types dan komponen yang ada di folder `src/api/`.
   - Strapi akan mengecek database `strapi_production`. Jika tabel belum ada, Strapi secara otomatis membuat tabel-tabel (*CREATE TABLE*), kolom, tipe data, indeks, dan relasi (*foreign keys*).
   - Skema ini otomatis disimpan dan dikelola oleh Strapi di dalam database.

2. **Bagaimana jika ingin membawa Data / Konten yang sudah diinput di lokal ke server?**
   - Jika Anda ingin data konten (berita, artikel, dsb.) di localhost ikut terisi di server, gunakan salah satu cara berikut:
     - **Cara 1 (Rekomendasi Strapi):** Gunakan fitur Data Transfer bawaan:
       ```bash
       # Jalankan di komputer lokal untuk mengirim data ke server
       npm run strapi transfer -- --to https://api.domainanda.com/admin
       ```
       *(Butuh Transfer Token yang dibuat dari menu Admin Panel: Settings > API & Transfer Tokens > Transfer Tokens)*.
     - **Cara 2 (MySQL Dump):** Export database lokal lalu import ke server VPS:
       ```bash
       # Di lokal:
       mysqldump -u root -p nama_db_lokal > backup_data.sql

       # Di server VPS:
       mysql -u strapi_user -p strapi_production < backup_data.sql
       ```

---

## Langkah 4: Deploy Kode Proyek & Setup Environment

### 1. Clone repository ke `/var/www/`:
```bash
sudo mkdir -p /var/www/strapi
sudo chown -R $USER:$USER /var/www/strapi
cd /var/www/strapi

# Clone repo Anda
git clone https://github.com/ammertav/mkn-strapi.git .
```

### 2. Install dependensi:
```bash
npm install
```

### 3. Buat file `.env` produksi:
```bash
nano .env
```
Isi dengan kredensial produksi:
```env
# Server
HOST=0.0.0.0
PORT=1337
APP_KEYS="kunciAcak1,kunciAcak2,kunciAcak3,kunciAcak4"
API_TOKEN_SALT="saltAcakToken"
ADMIN_JWT_SECRET="secretAcakAdminJwt"
TRANSFER_TOKEN_SALT="saltAcakTransferToken"
JWT_SECRET="secretAcakJwtUmum"
ENCRYPTION_KEY="kunciAcakEnkripsi32CharPanjang"

# URL Publik (Wajib agar media & upload link sesuai domain)
PUBLIC_URL=https://api.domainanda.com

# Database MySQL
DATABASE_CLIENT=mysql
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=strapi_production
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=PasswordRahasiaAnda123!
DATABASE_SSL=false
```

> **Tips Generator Key:** Anda bisa men-generate string acak di terminal dengan:
> ```bash
> openssl rand -base64 32
> ```

---

## Langkah 5: Build & Jalankan dengan PM2

### 1. Build Admin Panel:
```bash
NODE_ENV=production npm run build
```

### 2. Buat file `ecosystem.config.js`:
```bash
nano ecosystem.config.js
```
Tempelkan konfigurasi berikut:
```javascript
module.exports = {
  apps: [
    {
      name: 'strapi',
      cwd: '/var/www/strapi',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
```

### 3. Jalankan aplikasi menggunakan PM2:
```bash
pm2 start ecosystem.config.js
```

### 4. Simpan konfigurasi agar otomatis jalan saat server reboot:
```bash
pm2 startup
```
*(Jalankan perintah yang disarankan oleh output PM2 jika ada)*
```bash
pm2 save
```

Periksa status aplikasi:
```bash
pm2 status
pm2 logs strapi --lines 20
```

---

## Langkah 6: Konfigurasi Nginx Reverse Proxy

Install Nginx:
```bash
sudo apt install -y nginx
```

Buat konfigurasi virtual host:
```bash
sudo nano /etc/nginx/sites-available/strapi
```

Isi dengan konfigurasi berikut (sesuaikan `api.domainanda.com` dengan subdomain/domain Anda):
```nginx
server {
    listen 80;
    server_name api.domainanda.com;

    # Batas ukuran upload media (misal: gambar/video hingga 50MB)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

Aktifkan konfigurasi dan restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/strapi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Konfigurasi Firewall (UFW):
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Langkah 7: Pasang SSL Gratis (Let's Encrypt / Certbot)

Pastikan DNS domain Anda (`A Record` untuk `api.domainanda.com`) sudah mengarah ke IP VPS.

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Generate sertifikat SSL otomatis:
```bash
sudo certbot --nginx -d api.domainanda.com
```
Pilih opsi pengalihan HTTP ke HTTPS otomatis (Redirect). Certbot akan memperbarui sertifikat otomatis setiap 90 hari.

---

## Langkah 8: Uji Coba & Health Check

### 1. Cek endpoint kesehatan bawaan Strapi:
```bash
curl -I https://api.domainanda.com/_health
```
Respons yang diharapkan:
```http
HTTP/2 204
```

### 2. Buka Admin Panel:
Buka di browser:
```
https://api.domainanda.com/admin
```
Buat akun Admin pertama untuk sistem produksi Anda.

---

## Tips Pemeliharaan (Maintenance & Update Kode)

Jika ada perubahan kode di repository Anda di kemudian hari, lakukan alur update berikut:

```bash
cd /var/www/strapi

# 1. Tarik perubahan terbaru dari Git
git pull origin main

# 2. Update dependensi jika ada perubahan package.json
npm install

# 3. Rebuild admin panel
NODE_ENV=production npm run build

# 4. Reload proses PM2 tanpa downtime
pm2 reload strapi
```

### Perintah Penting PM2:
- Lihat daftar proses: `pm2 list`
- Lihat log langsung: `pm2 logs strapi`
- Restart aplikasi: `pm2 restart strapi`
- Hentikan aplikasi: `pm2 stop strapi`
- Cek penggunaan memori & CPU: `pm2 monit`
