// ================= 配置区域 =================

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

//【注意】上述url中的所有中文都需写成utf8编码形式，不然会一直给你丢到404，比如我的json地址是"/方案5/image.json"写成了"/%E6%96%B9%E6%A1%885/image.json"
// ===========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};


addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  let nowUrl = new URL(request.url);
  let urlSearch = nowUrl.search;

  if (nowUrl.pathname === '/api' || nowUrl.pathname === '/api/') {
    return extractSearch(urlSearch, request);
  } else if (nowUrl.pathname === '/') {
    return index();
  } else {
    return error("Invalid Path");
  }
}

async function extractSearch(urlSearch, request) {
  let searchParams = new URLSearchParams(urlSearch);
  let id = searchParams.get('id');
  let cats = searchParams.getAll('cat');
  let type = searchParams.get('type');
  let device = searchParams.get('device');
  let returnForm = searchParams.get('form');

  if (!returnForm) {
    returnForm = 'jpg';
  } else if (returnForm !== 'jpg' && !availableExtraForms.includes(returnForm)) {
    return error("Invalid image format: " + returnForm);
  }

  const response = await fetch(jsonUrl);
  if (!response.ok) return error("Failed to fetch JSON config");
  
  const imgList = await response.json();
  let availableCategories = Object.keys(imgList);

  let candidateCats = [];
  if (cats && cats.length > 0) {
      if (!cats.every(cat => availableCategories.includes(cat))) {
          return error("Category not found");
      }
      candidateCats = cats;
  } else {
      candidateCats = availableCategories;
  }

  const category = candidateCats[Math.floor(Math.random() * candidateCats.length)];
  const selectedList = imgList[category];

  let selectedDevice = device;
  let values = [];
  let isMixedPool = false;

  if (selectedDevice === 'invalid') {
      isMixedPool = true;
      for (let devKey in selectedList) {
          let imgs = selectedList[devKey];
          if (Array.isArray(imgs)) {
              imgs.forEach(imgItem => {
                  values.push({ i: imgItem, d: devKey });
              });
          }
      }
      if (values.length === 0) return error("Category is empty");
  } 
  else {
      if (!selectedDevice) selectedDevice = getDeviceType(request);
      
      if (!selectedList[selectedDevice]) {
          if (selectedDevice === 'mobile' && selectedList['pc']) selectedDevice = 'pc';
          else if (selectedDevice === 'pc' && selectedList['mobile']) selectedDevice = 'mobile';
          else return error(`Device '${selectedDevice}' data missing`);
      }
      values = selectedList[selectedDevice];
  }

  let trueId;
  let img;

  if (searchParams.has('id')) {
      let reqId = parseInt(id);
      if (isNaN(reqId) || reqId < 1 || reqId > values.length) return error("ID out of range");
      trueId = reqId - 1;
  } else {
      trueId = Math.floor(Math.random() * values.length);
  }

  let rawItem = values[trueId];

  if (isMixedPool) {
      img = rawItem.i;
      selectedDevice = rawItem.d; 
  } else {
      img = rawItem;
  }

  if (type === '302') {
    return redirect(trueId + 1, img, category, selectedDevice, returnForm, request);
  } 
  else if (type === 'json') {
    return typejson(trueId + 1, img, category, selectedDevice, returnForm, request);
  } 
  else if (!type) {
    return image(img, returnForm, category, selectedDevice);
  } 
  else {
    return error("Invalid type parameter");
  }
}


function getDeviceType(request) {
  const ua = request.headers.get('User-Agent') || "";
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  if (mobileRegex.test(ua)) return "mobile";
  return "pc";
}


function smartEncodePath(path) {
    return path.split('/').map(part => encodeURIComponent(part)).join('/');
}


function getGithubSourceUrl(img, returnForm) {
  let encodedImg = smartEncodePath(img);
  if (imgResize === 1 && returnForm !== 'jpg') {
      return imgHost + "jpg/" + encodedImg + ".jpg";
  }
  return imgHost + returnForm + "/" + encodedImg + "." + returnForm;
}


function getCdnProxyUrl(githubUrl, returnForm) {
  let url = resizeHost + githubUrl;
  
  if (imgResize === 1 && returnForm !== 'jpg') {
      url += "&output=" + returnForm;
  }
  return url;
}


