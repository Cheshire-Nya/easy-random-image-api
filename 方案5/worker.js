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


addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  let nowUrl = new URL(request.url);
  let urlSearch = nowUrl.search;

  if (nowUrl.pathname === '/api' || nowUrl.pathname === '/api/') {
    if (urlSearch) {
      return extractSearch(urlSearch, request);
    } else {
      return error("No search parameters");
    }
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

  if (cats && cats.length > 0) {
    const response = await fetch(jsonUrl);
    if (!response.ok) return error("Failed to fetch JSON config");
    
    const imgList = await response.json();
    let availableCategories = Object.keys(imgList);

    if (!cats.every(cat => availableCategories.includes(cat))) {
      return error("Category not found");
    }

    const category = cats[Math.floor(Math.random() * cats.length)];
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

  } else {
    return error("No category specified");
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
  let url = resizeHost + encodeURIComponent(githubUrl);
  if (imgResize === 1 && returnForm !== 'jpg') {
      url += "&output=" + returnForm;
  }
  return url;
}


async function image(img, returnForm, category, device) {
  let githubUrl = getGithubSourceUrl(img, returnForm);
  let fetchUrl = getCdnProxyUrl(githubUrl, returnForm);
  let contentType = returnForm === 'jpg' ? 'image/jpeg' : `image/${returnForm}`;
  
  let response = await fetch(fetchUrl);

  let newHeaders = new Headers(response.headers);
  newHeaders.set('Content-Type', contentType);
  newHeaders.set('X-Image-Category', category);
  newHeaders.set('X-Image-Device', device);
  newHeaders.set('Access-Control-Expose-Headers', 'X-Image-Category, X-Image-Device');
  newHeaders.set('Cache-Control', 'max-age=0, s-maxage=0');
  
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
    headers: { 'Content-Type': 'application/json' }
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
        <small>(Notice:404模板没有成功加载,所以你会看到这个备用的简单页面.)</small>
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
  return new Response(response.body, { status: 200, headers: { 'Content-Type': 'text/html' } });
}