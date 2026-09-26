"use client";

import { useMemo, useState } from "react";

const dailyUrl = "https://www.marketgrep.com/api/sentiment-report";
const historyUrl = "https://lite.marketgrep.com/api/sentiment-report/history";
const sourcePageUrl = "https://lite.marketgrep.com/zh/wsb";
const thirteenFSourceUrl = "https://lite.marketgrep.com/zh/13f";
const thirteenFManagerSourceUrl = "https://lite.marketgrep.com/zh/13f/managers/berkshire-hathaway";
const managersUrl = "https://lite.marketgrep.com/api/13f/managers";
const managerDetailUrl = "https://lite.marketgrep.com/api/13f/managers/{slug}";
const managerDetailExampleUrl = "https://lite.marketgrep.com/api/13f/managers/berkshire-hathaway";
const licenseUrl = "https://lite.marketgrep.com/license/";
const finvizFinanceRepoUrl = "https://github.com/lit26/finvizfinance";
const finvizFinanceDocsUrl = "https://finvizfinance.readthedocs.io/en/latest/";
const finvizFinanceLicenseUrl = "https://github.com/lit26/finvizfinance/blob/master/LICENSE";
const finvizUrl = "https://finviz.com/";
const akshareRepoUrl = "https://github.com/akfamily/akshare";
const akshareDocsUrl = "https://akshare.akfamily.xyz/data/others/others.html";
const akshareStockDocsUrl = "https://akshare.akfamily.xyz/data/stock/stock.html";
const eastmoneyAShareUrl = "https://quote.eastmoney.com/center/gridlist.html#hs_a_board";
const sinaAShareUrl = "https://vip.stock.finance.sina.com.cn/mkt/#hs_a";
const basePath = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
const assetPath = (path: string) => `${basePath}${path}`;
const snippets = {
  Python: `import requests

url = "${dailyUrl}"
response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
response.raise_for_status()
data = response.json()

print(f"报告日期: {data['report_date']}")
print(data["report_events"])
print(data["report_markdown"])`,
  JavaScript: `const response = await fetch("${dailyUrl}");
if (!response.ok) throw new Error(\`HTTP \${response.status}\`);

const data = await response.json();
console.log(data.report_date);
console.table(data.report_events);
console.log(data.report_markdown);`,
  cURL: `curl --request GET \\
  --url ${dailyUrl} \\
  --header 'Accept: application/json' \\
  --header 'User-Agent: Mozilla/5.0'`,
};
const thirteenFSnippets = {
  Python: `import requests

base_url = "${managersUrl}"
managers = requests.get(base_url, timeout=30).json()["managers"]

slug = managers[0]["slug"]
detail = requests.get(f"{base_url}/{slug}", timeout=30).json()
print(detail["manager"]["display_name"])
print(detail["stat"]["top_holdings"][:5])`,
  JavaScript: `const managers = await fetch("${managersUrl}")
  .then((response) => response.json());

const slug = managers.managers[0].slug;
const detail = await fetch(
  \`https://lite.marketgrep.com/api/13f/managers/\${slug}\`
).then((response) => response.json());

console.table(detail.stat.top_holdings.slice(0, 5));`,
  cURL: `curl --request GET \\
  --url ${managersUrl} \\
  --header 'Accept: application/json'`,
};
const finvizQuoteSnippet = `from finvizfinance.quote import finvizfinance

stock = finvizfinance("TSLA")

chart = stock.ticker_charts()
fundamentals = stock.ticker_fundament()
description = stock.ticker_description()
peers = stock.ticker_peer()
etf_holders = stock.ticker_etf_holders()
ratings = stock.ticker_outer_ratings()
stock_news = stock.ticker_news()
insider_trades = stock.ticker_inside_trader()`;
const finvizInsiderSnippet = `from finvizfinance.insider import Insider

# 可选：latest、top week、top owner trade
insider = Insider(option="top owner trade")
trades = insider.get_insider()

print(trades.head())`;
const finvizNewsSnippet = `from finvizfinance.news import News

feed = News().get_news()
news = feed["news"]
blogs = feed["blogs"]

print(news.head())
print(blogs.head())`;
const akshareEastmoneySnippet = `import akshare as ak

# 东方财富：全部沪深京 A 股实时行情
quotes = ak.stock_zh_a_spot_em()
print(quotes[["代码", "名称", "最新价", "涨跌幅", "成交额"]].head())`;
const akshareSinaSnippet = `import akshare as ak

# 新浪财经：全部沪深京 A 股实时行情
quotes = ak.stock_zh_a_spot()
print(quotes[["代码", "名称", "最新价", "涨跌幅", "买入", "卖出"]].head())`;
const fields = [
  ["来源", "_license", "string", "数据复用许可摘要；完整条款以 _terms 指向页面为准"],
  ["来源", "_attribution", "string", "展示数据时使用的来源署名文本"],
  ["来源", "_canonical", "string · URI", "该响应的规范 API 地址"],
  ["来源", "_terms", "string · URI", "数据许可与使用条款地址"],
  ["报告", "report_date", "string · date", "报告对应的美股交易日，格式为 YYYY-MM-DD"],
  ["报告", "session", "string · enum", "报告时段：premarket（盘前）或 postclose（盘后）"],
  ["报告", "updated_at", "string · date-time", "报告生成或最近更新时间，UTC"],
  ["报告", "report_events", "array<object>", "市场概览中的关键事件列表"],
  ["事件", "report_events[].title", "string", "关键事件的中文标题"],
  ["事件", "report_events[].tickers", "array<string>", "该事件关联的股票或 ETF 代码；可能为空数组"],
  ["情绪", "market_mood", "object", "整体情绪对象，包含 overall_level、score 与判断说明"],
  ["热门标的", "top_tickers", "array<object>", "热门标的排行，包含讨论量、得票、价格、涨跌幅与趋势数据"],
  ["正文", "report_markdown", "string · markdown", "完整中文报告，可直接交给 Markdown 渲染器"],
  ["正文", "report_markdown_en", "string · markdown", "完整英文报告"],
  ["样本", "wsb_posts_count", "integer", "生成本期报告时分析的帖子数量"],
  ["样本", "wsb_comments_count", "integer", "生成本期报告时分析的评论数量"],
  ["质量", "quality_checks", "object", "报告内容质量检查结果；内部键会随检查项变化"],
  ["质量", "data_quality", "object", "上游状态、陈旧秒数及陈旧原因"],
];
const historyFields = [
  ["来源", "_license", "string", "数据复用许可摘要；完整条款以 _terms 指向页面为准"],
  ["来源", "_attribution", "string", "展示数据时使用的来源署名文本"],
  ["来源", "_canonical", "string · URI", "该响应的规范 API 地址"],
  ["来源", "_terms", "string · URI", "数据许可与使用条款地址"],
  ["响应", "count", "integer", "本次返回的历史报告记录数；当前响应为 10"],
  ["响应", "runs", "array<object>", "历史报告索引列表，按更新时间从新到旧排列"],
  ["报告", "runs[].updated_at", "string · date-time", "该期报告生成或最近更新时间，UTC"],
  ["报告", "runs[].report_date", "string · date", "报告对应的美股交易日，格式为 YYYY-MM-DD"],
  ["报告", "runs[].session", "string · enum", "报告时段：premarket（盘前）或 postclose（盘后）"],
  ["情绪", "runs[].mood", "string · enum", "情绪标签，例如 bullish、neutral 或 bearish"],
  ["情绪", "runs[].score", "number", "情绪量化分数；正值偏多，负值偏空"],
  ["样本", "runs[].posts", "integer", "生成该期报告时分析的帖子数量"],
  ["样本", "runs[].comments", "integer", "生成该期报告时分析的评论数量"],
  ["正文", "runs[].markdown_chars", "integer", "该期 Markdown 报告的字符数，不是报告全文"],
  ["事件", "runs[].events", "array<string>", "该期报告的关键事件标题列表"],
  ["质量", "runs[].quality", "object", "可选质量检查项，例如重复引用、内容过短、稀疏标的及新闻样本统计"],
];

