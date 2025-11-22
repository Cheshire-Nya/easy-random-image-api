# easy-random-img-api

## 简介

白嫖Github仓库和Cloudflare Workers简单快捷实现可分类的随机图片抽取

（写着玩，屎山，别喷我，叠甲，叠甲，叠甲，叠甲，叠甲）

相比较4，增加了可以使用`form`参数返回其他格式图片，比如webp。

**当然，需要参照本文件夹下的`image.json`自行编写json文件**

cloudflare worker无法使用使用canvas api或第三方库进行转码，**所以其他格式图片需要自行上传，且不同格式图片文件夹的目录结构、文件名须保持一致**，目录格式参照本文件夹下的`jpg`，`webp`

图片批量转码和压缩推荐使用[caesium](https://saerasoft.com/caesium#downloads)，可以保留目录结构转码压缩

## 演示

[https://demo5.randomimg.sfacg.ltd](https://demo5.randomimg.sfacg.ltd)主页

[https://demo5.randomimg.sfacg.ltd/api](https://demo5.randomimg.sfacg.ltd/api)`cat`为必须参数，不存在就返回404

[https://demo5.randomimg.sfacg.ltd/api?cat=category1](https://demo5.randomimg.sfacg.ltd/api?cat=category1)无form默认jpg且**自动识别设备类型（129行的函数，应该能判断出大部分设备，可以修改）**

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&form=webp](https://demo5.randomimg.sfacg.ltd/api?cat=category1&form=webp)`category2`分类webp，自动识别设备类型

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&cat=category2](https://demo5.randomimg.sfacg.ltd/api?cat=category1&cat=category2)多分类抽取自动识别设备类型

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&device=mobile&id=2](https://demo5.randomimg.sfacg.ltd/api?cat=category1&device=mobile&id=2)抽取`image.json`中`category1`分类适合移动端查看的第2张图

[https://demo5.randomimg.sfacg.ltd/api?cat=category2&type=json](https://demo5.randomimg.sfacg.ltd/api?cat=category2&type=json)随机抽取`category2`分类并返回json

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&device=pc&id=2&type=json](https://demo5.randomimg.sfacg.ltd/api?cat=category1&device=pc&id=2&type=json)指定`category1`分类适合pc端的第二张并返回json

[https://demo5.randomimg.sfacg.ltd/api?cat=category1&type=302](https://demo5.randomimg.sfacg.ltd/api?cat=category1&type=302)以302返回跳转到随机一张图的准确地址，供网页使用

PS:cloudflare提供的`workers.dev`域名在大陆无法正常解析，所以演示站是添加的自定义域名

## 部署和使用

Github随便新建个公开仓库，**新建文件夹`jpg`和其他你想要的格式对应的文件夹，jpg图片塞进jpg文件夹这样**

**参照`image.json`编写你自己的json文件**，随便放哪里，仓库、其他网站目录或服务器都行，只要能通过公网访问到即可

Cloudflare Worker首页：https://workers.cloudflare.com

注册，登陆，`start building`，取一个worker子域名，`创建服务`，不需要使用模板创建worker，直接hello weorld创建即可。

进入编辑后复制 本文件夹下的 `worker.js`  到左侧代码框，**按照代码中的注释和自己的需求修改代码**，`保存并部署`。

### 需要修改的变量

#### 必选

- `urlIndex`：主页模板的地址

- `url404`：404页模板的地址

- `imgHost`：图片仓库的地址，通常为此格式`https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>/`（即`jpg`的上级目录）

- `jsonUrl`：存储图片信息的json文件地址

- `availableExtraForms`：除jpg外新添加的其他格式

- `availableDevices`：图片分辨率适合的设备分类，**一般不需要改这个了，改了就要改代码，如果可以更加细分设备，欢迎pr**

#### 可选

- `redirectProxy`：返回类型为302时图片使用的代理，默认为`1`。

   `0`不使用代理（返回github原地址）

   `1`(不推荐)使用worker本身代理（返回`https://example.com/api?category1&id=1`这样的链接）

   ~~`2`(推荐)使用ghproxy代理（返回`ghproxy.com`代理的链接）~~ ghproxy似乎寄了，演示站现在用的是1  

   PS：如果302返回使用的是worker代理，那么请求一次就是请求了worker两次。那我问你🤓👆

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
    <td align="center">json文件中的key</td>
    <td>在该分类中抽取图片</td>
  </tr>
  <tr>
    <td align="center" rowspan="2">type</td>
    <td align="center">302<br>(存在id时不允许type=302)</td>
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
    <td align="center">id</td>
    <td align="center">&lt;数值&gt;</td>
    <td>返回排序为第&lt;数值&gt;张的指定图片</td>
  </tr>
  <tr>
    <td align="center">form</td>
    <td align="center">自行添加的其他图片格式</td>
    <td>返回对应格式的图片，不存在时默认返回jpg</td>
  </tr>
</tbody>
</table>
PS：

- 从多个分类中抽取应按此格式`https://example.com/api?cat=category1&cat=category2`

- json返回包含:分类`cat`,适合的设备`device`,图片id`id`,图片github原链接`githubUrl`,worker代理链接`workerUrl`,ghproxy代理链接`proxyUrl`
<!--
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
-->

## PS

- 不知道还有啥问题，如果遇到了可以提issue

1. cloudflare workers每个账户的免费额度是每天十万次请求，并且有每分钟1000次请求的限制，超出后请求会返回错误。如果不够用，可升级到 $5 的高级版本，每月可用 1000 万次请求（超出部分 $0.5/百万次请求）

2. cloudflare注册没有花里胡哨的各种认证，超低门槛，有邮箱就能注册。

3. 理论上可以无限白嫖，多注册几个账号，其他服务调用随机图时多写个逻辑返回错误请求另外的接口即可。唯一的成本是大陆访问需要绑自定义域名，但是域名可以白嫖免费域名或者一年十几二十块的便宜域名，四舍五入就是妹花钱。添加自定义域在[Cloudflare控制台](https://dash.cloudflare.com/)中`网站`里按指引操作，选择free计划即可。

4. **~~错误返回偷懒没完善~~**(差不多好了)

5. **主页和404页没啥卵用，建议用的时候删了**

## TODO（咕咕咕）

- [ ] 待定



