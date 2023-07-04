---
created_date: 2022-06-28 15:07
updated_date: 2022-06-29 10:22
archive:
tags:
  - blog
  - 开发资源
title: 在坚果云设置文件同步过滤规则
name: ignore-file-with-jianguoyun-sync
slug: ignore-file-with-jianguoyun-sync
brief: 用坚果云同步笔记，设置同步规则，过滤不需要上传同步的文件
---

## 前言

我使用 obsidian 和坚果云管理自己的笔记，但 obsidian 的 `.obsidian/workspace.json` 经常和云端的文件发生冲突，产生一堆 `NSConflict.json` 文件。因此需要设置坚果云文件同步规则，不同步 `.obsidian/workspace.json`。

## 在 Mac/Linux 上设置

打开 `~/.nutstore/db`

```shell
open ~/.nutstore/db
```

修改 `customExtRules.conf`，没有就新建一个。

```txt title={customExtRules.conf}
# 添加过滤规则
.obsidian/workspace.json
.obsidian/workspaces.json
```

重启坚果云就会生效。

## 在 Windows 上设置

打开 `%APPDATA%\Nutstore\db`，也是相同的修改。

> [本博客](https://marsk6.github.io/) 所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！
