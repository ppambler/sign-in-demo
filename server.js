var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'))
  }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('方方说：含查询字符串的路径\n' + pathWithQuery)

  if (path === '/') {
    let string = fs.readFileSync('./index.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_up' && method === 'GET') {
    let string = fs.readFileSync('./sign_up.html', 'utf8')
    response.statusCode = 200
    response.setHeader('content-Type', 'text/html;charset=utf-8')
    // response.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:5500')
    response.write(string)
    response.end()

  }else if(path === '/sign_up' && method === 'POST') {
    readBody(request).then((body)=>{
      // body →☞email=13790020331%40163.com&……
      let strings = body.split('&') //['email=……',……]
      let hash = {}
      strings.forEach((string)=>{
        // string = 'email=……'
        let parts = string.split('=') //['email','……']
        let key = parts[0]
        let value = parts[1]
        // 翻译%40为@字符
        hash[key] = decodeURIComponent(value) //hash['email'] = '……'
      })
      let {email,password,password_confirmation} = hash
      if(email.indexOf('@') === -1){
        response.statusCode = 400
        // 为了使用jQuery的API
        response.setHeader('Content-Type','application/json;charset=utf-8')
        // 一般都是返回有结构的数据
        response.write(`
          {
            "errors": {
              "email":"invalid"
            }
          }
        `)
      } else if(password !== password_confirmation) {
        response.statusCode = 400
        response.write('password not match')
      } else {
        var users = fs.readFileSync('./db/users','utf8')
        try {
          users = JSON.parse(users)
        } catch(e) {
          users = []
        }
        users.push({email:email,password:password})
        // 把users这个JSON数组给JSON字符串化，存到db里去，
        // 毕竟对象只在内存中
        var usersString  = JSON.stringify(users)
        fs.writeFileSync('./db/users',usersString)
        response.statusCode = 200
      }
      console.log(body)
      console.log(hash)
      response.end()
    })
  } else if (path === '/main.js') {
    let string = fs.readFileSync('./main.js', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/javascript;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/xxx') {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/json;charset=utf-8')
    response.setHeader('Access-Control-Allow-Origin', 'http://frank.com:8001')
    response.write(`
    {
      "note":{
        "to": "小谷",
        "from": "方方",
        "heading": "打招呼",
        "content": "hi"
      }
    }
    `)
    response.end()
  } else {
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(`
      {
        "error": "not found"
      }
    `)
    response.end()
  }

  /******** 代码结束，下面不要看 ************/
})

function readBody(request) {
  // 之所以用Promise,那是因为这是异步的
  return new Promise((resolve, reject) => {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      // at this point, `body` has the entire request body stored in it as a string
      // 这个回调函数在下一个then中
      resolve(body)
    });
  })
}
server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)