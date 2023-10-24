---
created_date: 2023-10-18 10:36
updated_date: 2023-10-18 16:04
brief: 使用 `.env` 和 `dotenv` 配置管理 node 项目的环境变量
tags:
  - 工程化
name: set-env-var-in-node-project 项目读取环境变量
title: node 项目读取环境变量
slug: set-env-var-in-node-project
---

node 项目从 `process.env` 读取环境变量时，`process.env` 有哪些来源？

### 命令行

使用 `cross-env` 处理跨平台环境变量设置。

```json title={package.json}
{
  "scripts": {
    "dev": "cross-env MY_ENV=hello node ./index.js",
    "start": "cross-env MY_ENV=hello webpack"
  }
}
```

> 在 mac 下可以直接设置局部变量，`{ "dev": "MY_ENV=hello node ./index.js" }`。

### `.env` 文件

环境变量配置在项目根目录下的 `.env`。

```shell title={.env}
PORT=8080
MY_ENV=live
```

安装 `dotenv`，`npm install dotenv --save`。

`dotenv` 会自动读取项目根目录下的 `.env` 到 `process.env`，并且不会覆盖已存在 `process.env` 上的环境变量。

```javascript title={app.js}
require('dotenv').config();
const http = require('http');
const port = parseInt(process.env.PORT, 10) || 5000;
http
  .createServer((request, response) => {
    response.writeHead(200, {
      'Content-Type': 'text/plain',
    });
    response.write(process.env.MY_ENV);
    response.end();
  })
  .listen(port);
```

按照 `dotenv` 的最佳实践：

- 应该把 `.env` 加到 `.gitignore`，因为每个环境的配置不同，还可能包含数据库密钥等；
- 不要按部署环境划分 `.env.test`、`.env.staging` 等环境变量文件，因为难以扩展，更多部署环境就需要添加更多的配置文件。

### shell

如果在执行 node 脚本前，还需为其他的 shell 脚本设置环境变量。

```shell
set -o allexport # 👉 把后面创建的变量标记为导出，即导出为环境变量
. ./.env
set +o allexport # 关闭 👆 这种模式
```

### 关联

1. [Node Environment Variables: Process env Node](https://www.knowledgehut.com/blog/web-development/node-environment-variables)

> [本博客](https://marsk6.github.io/) 所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！
