# 极简第一版

## 简介
**各种方面上都很极简捏，比如功能极简**

一个基于Github仓库和Cloudflare Workers的简单快捷可分类图片的全免费纯白嫖随机图片接口

## 演示

[https://demo.randomimg.sfacg.ltd/示例图](https://demo.randomimg.sfacg.ltd/示例图)

[https://demo.randomimg.sfacg.ltd/demoimg](https://demo.randomimg.sfacg.ltd/demoimg)

PS:cloudflare提供的`workers.dev`域名在大陆无法正常解析，所以演示站是添加的自定义域名

## 部署和使用

Github随便新建个公开仓库，图片按`1.jpg，2.jpg，3.jpg`这样重命名后塞进库里，分不分文件夹都行

Cloudflare Worker首页：https://workers.cloudflare.com

注册，登陆，`start building`，取一个worker子域名，`创建服务`，保持默认的即可。

进入编辑后复制`worker.js`中的代码到左侧代码框，**按照代码中的注释和自己的需求修改代码**，`保存并部署`。

如果分了文件夹，想抽文件夹下的图片就得访问`https://<worker域名>/<文件夹名>`，抽取直接存仓库根目录的图片访问`https://<worker域名>`

### 举个栗子

我希望在[Cheshire-Nya/random-genshin-img](https://github.com/Cheshire-Nya/random-genshin-img)仓库下`纳西妲`文件夹下的35张图片中抽取，那么worker.js中：

[Line5](https://github.com/Cheshire-Nya/easy-random-img-api/blob/5fd71f5a549ab6e5ea8240a15891299bac9a89a2/worker.js#L5)就应该是`var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/random-genshin-img/main";`

[Line17](https://github.com/Cheshire-Nya/easy-random-img-api/blob/5fd71f5a549ab6e5ea8240a15891299bac9a89a2/worker.js#L17)应为`if (imgPath == '/%E7%BA%B3%E8%A5%BF%E5%A6%B2') { max=35;}`

访问时应使用的链接为`https://<worker域名>/纳西妲`

## PS

1.cloudflare workers每个账户的免费额度是每天十万次请求，并且有每分钟1000次请求的限制，超出后请求会返回错误。如果不够用，可升级到 $5 的高级版本，每月可用 1000 万次请求（超出部分 $0.5/百万次请求）

2.cloudflare注册没有花里胡哨的各种认证，门槛极低，有邮箱就能注册。

3.理论上可以无限白嫖，多注册几个账号，其他服务调用随机图时多写个逻辑返回错误请求另外的接口即可。唯一的成本无非就是大陆访问需要绑自定义域名，但是域名无论是白嫖免费域名或是一年十几二十块的便宜域名，四舍五入就是没花钱欸嘿。添加自定义域在[Cloudflare控制台](https://dash.cloudflare.com/)中`网站`里按指引操作，选择free计划即可。
