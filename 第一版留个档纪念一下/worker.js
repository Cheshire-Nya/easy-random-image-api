addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

var imgHost = "https://raw.githubusercontent.com/Cheshire-Nya/easy-random-img-api/main";
//图片地址前部不会发生改变的部分
//用github作为图库应按照此格式"https://raw.githubusercontent.com/<github用户名>/<仓库名>/<分支名>"
var min = 1;
var max;

var maxValues = {
  '/%E7%A4%BA%E4%BE%8B%E5%9B%BE': 10, //示例图
  //判断当前访问的url.pathname是否为/示例图（即/%E7%A4%BA%E4%BE%8B%E5%9B%BE，js内中文不编码无法正常使用）
  //是则max=10（即文件夹"示例图"下图片命名数字最大一个）
  //其他路径下同理，只需要这样相同格式多写一条键值对即可`'/<文件夹名>': <数值>,`
  '/demoimg': 5, //demoimg
  //英文路径正常使用
}
//存储仓库下图片文件夹名称及对应的图片数

async function handleRequest(request) {
  let nowUrl = new URL(request.url);
  let imgPath = nowUrl.pathname;
  
  let max = maxValues[imgPath];

  let imgUrl = imgHost + imgPath + "/" + Math.floor(Math.random()*(max-min+1)+min) + ".jpg";
  
  let getimg = new Request(imgUrl);
  return fetch(getimg, {
    headers: {
      'content-type': 'image/jpeg'
    },
  });  
}