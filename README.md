# easy-random-img-api

一个基于 Cloudflare Workers 的轻量级、高性能随机图片 API 服务。

## 📖 简介 | Introduction
利用 Cloudflare Workers 的无服务器特性，配合 GitHub 仓库作为存储后端，构建了一个零成本、响应速度极快的随机图片 API。不仅支持多分类管理，还通过集成 CDN 实现实时的图片压缩、格式转换和裁剪，非常适合用于网站背景、博客配图或小程序开发。

**快给我点star ⭐️**

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

**快速部署**<br>
	1.准备仓库以及资源<br>
	<br>
	Fork本仓库后需要保留 wrangler.toml、worker.js<br>
	<br>
	以及html-template/...、scripts/validate_json.py、.github/check.yml<br>
	<br>
	随后在worker.js顶部配置区域中修改变量（见下文配置说明）<br>
	<br>
	并在仓库中存放你的图片资源<br>
	<br>
	最后确认scripts/validate_json.py、.github/check.yml中的路径正确以保证image.json自动校验正常运行<br>
  	<br>
	2. 创建并编写图片信息文件 (image.json)<br>
	<br>
	创建一个 image.json 文件（放在仓库或任意可公网访问的地方）。采用扁平化键值对结构：

	
	{
	  "unique_id_01": {
		"src": "mobile/1.jpg",
		"category": ["anime", "mobile"],
		"device": ["mobile"]
	  },
	  "unique_id_02": {
		"src": "wallpapers/sky.png",
		"title": "高清蓝天",
		"repo": "scenery_repo", 
		"category": ["scenery", "blue"],
		"device": ["pc"]
	  }
	}
