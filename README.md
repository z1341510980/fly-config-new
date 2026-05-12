# 使用文档

## 环境要求

### Node.js 版本

项目要求使用 `.nvmrc` 文件中指定的 Node.js 版本。  就是node版本：24.12.0

1. 查看项目要求的版本：
   ```bash
   cat .nvmrc
   ```

2. 安装指定版本（推荐使用 nvm）：
   ```bash
   nvm install
   nvm use
   ```

   或手动安装：
   ```bash
   # 下载并安装 https://nodejs.org/
   node --version  # 验证版本是否匹配
   ```

### 浏览器要求

需要 Chromium 内核浏览器（Chrome、Chromium、Microsoft Edge 等），以支持完整的设备通信功能：

| 功能 | 浏览器 API |
|------|-----------|
| 串口连接 | Web Serial |
| 蓝牙连接 | Web Bluetooth |
| DFU 刷写 | WebUSB |
| 本地开发认证 | HTTPS + WebAuthn |

## 安装步骤

### 1. 安装依赖

```bash
# 安装 Yarn 包管理器（如果尚未安装）
npm install yarn -g

# 安装项目依赖
yarn install
```

## 开发模式

### 启动开发服务器

```bash
yarn dev
```

启动后，Vite 会在终端输出访问地址：

- **无证书时：** `http://localhost:8088`

在浏览器中打开对应地址即可访问应用。

### 开发模式特点

- 热模块替换（HMR）：代码修改后自动刷新
- 源码调试：支持断点调试和源码映射
- 实时预览：修改立即生效

## 打包构建

### 生产环境打包

```bash
yarn build
```

构建完成后，输出文件位于 `dist/` 目录。

### 预览构建结果

```bash
# 先执行构建
yarn build

# 预览生产版本
yarn preview
```

预览命令会启动本地服务器，展示打包后的实际效果。

## 部署方法

### 方案一：静态资源部署（推荐）

将 `dist/` 目录的所有文件部署到任意静态 Web 服务器：

#### Nginx 配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/domain.crt;
    ssl_certificate_key /path/to/your/domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /path/to/dist;
    index index.html;

    # PWA 支持：所有路由回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # service-worker 不缓存
    location = /service-worker.js {
        add_header Cache-Control "no-cache";
    }
}

# HTTP 自动跳转 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

#### Apache 配置示例

创建 `.htaccess` 文件：

```apache
# HTTP 重定向到 HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# SPA 路由回退
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# 静态资源缓存
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>
```

或在 Apache 虚拟主机配置中启用 SSL：

```apache
<VirtualHost *:443>
    ServerName your-domain.com
    
    SSLEngine on
    SSLCertificateFile /path/to/your/domain.crt
    SSLCertificateKeyFile /path/to/your/domain.key
    
    DocumentRoot /path/to/dist
    
    <Directory /path/to/dist>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>

# HTTP 自动跳转 HTTPS
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>
```

### 方案二：GitHub Pages 部署

```bash
# 安装 gh-pages
yarn add -D gh-pages

# 在 package.json 中添加脚本
# "deploy": "gh-pages -d dist"

# 构建并部署
yarn build
yarn deploy
```

### 方案三：Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 443 80
CMD ["nginx", "-g", "daemon off;"]
```

创建 `nginx.conf`：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/domain.crt;
    ssl_certificate_key /etc/nginx/ssl/domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /service-worker.js {
        add_header Cache-Control "no-cache";
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

构建和运行（挂载 SSL 证书）：

```bash
# 构建镜像
docker build -t betaflight-app .

# 运行容器（挂载 SSL 证书目录）
docker run -p 443:443 -p 80:80 \
  -v /path/to/your/ssl:/etc/nginx/ssl \
  betaflight-app
```

或使用 Docker Compose：

```yaml
version: '3.8'
services:
  betaflight-app:
    build: .
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./ssl:/etc/nginx/ssl
    restart: always
