addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

var url404 = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/404.html";
//404模板地址
var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main";
//图片地址前部不会发生改变的部分
//用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>"
var defaultPath = '/'; //现在是仓库根目录(换其他文件夹格式`'/<文件夹名>'`)
//访问的url路径为`/api`或`/api/`时抽图的文件夹
var redirectProxy = 2;
//type=302时返回的链接是否是经过代理的，0 不代理(返回github原链接)，1 worker代理，2 ghproxy代理
var maxValues = {
  '/': 2, //(defaultPath和对应图片数)现在是仓库根目录，对应2张图
  '示例图': 10, //示例图
  //中文路径
  'demoimg': 5, //demoimg
  //英文路径
  //其他要抽图的文件夹和对应图片数，不用在名称前加`/`
  //其他路径下同理，只需要这样相同格式多写一条键值对即可`'<文件夹名>': <数值>,`
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
      return extractSearch(urlSearch, request);

    }
	else {
     return random(defaultPath);

    };
  }
  else {
    return error();

  }
}


function extractSearch(urlSearch, request) {
  let searchParams = new URLSearchParams(urlSearch);
  
  let id = searchParams.get('id');
  let cats = searchParams.getAll('cat');
  let type = searchParams.get('type');

//开始吟唱
  let allCatsValid = true;
  for (let i = 0; i < cats.length; i++) {
    if (!(cats[i] in maxValues) || maxValues[cats[i]] < 1) {
      allCatsValid = false;
      break;
    } else {
      maxValues[cats[i]]--;
    }
  }

  if (allCatsValid) {

    if (searchParams.has('id') && !searchParams.has('cat')) {
      let imgName = id;

      if (type === 'json') {
        return typejson(defaultPath, imgName, request);
      }
      else if (!searchParams.has('type')) {
        return prescriptive(defaultPath, imgName);
      }
	    else {
        return error();
      }
    }
    else if (searchParams.has('id') && searchParams.has('cat')) {
      let imgName = id;
      let imgPath = cats[Math.floor(Math.random() * cats.length)];
      if (type === 'json') {
        return typejson(imgPath, imgName, request);
      }
	  else if (!searchParams.has('type')) {
        return prescriptive(defaultPath, imgName);
      }
	  else {
        return error();
      }
    } 
    else if (!searchParams.has('id') && searchParams.has('cat')) {
      let imgPath = cats[Math.floor(Math.random() * cats.length)];
      if (type === '302') {
        return redirect(imgPath, request);
      } 
      else if (type === 'json') {
	    let max = maxValues[imgPath];
	    let imgName = Math.floor(Math.random()*(max-min+1)+min);
        return typejson(imgPath, imgName, request);
      }
      else if (!searchParams.has('type')) {
        return random(imgPath);
      }
      else return error();
	}
	else if (searchParams.has('type') && !searchParams.has('id') && !searchParams.has('cat')) {
      if (type === '302') {
        return redirect(defaultPath, request);
      }
      else if (type === 'json') {
        let max = maxValues[defaultPath];
	    let imgName = Math.floor(Math.random()*(max-min+1)+min);
        return typejson(defaultPath, imgName, request);
      }
      else return error();
    }
    else return error();
  }
  else return error();
}


function random(imgPath) {
  if (!maxValues.hasOwnProperty(imgPath)) {
  return error();
  }
  let max = maxValues[imgPath];
  let imgUrl = imgHost + "/" + imgPath + "/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
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
	}
	else return error();
  }
  else return error();
}


function redirect(imgPath, request) {
  let max = maxValues[imgPath];
  if (redirectProxy === 0) {
    const redirectUrl = imgHost + "/" + imgPath + "/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
    return type302(redirectUrl);
  }
  else if (redirectProxy === 1) {
    const nowUrl = new URL(request.url);
    const myHost = nowUrl.hostname;
    if (imgPath === defaultPath) {
      const redirectUrl = "https://" + myHost + "/api" + "?id=" + Math.floor(Math.random()*(max-min+1)+min);
      return type302(redirectUrl);
    }
	else if (maxValues.hasOwnProperty(imgPath) && imgPath !== defaultPath) {
      const redirectUrl = "https://" + myHost + "/api" + "?id=" + Math.floor(Math.random()*(max-min+1)+min) + "&cat=" + imgPath;
      return type302(redirectUrl);
    }
	else return error();
  }
  else if (redirectProxy === 2) {
    const redirectUrl = ghproxyUrl + imgHost + "/" + imgPath + "/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
    return type302(redirectUrl);
  }
  else return error();
  
}


function type302(redirectUrl) {
  return new Response("", {
    status: 302,
    headers: {
      Location: redirectUrl
    }
  });
}


function typejson(imgPath, imgName, request) {
  if (imgPath in maxValues) {
	  if (imgName >= 1 && imgName <= maxValues[imgPath]) {
      let nowUrl = new URL(request.url);
      let myHost = nowUrl.hostname;
	    let githubUrl = imgHost + "/" + imgPath + "/" + imgName + ".jpg";
	    let workerUrl = null;
	    if (imgPath === defaultPath) { workerUrl = "https://" + myHost + "/api" + "?id=" + imgName;}
	    else {workerUrl = "https://" + myHost + "/api" + "?id=" + imgName + "&cat=" + imgPath;}
	    const proxyUrl = ghproxyUrl + imgHost + "/" + imgPath + "/" + imgName + ".jpg";
	    return new Response(
        JSON.stringify({
          "category": imgPath,
          "id": imgName,
          "githubUrl": githubUrl,
          "workerUrl": workerUrl,
          "proxyUrl": proxyUrl
        }, null, 2), {
        headers: {
          'Content-Type': 'application/json'
        }
        });
	  }
	  else return error();
  }
  else return error();
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