async function image(img, returnForm, category, device) {
  let githubUrl = getGithubSourceUrl(img, returnForm);
  let fetchUrl = getCdnProxyUrl(githubUrl, returnForm);
  let contentType = returnForm === 'jpg' ? 'image/jpeg' : `image/${returnForm}`;
  
  let response = await fetch(fetchUrl, {
      headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://github.com/"
      }
  });

  if (!response.ok) {
      return error(`CDN Error: ${response.status}`);
  }

  let newHeaders = new Headers(response.headers);
  newHeaders.set('Content-Type', contentType);
  newHeaders.set('X-Image-Category', category);
  newHeaders.set('X-Image-Device', device);
  newHeaders.set('Access-Control-Expose-Headers', 'X-Image-Category, X-Image-Device');
  newHeaders.set('Cache-Control', 'max-age=0, s-maxage=0');
  
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });  
}


function redirect(id, img, category, device, returnForm, request) {
  let nowUrl = new URL(request.url);
  
  let githubUrl = getGithubSourceUrl(img, returnForm);
  
  let targetUrl = "";

  if (redirectProxy === 0) {
    targetUrl = githubUrl;
  }
  else if (redirectProxy === 1) {
    const myHost = nowUrl.hostname;
    targetUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id + "&form=" + returnForm;
  }
  else if (redirectProxy === 2) {
    targetUrl = getCdnProxyUrl(githubUrl, returnForm);
  }
  else return error("Redirect Config Error");

  return type302(targetUrl);
}


function typejson(id, img, category, device, returnForm, request) {
  let nowUrl = new URL(request.url);
  let myHost = nowUrl.hostname;
  let githubUrl = getGithubSourceUrl(img, returnForm);
  
  let workerUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id + "&form=" + returnForm;
  let proxyUrl = getCdnProxyUrl(githubUrl, returnForm);

  return new Response(
    JSON.stringify({
      "category": category,
      "device": device,
      "id": id,
      "form": returnForm,
      "githubUrl": githubUrl,
      "workerUrl": workerUrl,
      "proxyUrl": proxyUrl
    }, null, 2), {
    headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
    }
  });
}


function type302(redirectUrl) {
  return new Response("", {
    status: 302,
    headers: { Location: redirectUrl }
  });
}


async function error(reason = "Unknown Error") {
  let htmlContent = "";
  let isFallback = false;

  try {
    const response = await fetch(url404);
    if (response.ok) {
      htmlContent = await response.text();
    } else {
      throw new Error("404 Template Fetch Failed");
    }
  } catch (e) {
    isFallback = true;
    htmlContent = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 Not Found (Fallback)</title>
      <style>
        :root {
            --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --glass-bg: rgba(255, 255, 255, 0.1);
            --glass-border: rgba(255, 255, 255, 0.2);
            --text-color: #ffffff;
            --text-secondary: #e2e8f0;
            --box-bg: rgba(0, 0, 0, 0.2);
        }
        body {
          margin: 0;
          font-family: system-ui, -apple-system, sans-serif;
          background: var(--bg-gradient);
          color: var(--text-color);
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .container {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 3rem;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        h1 { margin: 0 0 1rem; font-size: 3rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        p { font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem; }
        .debug-box {
          background: var(--box-bg);
          padding: 1rem;
          border-radius: 8px;
          text-align: left;
          font-size: 0.9rem;
          border: 1px solid var(--glass-border);
        }
        .tag {
          display: inline-block;
          background: #e53e3e;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
        }
        code { font-family: monospace; color: #feb2b2; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404</h1>
        <p>无法找到请求的资源。</p>
        
        <div class="debug-box">
          <span class="tag">Fallback Mode</span><br>
          <strong>Error Reason:</strong><br>
          <code>${reason}</code>
          <br><br>
          <small style="color: #cbd5e0;">
            (注意: 404模板加载失败，您正在查看内置备用页面。)
          </small>
        </div>
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
      'X-Error-Fallback': isFallback ? 'true' : 'false',
      ...corsHeaders 
    }
  });
}


async function index() {
  let response = await fetch(urlIndex);
  return new Response(response.body, { status: 200, headers: { 'Content-Type': 'text/html' } });
}