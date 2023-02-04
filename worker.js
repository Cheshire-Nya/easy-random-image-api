addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-img-api/main";
//图片地址前部不会发生改变的部分
//用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>"
var min = 1;
var max;

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
  if (nowUrl.pathname === '/api' || nowUrl.pathname === '/api/') {
    return random('/');
  } else {
    return handle1(nowUrl);
  }
}


async function handle1(nowUrl) {
  let urlSearch = nowUrl.search
  let wholePath = nowUrl.pathname;
  if (urlSearch) {
    const regex = /^\/api\/(.+[^\/])\/$/;
    const match = wholePath.match(regex);
    if (match) {
      imgPath = `/${match[1]}`;
      const params = new URLSearchParams(urlSearch);
      const imgName = parseInt(params.get("id")); 
      const imgUrl = imgHost + imgPath + '/' + imgName + '.jpg'
      return fetch(new Request(imgUrl), {
        headers: {
          'cache-control': 'no-store',
		  'content-type': 'image/jpeg'
        },
      });
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
    let imgUrl = imgHost + imgPath + "/" + imgName + ".jpg";
    return fetch(new Request(imgUrl), {
      headers: {
        'cache-control': 'no-store',
		'content-type': 'image/jpeg'
      },
    });
  } else {
    const regex2 = /^\/api\/(.+[^\/])\/?$/;
    const match2 = wholePath.match(regex2);

    if (match2) { 
      imgPath = `/${match2[1]}`;
      return random(imgPath);
    } /*else { 
      return fetch(request);
    }*/
  }
}


function random(imgPath) {
  let max = maxValues[imgPath];

  let imgUrl = imgHost + imgPath + "/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
  
  let getimg = new Request(imgUrl);
  return fetch(getimg, {
    headers: {
      'cache-control': 'no-store',
	  'content-type': 'image/jpeg'
    },
  });  
}
