addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

var url404 = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/404.html";
//404模板地址

var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main";
//图片地址前部不会发生改变的部分
//用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>"

var defaultPath = '/'; //现在是仓库根目录
//访问的url路径为`/api`或`/api/`时抽图的文件夹

var redirectProxy = 2;
//type=302时返回的链接是否是经过代理的，0 不代理(返回github原链接)，1 worker代理，2 ghproxy代理

var maxValues = {
  '/': 2, //仓库根目录
  '/%E7%A4%BA%E4%BE%8B%E5%9B%BE': 10, //示例图
  //判断当前访问的url.pathname是否为`/示例图`（即`/%E7%A4%BA%E4%BE%8B%E5%9B%BE`，js内中文不编码无法正常使用）
  //其他路径下同理，只需要这样相同格式多写一条键值对即可`'/<文件夹名>': <数值>,`
  '/demoimg': 5, //demoimg
  //英文路径正常使用
}
//存储键值对：仓库下图片文件夹名称及对应的图片数

var ghproxyUrl = "https://ghproxy.com/";
var min = 1;
var max;

async function handleRequest(request) {
  let nowUrl = new URL(request.url);
  let wholePath = nowUrl.pathname;
  let urlSearch = nowUrl.search;
  if (nowUrl.pathname === '/api' || nowUrl.pathname === '/api/') {
    if (nowUrl.search) {
      const imgPath = defaultPath;
      return extractSearch(imgPath, urlSearch, request);

    } else {
     return random(defaultPath);

    };
  } else {
    return whetherDefault(wholePath, urlSearch, request);

  }
}


function whetherDefault(wholePath, urlSearch, request) {
  let imgName = null;
  const regex = /^\/api\/(\d+)\.jpg$/;
  const match = wholePath.match(regex);
  if (match) {
    imgName = match[1];
    let imgPath = defaultPath;
    return prescriptive(defaultPath, imgName);
  } else {
    return handle1(wholePath, urlSearch, request);
  }
}


function handle1(wholePath, urlSearch, request) {
  let imgPath = null;
  if (urlSearch) {
    const regex = /^\/api\/(.+[^\/])\/?$/;
    const match = wholePath.match(regex);
    if (match) {
      imgPath = `/${match[1]}`;
      return extractSearch(imgPath, urlSearch, request);
    } else {
      return error();
    };

  } else {
    return handle2(wholePath);
  };
}

function extractSearch(imgPath, urlSearch, request) {
  const params = new URLSearchParams(urlSearch);
  if (params.has("id") && params.get("type") !== "302") {
    const imgName = parseInt(params.get("id"));
    return prescriptive(imgPath, imgName);
  
  } else if (params.get("type") === "302") {
    
    return redirect(imgPath, request);
  }
}

function handle2(wholePath) {
  let imgPath = null;
  let imgName = null;
  const regex1 = /^\/api\/(.+[^\/])\/(\d+)\.jpg$/;
  const match1 = wholePath.match(regex1);

  if (match1) { 
    imgPath = `/${match1[1]}`;
    imgName = match1[2];
    return prescriptive(imgPath, imgName);
  } else {
    const regex2 = /^\/api\/(.+[^\/])\/?$/;
    const match2 = wholePath.match(regex2);

    if (match2) {
      imgPath = `/${match2[1]}`;
      return random(imgPath);
    } else {
      return error();
    }
  }
}


function random(imgPath) {
  if (!maxValues.hasOwnProperty(imgPath)) { 
  return error();
  }
  let max = maxValues[imgPath];
  let imgUrl = imgHost + imgPath + "/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
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

function prescriptive(imgPath, imgName) {
  let imgUrl = imgHost + imgPath + "/" + imgName + ".jpg";
  if (imgPath in maxValues) {
    if (imgName >= 1 && imgName <= maxValues[imgPath]) {
      return fetch(new Request(imgUrl), {
        headers: {
        'cache-control': 'max-age=0, s-maxage=0',
        'content-type': 'image/jpeg',
        'Cloudflare-CDN-Cache-Control': 'max-age=0',
        'CDN-Cache-Control': 'max-age=0'
        },
      });
    } else return error();
  } else return error();
}

function redirect(imgPath, request) {
  let max = maxValues[imgPath];
  if (redirectProxy === 0) {
    const redirectUrl = imgHost + imgPath + "/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
    return do302(redirectUrl);

  } else if (redirectProxy === 1) {
    const nowUrl = new URL(request.url);
    const myHost = nowUrl.hostname;
    if (imgPath === defaultPath) {
      const redirectUrl = "https://" + myHost + "/api/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
      return do302(redirectUrl);

    } else if (maxValues.hasOwnProperty(imgPath) && imgPath !== defaultPath) {
      const redirectUrl = "https://" + myHost + "/api" + imgPath + "/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
      return do302(redirectUrl);

    } else return error();
  
  } else if (redirectProxy === 2) {
    const redirectUrl = ghproxyUrl + imgHost + imgPath + "/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
    return do302(redirectUrl);

  } else return error();
  
}

function do302(redirectUrl) {
  return new Response("", {
    status: 302,
    headers: {
      Location: redirectUrl
    }
  });
}

async function error() {
  let response = await fetch(url404);
  response = new Response(response.body, {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/html' }
  });
  return response
}