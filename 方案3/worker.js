var jsonUrl = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%883/image.json";
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

var ghproxyUrl = "https://ghproxy.com/";

//【注意】上述url中的所有中文都需写成utf8编码形式，不然会一直给你丢到404，比如我的json地址是"方案3/image.json"写成了"/%E6%96%B9%E6%A1%883/image.json"

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


//开始吟唱
async function extractSearch(urlSearch, request) {
  let searchParams = new URLSearchParams(urlSearch);
  let id = searchParams.get('id');
  let cats = searchParams.getAll('cat'); // 获取所有 cat 参数
  let type = searchParams.get('type');

  //确保真的传了分类参数
  if (cats && cats.length > 0) {
    
    // 获取 JSON 配置
    const response = await fetch(jsonUrl);
    
    //检查 JSON 是否成功获取
    if (!response.ok) {
      return error("Failed to fetch JSON config");
    }

    const jsonData = await response.json();

    const existingCats = cats.filter(cat => jsonData.hasOwnProperty(cat));
    if (existingCats.length !== cats.length) {
      return error("Category not found in JSON");
    }

    // 随机选一个分类
    const category = existingCats[Math.floor(Math.random() * existingCats.length)];
    const values = jsonData[category];

    if (!values || values.length === 0) {
      return error("Category is empty");
    }

    let trueId;
    let img;

    if (searchParams.has('id')) {
      let reqId = parseInt(id);
      
      if (isNaN(reqId)) {
        return error("ID must be a number");
      }
      
      if (reqId < 1 || reqId > values.length) {
        return error("ID out of range (1-" + values.length + ")");
      }
      
      trueId = reqId - 1; // 转换为数组索引
      img = values[trueId];
      
    } else {
      trueId = Math.floor(Math.random() * values.length);
      img = values[trueId];
    }

    if (type === '302') {
      return redirect(trueId + 1, img, category, request);
    } 
    else if (type === 'json') {
      return typejson(trueId + 1, img, category, request);
    } 
    else if (!type) {
      return image(img);
    } 
    else {
      return error("Invalid type param");
    }

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


function redirect(id, img, category, request) {
  // 同样使用智能转义处理路径
  let encodedImg = img.split('/').map(part => encodeURIComponent(part)).join('/');
  
  if (redirectProxy === 0) {
    const redirectUrl = imgHost + encodedImg; // 使用处理后的路径
    return type302(redirectUrl);
  }
  else if (redirectProxy === 1) {
    const nowUrl = new URL(request.url);
    const myHost = nowUrl.hostname;
    const redirectUrl = "https://" + myHost + "/api" + "?cat=" + category + "&id=" + id;
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


function typejson(id, img, category, request) {
  let nowUrl = new URL(request.url);
  let myHost = nowUrl.hostname;
  let githubUrl = imgHost + img;
  // 修正 query 拼接
  let workerUrl = "https://" + myHost + "/api" + "?cat=" + category + "&id=" + id;
  let proxyUrl = ghproxyUrl + imgHost + img;   
  return new Response(
    JSON.stringify({
      "category": category,
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