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
    <th>可用参数</th>
    <th>值</th>
    <th>说明</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center">cat</td>
    <td align="center">json文件中的key</td>
    <td>在该分类中抽取图片</td>
  </tr>
  <tr>
    <td align="center" rowspan="2">type</td>
    <td align="center">302<br>(有id参数时不应type=302)</td>
    <td>通过302返回直接跳转到图片对应的准确地址，可用作随机网页背景等</td>
  </tr>
    <tr>
    <td align="center">json</td>
    <td>以json格式返回</td>
  </tr>
  <tr>
    <td align="center" rowspan="2">device<br>(不指定device时会由函数来判断设备类型)<br>(这时不允许使用id参数)</td>
    <td align="center">pc</td>
    <td>返回适合pc的图片</td>
  </tr>
  <tr>
    <td align="center">mobile</td>
    <td>返回适合移动端的图片</td>
  </tr>
  <tr>
    <td align="center">invalid</td>
    <td>禁用设备判断全池随机抽取</td>
  </tr>
  <tr>
    <td align="center">id</td>
    <td align="center">&lt;数值&gt;</td>
    <td>需要和cat参数配合<br>返回排序为第&lt;数值&gt;张的指定图片</td>
  </tr>
  <tr>
    <td align="center">form</td>
    <td align="center">其他图片格式</td>
    <td>返回对应格式的图片，不存在时默认返回jpg</td>
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

- 正确响应通常会带有如下标头
![正确响应标头](https://cdn.jsdelivr.net/gh/Cheshire-Nya/easy-random-image-api/例图/正确响应.png)

- 错误响应通常会带有如下标头
![错误响应标头](https://cdn.jsdelivr.net/gh/Cheshire-Nya/easy-random-image-api/例图/错误响应.png)
	`X-Error-Reason`有以下几种
	```
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
	```

## PS

- 不知道还有啥问题，如果遇到了可以提issue

1. cloudflare workers每个账户的免费额度是每天十万次请求，并且有每分钟1000次请求的限制，超出后请求会返回错误。如果不够用，可升级到 $5 的高级版本，每月可用 1000 万次请求（超出部分 $0.5/百万次请求）

2. cloudflare注册没有花里胡哨的各种认证，超低门槛，有邮箱就能注册。

3. 理论上可以无限白嫖，多注册几个账号，其他服务调用随机图时多写个逻辑返回错误请求另外的接口即可。唯一的成本是大陆访问需要绑自定义域名，但是域名可以白嫖免费域名或者一年十几二十块的便宜域名，四舍五入就是妹花钱。添加自定义域在[Cloudflare控制台](https://dash.cloudflare.com/)中`网站`里按指引操作，选择free计划即可。

4. ~~错误返回偷懒没完善~~

5. **主页和404页没啥卵用，建议用的时候删了**





