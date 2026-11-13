# 每日热点公开分享转发

`daily-radar-sharing.conf.example` 是可审查的脱敏片段。实际
`direct/starcat.ink.conf` 是被 Git 忽略的本机私有配置，不应强制提交。

在现有 HTTPS `server` 中、SPA 的 `location /` 之前 include 此片段，或复制对应
`location ^~ /d/`。它依赖公开仓库分享已有的 resolver 与
`$sharing_fly_upstream`，并统一转发页面、WebP 和 PNG。`Host`、TLS SNI 和
`X-SC-Svc: sharing` 必须同时保留；否则聚合服务无法识别匿名浏览器的目标服务。

实际部署需另行授权。部署时先在目标机器执行 `nginx -t`，再重载；本任务不上传
私有配置、不执行部署脚本。验收时确认 `/d/{id}` 返回日报 HTML 而非官网首页，
两张资产的 `Content-Type` 分别为 `image/webp` 与 `image/png`，且 OG 指向绝对 PNG URL。

后端一年 immutable 缓存是方案指定行为。撤销会阻止后续回源请求，但不能主动
删除浏览器或分享平台已缓存的响应；如以后需要即时撤销，必须另行调整缓存契约。