const managerFields = [
  ["来源", "_license / _terms", "string · URI", "数据许可摘要与完整使用条款地址"],
  ["响应", "managers", "array<object>", "精选机构管理人列表"],
  ["身份", "managers[].slug", "string", "机构详情接口使用的稳定路径标识"],
  ["身份", "display_name / firm_name", "string", "管理人展示名与申报机构名称"],
  ["身份", "display_name_cn / firm_name_cn", "string · nullable", "可选的中文管理人名与机构名"],
  ["身份", "cik", "string", "SEC Central Index Key，保留前导零"],
  ["分类", "category / axis", "string", "策略类别与站内精选维度"],
  ["季度", "latest_period", "string", "最新持仓报告季度，例如 2026Q2"],
  ["季度", "latest_filing_date", "string · date", "最新 13F 向 SEC 提交的日期"],
  ["规模", "reported_value", "integer", "13F 报告持仓市值，单位为美元；不等同于机构 AUM"],
  ["指标", "badges", "object", "持仓数量、前五大集中度、换手率与期权占比"],
  ["画像", "description_cn / tags_cn", "string / array", "中文机构简介与策略标签"],
  ["头部持仓", "top_holding_ticker / top_holding_weight", "string / number", "第一大持仓代码及其组合权重"],
  ["变化", "signals", "object · nullable", "最大新建仓、加仓、减仓及新进/退出数量"],
];

