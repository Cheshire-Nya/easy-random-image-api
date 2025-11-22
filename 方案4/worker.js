var jsonUrl = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%884/image.json";
//json文件的地址
var urlIndex = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/index.html";
//主页模板地址
var url404 = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/404.html";
//404模板地址
var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/";
//图片地址前部不会发生改变的部分
//用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>/"
var redirectProxy = 1;
//type=302时返回的链接是否是经过代理的，0 不代理(返回github原链接)，1 worker代理，2 ghproxy代理
var availableDevices = ["mobile", "pc"];
var ghproxyUrl = "https://ghproxy.com/";
//(这个ghproxy有问题，除非你有其他的github代理)

//【注意】上述url中的所有中文都需写成utf8编码形式，不然会一直给你丢到404，比如我的json地址是"方案4/image.json"写成了"/%E6%96%B9%E6%A1%884/image.json"

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  let nowUrl = new URL(request.url);
  let urlSearch = nowUrl.search;

  // 允许 /api 和 /api/
  if (nowUrl.pathname === '/api' || nowUrl.pathname === '/api/') {
    if (urlSearch) {
      return extractSearch(urlSearch, request);
    } else {
      return error("No search parameters provided");
    }
  } else if (nowUrl.pathname === '/') {
    return index();
  } else {
    return error("Invalid path");
  }
}

async function extractSearch(urlSearch, request) {
  let searchParams = new URLSearchParams(urlSearch);
  let id = searchParams.get('id');
  let cats = searchParams.getAll('cat'); // 获取所有cat参数
  let type = searchParams.get('type');
  let device = searchParams.get('device');

  //改动：检查cats数组是否有长度，而不仅仅是检查是否存在
  if (cats && cats.length > 0) {
    const response = await fetch(jsonUrl);
    
    // 检查 JSON 是否获取成功
    if (!response.ok) return error("Failed to fetch JSON config");
    
    const imgList = await response.json();
    let availableCategories = Object.keys(imgList);

    //这里会区分大小写。如果你的URL是?cat=jk，JSON key也必须也是 "jk"
    if (!cats.every(cat => availableCategories.includes(cat))) {
      return error("Category not found in JSON"); 
    }

    const category = cats[Math.floor(Math.random() * cats.length)];
    const selectedList = imgList[category];

    // 如果指定了设备
    if (device) {
      // 检查JSON中是否有该设备类型
      if (!selectedList[device]) return error("Device not found in category");

      if (!searchParams.has('id')) {
        // 有设备，无id随机取该设备的一张图
        const values = selectedList[device];
        const trueId = Math.floor(Math.random() * values.length);
        const img = values[trueId];
        
        if (type === '302') return redirect(trueId + 1, img, category, device, request);
        if (type === 'json') return typejson(trueId + 1, img, category, device, request);
        if (!type) return image(img);
        return error("Invalid type param");
      } 
      else if (id) {
        // 有设备，有id就转到特定图片
        const values = selectedList[device];
        // 防止id超过fanwei
        if (id < 1 || id > values.length) return error("ID out of range");
        
        const trueId = id - 1;
        const img = values[trueId];
        
        if (type === 'json') return typejson(id, img, category, device, request);
        if (!type) return image(img);
        return error("Invalid type with ID");
      } 
      else return error("ID parameter is empty");
    }
    
    // 如果未指定设备 (自动随机设备)
    if (!device) {
      let randomDevice = availableDevices[Math.floor(Math.random() * availableDevices.length)];
      
      // 维持原逻辑，但给出明确错误。
      if (searchParams.has('id')) {
         return error("Cannot specify ID without specifying Device");
      }

      const values = selectedList[randomDevice];
      if (!values) return error("Random device list missing");

      const trueId = Math.floor(Math.random() * values.length);
      const img = values[trueId];

      if (type === '302') return redirect(trueId + 1, img, category, randomDevice, request);
      if (type === 'json') return typejson(trueId + 1, img, category, randomDevice, request);
      if (!type) return image(img);
      return error("Invalid type param");
    }
    
    return error("Unknown logic error");
  } else {
    return error("No category specified");
  }
}

function image(img) {
  // 原let encodedImg = encodeURIComponent(img); 
  // 会把 'demoimg/1.jpg' 变成 'demoimg%2F1.jpg'
  //按斜杠分割，只转义每一部分（例如处理空格），然后再用斜杠拼回去
  let encodedImg = img.split('/').map(part => encodeURIComponent(part)).join('/');
  
  let imgUrl = imgHost + encodedImg;
  let getimg = new Request(imgUrl);
  return fetch(getimg, {
    headers: {
      'cache-control': 'max-age=0, s-maxage=0',
      'content-type': 'image/jpeg',
      'Cloudflare-CDN-Cache-Control': 'max-age=0',
      'CDN-Cache-Control': 'max-age=0'
    },
  });  
}

function redirect(id, img, category, device, request) {
  // 同样使用智能转义处理路径
  let encodedImg = img.split('/').map(part => encodeURIComponent(part)).join('/');
  
  if (redirectProxy === 0) {
    const redirectUrl = imgHost + encodedImg; // 使用处理后的路径
    return type302(redirectUrl);
  }
  else if (redirectProxy === 1) {
    const nowUrl = new URL(request.url);
    const myHost = nowUrl.hostname;
    const redirectUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id;
    return type302(redirectUrl);
  }
  else if (redirectProxy === 2) {
    const redirectUrl = ghproxyUrl + imgHost + encodedImg; // 使用处理后的路径
    return type302(redirectUrl);
  }
  else return error("Invalid redirect config");
}

function type302(redirectUrl) {
  return new Response("", {
    status: 302,
    headers: {
      Location: redirectUrl
    }
  });
}

function typejson(id, img, category, device, request) {
  let nowUrl = new URL(request.url);
  let myHost = nowUrl.hostname;
  let githubUrl = imgHost + img;
  // 修正 query 拼接
  let workerUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id;
  let proxyUrl = ghproxyUrl + imgHost + img;   
  return new Response(
    JSON.stringify({
      "category": category,
      "device": device,
      "id": id,
      "githubUrl": githubUrl,
      "workerUrl": workerUrl,
      "proxyUrl": proxyUrl
    }, null, 2), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// 优化后的 Error 函数，带 Debug Header

async function error(reason = "Unknown Error") {
  let htmlContent = "";
  let isFallback = false;

  try {
    const response = await fetch(url404);
    // 如果 404 模板加载成功 (状态码 200-299)
    if (response.ok) {
      htmlContent = await response.text();
    } else {
      throw new Error("404 Template not found");
    }
  } catch (e) {
    // 如果连 404 模板都获取失败，使用这个备用的简易 HTML
    isFallback = true;
    htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 Not Found</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
        h1 { font-size: 48px; color: #333; }
        p { font-size: 18px; color: #666; }
        .debug { margin-top: 20px; padding: 10px; background: #fff; border: 1px solid #ddd; display: inline-block; text-align: left; color: #d9534f; }
      </style>
    </head>
    <body>
      <h1>404 - Not Found</h1>
      <p>The requested image or category could not be found.</p>
      <div class="debug">
        <strong>Debug Info:</strong><br>
        Reason: ${reason}<br>
        <small>(Note:404.html template also failed to load, so you are seeing this fallback page.)</small>
      </div>
    </body>
    </html>
    `;
  }

  return new Response(htmlContent, {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Error-Reason': reason,
      'X-Error-Fallback': isFallback ? 'true' : 'false'
    }
  });
}

async function index() {
  let response = await fetch(urlIndex);
  return new Response(response.body, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html' }
  });
}