```

```bash
docker-compose up -d
```

### 方案三（备选）：Docker + Let's Encrypt 自动证书

使用 `nginx-proxy` + `letsencrypt` 自动获取 HTTPS 证书：

```yaml
version: '3.8'
services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - certs:/etc/nginx/certs
      - vhost:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
    restart: always

  letsencrypt:
    image: nginxproxy/acme-companion
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - certs:/etc/nginx/certs
      - vhost:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
      - acme:/etc/acme.sh
    environment:
      DEFAULT_EMAIL: your-email@example.com
    depends_on:
      - nginx-proxy
    restart: always

  betaflight-app:
    build: .
    environment:
      VIRTUAL_HOST: your-domain.com
      LETSENCRYPT_HOST: your-domain.com
      LETSENCRYPT_EMAIL: your-email@example.com
    volumes:
      - ./nginx-http.conf:/etc/nginx/conf.d/default.conf
    restart: always

volumes:
  certs:
  vhost:
  html:
  acme:
```

```bash
docker-compose up -d
```

### 方案四：对象存储部署（阿里云 OSS / 腾讯云 COS / AWS S3）

> **注意：** 对象存储通常提供默认 HTTPS 域名，但自定义域名需要自行配置 SSL 证书或使用 CDN。

1. 构建项目：`yarn build`
2. 将 `dist/` 目录上传至对象存储桶
3. 配置静态网站托管
4. 设置 404 回退规则到 `index.html`（SPA 路由支持）
5. **启用 HTTPS：**
   - **阿里云 OSS：** 绑定自定义域名后，在 CDN 控制台开启 HTTPS 并上传证书
   - **腾讯云 COS：** 在 CDN 域名管理中配置 HTTPS 证书
   - **AWS S3 + CloudFront：** 在 CloudFront 分配中绑定 ACM 证书

#### 阿里云 OSS + CDN 示例

```bash
# 1. 使用 ossutil 上传
ossutil cp -r dist/ oss://your-bucket-name/

# 2. 在阿里云 CDN 控制台：
#    - 添加加速域名
#    - 开启 HTTPS 安全加速
#    - 上传 SSL 证书或使用免费证书
#    - 配置 404 回退规则（通过函数计算或边缘脚本）
```

#### AWS S3 + CloudFront 示例

```bash
# 1. 上传到 S3
aws s3 sync dist/ s3://your-bucket-name --delete

# 2. 使用 ACM 申请免费 SSL 证书
aws acm request-certificate \
  --domain-name your-domain.com \
  --validation-method DNS

# 3. 创建 CloudFront 分配，绑定 ACM 证书
#    - Origin: 选择 S3 桶
#    - Viewer Protocol Policy: Redirect HTTP to HTTPS
#    - Default Root Object: index.html
#    - Custom Error Responses: 404 -> 200, 响应页面: /index.html
```

## 其他命令

### 运行测试

```bash
yarn test
```

### 代码检查

```bash
yarn lint
```

## 常见问题

### 1. Node.js 版本不匹配

```bash
# 使用 nvm 切换版本
nvm install <version>  # 替换为 .nvmrc 中的版本
nvm use <version>
```

### 2. 依赖安装失败

```bash
# 清除缓存后重新安装
yarn cache clean
yarn install
```

### 3. 开发服务器无法启动

- 检查端口 `8088` 是否被占用
- 使用 `lsof -i :8088` (Linux/Mac) 或 `netstat -ano | findstr 8088` (Windows) 查看占用进程

### 4. 浏览器不支持 Web Serial

- 确保使用 Chromium 内核浏览器（Chrome 89+）
- HTTPS 环境下才能使用（localhost 除外）
- 在 `chrome://flags` 中启用相关实验性功能（如需要）

## 技术栈

| 类型 | 技术 |
|------|------|
| 框架 | Vue 3 |
| 构建工具 | Vite |
| 包管理器 | Yarn |
| 部署模式 | PWA（渐进式 Web 应用） |
| 设备通信 | Web Serial / Web Bluetooth / WebUSB / WebSocket |
