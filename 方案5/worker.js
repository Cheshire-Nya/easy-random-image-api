// ================= 配置区域 =================

var jsonUrl = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/image.json";
//json文件的地址
var urlIndex = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/index.html";
//主页模板地址
var url404 = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/404.html";
//404模板地址
var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/%E6%96%B9%E6%A1%885/";
//图片地址前部不会发生改变的部分
//用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>/"
var redirectProxy = 1;
//type=302时返回的链接是否是经过代理的，0 不代理(返回github原链接)，1 worker代理，2 ghproxy代理
var availableExtraForms = ["webp"];
//除默认的jpg外，你额外增加的可以返回的图片格式
var availableDevices = ["mobile", "pc"];
var ghproxyUrl = "https://ghproxy.com/";
//(这个ghproxy有问题，除非你有其他的github代理)

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

  // 如果没有指定 form，默认为 jpg
  if (!returnForm) {
    returnForm = 'jpg';
  } 
  else if (returnForm !== 'jpg' && !availableExtraForms.includes(returnForm)) {
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
    if (!selectedDevice) {
        if (searchParams.has('id')) {
            return error("Cannot specify ID without Device");
        }
        selectedDevice = availableDevices[Math.floor(Math.random() * availableDevices.length)];
    }

    if (!selectedList[selectedDevice]) {
        return error(`Device '${selectedDevice}' not found in category '${category}'`);
    }
    
    const values = selectedList[selectedDevice];

    let trueId;
    let img;

    if (searchParams.has('id')) {
        let reqId = parseInt(id);
        if (isNaN(reqId) || reqId < 1 || reqId > values.length) {
            return error("ID out of range");
        }
        trueId = reqId - 1;
        img = values[trueId];
    } else {
        trueId = Math.floor(Math.random() * values.length);
        img = values[trueId];
    }

    if (type === '302') {
      return redirect(trueId + 1, img, category, selectedDevice, returnForm, request);
    } 
    else if (type === 'json') {
      return typejson(trueId + 1, img, category, selectedDevice, returnForm, request);
    } 
    else if (!type) {
      return image(img, returnForm);
    } 
    else {
      return error("Invalid type parameter");
    }

  } else {
    return error("No category specified");
  }
}


function smartEncodePath(path) {
    return path.split('/').map(part => encodeURIComponent(part)).join('/');
}

function image(img, returnForm) {
  let encodedImg = smartEncodePath(img);
  
  let contentType = returnForm === 'jpg' ? 'image/jpeg' : `image/${returnForm}`;
  
  let imgUrl = imgHost + returnForm + "/" + encodedImg + "." + returnForm;
  
  let getimg = new Request(imgUrl);
  return fetch(getimg, {
    headers: {
      'content-type': contentType,
      'cache-control': 'max-age=0, s-maxage=0',
      'Cloudflare-CDN-Cache-Control': 'max-age=0',
      'CDN-Cache-Control': 'max-age=0'
    },
  });  
}

function redirect(id, img, category, device, returnForm, request) {
  let nowUrl = new URL(request.url);
  let encodedImg = smartEncodePath(img); // 修复 redirect 中的路径编码问题
  
  // 构造最终文件名路径
  let fileUrlPath = returnForm + "/" + encodedImg + "." + returnForm;

  if (redirectProxy === 0) {
    return type302(imgHost + fileUrlPath);
  }
  else if (redirectProxy === 1) {
    const myHost = nowUrl.hostname;
    let redirectUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id + "&form=" + returnForm;
    return type302(redirectUrl);
  }
  else if (redirectProxy === 2) {
    return type302(ghproxyUrl + imgHost + fileUrlPath);
  }
  else return error("Redirect Config Error");
}

function type302(redirectUrl) {
  return new Response("", {
    status: 302,
    headers: { Location: redirectUrl }
  });
}

function typejson(id, img, category, device, returnForm, request) {
  let nowUrl = new URL(request.url);
  let myHost = nowUrl.hostname;
  let encodedImg = smartEncodePath(img); // 修复 JSON 中的路径编码问题

  let fileUrlPath = returnForm + "/" + encodedImg + "." + returnForm;

  let githubUrl = imgHost + fileUrlPath;
  let workerUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id + "&form=" + returnForm;
  let proxyUrl = ghproxyUrl + imgHost + fileUrlPath;

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
    <html><head><title>404 Not Found</title></head>
    <body style="text-align:center; padding:50px; font-family:sans-serif;">
      <h1>404 Not Found</h1>
      <p>Could not find the requested image.</p>
      <div style="color:red; border:1px solid #ccc; display:inline-block; padding:10px;">
        Debug: ${reason}
      </div>
    </body></html>`;
  }

  return new Response(htmlContent, {
      status: 404,
      statusText: 'Not Found',
      headers: { 
          'Content-Type': 'text/html',
          'X-Error-Reason': reason 
      }
  });
}

async function index() {
  let response = await fetch(urlIndex);
  return new Response(response.body, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
  });
}