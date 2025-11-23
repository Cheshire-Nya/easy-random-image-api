# easy-random-img-api

## 简介

白嫖Github仓库和Cloudflare Workers简单快速实现可分类可判断设备的随机图片抽取

**快给我点star**

## 部署和使用

Github随便新建个公开仓库，新建文件夹`jpg`和其他你想要的格式对应的文件夹，jpg图片塞进jpg文件夹这样
其他格式图片可以自行上传，且不同格式图片文件夹的目录结构、文件名须保持一致，目录格式参照本文件夹下的`jpg`，`webp`
图片批量转码和压缩推荐使用[caesium](https://saerasoft.com/caesium#downloads)，可以保留目录结构转码压缩
也可将`imgResize`置1以使用第三方cdn来转码

参照`image.json`编写你自己的json文件，随便放哪里，仓库、其他网站目录或服务器都行，只要能通过公网访问到即可

Cloudflare Worker首页：https://workers.cloudflare.com

注册，登陆，`start building`，取一个worker子域名，`创建服务`，不需要使用模板创建worker，直接hello world创建即可。

进入编辑后复制本文件夹下的 `worker.js` 到左侧代码框，**按照代码中的注释和自己的需求修改代码**，`保存并部署`。

### 配置

```
var jsonUrl = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/image.json";
// json文件的地址

var urlIndex = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/index.html";
// 主页模板地址

var url404 = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/404.html";
// 404模板地址

var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/";
// 图片地址前部不会发生改变的部分
// 用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>/"

var redirectProxy = 2;
// 代理模式: 
// 0 = GitHub 直链 (不推荐，国内访问慢)
// 1 = Worker 代理 (消耗 Worker 流量及次数)
// 2 = 第三方 CDN 代理 (使用 wsrv.nl 加速)

var imgResize = 1; 
// 转码/路径开关: 
// 0 = 本地模式 (GitHub 上必须存在对应格式的文件夹，如 /webp/，代理只负责搬运)
// 1 = 云端模式 (GitHub 上只需有 jpg，其他格式由 CDN 在线转码)

var resizeHost = "https://wsrv.nl/?url=";
// 统一使用的图片处理/代理 CDN

var availableExtraForms = ["webp"];
//除默认的jpg外，你额外增加的可以返回的图片格式

var availableDevices = ["mobile", "pc"];
//一般不需要改这个了，改了就要改代码，如果可以更加细分设备，欢迎pr
```
**【注意】上述url中的所有中文都需写成utf8编码形式，不然会一直给你丢到404，比如我的json地址是"/方案5/image.json"写成了"/%E6%96%B9%E6%A1%885/image.json"**


### 调用参数

<table>
  <thead>
    <tr>
      <th width="15%">参数</th>
      <th width="20%">值</th>
      <th>说明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>cat</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>JSON Key</code></td>
      <td>
        指定分类名称。<br>
        <span class="tag-tip">留空则在所有分类中随机抽取。</span>
      </td>
    </tr>
    <tr>
      <td><strong>device</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>pc</code><br><code>mobile</code><br><code>invalid</code></td>
      <td>
        <strong>pc/mobile</strong>: 强制指定设备。<br>
        <strong>invalid</strong>: 全池随机模式 (混合所有设备图)。<br>
        <span class="tag-tip">留空则根据 User-Agent 自动判断。</span>
      </td>
    </tr>
    <tr>
      <td><strong>type</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>302</code><br><code>json</code><br><code>(空)</code></td>
      <td>
        <strong>302</strong>: 跳转到图片真实地址 (默认)。<br>
        <strong>json</strong>: 返回包含元数据的 JSON。<br>
        <strong>(空)</strong>: 直接返回图片数据流。
      </td>
    </tr>
    <tr>
      <td><strong>id</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>Integer</code></td>
      <td>
        获取第 N 张图片。<br>
        <span class="tag-warn">⚠️ 建议配合 device 参数使用以确保顺序固定。</span>
      </td>
    </tr>
    <tr>
      <td><strong>form</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>webp</code> / <code>jpg</code></td>
      <td>
        指定返回格式。<br>
        默认为 jpg。如指定 webp，系统会自动通过 CDN 转码。
      </td>
    </tr>
  </tbody>
</table>

### 示例

[https://demo5.randomimg.sfacg.ltd](https://demo5.randomimg.sfacg.ltd)主页

[https://demo5.randomimg.sfacg.ltd/api](https://demo5.randomimg.sfacg.ltd/api)不带参数直接扔到404

[https://demo5.randomimg.sfacg.ltd/api?cat=category1](https://demo5.randomimg.sfacg.ltd/api?cat=category1)无form默认jpg，无device自动识别设备类型

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&form=webp](https://demo5.randomimg.sfacg.ltd/api?cat=category1&form=webp)category1分类webp，自动识别设备类型

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&cat=category2](https://demo5.randomimg.sfacg.ltd/api?cat=category1&cat=category2)多分类抽取自动识别设备类型

[https://demo5.randomimg.sfacg.ltd/api?device=invalid](https://demo5.randomimg.sfacg.ltd/api?device=invalid)禁用设备判断，无视分类全池抽取

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&device=mobile&id=2](https://demo5.randomimg.sfacg.ltd/api?cat=category1&device=mobile&id=2)抽取`image.json`中`category1`分类适合移动端查看的第2张图

[https://demo5.randomimg.sfacg.ltd/api?cat=category2&type=json](https://demo5.randomimg.sfacg.ltd/api?cat=category2&type=json)随机抽取`category2`分类并返回json

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&device=pc&id=2&type=json](https://demo5.randomimg.sfacg.ltd/api?cat=category1&device=pc&id=2&type=json)指定`category1`分类适合pc端的第二张并返回json

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&type=302](https://demo5.randomimg.sfacg.ltd/api?cat=category1&type=302)以302返回跳转到随机一张图的准确地址

PS:cloudflare提供的`workers.dev`域名在大陆无法正常解析，所以演示站是添加的自定义域名

### 响应/错误返回说明
- json返回会包含如下内容
```
{
  "category": "category1",
  "device": "mobile",
  "id": 5,
  "form": "webp",
  "githubUrl": "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/jpg/8.jpg",
  "workerUrl": "https://test.sfacg.ltd/api?cat=category1&device=mobile&id=5&form=webp",
  "proxyUrl": "https://wsrv.nl/?url=https%3A%2F%2Fraw.githubusercontent.com%2FCheshire-Nya%2Feasy-random-image-api%2Fmain%2F%25E6%2596%25B9%25E6%25A1%25885%2Fjpg%2F8.jpg&output=webp"
}
```

- 正确响应通常会带有如下标头<br>

![正确响应标头](https://wsrv.nl/?url=https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/refs/heads/main/%E4%BE%8B%E5%9B%BE/%E6%AD%A3%E7%A1%AE%E5%93%8D%E5%BA%94.png)

- 错误响应通常会带有如下标头<br>

![错误响应标头](https://wsrv.nl/?url=https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/refs/heads/main/%E4%BE%8B%E5%9B%BE/%E9%94%99%E8%AF%AF%E5%93%8D%E5%BA%94.png)<br>
	`X-Error-Reason`有以下几种
	
	No search parameters
	Invalid Path
	Invalid image format: 
	Failed to fetch JSON config
	Category not found
	Category is empty
	ID out of range
	Invalid type parameter
	No category specified
	Redirect Config Error
	404 Template not found

## PS

- 不知道还有啥问题，如果遇到了可以提issue

1. cloudflare workers每个账户的免费额度是每天十万次请求，并且有每分钟1000次请求的限制，超出后请求会返回错误。如果不够用，可升级到 $5 的高级版本，每月可用 1000 万次请求（超出部分 $0.5/百万次请求）

2. cloudflare注册没有花里胡哨的各种认证，超低门槛，有邮箱就能注册。

3. 理论上可以无限白嫖，多注册几个账号，其他服务调用随机图时多写个逻辑返回错误请求另外的接口即可。唯一的成本是大陆访问需要绑自定义域名，但是域名可以白嫖免费域名或者一年十几二十块的便宜域名，四舍五入就是妹花钱。添加自定义域在[Cloudflare控制台](https://dash.cloudflare.com/)中`网站`里按指引操作，选择free计划即可。

4. ~~错误返回偷懒没完善~~

5. **主页和404页没啥卵用，建议用的时候删了**





