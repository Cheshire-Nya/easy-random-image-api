# easy-random-img-api

一个基于 Cloudflare Workers 的轻量级、高性能随机图片 API 服务。

## 📖 简介 | Introduction
利用 Cloudflare Workers 的无服务器特性，配合 GitHub 仓库作为存储后端，构建了一个零成本、响应速度极快的随机图片 API。不仅支持多分类管理，还通过集成 CDN 实现实时的图片压缩、格式转换和裁剪，非常适合用于网站背景、博客配图或小程序开发。

**快给我点star**

## ✨ 项目特性 | Features
- **⚡️ Serverless 架构**：完全运行在 Cloudflare Workers 上，依托全球边缘网络，极低延迟，无需购买服务器。

- **📦 多仓库存储**：支持挂载多个 GitHub 仓库，通过统一的 JSON 文件管理所有资源，突破单仓库体积限制。

- **🗂️ 灵活的标签系统**：图片采用扁平化 Key-Value 结构管理，支持多分类标签 (category) 和设备标签 (device)，一张图可属于多个分类。

- **📱 智能设备适配**：

   自动根据 User-Agent 识别 PC 或移动端，返回适配的图片。

   支持 device=invalid 模式，实现全图池混合随机抽取。

- **🎨 实时图片处理**：

   内置 CDN 代理（wsrv.nl），支持 URL 参数透传。

   无需处理原图，通过 API 参数即可实时控制图片宽 (w)、高 (h)、质量 (q)、裁剪 (fit) 及格式转换 (form=webp)。
   
- **🛡️ 高可用设计**：

	智能降级：当 CDN 服务不可用时，自动回源 GitHub 直链，并根据文件后缀动态修正 Content-Type。

	防重复：支持 not_id 参数，确保连续请求不出现同一张图。

	全局缓存：Worker 级缓存 JSON 配置，减少 GitHub 请求频率。

- **🔀 多种响应模式**：

   302 跳转：重定向至图片真实地址（适合 background-image）。

   JSON 元数据：返回包含直链、CDN 链、分类及设备信息的 JSON 对象。

   直链输出：直接返回图片二进制流，伪装浏览器 UA 防止 403。

- **💻 现代化 UI**：提供一套简洁的演示主页和404页，集成随机抽取背景图片的案例与参数说明文档。

## 部署和使用

1. 准备图片仓库

	你可以使用现有的公开 GitHub 仓库，或者新建一个。

	图片可以存放在仓库的任意目录下。

	不再强制要求特定的文件夹结构（如 /jpg/），只需在 JSON 中填写完整路径（包含后缀）即可。

2. 编写图片信息文件 (image.json)

	创建一个 image.json 文件（放在仓库或任意可公网访问的地方）。采用扁平化键值对结构：

	```
	{
	  "unique_id_01": {
		"src": "mobile/1.jpg",
		"category": ["anime", "mobile"],
		"device": ["mobile"]
	  },
	  "unique_id_02": {
		"src": "wallpapers/sky.png",
		"title": "高清蓝天",
		"repo": "backup_repo", 
		"category": ["scenery", "blue"],
		"device": ["pc"]
	  }
	}
	```

	- Key: 图片的唯一标识（ID）。

	- src: 图片在仓库中的相对路径（必须包含后缀，如 .jpg, .png）。

	- repo: (可选) 指定该图片所在的仓库 Key（需在 Worker 代码中配置），默认使用 default。

	- category: (数组) 图片所属的分类标签。

	- device: (数组) 适配的设备类型 (mobile, pc)。

3. 部署 Cloudflare Worker
	访问 [Cloudflare Workers](https://workers.cloudflare.com)。

	创建服务 (Create Service) -> Hello World 模板。

	复制本项目 worker.js 的全部代码到编辑器中。

	修改顶部的配置区域（见下文）。

	保存并部署。

### ⚙️ Worker 配置说明

请在 worker.js 顶部修改以下变量：

```
const jsonUrl = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/image.json";
// json文件的地址

const urlIndex = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/index.html";
// 主页模板地址

const url404 = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/404.html";
// 404模板地址

// 多仓库映射表
// 格式: "仓库标识": "仓库Raw地址前缀"
// 注意：地址末尾必须带 "/"
const repoConfig = {
    // 必须保留 default
    "default": "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/",
    
    // 可选：其他仓库
    "genshin": "https://raw.githubusercontent.com/Cheshire-Nya/random-genshin-img/main/"
};

const redirectProxy = 2;
// 代理模式（使用场景通常是type=302）: 
// 0 = GitHub 直链 (不推荐，国内访问慢)
// 1 = Worker 代理 (消耗 Worker 流量及次数)
// 2 = 第三方 CDN 代理 (使用 wsrv.nl 加速)
<!--
const resizeHost = "https://wsrv.nl/?url=";
// 统一使用的图片处理/代理 CDN
-->

const availableExtraForms = ["webp"];
//除默认的jpg外，你额外增加的可以返回的图片格式

<!--
const availableDevices = ["mobile", "pc"];
//一般不需要改这个了，改了就要改代码，如果可以更加细分设备，欢迎pr
-->
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
      <td>指定分类。<span class="tag-tip">留空则随机全分类。</span></td>
    </tr>
    <tr>
      <td><strong>device</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>pc/mobile</code><br><code>invalid</code></td>
      <td><strong>invalid</strong>: 全池随机。<span class="tag-tip">留空自动判断设备。</span></td>
    </tr>
    <tr>
      <td><strong>type</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>302</code><br><code>json</code></td>
      <td><strong>json</strong>: 返回元数据。<br><strong>(空)</strong>: 直接返回图片。</td>
    </tr>
    <tr>
      <td><strong>id</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>Integer</code></td>
      <td>获取第 N 张图。<span class="tag-warn">⚠️ 建议配合 device 使用。</span></td>
    </tr>
    <tr>
      <td><strong>form</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>webp/jpg</code></td>
      <td>指定格式 (支持自动转码)。</td>
    </tr>
    <tr>
      <td><strong>CDN参数</strong><br><span class="tag tag-opt">透传</span></td>
      <td><code>w</code>, <code>h</code>, <code>q</code>...</td>
      <td>
        支持 <a href="https://wsrv.nl/" target="_blank" style="color:var(--accent-color)">wsrv.nl</a> 的所有参数。<br>
        例: <code>w=200</code> (宽200), <code>q=80</code> (质量80)<br>
		但为了保持对本地存储额外格式图片的支持，<code>output</code>是无效的
      </td>
    </tr>
  </tbody>
</table>

### 示例

[https://demo5.randomimg.sfacg.ltd](https://demo5.randomimg.sfacg.ltd)主页

[https://demo5.randomimg.sfacg.ltd/api?filt=greyscale](https://demo5.randomimg.sfacg.ltd/api?filt=greyscale)输出黑白滤镜【在使用cdn代理图片时】

[https://demo5.randomimg.sfacg.ltd/api](https://demo5.randomimg.sfacg.ltd/api)不带参数自动判断设备无视分类抽取

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
	
	CDN Error: ${response.status}
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





