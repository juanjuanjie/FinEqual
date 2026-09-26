# 金融信息平权 · FinEqual

> 让金融信息不再有门槛。

FinEqual 是一个面向中文开发者的免费金融信息 API 聚合与说明平台。项目整理公开可用的金融数据接口，提供字段解释、请求示例、来源网页与使用许可，方便开发者快速查找和接入。

## 当前收录

### WSB 美股舆情

- 最新报告 API
- 历史报告 API
- 原始页面：[MarketGrep WSB 美股舆情](https://lite.marketgrep.com/zh/wsb)
- 数据许可：[MarketGrep Rights & Usage](https://lite.marketgrep.com/license/)

### 13F 机构持仓研究

- 机构管理人列表 API
- 单个机构持仓、季度变化与研究叙事 API
- 原始页面：[MarketGrep 机构持仓 13F 研究](https://lite.marketgrep.com/zh/13f)
- 数据许可：[MarketGrep Rights & Usage](https://lite.marketgrep.com/license/)

后续将继续按数据类型扩充更多免费的金融信息 API。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:3000`。

生产构建：

```bash
npm run build
```

## 使用说明

- FinEqual 负责整理和说明第三方公开 API，不对第三方接口的可用性、准确性或持续性作保证。
- 各数据接口遵循其原始提供方的许可与署名要求。
- 社区情绪及自动生成内容不构成投资建议。
- 使用接口时请合理控制请求频率，并为生产环境设置缓存与失败重试。

## 项目许可

FinEqual 自有源代码采用 [MIT License](./LICENSE)。第三方数据、内容及商标仍遵循各自提供方的许可条款。

## 联系作者

[卷卷姐juan · 哔哩哔哩](https://space.bilibili.com/229150291)