const managerDetailFields = [
  ["机构", "manager", "object", "机构身份、最新季度、简介、标签及概览信号"],
  ["季度", "stat.report_period / filing_date", "string", "当前报告季度与 SEC 申报日期"],
  ["原始申报", "stat.accession_number / sec_url", "string / URI", "SEC 申报编号与 EDGAR 原始页面"],
  ["规模", "stat.scale", "object", "报告市值、持仓数、Top 1/Top 5、期权及 ETF 占比"],
  ["趋势", "stat.scale_arc", "array<object>", "逐季度规模、持仓数量和集中度演变"],
  ["调仓", "stat.new_positions", "array<object>", "本季度新建仓列表"],
  ["调仓", "stat.largest_adds / largest_reduces", "array<object>", "主要加仓与减仓列表"],
  ["调仓", "stat.exits", "array<object>", "本季度退出的持仓列表"],
  ["持仓", "stat.holdings / top_holdings", "array<object>", "完整持仓与前十大持仓，含权重、股数和环比变化"],
  ["衍生品", "stat.option_holdings", "array<object>", "13F 中披露的 PUT/CALL 名义持仓"],
  ["长期核心", "stat.persistent_core", "array<object>", "持续持有季度数及历史权重区间"],
  ["季度矩阵", "stat.quarterly_matrix", "array<object>", "各标的跨季度权重、市值与股数序列"],
  ["策略", "stat.strategy_label / pivot_score", "string / number", "组合风格标签与季度换挡分数"],
  ["主题", "stat.theme_exposure", "object", "金融、消费、平台、能源等主题暴露"],
  ["研究", "about", "object", "机构背景、投资风格、标签及人工核验状态"],
  ["叙事", "chapters", "array<object>", "各季度统计快照与 narrative 研究解读"],
  ["表现", "cumulative_growth_pct", "number", "页面研究口径下的累计增长比例"],
];

const finvizQuoteFeatures = [
  ["行情图表", "ticker_charts()", "图表", "获取个股在 Finviz 上的价格图表。"],
  ["基本面", "ticker_fundament()", "dict", "公司、市值、估值、盈利、股本与阶段表现等基本面指标。"],
  ["公司资料", "ticker_description()", "string", "获取公司的业务与经营范围描述。"],
  ["同行公司", "ticker_peer()", "list", "返回同行或可比公司的股票代码。"],
  ["ETF 持有者", "ticker_etf_holders()", "list", "查看哪些 ETF 持有该股票。"],
  ["外部评级", "ticker_outer_ratings()", "DataFrame", "整理分析师评级及评级调整记录。"],
  ["个股新闻", "ticker_news()", "DataFrame", "获取与该股票相关的近期新闻。"],
  ["内部人交易", "ticker_inside_trader()", "DataFrame", "获取公司内部人的买卖交易记录。"],
];

const searchItems = [
  { name: "WSB 美股舆情", meta: "数据类型 · WallStreetBets", href: "#quickstart", keywords: "wsb wallstreetbets reddit marketgrep 美股 舆情 市场情绪" },
  { name: "最新报告 API", meta: "GET · 实时", href: "#daily", keywords: "每日 市场情绪 sentiment report report_events report_markdown" },
  { name: "历史报告 API", meta: "GET · 历史", href: "#history", keywords: "历史索引 历史情绪 历史报告 history runs" },
  { name: "13F 机构持仓", meta: "数据类型 · 聪明钱", href: "#thirteen-f", keywords: "13f 机构 持仓 基金 sec 聪明钱 marketgrep" },
  { name: "机构列表 API", meta: "GET · 季度", href: "#managers", keywords: "13f managers 机构列表 基金经理" },
  { name: "13F 机构持仓详情 API", meta: "GET · 季度", href: "#manager-detail", keywords: "13f manager slug holdings 调仓 季度变化 narrative" },
  { name: "美股详情", meta: "开源工具 · Python", href: "#us-stock-detail", keywords: "美股 个股 finviz finvizfinance 基本面 图表 新闻 评级 内幕信息" },
  { name: "股票报价、图表与基本面分析", meta: "Python · Quote", href: "#stock-quote", keywords: "quote ticker chart fundament description ratings 股票报价 图表 基本面" },
  { name: "内幕信息", meta: "Python · Insider", href: "#insider-information", keywords: "insider 内幕 内部人交易 owner trade" },
  { name: "新闻与情绪趋势", meta: "Python · News", href: "#news-sentiment", keywords: "news blogs sentiment 新闻 情绪 趋势" },
  { name: "A 股行情数据", meta: "开源工具 · AKShare", href: "#a-share-market", keywords: "a股 行情 akshare 沪深京 股票 数据源" },
  { name: "东方财富实时行情", meta: "Python · 全市场", href: "#akshare-eastmoney", keywords: "东方财富 stock_zh_a_spot_em 实时行情" },
  { name: "新浪财经实时行情", meta: "Python · 全市场", href: "#akshare-sina", keywords: "新浪财经 stock_zh_a_spot 实时行情" },
  { name: "API 收录协议", meta: "OpenAPI 3.1", href: "#standard", keywords: "接入规范 收录标准 协议" },
  { name: "使用须知", meta: "来源 · 授权 · 请求边界", href: "#quality", keywords: "非投资建议 署名 版权 频率 缓存" },
];