<br>
	- Key: 图片的唯一标识（ID）。<br>
	<br>
	- src: 图片在仓库中的相对路径（必须包含后缀，如 .jpg, .png）。<br>
	<br>
	- repo: (可选) 指定该图片所在的仓库 Key（需在 Worker 代码中配置），默认使用 default。<br>
	<br>
	- category: (数组) 图片所属的分类标签。<br>
	<br>
	- device: (数组) 适配的设备类型 (mobile, pc)。<br>
	<br>
	3.部署 Cloudflare Worker<br>
  <br>
  	访问 [Cloudflare Workers](https://workers.cloudflare.com)。<br>
<br>
	创建应用程序 -> Continue with GitHub<br>
<br>
	验证绑定github用户后选择上两步准备的仓库 -> 下一步<br>
<br>
	项目名称可以随意取，其他选项参数均不需要修改 -> 部署<br>
<br>
	第一次部署后，cloudflare机器人会对仓库提出pr以修正 wrangler.toml 中应用名称的错误，直接合并请求<br>
<br>
	以后每次对仓库main分支修改后cloudflare都会自动重新部署代码<br>
	<br>
	同时系统会自动检查 image.json 是否有重复 Key。如果发现重复，GitHub 会发送邮件通知你（且不影响正常部署）。<br>
<br>

**传统部署**<br>
	<br>
	1. 准备图片仓库<br>
<br>
	你可以使用现有的公开 GitHub 仓库，或者新建一个。<br>
<br>
	图片可以存放在仓库的任意目录下。<br>
<br>
	不再强制要求特定的文件夹结构（如 /jpg/），只需在 JSON 中填写完整路径（包含后缀）即可。<br>
<br>
	2. 编写图片信息文件 (image.json)<br>
<br>
	创建一个 image.json 文件（放在仓库或任意可公网访问的地方）。采用扁平化键值对结构：<br>

	{
	  "unique_id_01": {
		"src": "mobile/1.jpg",
		"category": ["anime", "mobile"],
		"device": ["mobile"]
	  },
	  "unique_id_02": {
		"src": "wallpapers/sky.png",
		"title": "高清蓝天",
		"repo": "scenery_repo", 
		"category": ["scenery", "blue"],
		"device": ["pc"]
	  }
	}
<br>
	- Key: 图片的唯一标识（ID）。<br>
<br>
	- src: 图片在仓库中的相对路径（必须包含后缀，如 .jpg, .png）。<br>
<br>
	- repo: (可选) 指定该图片所在的仓库 Key（需在 Worker 代码中配置），默认使用 default。<br>
<br>
	- category: (数组) 图片所属的分类标签。<br>
<br>
	- device: (数组) 适配的设备类型 (mobile, pc)。<br>
<br>
	3. 部署 Cloudflare Worker<br>
	<br>
	访问 [Cloudflare Workers](https://workers.cloudflare.com)。<br>
<br>
	创建应用程序 (Create Service) -> Hello World 模板。<br>
<br>
	复制本项目 worker.js 的全部代码到编辑器中。<br>
<br>
	修改顶部的配置区域（见下文）。<br>
<br>
	保存并部署。<br>
<br>
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
    "default": "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/jpg/",
    
    // 可选：其他仓库
    "genshin": "https://raw.githubusercontent.com/Cheshire-Nya/random-genshin-img/main/"
};

const redirectProxy = 2;
// 代理模式（使用场景通常是type=302）: 
// 0 = GitHub 直链 (不推荐，国内访问慢)
// 1 = Worker 代理 (消耗 Worker 流量及次数)
// 2 = 第三方 CDN 代理 (使用 wsrv.nl 加速)
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
      <td>指定分类。<span class="tag-tip">留空则在所有分类中随机抽取。</span></td>
    </tr>
    <tr>
      <td><strong>device</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>pc</code><br><code>mobile</code><br><code>invalid</code></td>
      <td>
        <strong>pc/mobile</strong>: 强制筛选特定设备。<br>
        <strong>invalid</strong>: 全池随机模式（混合所有设备图）。<br>
        <span class="tag-tip">留空则根据 User-Agent 自动判断。</span>
      </td>
    </tr>
    <tr>
      <td><strong>type</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>302</code><br><code>json</code><br><code>(空)</code></td>
      <td>
        <strong>302</strong>: 跳转到图片真实地址 (默认)。<br>
        <strong>json</strong>: 返回包含图片信息、CDN链接、元数据的 JSON。<br>
        <strong>(空)</strong>: 直接返回图片二进制流。
      </td>
    </tr>
    <tr>
      <td><strong>id</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>Integer</code> / <code>String</code></td>
      <td>
        <strong>数字</strong>: 获取筛选结果中的第 N 张图。<br>
        <strong>字符串</strong>: 直接获取指定 Key 的图片 (如 <code>id=miku_01</code>)。
      </td>
    </tr>
    <tr>
      <td><strong>not_id</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>String (Key)</code></td>
      <td>
        传入当前图片的 Key (如 <code>keli_01</code>)。<br>
        <span class="tag-tip">API 将确保随机出的下一张图不是这张 (用于去重)。</span>
      </td>
    </tr>
    <tr>
      <td><strong>form</strong><br><span class="tag tag-opt">可选</span></td>
      <td><code>webp</code> / <code>jpg</code></td>
      <td>指定返回格式。系统会自动判断是否需要通过 CDN 转码。</td>
    </tr>
    <tr>
      <td><strong>CDN参数</strong><br><span class="tag tag-opt">透传</span></td>
      <td><code>w</code>, <code>h</code>, <code>q</code>...</td>
      <td>
        支持 <a href="https://wsrv.nl/" target="_blank" style="color:var(--accent-color)">wsrv.nl</a> 的所有处理参数。<br>
        例: <code>w=200</code> (宽200), <code>q=75</code> (质量75), <code>fit=cover</code>
      </td>
    </tr>
  </tbody>
</table>

### 🔗 调用示例

- **主页**：[https://demo5.randomimg.sfacg.ltd](https://demo5.randomimg.sfacg.ltd)

- **随机获取一张图 (自动适配设备)**：[https://demo5.randomimg.sfacg.ltd/api](https://demo5.randomimg.sfacg.ltd/api)

- **随机获取一张category1分类的图**：[https://demo5.randomimg.sfacg.ltd/api?cat=category1](https://demo5.randomimg.sfacg.ltd/api?cat=category1)

- **获取一张 WebP 格式、质量 75 的图**：[https://demo5.randomimg.sfacg.ltd/api?form=webp&q=75](https://demo5.randomimg.sfacg.ltd/api?form=webp&q=75)category1分类webp，自动识别设备类型

- **禁用设备判断，无视分类全池抽取**：[https://demo5.randomimg.sfacg.ltd/api?device=invalid](https://demo5.randomimg.sfacg.ltd/api?device=invalid)

- **获取图片的详细 JSON 信息**：[https://demo5.randomimg.sfacg.ltd/api?cat=category2&type=json](https://demo5.randomimg.sfacg.ltd/api?cat=category2&type=json)随机抽取`category2`分类并返回json

- **防止获取到 ID 为 miku_01 的图 (去重)：**[https://demo5.randomimg.sfacg.ltd/api?not_id=keli_01](https://demo5.randomimg.sfacg.ltd/api?not_id=keli_01)

- **302跳转到随机一张图的准确地址**：[https://demo5.randomimg.sfacg.ltd/api?type=302](https://demo5.randomimg.sfacg.ltd/api?type=302)

PS:cloudflare提供的`workers.dev`域名在大陆无法正常解析，所以演示站是添加的自定义域名

### 响应/错误返回说明
- 📦 JSON 响应示例
```
{
  "categories": ["anime", "miku"], // 图片所属分类
  "device": "mobile",              // 图片所属设备
  "id": 5,                         // 在当前筛选列表中的索引
  "key": "miku_v4",                // 图片的唯一 Key (ID)
  "repo": "default",               // 来源仓库
  "form": "webp",
  "githubUrl": "https://raw.githubusercontent.com/.../miku_v4.jpg",
  "workerUrl": "https://api.site/api?cat=anime&id=miku_v4&form=webp",
  "proxyUrl": "https://wsrv.nl/?url=...&output=webp",
  "metadata": {                    // image.json 中定义的额外信息
    "title": "初音未来 V4",
    "author": "iXima"
  }
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

## 🛠️ 常见问题 (FAQ)
	
**1.为什么返回 403 Forbidden？**
	
- 通常是因为目标图片服务（GitHub 或 CDN）拦截了请求。本项目已内置 User-Agent 伪装，但如果你在浏览器直接访问 GitHub Raw 链接也打不开，说明是网络问题或仓库私有。请确保 GitHub 仓库是 Public 的。

**2.CDN 图片加载失败怎么办？**
	
- 程序内置了 自动降级 (Fallback) 机制。如果 CDN (wsrv.nl) 请求失败（403/404/500），Worker 会自动尝试直接从 GitHub 获取原始图片，并修正 Content-Type 返回给用户。

**3.关于免费额度**
	
- Cloudflare Workers 免费版每天有 100,000 次 请求额度。

-本项目已针对性优化：图片资源设置了 Cache-Control: max-age=3600，CORS 预检设置了 24 小时缓存。这意味着浏览器缓存命中时不消耗 Worker 额度。
	
## PS

- 不知道还有啥问题，如果遇到了可以提issue

1. cloudflare workers每个账户的免费额度是每天十万次请求，并且有每分钟1000次请求的限制，超出后请求会返回错误。如果不够用，可升级到 $5 的高级版本，每月可用 1000 万次请求（超出部分 $0.5/百万次请求）

2. cloudflare注册没有花里胡哨的各种认证，超低门槛，有邮箱就能注册。

3. 理论上可以无限白嫖，多注册几个账号，其他服务调用随机图时多写个逻辑返回错误请求另外的接口即可。唯一的成本是大陆访问需要绑自定义域名，但是域名可以白嫖免费域名或者一年十几二十块的便宜域名，四舍五入就是妹花钱。添加自定义域在[Cloudflare控制台](https://dash.cloudflare.com/)中`网站`里按指引操作，选择free计划即可。
