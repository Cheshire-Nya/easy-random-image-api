# easy-random-img-api

## 简介

一个基于Github仓库和Cloudflare Workers的简单快捷可分类图片的全免费纯白嫖随机图片接口

## 演示

[https://demo2.randomimg.sfacg.ltd/api](https://demo2.randomimg.sfacg.ltd/api)

[https://demo2.randomimg.sfacg.ltd/api?cat=示例图](https://demo2.randomimg.sfacg.ltd/api?cat=示例图)

[https://demo2.randomimg.sfacg.ltd/api?cat=demoimg&cat=示例图](https://demo2.randomimg.sfacg.ltd/api?cat=demoimg&cat=示例图)多分类抽取

[https://demo2.randomimg.sfacg.ltd/api?cat=demoimg&id=8](https://demo2.randomimg.sfacg.ltd/api?cat=demoimg&id=8)查看`示例图`下的`8.jpg`

[https://demo2.randomimg.sfacg.ltd/api?type=json](https://demo2.randomimg.sfacg.ltd/api?type=json)默认分类抽取并返回json

[https://demo2.randomimg.sfacg.ltd/api?cat=demoimg&id=2&type=json](https://demo2.randomimg.sfacg.ltd/api?cat=demoimg&id=2&type=json)指定`demoimg`下的`2.jpg`返回json

[https://demo2.randomimg.sfacg.ltd/api?cat=demoimg&type=302](https://demo2.randomimg.sfacg.ltd/api?cat=demoimg&type=302)以302返回跳转到随机一张图的准确地址，供网页使用

PS:cloudflare提供的`workers.dev`域名在大陆无法正常解析，所以演示站是添加的自定义域名

## 部署和使用

Github随便新建个公开仓库，**图片按`1.jpg，2.jpg，3.jpg`这样重命名后分类存到文件夹里**，不分文件夹就只能设置默认文件夹抽取

Cloudflare Worker首页：https://workers.cloudflare.com

注册，登陆，`start building`，取一个worker子域名，`创建服务`，保持默认的即可。

进入编辑后复制 [worker.js](https://github.com/Cheshire-Nya/easy-random-img-api/blob/main/worker.js)  到左侧代码框，**按照代码中的注释和自己的需求修改代码**，`保存并部署`。

### 需要修改的变量

#### 必选

`url404`：404页的地址

`imgHost`：图片仓库的地址，通常为此格式`https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>`

`defaultPath`：当访问的url为`https://example.com/api`时抽取图片的文件夹，你可以当成默认分类

`maxValues`：用来抽图的文件夹名称和对应的图片数，以键值对形式存储，格式为`'/<名称>': <数量>,`

#### 可选

`redirectProxy`：返回类型为302时图片使用的代理，默认为`2`。`0`不使用代理（返回github原地址），`1`(不推荐)使用worker本身代理（返回`https://example.com/api/1.jpg`这样的链接），`2`(推荐)使用ghproxy代理（返回`ghproxy.com`代理的链接）  
PS：如果302返回使用的是worker代理，那么相当于调用一次请求了worker两次，故不推荐

`ghproxyUrl`：github加速站的链接，`ghproxy.com`能正常使用就不需要改，更换地址通常按照此格式填写`"https://example.com/"`（不能漏掉结尾的`/`）

### 调用参数

<table>
<thead>
  <tr>
    <th>可用参数</th>
    <th>值</th>
    <th>说明</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center">cat</td>
    <td align="center">图片分类（文件夹名）</td>
    <td>在该分类中抽取图片（从多个分类中抽取应按此格式`https://example.com/api?cat=val1&cat=val2`）（没有该参数时从默认文件夹抽取）</td>
  </tr>
  <tr>
    <td align="center" rowspan="2">type</td>
    <td align="center">302</td>
    <td>通过302返回直接跳转到图片对应的准确地址，可用作随机网页背景等(指定图片id时不允许302返回)</td>
  </tr>
    <tr>
    <td align="center">json</td>
    <td>以json格式返回，包含:分类`cat`,图片id`id`,图片github原链接`githubUrl`,worker代理链接`workerUrl`,ghproxy代理链接`proxyUrl`</td>
  </tr>
  <tr>
    <td align="center">id</td>
    <td align="center">&lt;数值&gt;</td>
    <td>返回名称为&lt;数值&gt;的指定图片</td>
  </tr>
  <tr>
    <td align="center">不使用参数</td>
    <td align="center">空</td>
    <td>简简单单抽张图</td>
  </tr>
</tbody>
</table>

<!--
### 举个栗子

我希望在[Cheshire-Nya/random-genshin-img](https://github.com/Cheshire-Nya/random-genshin-img)仓库下`纳西妲`文件夹下的35张图片中抽取，那么worker.js中：

[Line5](https://github.com/Cheshire-Nya/easy-random-img-api/blob/5fd71f5a549ab6e5ea8240a15891299bac9a89a2/worker.js#L5)就应该是`var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/random-genshin-img/main";`

[Line17](https://github.com/Cheshire-Nya/easy-random-img-api/blob/5fd71f5a549ab6e5ea8240a15891299bac9a89a2/worker.js#L17)应为`if (imgPath == '/%E7%BA%B3%E8%A5%BF%E5%A6%B2') { max=35;}`

访问时应使用的链接为`https://<worker域名>/api/纳西妲`
-->

## PS

1.cloudflare workers每个账户的免费额度是每天十万次请求，并且有每分钟1000次请求的限制，超出后请求会返回错误。如果不够用，可升级到 $5 的高级版本，每月可用 1000 万次请求（超出部分 $0.5/百万次请求）

2.cloudflare注册没有花里胡哨的各种认证，门槛极低，有邮箱就能注册。

3.理论上可以无限白嫖，多注册几个账号，其他服务调用随机图时多写个逻辑返回错误请求另外的接口即可。唯一的成本无非就是大陆访问需要绑自定义域名，但是域名无论是白嫖免费域名或是一年十几二十块的便宜域名，四舍五入就是没花钱欸嘿。添加自定义域在[Cloudflare控制台](https://dash.cloudflare.com/)中`网站`里按指引操作，选择free计划即可。

## TODO（咕咕咕）

- [x] 1.支持查看指定图片

- [x] 2.支持返回json

- [ ] 3.添加一个主页模板

- [x] 4.添加404模板

- [x] 5.解决`/api?`和`/api/?`无法使用

- [x] 6.解决`/api/1.jpg`无法使用

- [x] 7.解决`/api/demoimg?`无法使用

- [x] 8.支持返回302到通过ghproxy或worker代理的图片地址，方便web使用不受浏览器缓存影响

- [x] 9.弃用旧方案改为从url查询参数中获取分类以方便实现多个分类抽取

## 其他版本（咕咕咕）

- [x] 极简简简版（留档纪念的第一版捏）

- [ ] 自行存入指定图片链接的版本（类似[YieldRay/Random-Picture](https://github.com/YieldRay/Random-Picture)）

## changelog

- 2023.02.08 弃用旧方案，完成TODO2

- 2023.02.06 完成TODO4、8，完善错误返回

- 2023.02.05 完成TODO1、5、6、7

- 2023.02.04 更完善的版本，自定义默认目录

- 2023.02.03 初始极简版，简简单单抽个图
