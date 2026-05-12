# Betaflight App 使用文档

## 项目简介

Betaflight App 是一个渐进式 Web 应用程序（PWA），用于配置和管理 Betaflight 飞行控制系统。支持四旋翼、六旋翼、八旋翼和固定翼等多种飞行器类型。

**在线版本：**
- 稳定版：https://app.betaflight.com
- 开发版：https://master.app.betaflight.com

## 环境要求

### Node.js 版本

项目要求使用 `.nvmrc` 文件中指定的 Node.js 版本。

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
- **有证书时：** `https://local.betaflight.com:8443`

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
    listen 80;
    server_name your-domain.com;

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
```

#### Apache 配置示例

创建 `.htaccess` 文件：

```apache
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
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建和运行：

```bash
docker build -t betaflight-app .
docker run -p 80:80 betaflight-app
```

### 方案四：对象存储部署（阿里云 OSS / 腾讯云 COS / AWS S3）

1. 构建项目：`yarn build`
2. 将 `dist/` 目录上传至对象存储桶
3. 配置静态网站托管
4. 设置 404 回退规则到 `index.html`（SPA 路由支持）

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