function CopyButton({ value, compact = false }: { value: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return <button className={compact ? "copy compact" : "copy"} onClick={copy} aria-label="复制内容">{copied ? "已复制" : "复制"}</button>;
}

function OpenEndpointButton({ href }: { href: string }) {
  return <a className="endpoint-open" href={href} target="_blank" rel="noreferrer" aria-label="在新标签页打开接口">打开 ↗</a>;
}

function ApiAttribution({ sourceUrl = sourcePageUrl, sourceLabel = "MarketGrep · WSB 美股舆情页面" }: { sourceUrl?: string; sourceLabel?: string }) {
  return <div className="api-attribution" aria-label="接口来源与许可">
    <span><b>数据来源</b><a href={sourceUrl} target="_blank" rel="noreferrer">{sourceLabel} ↗</a></span>
    <span><b>许可说明</b><a href={licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0 与使用条款 ↗</a></span>
  </div>;
}

export default function Home() {
  const [language, setLanguage] = useState<keyof typeof snippets>("Python");
  const [thirteenFLanguage, setThirteenFLanguage] = useState<keyof typeof thirteenFSnippets>("Python");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return searchItems.filter((item) => `${item.name} ${item.meta} ${item.keywords}`.toLowerCase().includes(q));
  }, [query]);

  return <div className="site-shell">
    <header className="topbar">
      <a className="brand" href="#overview"><img className="brand-mark" src={assetPath("/logo.png")} alt="" /><span>金融信息平权</span><span className="brand-en">FinEqual</span><span className="version">v1.0</span></a>
      <div className="header-actions"><a className="text-link" href="#standard">接入规范</a><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="打开导航">☰</button></div>
    </header>

    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="search-wrap"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索 API 或字段…" aria-label="搜索文档" /><kbd>⌘ K</kbd>
        {query && <div className="search-results">{matches.length ? matches.map((item) => <a key={item.href} href={item.href} onClick={() => { setQuery(""); setMenuOpen(false); }}><strong>{item.name}</strong><small>{item.meta}</small></a>) : <p>没有找到匹配内容</p>}</div>}
      </div>
      <nav>
        <details className="nav-group" open>
          <summary>开始</summary>
          <div className="nav-children"><a href="#overview">概览</a></div>
        </details>
        <details className="nav-group" open>
          <summary>WSB 美股舆情</summary>
          <div className="nav-children"><a href="#daily"><span className="method-dot">GET</span> 最新报告</a><a href="#history"><span className="method-dot">GET</span> 历史报告</a></div>
        </details>
        <details className="nav-group" open>
          <summary>13F 机构持仓</summary>
          <div className="nav-children"><a href="#managers"><span className="method-dot">GET</span> 机构列表</a><a href="#manager-detail"><span className="method-dot">GET</span> 持仓详情</a></div>
        </details>
        <details className="nav-group" open>
          <summary>美股详情</summary>
          <div className="nav-children"><a href="#stock-quote"><span className="method-dot">PY</span> 股票报价、图表与基本面</a><a href="#insider-information"><span className="method-dot">PY</span> 内幕信息</a><a href="#news-sentiment"><span className="method-dot">PY</span> 新闻与情绪趋势</a></div>
        </details>
        <details className="nav-group" open>
          <summary>A 股行情数据</summary>
          <div className="nav-children"><a href="#akshare-eastmoney"><span className="method-dot">PY</span> 东方财富实时行情</a><a href="#akshare-sina"><span className="method-dot">PY</span> 新浪财经实时行情</a></div>
        </details>
        <details className="nav-group" open>
          <summary>维护者指南</summary>
          <div className="nav-children"><a href="#standard">API 收录协议</a><a href="#quality">使用须知</a></div>
        </details>
      </nav>
      <div className="sidebar-contact">
        <span>联系作者</span>
        <a href="https://space.bilibili.com/229150291" target="_blank" rel="noreferrer">
          <img src={assetPath("/author-avatar.jpg")} alt="卷卷姐juan 的哔哩哔哩头像" />
          <div><strong>卷卷姐juan</strong><small>哔哩哔哩</small></div>
          <b aria-hidden="true">↗</b>
        </a>
      </div>
    </aside>

    <main>
      <section className="hero" id="overview">
        <div className="eyebrow"><span>Financial Information Equality</span><span>•</span><span>开放获取</span></div>
        <h1>让金融信息 <span>不再有门槛</span></h1>
        <p className="hero-copy">免费金融信息 API 聚合平台。为中文开发者筛选开放、实用的数据接口，并提供清晰的字段说明与可直接运行的示例。</p>
        <div className="hero-actions"><a className="primary-button" href="#quickstart">开始调用 <span>→</span></a><a className="secondary-button" href={assetPath("/openapi.yaml")} download>下载 OpenAPI 规范</a></div>
        <div className="stats"><div><strong>4</strong><span>已收录数据类型</span></div><div><strong>4</strong><span>免费 API 接口</span></div><div><strong>2</strong><span>开源 Python 工具</span></div></div>
      </section>

      <section className="content-section provider-section" id="quickstart">
        <div className="provider-heading"><span className="section-number">01 / 美股舆情</span><div><h2>WallStreetBets 美股舆情</h2><p>追踪 Reddit r/wallstreetbets 社区的热门股票与多空情绪。本项包含同一个舆情页面的调用示例、最新报告 API 和历史报告 API。</p><div className="source-reference"><span>原网页</span><a href={sourcePageUrl} target="_blank" rel="noreferrer"><strong>WallStreetBets 美股每日散户情绪报告</strong><small>MarketGrep</small><b>↗</b></a></div></div></div>
        <div className="intro-grid provider-intro">
          <div><span className="subsection-label">快速开始</span><h3>三十秒拿到第一份报告</h3><p>这是一个标准 HTTP GET 接口，返回 JSON。建议始终设置超时、检查状态码，并保留来源署名。</p></div>
          <div className="code-card"><div className="code-tabs"><div>{Object.keys(snippets).map((item) => <button key={item} className={language === item ? "selected" : ""} onClick={() => setLanguage(item as keyof typeof snippets)}>{item}</button>)}</div><CopyButton value={snippets[language]} compact /></div><pre><code>{snippets[language]}</code></pre></div>
        </div>

      <div className="api-subsection" id="daily">
        <div className="section-heading"><div><span className="section-number">01.1 / 接口</span><h2>最新报告 API</h2></div><span className="status"><i /> 在线</span></div>
        <p className="lead">抓取社区讨论并汇总成结构化的每日市场报告。<code>report_events</code> 适合做信息流、时间线和提醒；<code>report_markdown</code> 适合直接渲染全文。</p>
        <div className="endpoint-bar"><span>GET</span><code>{dailyUrl}</code><CopyButton value={dailyUrl} compact /><OpenEndpointButton href={dailyUrl} /></div>
        <ApiAttribution />
        <h3>响应字段</h3>
        <div className="field-table response-fields"><div className="field-head"><span>字段</span><span>类型</span><span>说明</span></div>{fields.map(([, name, type, desc]) => <div className="field-row" key={name}><code>{name}</code><span>{type}</span><p>{desc}</p></div>)}</div>
        <h3>最小响应示例</h3>
        <div className="response-card"><div className="response-top"><span><i /> 200 OK</span><span>application/json</span></div><pre><code>{`{
  "report_date": "2026-09-25",
  "session": "postclose",
  "report_events": [
    { "title": "微软收涨，Copilot 改版成为市场焦点", "tickers": ["MSFT"] }
  ],
  "market_mood": { "overall_level": "neutral", "score": 0.1 },
  "report_markdown": "# WallStreetBets 市场情绪报告…"
}`}</code></pre></div>
      </div>

      <div className="api-subsection" id="history">
        <div className="section-heading"><div><span className="section-number">01.2 / 接口</span><h2>历史报告 API</h2></div><span className="status"><i /> 在线</span></div>
        <p className="lead">获取近期历史报告的摘要列表。适合做报告归档、情绪趋势或关键事件回看；响应不包含每期完整的 <code>report_markdown</code>。</p>
        <div className="endpoint-bar"><span>GET</span><code>{historyUrl}</code><CopyButton value={historyUrl} compact /><OpenEndpointButton href={historyUrl} /></div>
        <ApiAttribution />
        <h3>响应字段</h3>
        <div className="field-table response-fields"><div className="field-head"><span>字段</span><span>类型</span><span>说明</span></div>{historyFields.map(([, name, type, desc]) => <div className="field-row" key={name}><code>{name}</code><span>{type}</span><p>{desc}</p></div>)}</div>
        <h3>最小响应示例</h3>
        <div className="response-card"><div className="response-top"><span><i /> 200 OK</span><span>application/json</span></div><pre><code>{`{
  "_attribution": "MarketGrep (marketgrep.com)",
  "_canonical": "https://lite.marketgrep.com/api/sentiment-report/history",
  "_terms": "https://lite.marketgrep.com/license/",
  "count": 10,
  "runs": [
    {
      "updated_at": "2026-09-26 01:13:45.821853+00:00",
      "report_date": "2026-09-25",
      "session": "postclose",
      "mood": "neutral",
      "score": 0.1,
      "posts": 500,
      "comments": 3304,
      "markdown_chars": 14658,
      "events": [
        "OpenAI 推出每月 500 美元 Pro Max 订阅",
        "微软收涨 3.66%，Copilot 改版成权重股赢家"
      ],
      "quality": {
        "news_seen": ["community 1", "wire 40"]
      }
    }
  ]
}`}</code></pre></div>
      </div>
      </section>

      <section className="content-section provider-section" id="thirteen-f">
        <div className="provider-heading"><span className="section-number">02 / 13F 机构持仓</span><div><h2>MarketGrep 机构持仓 13F 研究</h2><p>13F 是管理规模超过 1 亿美元的机构投资者每季度向 SEC 申报的持仓清单。追踪头部基金的持仓如何逐季演变，以及每一步背后的策略，是观察聪明钱真实动向最清晰的窗口之一。</p><div className="source-reference"><span>原网页</span><a href={thirteenFSourceUrl} target="_blank" rel="noreferrer"><strong>MarketGrep 机构持仓 13F 研究</strong><small>MarketGrep</small><b>↗</b></a></div></div></div>
        <div className="intro-grid provider-intro">
          <div><span className="subsection-label">快速开始</span><h3>先选机构，再读取完整持仓</h3><p>先从机构列表取得稳定的 <code>slug</code>，再拼入详情接口。详情响应同时提供 SEC 原始申报链接、逐季持仓变化与研究叙事。</p></div>
          <div className="code-card"><div className="code-tabs"><div>{Object.keys(thirteenFSnippets).map((item) => <button key={item} className={thirteenFLanguage === item ? "selected" : ""} onClick={() => setThirteenFLanguage(item as keyof typeof thirteenFSnippets)}>{item}</button>)}</div><CopyButton value={thirteenFSnippets[thirteenFLanguage]} compact /></div><pre><code>{thirteenFSnippets[thirteenFLanguage]}</code></pre></div>
        </div>

        <div className="api-subsection" id="managers">
          <div className="section-heading"><div><span className="section-number">02.1 / 接口</span><h2>机构列表 API</h2></div><span className="status"><i /> 季度更新</span></div>
          <p className="lead">返回精选机构管理人及其最新 13F 申报季度。适合制作机构目录、筛选器和聪明钱概览，并为详情接口取得 <code>slug</code>。</p>
          <div className="endpoint-bar"><span>GET</span><code>{managersUrl}</code><CopyButton value={managersUrl} compact /><OpenEndpointButton href={managersUrl} /></div>
          <ApiAttribution sourceUrl={thirteenFSourceUrl} sourceLabel="MarketGrep · 机构持仓 13F 研究页面" />
          <h3>响应字段</h3>
          <div className="field-table response-fields"><div className="field-head"><span>字段</span><span>类型</span><span>说明</span></div>{managerFields.map(([, name, type, desc]) => <div className="field-row" key={name}><code>{name}</code><span>{type}</span><p>{desc}</p></div>)}</div>
          <h3>最小响应示例</h3>
          <div className="response-card"><div className="response-top"><span><i /> 200 OK</span><span>application/json</span></div><pre><code>{`{
  "_attribution": "MarketGrep (marketgrep.com)",
  "_terms": "https://lite.marketgrep.com/license/",
  "managers": [
    {
      "slug": "berkshire-hathaway",
      "display_name": "Warren Buffett",
      "firm_name": "Berkshire Hathaway Inc",
      "cik": "0001067983",
      "latest_period": "2026Q2",
      "latest_filing_date": "2026-08-14",
      "reported_value": 299253556246,
      "badges": {
        "holdings_count": 29,
        "top5_weight": 0.6865,
        "turnover": 0.0777,
        "option_ratio": 0
      },
      "top_holding_ticker": "AAPL"
    }
  ]
}`}</code></pre></div>
        </div>

        <div className="api-subsection" id="manager-detail">
          <div className="section-heading"><div><span className="section-number">02.2 / 接口</span><h2>13F 机构持仓详情 API</h2></div><span className="status"><i /> 季度更新</span></div>
          <p className="lead">按机构 <code>slug</code> 返回完整持仓、环比调仓、历史季度矩阵、策略标签与研究叙事。13F 只覆盖申报范围内的证券，<code>reported_value</code> 不应直接当作机构总资产 AUM。</p>
          <div className="endpoint-bar"><span>GET</span><code>{managerDetailUrl}</code><CopyButton value={managerDetailUrl} compact /><OpenEndpointButton href={managerDetailExampleUrl} /></div>
          <div className="path-parameter"><span>路径参数</span><code>slug</code><p>来自机构列表的 <code>managers[].slug</code>，例如 <code>berkshire-hathaway</code>。</p></div>
          <ApiAttribution sourceUrl={thirteenFManagerSourceUrl} sourceLabel="MarketGrep · 伯克希尔·哈撒韦 13F 机构详情页" />
          <h3>响应字段</h3>
          <div className="field-table response-fields"><div className="field-head"><span>字段</span><span>类型</span><span>说明</span></div>{managerDetailFields.map(([, name, type, desc]) => <div className="field-row" key={name}><code>{name}</code><span>{type}</span><p>{desc}</p></div>)}</div>
          <h3>最小响应示例</h3>
          <div className="response-card"><div className="response-top"><span><i /> 200 OK</span><span>application/json</span></div><pre><code>{`{
  "manager": {
    "slug": "berkshire-hathaway",
    "display_name": "Warren Buffett",
    "latest_period": "2026Q2"
  },
  "stat": {
    "report_period": "2026Q2",
    "filing_date": "2026-08-14",
    "sec_url": "https://www.sec.gov/cgi-bin/browse-edgar?...",
    "scale": {
      "reported_value": 299253556246,
      "holdings_count": 29,
      "top_5_weight": 0.6865
    },
    "top_holdings": [
      { "rank": 1, "ticker": "AAPL", "weight": 0.2204, "status": "hold" }
    ],
    "strategy_label": "Concentrated",
    "pivot_score": 0.0405
  },
  "chapters": [
    { "narrative": { "one_liner": "Alphabet built to a combined 12.6%" } }
  ]
}`}</code></pre></div>
        </div>
      </section>

      <section className="content-section provider-section" id="us-stock-detail">
        <div className="provider-heading"><span className="section-number">03 / 美股详情</span><div><h2>finvizfinance 美股数据工具</h2><p>finvizfinance 是从 <a className="inline-source-link" href={finvizUrl} target="_blank" rel="noreferrer">Finviz ↗</a> 获取金融信息的 Python 开源库。本分类按照项目实际能力拆分为三部分：单只股票的报价、图表与基本面分析，全市场内幕交易信息，以及近期金融新闻。</p><div className="source-reference"><span>开源项目</span><a href={finvizFinanceRepoUrl} target="_blank" rel="noreferrer"><strong>lit26/finvizfinance</strong><small>GitHub</small><b>↗</b></a></div></div></div>
        <div className="endpoint-bar package-bar"><span>PIP</span><code>pip install finvizfinance</code><CopyButton value="pip install finvizfinance" compact /></div>
        <div className="api-attribution" aria-label="项目资料与许可">
          <span><b>项目主页</b><a href={finvizFinanceRepoUrl} target="_blank" rel="noreferrer">GitHub · lit26/finvizfinance ↗</a></span>
          <span><b>原始数据网站</b><a href={finvizUrl} target="_blank" rel="noreferrer">Finviz.com ↗</a></span>
          <span><b>官方文档</b><a href={finvizFinanceDocsUrl} target="_blank" rel="noreferrer">Read the Docs ↗</a></span>
          <span><b>开源许可</b><a href={finvizFinanceLicenseUrl} target="_blank" rel="noreferrer">MIT License ↗</a></span>
        </div>
        <p className="tool-note">项目性质：本地安装的 Python 数据采集库，并非 HTTP API。数据来自 <a className="inline-source-link" href={finvizUrl} target="_blank" rel="noreferrer">Finviz ↗</a>，使用时需同时遵守项目许可证和来源网站条款。</p>

        <div className="api-subsection tool-subsection" id="stock-quote">
          <div className="section-heading"><div><span className="section-number">03.1 / 个股</span><h2>股票报价、图表与基本面分析</h2></div><span className="status"><i /> Quote</span></div>
          <p className="lead">通过股票代码创建个股对象。除了图表与基本面，还能读取公司描述、同行公司、ETF 持有者、外部评级、该股新闻及该股内部人交易。</p>
          <div className="code-card tool-code"><div className="code-tabs"><div><button className="selected">Python</button></div><CopyButton value={finvizQuoteSnippet} compact /></div><pre><code>{finvizQuoteSnippet}</code></pre></div>
          <h3>可获取的个股详情</h3>
          <div className="field-table"><div className="field-head"><span>内容</span><span>方法</span><span>返回</span><span>说明</span></div>{finvizQuoteFeatures.map(([scope, name, type, desc]) => <div className="field-row" key={name}><span className="field-scope">{scope}</span><code>{name}</code><span>{type}</span><p>{desc}</p></div>)}</div>
        </div>

        <div className="api-subsection tool-subsection" id="insider-information">
          <div className="section-heading"><div><span className="section-number">03.2 / 市场</span><h2>内幕信息</h2></div><span className="status"><i /> Insider</span></div>
          <p className="lead">获取 <a className="inline-source-link" href={finvizUrl} target="_blank" rel="noreferrer">Finviz ↗</a> 汇总的内部人交易记录。可以查看最新交易、近一周重点交易或大股东交易，结果以表格形式返回，常见内容包括股票代码、内部人、关系、交易日期、买卖方向、价格、股数与金额。</p>
          <div className="code-card tool-code"><div className="code-tabs"><div><button className="selected">Python</button></div><CopyButton value={finvizInsiderSnippet} compact /></div><pre><code>{finvizInsiderSnippet}</code></pre></div>
          <div className="path-parameter"><span>option 可选值</span><code>latest</code><p><code>top week</code> 查看本周重点交易；<code>top owner trade</code> 查看大股东交易。</p></div>
        </div>

        <div className="api-subsection tool-subsection" id="news-sentiment">
          <div className="section-heading"><div><span className="section-number">03.3 / 市场</span><h2>新闻与情绪趋势</h2></div><span className="status"><i /> News</span></div>
          <p className="lead">获取 <a className="inline-source-link" href={finvizUrl} target="_blank" rel="noreferrer">Finviz ↗</a> 的近期金融新闻与博客列表，返回时间、标题、来源和链接。项目示例没有直接返回情绪分数；如需绘制情绪趋势，可在新闻标题与正文之上继续接入情绪分析模型。</p>
          <div className="code-card tool-code"><div className="code-tabs"><div><button className="selected">Python</button></div><CopyButton value={finvizNewsSnippet} compact /></div><pre><code>{finvizNewsSnippet}</code></pre></div>
        </div>
      </section>

      <section className="content-section provider-section" id="a-share-market">
        <div className="provider-heading"><span className="section-number">04 / A 股行情数据</span><div><h2>AKShare A 股行情</h2><p>AKShare 是面向 Python 的开源财经数据工具，统一封装了多个公开数据源。本页列举东方财富和新浪财经两个来源，均可获取沪深京 A 股全市场实时行情。</p><div className="source-reference"><span>官方文档</span><a href={akshareStockDocsUrl} target="_blank" rel="noreferrer"><strong>AKShare 股票数据 · A 股</strong><small>AKShare</small><b>↗</b></a></div></div></div>
        <div className="endpoint-bar package-bar"><span>PIP</span><code>pip install akshare --upgrade</code><CopyButton value="pip install akshare --upgrade" compact /></div>
        <div className="api-attribution" aria-label="AKShare 项目资料">
          <span><b>开源项目</b><a href={akshareRepoUrl} target="_blank" rel="noreferrer">GitHub · akfamily/akshare ↗</a></span>
          <span><b>A 股文档</b><a href={akshareStockDocsUrl} target="_blank" rel="noreferrer">股票数据字典 ↗</a></span>
          <span><b>更多数据</b><a href={akshareDocsUrl} target="_blank" rel="noreferrer">另类数据字典 ↗</a></span>
        </div>
        <p className="tool-note">项目性质：本地安装的 Python 数据采集库，并非 AKShare 自建行情源。接口的可用性、频率限制和字段可能随上游网站变化，生产使用时应做好缓存、异常处理与降频。</p>

        <div className="api-subsection tool-subsection" id="akshare-eastmoney">
          <div className="section-heading"><div><span className="section-number">04.1 / 东方财富</span><h2>沪深京 A 股实时行情</h2></div><span className="status"><i /> 全市场</span></div>
          <p className="lead"><code>stock_zh_a_spot_em()</code> 单次返回全部沪深京 A 股上市公司的实时行情，常用字段包括代码、名称、最新价、涨跌幅、成交量、成交额、最高价和最低价。</p>
          <div className="source-reference"><span>数据来源</span><a href={eastmoneyAShareUrl} target="_blank" rel="noreferrer"><strong>东方财富 · 沪深京 A 股行情</strong><small>Eastmoney</small><b>↗</b></a></div>
          <div className="code-card tool-code"><div className="code-tabs"><div><button className="selected">Python</button></div><CopyButton value={akshareEastmoneySnippet} compact /></div><pre><code>{akshareEastmoneySnippet}</code></pre></div>
        </div>

        <div className="api-subsection tool-subsection" id="akshare-sina">
          <div className="section-heading"><div><span className="section-number">04.2 / 新浪财经</span><h2>沪深京 A 股实时行情</h2></div><span className="status"><i /> 全市场</span></div>
          <p className="lead"><code>stock_zh_a_spot()</code> 返回沪深京 A 股全市场实时行情，并包含买入价、卖出价、昨收、今开、最高和最低等字段。官方文档提示，重复高频调用可能被新浪暂时封禁 IP，应主动增加请求间隔。</p>
          <div className="source-reference"><span>数据来源</span><a href={sinaAShareUrl} target="_blank" rel="noreferrer"><strong>新浪财经 · 沪深京 A 股行情</strong><small>Sina Finance</small><b>↗</b></a></div>
          <div className="code-card tool-code"><div className="code-tabs"><div><button className="selected">Python</button></div><CopyButton value={akshareSinaSnippet} compact /></div><pre><code>{akshareSinaSnippet}</code></pre></div>
        </div>

      </section>

      <section className="content-section standard-section" id="standard">
        <span className="section-number">05 / 收录协议</span><h2>以后新增 API，都按同一套标准</h2>
        <p className="lead">本站采用 <strong>OpenAPI 3.1</strong> 描述 HTTP 接口，并用 JSON Schema 定义响应结构。这是行业通用规范，可继续生成文档、客户端和测试，而不是自创格式。</p>
        <div className="principles">
          <article><b>1</b><h3>身份明确</h3><p>写清数据提供方、原始地址、授权方式、许可协议与署名要求。</p></article>
          <article><b>2</b><h3>调用明确</h3><p>固定记录方法、URL、请求参数、认证、超时、限频和缓存建议。</p></article>
          <article><b>3</b><h3>结构明确</h3><p>每个字段都有类型、是否可空、示例与语义；不把猜测写成事实。</p></article>
          <article><b>4</b><h3>质量明确</h3><p>标注更新时间、数据延迟、稳定性、已知限制与错误处理方式。</p></article>
        </div>
        <div className="spec-card"><div><span className="spec-badge">OAS</span><div><strong>OpenAPI 3.1 规范文件</strong><p>可导入 Swagger UI、Redoc、Postman 与多数代码生成工具。</p></div></div><a href={assetPath("/openapi.yaml")} download>下载 YAML ↓</a></div>
      </section>

      <section className="content-section quality" id="quality">
        <div><span className="section-number">06 / 使用须知</span><h2>数据有来源，使用有边界</h2></div>
        <div className="quality-list"><p><strong>非投资建议</strong><span>聚合数据与自动生成内容可能存在延迟、遗漏或偏差，不应单独作为交易依据。</span></p><p><strong>遵守来源许可</strong><span>不同数据源的授权范围、署名和使用要求可能不同，请以对应接口详情及原网站条款为准。</span></p><p><strong>合理请求</strong><span>遵守各数据源的访问限制，避免高频轮询；生产环境建议缓存结果，并为失败请求设置退避重试。</span></p></div>
      </section>

      <footer><div><img className="brand-mark small" src={assetPath("/logo.png")} alt="" /><strong>金融信息平权 · FinEqual</strong></div><p>让金融信息不再有门槛。</p><div><a href="#overview">回到顶部 ↑</a></div></footer>
    </main>
  </div>;
}
