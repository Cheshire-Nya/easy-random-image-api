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
  if (nowUrl.pathname === '/api' || nowUrl.pathname === '/api/') { //是/api或/api/
    if (nowUrl.search) { //则检查是否有查询字符串
      const params = new URLSearchParams(nowUrl.search);
      const imgName = parseInt(params.get("id")); //有则提取`id`的值赋给imgName
      return prescriptive(defaultPath, imgName);
    } else {
      return random(defaultPath); //没有查询则转到random，传递默认目录
    };
  } else {
    return handle1(nowUrl);
  }
}


function handle1(nowUrl) {
  let urlSearch = nowUrl.search
  let wholePath = nowUrl.pathname;
  if (urlSearch) { //如果有查询字符串，将拿到的imgPath和imgName传给prescriptive
    const regex = /^\/api\/(.+[^\/])\/$/; // 正则表达式，匹配以/api/开头，后面是任意字符组成的字符串的字符串
    const match = wholePath.match(regex); // 匹配pathname字符串
    if (match) { // 如果匹配成功
      imgPath = `/${match[1]}`; // 将匹配的第一个组（任意字符组成的字符串）加上/符号，并赋值给pathname
      const params = new URLSearchParams(urlSearch);
      const imgName = parseInt(params.get("id")); 
      return prescriptive(imgPath, imgName);
    }

  } else { //没有查询则转到handle2
    return handle2(wholePath);
  }
}


function handle2(wholePath) {
  let imgPath = null; // 声明变量imgPath，初始值为null
  let imgName = null; // 声明变量imgName，初始值为null
  const regex1 = /^\/api\/(.+[^\/])\/(\d+)\.jpg$/; // 正则表达式，匹配以/api/开头，后面是任意非空字符组成的字符串，再加上一个/，后面是阿拉伯数字组成的字符串，最后是.jpg结尾的字符串
  const match1 = wholePath.match(regex1); // 匹配pathname字符串

  if (match1) { // 如果匹配成功
    imgPath = `/${match1[1]}`; // 将匹配的第一个组（任意字符组成的字符串）加上/符号，并赋值给imgPath
    imgName = match1[2]; // 将匹配的第二个组（阿拉伯数字组成的字符串）赋值给imgName
    return prescriptive(imgPath, imgName);
  } else {
    const regex2 = /^\/api\/(.+[^\/])\/?$/; // 正则表达式，匹配以/api/开头，后面是任意字符组成的字符串的字符串
    const match2 = wholePath.match(regex2); // 匹配pathname字符串

    if (match2) { // 如果匹配成功
      imgPath = `/${match2[1]}`; // 将匹配的第一个组（任意字符组成的字符串）加上/符号，并赋值给imgPath
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