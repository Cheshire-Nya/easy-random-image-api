// ================= 配置区域 =================

const jsonUrl = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/image.json";
// json文件的地址

const urlIndex = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/index.html";
// 主页模板地址

const url404 = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/404.html";
// 404模板地址

const repoConfig = {
    "default": "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/",
    "genshin": "https://raw.githubusercontent.com/Cheshire-Nya/random-genshin-img/main/"
};
// 用于图片存储的仓库分支(支持多个仓库分开存储)
// 用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>/"

const redirectProxy = 2;
// 代理模式: 
// 0 = GitHub 直链 (不推荐，国内访问慢)
// 1 = Worker 代理 (消耗 Worker 流量及次数)
// 2 = 第三方 CDN 代理 (使用 wsrv.nl 加速)


const resizeHost = "https://wsrv.nl/?url=";
// 统一使用的图片处理/代理 CDN

const availableExtraForms = ["webp"];
//除默认的jpg外，你额外增加的可以返回的图片格式

const availableDevices = ["mobile", "pc"];
//一般不需要改这个了，改了就要改代码，如果可以更加细分设备，欢迎pr

//【注意】上述url中的所有中文都需写成utf8编码形式，不然会一直给你丢到404，比如我的json地址是"/方案5/image.json"写成了"/%E6%96%B9%E6%A1%885/image.json"
// ===========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};


let cachedImgList = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000;

