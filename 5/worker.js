var jsonUrl = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/5/image.json";
//json文件的地址
var urlIndex = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/index.html";
//主页模板地址
var url404 = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/html-template/404.html";
//404模板地址
var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-image-api/main/5/";
//图片地址前部不会发生改变的部分
//用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>/"
var redirectProxy = 2;
//type=302时返回的链接是否是经过代理的，0 不代理(返回github原链接)，1 worker代理，2 ghproxy代理
var availableExtraForms = ["webp"];
//除默认的jpg外，你额外增加的可以返回的图片格式
var availableDevices = ["mobile", "pc"];
//允许的图片分辨率适合的设备分类，通常就这俩，没啥好改的
var ghproxyUrl = "https://ghproxy.com/";


addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});


function handleRequest(request) {
  let nowUrl = new URL(request.url);
  let wholePath = nowUrl.pathname;
  let urlSearch = nowUrl.search;
  if (nowUrl.pathname === '/api' || nowUrl.pathname === '/api/') {
    if (nowUrl.search) {
      return extractSearch(urlSearch, request);
    }
	  else {
     return error();
    };
  }
  else if (nowUrl.pathname === '/') {
	return index();
  }
  else {
    return error();
  }
}

//开始吟唱
async function extractSearch(urlSearch, request) {
  let searchParams = new URLSearchParams(urlSearch);
  let id = searchParams.get('id');
  let cats = searchParams.getAll('cat');
  let type = searchParams.get('type');
  let device = searchParams.get('device');
  let returnForm = searchParams.get('form');
  
  if (returnForm) {
	if (!availableExtraForms.includes(returnForm)) {
	  return error();
	}
  } //如果有则判断form参数的值是否存在于availableExtraForms
  
  if (cats) {
    const response = await fetch(jsonUrl);
    const imgList = await response.json();

    let availableCategories = Object.keys(imgList);
    if (!cats.every(cat => availableCategories.includes(cat))) {
      return error(); //遍历cats不是json中category的子集则error
    }

    const category = cats[Math.floor(Math.random() *cats.length)];
    const selectedList = imgList[category];

    if (device) {
      if (!searchParams.has('id')) {
        const values = selectedList[device];
        const trueId = Math.floor(Math.random() * values.length);
        const img = values[trueId];
        if (type === '302') {
          return redirect(trueId + 1, img, category, device, request);
        }
        else if (type === 'json') {
          return typejson(trueId + 1, img, category, device, request);
        }
        else if (!searchParams.has('type')) {
          if (returnForm) {
			return image(img, returnForm);
		  }
		  else return image(img, 'jpg');
        }
        else return error();
      }
      else if (id) {
        const values = selectedList[device];
        const trueId = id - 1;
        const img = values[trueId];
        if (type === 'json') {
          return typejson(id, img, category, device, request);
        }
        else if (!searchParams.has('type')) {
          if (returnForm) {
			return image(img, returnForm);
		  }
		  else return image(img, 'jpg');
        }
        else return error(); //有type但不为json时返回错误
      }
      else return error()
    }//指定适合的设备，结束
    if (!device) { //不指定适合的设备，开始
      let device = availableDevices[Math.floor(Math.random() * availableDevices.length)]; //从availableDevices中抽取device
      if (!searchParams.has('id')) {
        const values = selectedList[device];
        const trueId = Math.floor(Math.random() * values.length);
        const img = values[trueId];
        if (type === '302') {
          return redirect(trueId + 1, img, category, device, request);
        }
        else if (type === 'json') {
          return typejson(trueId + 1, img, category, device, request);
        }
        else if (!searchParams.has('type')) {
          if (returnForm) {
			return image(img, returnForm);
		  }
		  else return image(img, 'jpg');
        }
        else return error(); //有type但不为302或json时返回错误
      }
      else return error(); //不指定device不允许指定id
    }
    else return error();
  }
  else return error(); //cat为必须，没有则抛出错误
}


function image(img, returnForm) {
  let encodedImg = encodeURIComponent(img);
  let contentType = returnForm === 'jpg' ? 'image/jpeg' : `image/${returnForm}`;
  let imgUrl = imgHost + returnForm + "/" + encodedImg + "." + returnForm;
  let getimg = new Request(imgUrl);
  return fetch(getimg, {
    headers: {
      'content-type': contentType
    },
  });  
}


function redirect(id, img, category, device, request) {
  let nowUrl = new URL(request.url);
  let searchParams = new URLSearchParams(nowUrl.search);
  let returnForm = searchParams.get('form');
  if (!searchParams.has('form')) {returnForm = "jpg";}
//  let encodedImg = encodeURIComponent(img);
  if (redirectProxy === 0) {
    const redirectUrl = imgHost + returnForm + "/" + img + "." + returnForm;
    return type302(redirectUrl);
  }
  else if (redirectProxy === 1) {
    const myHost = nowUrl.hostname;
    let redirectUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id + "&form=" + returnForm;
	if (!searchParams.has('form')) {redirectUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id;}
    return type302(redirectUrl);
  }
  else if (redirectProxy === 2) {
    const redirectUrl = ghproxyUrl + imgHost + returnForm + "/" + img + "." + returnForm;
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


function typejson(id, img, category, device, request) {
  let nowUrl = new URL(request.url);
  let searchParams = new URLSearchParams(nowUrl.search);
  let returnForm = searchParams.get('form');
  if (!searchParams.has('form')) {returnForm = "jpg";}
  let myHost = nowUrl.hostname;
	let githubUrl = imgHost + returnForm + "/" + img + "." + returnForm;
	let workerUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id + "&form=" + returnForm;
	if (!searchParams.has('form')) {workerUrl = "https://" + myHost + "/api" + "?cat=" + category + "&device=" + device + "&id=" + id;}
	let proxyUrl = ghproxyUrl + imgHost + returnForm + "/" + img + "." + returnForm;
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


async function error() {
  let response = await fetch(url404);
  response = new Response(response.body, {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/html' }
  });
  return response
}


async function index() {
  let response = await fetch(urlIndex);
  response = new Response(response.body, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html' }
  });
  return response
}