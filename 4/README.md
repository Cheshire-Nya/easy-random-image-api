# easy-random-img-api

## 简介

一个基于Github仓库和Cloudflare Workers的简单快捷可分类图片的全免费纯白嫖随机图片接口实现

相比较3，增加了可以使用`device`参数区分图片适合观看的设备。**当然，需要按照`image.json`自行编写json文件**

不建议使用本方案查看指定图片，因为得指定`device=mobile`这样才能再指定`id=xx`，链接里的参数太多了用起来挺麻烦的，保留`id`只是为了方便302跳转

## 演示

[https://demo4.randomimg.sfacg.ltd](https://demo4.randomimg.sfacg.ltd)主页

[https://demo4.randomimg.sfacg.ltd/api](https://demo4.randomimg.sfacg.ltd/api)`cat`为必须参数，不存在就返回404

[https://demo4.randomimg.sfacg.ltd/api?cat=category1](https://demo4.randomimg.sfacg.ltd/api?cat=category1)

[https://demo4.randomimg.sfacg.ltd/api?cat=category1&cat=category2](https://demo4.randomimg.sfacg.ltd/api?cat=category1&cat=category2)多分类抽取

[https://demo4.randomimg.sfacg.ltd/api?cat=category1&device=mobile&id=4](https://demo4.randomimg.sfacg.ltd/api?cat=category1&device=mobile&id=2)抽取`image.json`中`category1`分类适合移动端查看的第2张图

[https://demo4.randomimg.sfacg.ltd/api?cat=category2&type=json](https://demo4.randomimg.sfacg.ltd/api?cat=category2&type=json)随机抽取`category2`分类并返回json

[https://demo4.randomimg.sfacg.ltd/api?cat=category1&device=pc&id=2&type=json](https://demo4.randomimg.sfacg.ltd/api?cat=category1&device=pc&id=2&type=json)指定`category1`分类适合pc端的第二张并返回json

[https://demo4.randomimg.sfacg.ltd/api?cat=category1&type=302](https://demo4.randomimg.sfacg.ltd/api?cat=category1&type=302)以302返回跳转到随机一张图的准确地址，供网页使用

PS:cloudflare提供的`workers.dev`域名在大陆无法正常解析，所以演示站是添加的自定义域名

## 部署和使用

Github随便新建个公开仓库，**图片塞进库里想怎么放就怎么放**

**参照`image.json`编写你自己的json文件**，随便放哪里，仓库、其他网站目录或服务器都行，只要能通过公网访问到即可

Cloudflare Worker首页：https://workers.cloudflare.com

注册，登陆，`start building`，取一个worker子域名，`创建服务`，保持默认的即可。

进入编辑后复制 [worker.js](https://github.com/Cheshire-Nya/easy-random-img-api/blob/main/方案3/worker.js)  到左侧代码框，**按照代码中的注释和自己的需求修改代码**，`保存并部署`。

### 需要修改的变量

#### 必选

- `urlIndex`：主页模板的地址

- `url404`：404页模板的地址

- `imgHost`：图片仓库的地址，通常为此格式`https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>/`

- `jsonUrl`：存储图片信息的json文件地址

#### 可选

- `redirectProxy`：返回类型为302时图片使用的代理，默认为`2`。

   `0`不使用代理（返回github原地址）

   `1`(不推荐)使用worker本身代理（返回`https://example.com/api?category1&id=1`这样的链接）

   `2`(推荐)使用ghproxy代理（返回`ghproxy.com`代理的链接）  

   PS：如果302返回使用的是worker代理，那么相当于调用一次请求了worker两次，故不推荐

- `ghproxyUrl`：github加速站的链接，`ghproxy.com`能正常使用就不需要改，更换地址通常按照此格式填写`"https://example.com/"`（不能漏掉结尾的`/`）

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
    <td align="center">cat<br>（必须参数）</td>
    <td align="center">json文件中的键</td>
    <td>在该分类中抽取图片</td>
  </tr>
  <tr>
    <td align="center" rowspan="2">type</td>
    <td align="center">302</td>
    <td>通过302返回直接跳转到图片对应的准确地址，可用作随机网页背景等</td>
  </tr>
    <tr>
    <td align="center">json</td>
    <td>以json格式返回</td>
  </tr>
  <tr>
    <td align="center" rowspan="2">device</td>
    <td align="center">pc</td>
    <td>返回适合pc的图片</td>
  </tr>
  <tr>
    <td align="center">mobile</td>
    <td>返回适合移动端的图片</td>
  </tr>
  <tr>
    <td align="center">id</td>
    <td align="center">&lt;数值&gt;</td>
    <td>返回排序为第&lt;数值&gt;张的指定图片(存在id时不允许type=302)</td>
  </tr>
</tbody>
</table>
PS：

- 从多个分类中抽取应按此格式`https://example.com/api?cat=category1&cat=category2`

- json返回包含:分类`cat`,适合的设备`device`,图片id`id`,图片github原链接`githubUrl`,worker代理链接`workerUrl`,ghproxy代理链接`proxyUrl`
```
{
  "category": "category2",
  "device": "pc",
  "id": 2,
  "githubUrl": "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/示例图/6.jpg",
  "workerUrl": "https://demo4.randomimg.sfacg.ltd/api?cat=category2&device=pc&id=2",
  "proxyUrl": "https://ghproxy.com/https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/示例图/6.jpg"
}
```

<!--
### 举个栗子

我希望在[Cheshire-Nya/random-genshin-img](https://github.com/Cheshire-Nya/random-genshin-img)仓库下`纳西妲`文件夹下的35张图片中抽取，那么worker.js中：

[Line5](https://github.com/Cheshire-Nya/easy-random-img-api/blob/5fd71f5a549ab6e5ea8240a15891299bac9a89a2/worker.js#L5)就应该是`var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/random-genshin-img/main";`

[Line17](https://github.com/Cheshire-Nya/easy-random-img-api/blob/5fd71f5a549ab6e5ea8240a15891299bac9a89a2/worker.js#L17)应为`if (imgPath == '/%E7%BA%B3%E8%A5%BF%E5%A6%B2') { max=35;}`

访问时应使用的链接为`https://<worker域名>/api/纳西妲`
-->

## PS

- 不知道还有啥问题，如果遇到了可以提issue

1. cloudflare workers每个账户的免费额度是每天十万次请求，并且有每分钟1000次请求的限制，超出后请求会返回错误。如果不够用，可升级到 $5 的高级版本，每月可用 1000 万次请求（超出部分 $0.5/百万次请求）

2. cloudflare注册没有花里胡哨的各种认证，门槛极低，有邮箱就能注册。

3. 理论上可以无限白嫖，多注册几个账号，其他服务调用随机图时多写个逻辑返回错误请求另外的接口即可。唯一的成本无非就是大陆访问需要绑自定义域名，但是域名无论是白嫖免费域名或是一年十几二十块的便宜域名，四舍五入就是没花钱欸嘿。添加自定义域在[Cloudflare控制台](https://dash.cloudflare.com/)中`网站`里按指引操作，选择free计划即可。

## TODO（咕咕咕）

- [ ] 待定


## changelog

- 2023.02.16 测试无误上传至github