async function getOrFetchJson() {
  const now = Date.now();
  if (cachedImgList && (now - lastFetchTime < CACHE_TTL)) {
    return cachedImgList;
  }
  const response = await fetch(jsonUrl);
  if (!response.ok) throw new Error("Failed to fetch JSON config");
  cachedImgList = await response.json();
  lastFetchTime = now;
  return cachedImgList;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
  let notId = searchParams.get('not_id');

  if (!returnForm) {
    returnForm = 'jpg';
  } else if (returnForm !== 'jpg' && !availableExtraForms.includes(returnForm)) {
    return error("Invalid image format: " + returnForm);
  }

  let imgDB;
  try {
      imgDB = await getOrFetchJson();
  } catch (e) {
      return error(e.message);
  }

  let selectedDevice = device;
  if (!selectedDevice) {
      selectedDevice = getDeviceType(request);
  }

  let filteredItems = [];
  const entries = Object.entries(imgDB);

  for (const [key, item] of entries) {
      if (!item.category || !Array.isArray(item.category)) continue;
      
      let catMatch = false;
      if (cats && cats.length > 0) {
          catMatch = cats.some(c => item.category.includes(c));
      } else {
          catMatch = true; 
      }

      let devMatch = false;
      if (selectedDevice === 'invalid') {
          devMatch = true;
      } else {
          if (item.device && Array.isArray(item.device)) {
              devMatch = item.device.includes(selectedDevice);
          } else {
              devMatch = true; 
          }
      }

      if (catMatch && devMatch) {
          filteredItems.push({
              _id: key, 
              ...item
          });
      }
  }

  if (filteredItems.length === 0) {
      return error("No images found matching criteria");
  }

  let trueIndex;
  
  if (id) {
      let reqId = parseInt(id);
      if (!isNaN(reqId) && String(reqId) === id) {
          if (reqId < 1 || reqId > filteredItems.length) return error("ID out of range");
          trueIndex = reqId - 1;
      } 
      else {
          trueIndex = filteredItems.findIndex(item => item._id === id);
          if (trueIndex === -1) return error("Image Key not found");
      }
  } else {
      if (filteredItems.length <= 1) {
          trueIndex = 0;
      } else {
          let attempts = 0;
          do {
              trueIndex = Math.floor(Math.random() * filteredItems.length);
              attempts++;
          } while (notId && filteredItems[trueIndex]._id === notId && attempts < 10);
      }
  }

  let targetItem = filteredItems[trueIndex];
  
  let { src, repo, _id, category, device: itemDevice, ...metaRest } = targetItem;
  let imgPath = src;
  let repoKey = repo || "default";
  
  let metaData = { 
      id: _id, 
      category: category,
      ...metaRest 
  };

  if (type === '302') {
    return redirect(metaData.id, imgPath, category[0], selectedDevice, returnForm, request, searchParams, repoKey);
  } 
  else if (type === 'json') {
    return typejson(metaData.id, imgPath, category, selectedDevice, returnForm, request, searchParams, metaData, repoKey);
  } 
  else if (!type) {
    return image(imgPath, returnForm, category[0], selectedDevice, searchParams, metaData, repoKey);
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

function getExtraQueryString(searchParams) {
    let str = "";
    const systemParams = ['cat', 'device', 'type', 'id', 'form', 'output', 'not_id'];
    for (const [key, value] of searchParams) {
        if (!systemParams.includes(key)) {
            str += `&${key}=${encodeURIComponent(value)}`;
        }
    }
    return str;
}

function getGithubSourceUrl(img, repoKey) {
    let currentHost = repoConfig[repoKey] || repoConfig['default'];
    let encodedImg = smartEncodePath(img);
    return currentHost + encodedImg;
}

function getCdnProxyUrl(githubUrl, returnForm, searchParams) {
    let url = resizeHost + githubUrl;
    
    const lastDotIndex = githubUrl.lastIndexOf('.');
    let sourceExt = '';
    if (lastDotIndex !== -1) {
        sourceExt = githubUrl.substring(lastDotIndex + 1).toLowerCase();
    }

    const normalizedSource = sourceExt === 'jpeg' ? 'jpg' : sourceExt;
    const normalizedTarget = returnForm === 'jpeg' ? 'jpg' : returnForm;

    if (normalizedSource !== normalizedTarget) {
        url += "&output=" + returnForm;
    }

    if (searchParams) {
        url += getExtraQueryString(searchParams);
    }
    return url;
}

async function image(img, returnForm, category, device, searchParams, metaData, repoKey) {
  let githubUrl = getGithubSourceUrl(img, repoKey);
  let fetchUrl = getCdnProxyUrl(githubUrl, returnForm, searchParams);
  
  let contentType = returnForm === 'jpg' ? 'image/jpeg' : `image/${returnForm}`;
  const browserUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  let response = await fetch(fetchUrl, {
      headers: { "User-Agent": browserUA, "Referer": "https://github.com/" }
  });

  if (!response.ok) {
      let fallbackUrl = githubUrl;
      response = await fetch(fallbackUrl, { headers: { "User-Agent": browserUA } });
      
      if (response.ok) {
          const lowerImg = img.toLowerCase();
          if (lowerImg.endsWith('.png')) {
              contentType = 'image/png';
          } else if (lowerImg.endsWith('.gif')) {
              contentType = 'image/gif';
          } else if (lowerImg.endsWith('.webp')) {
              contentType = 'image/webp';
          } else {
              contentType = 'image/jpeg';
          }
      } 
      else {
          return error(`Image Load Failed`);
      }
  }

  let newHeaders = new Headers(response.headers);
  newHeaders.set('Content-Type', contentType);
  newHeaders.set('X-Image-Category', category);
  newHeaders.set('X-Image-Device', device);
  newHeaders.set('X-Image-Source-Repo', repoKey);
  
  if (metaData) {
      if (metaData.id) newHeaders.set('X-Image-Id', metaData.id);
      if (metaData.title) newHeaders.set('X-Image-Title', encodeURIComponent(metaData.title));
      if (metaData.author) newHeaders.set('X-Image-Author', encodeURIComponent(metaData.author));
  }

  newHeaders.set('Access-Control-Expose-Headers', 'X-Image-Category, X-Image-Device, X-Image-Id, X-Image-Title, X-Image-Author, X-Image-Source-Repo, X-Image-Source-Type');
  newHeaders.set('Cache-Control', 'public, max-age=3600');
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', '*');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });  
}

function redirect(id, img, category, device, returnForm, request, searchParams, repoKey) {
  let nowUrl = new URL(request.url);
  let githubUrl = getGithubSourceUrl(img, repoKey);
  let targetUrl = "";
  let extraQuery = getExtraQueryString(searchParams);

  if (redirectProxy === 0) {
    targetUrl = githubUrl;
  }
  else if (redirectProxy === 1) {
    const myHost = nowUrl.hostname;
    targetUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id + "&form=" + returnForm + extraQuery;
  }
  else if (redirectProxy === 2) {
    targetUrl = getCdnProxyUrl(githubUrl, returnForm, searchParams);
  }
  else return error("Redirect Config Error");

  return type302(targetUrl);
}

function typejson(id, img, category, device, returnForm, request, searchParams, metaData, repoKey) {
  let nowUrl = new URL(request.url);
  let myHost = nowUrl.hostname;
  let githubUrl = getGithubSourceUrl(img, repoKey);
  
  let extraQuery = getExtraQueryString(searchParams);
  let workerUrl = "https://" + myHost + "/api" + "?cat=" + category[0] + "&device=" + device + "&id=" + id + "&form=" + returnForm + extraQuery;
  let proxyUrl = getCdnProxyUrl(githubUrl, returnForm, searchParams);

  return new Response(
    JSON.stringify({
      "categories": category,
      "device": device,
      "id": id,
      "repo": repoKey,
      "form": returnForm,
      "githubUrl": githubUrl,
      "workerUrl": workerUrl,
      "proxyUrl": proxyUrl,
      "metadata": metaData
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
    } else { throw new Error("404 Template Fetch Failed"); }
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
        :root { --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%); --glass-bg: rgba(255, 255, 255, 0.1); --glass-border: rgba(255, 255, 255, 0.2); --text-color: #ffffff; --text-secondary: #e2e8f0; --box-bg: rgba(0, 0, 0, 0.2); }
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: var(--bg-gradient); color: var(--text-color); height: 100vh; display: flex; justify-content: center; align-items: center; text-align: center; }
        .container { background: var(--glass-bg); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid var(--glass-border); border-radius: 16px; padding: 3rem; max-width: 500px; width: 90%; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3); }
        h1 { margin: 0 0 1rem; font-size: 3rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        p { font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem; }
        .debug-box { background: var(--box-bg); padding: 1rem; border-radius: 8px; text-align: left; font-size: 0.9rem; border: 1px solid var(--glass-border); }
        .tag { display: inline-block; background: #e53e3e; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-bottom: 0.5rem; }
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
          <small style="color: #cbd5e0;">(注意: 404模板加载失败，您正在查看内置备用页面。)</small>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  return new Response(htmlContent, {
      status: 404,
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