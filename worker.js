addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

var min = 1;
var max;

var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-img-api/main";
//图片地址前部不会发生改变的部分
//用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>"

var defaultPath = '/'; //现在是仓库根目录
//访问的url路径为`/api`或`/api/`时抽图的文件夹

var maxValues = {
  '/': 2, //仓库根目录
  '/%E7%A4%BA%E4%BE%8B%E5%9B%BE': 10, //示例图
  //判断当前访问的url.pathname是否为`/示例图`（即`/%E7%A4%BA%E4%BE%8B%E5%9B%BE`，js内中文不编码无法正常使用）
  //其他路径下同理，只需要这样相同格式多写一条键值对即可`'/<文件夹名>': <数值>,`
  '/demoimg': 5, //demoimg
  //英文路径正常使用
}
//存储键值对：仓库下图片文件夹名称及对应的图片数

async function handleRequest(request) {
  let nowUrl = new URL(request.url);
  let wholePath = nowUrl.pathname;
  let urlSearch = nowUrl.search;
  if (nowUrl.pathname === '/api' || nowUrl.pathname === '/api/') {
    if (nowUrl.search) {
      const params = new URLSearchParams(nowUrl.search);
      const imgName = parseInt(params.get("id"));
      return prescriptive(defaultPath, imgName);
    } else {
      return random(defaultPath);
    };
  } else {
    return whetherDefault(wholePath, urlSearch);
  }
}


function whetherDefault(wholePath, urlSearch) {
  let imgName = null;
  const regex = /^\/api\/(\d+)\.jpg$/;
  const match = wholePath.match(regex);
  if (match) {
    imgName = match[1];
    let imgPath = defaultPath;
    return prescriptive(defaultPath, imgName);
  } else {
    return handle1(wholePath, urlSearch);
  }
}


function handle1(wholePath, urlSearch) {
  let imgPath = null;
  if (urlSearch) {
    const regex = /^\/api\/(.+[^\/])\/$/;
    const match = wholePath.match(regex);
    if (match) { 
      imgPath = `/${match[1]}`;
      const params = new URLSearchParams(urlSearch);
      const imgName = parseInt(params.get("id")); 
      return prescriptive(imgPath, imgName);
    }

  } else { 
    return handle2(wholePath);
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
    } /*else { // 如果匹配不成功
      return fetch(request); // 直接返回fetch(404.html)结果
    }*/
  }
}


function random(imgPath) {
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
    return fetch(new Request(imgUrl), {
      headers: {
        'cache-control': 'max-age=0, s-maxage=0',
        'content-type': 'image/jpeg',
        'Cloudflare-CDN-Cache-Control': 'max-age=0',
        'CDN-Cache-Control': 'max-age=0'
      },
    });
}