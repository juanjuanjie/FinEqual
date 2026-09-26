"use client";

import { useMemo, useState } from "react";

const dailyUrl = "https://www.marketgrep.com/api/sentiment-report";
const historyUrl = "https://lite.marketgrep.com/api/sentiment-report/history";
const sourcePageUrl = "https://lite.marketgrep.com/zh/wsb";
const licenseUrl = "https://lite.marketgrep.com/license/";
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

const searchItems = [
  { name: "WSB 美股舆情", meta: "数据类型 · WallStreetBets", href: "#quickstart", keywords: "wsb wallstreetbets reddit marketgrep 美股 舆情 市场情绪" },
  { name: "最新报告 API", meta: "GET · 实时", href: "#daily", keywords: "每日 市场情绪 sentiment report report_events report_markdown" },
  { name: "历史报告 API", meta: "GET · 历史", href: "#history", keywords: "历史索引 历史情绪 历史报告 history runs" },
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

function ApiAttribution() {
  return <div className="api-attribution" aria-label="接口来源与许可">
    <span><b>数据来源</b><a href={sourcePageUrl} target="_blank" rel="noreferrer">MarketGrep · WSB 美股舆情页面 ↗</a></span>
    <span><b>许可说明</b><a href={licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0 与使用条款 ↗</a></span>
  </div>;
}

export default function Home() {
  const [language, setLanguage] = useState<keyof typeof snippets>("Python");
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
        <div className="stats"><div><strong>1</strong><span>已收录数据类型</span></div><div><strong>2</strong><span>免费 API 接口</span></div><div><strong>0</strong><span>所需 API Key</span></div></div>
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
        <div className="endpoint-bar"><span>GET</span><code>{dailyUrl}</code><CopyButton value={dailyUrl} compact /></div>
        <ApiAttribution />
        <h3>响应字段</h3>
        <div className="field-table"><div className="field-head"><span>分类</span><span>字段</span><span>类型</span><span>说明</span></div>{fields.map(([scope, name, type, desc]) => <div className="field-row" key={name}><span className="field-scope">{scope}</span><code>{name}</code><span>{type}</span><p>{desc}</p></div>)}</div>
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
        <div className="endpoint-bar"><span>GET</span><code>{historyUrl}</code><CopyButton value={historyUrl} compact /></div>
        <ApiAttribution />
        <h3>响应字段</h3>
        <div className="field-table"><div className="field-head"><span>分类</span><span>字段</span><span>类型</span><span>说明</span></div>{historyFields.map(([scope, name, type, desc]) => <div className="field-row" key={name}><span className="field-scope">{scope}</span><code>{name}</code><span>{type}</span><p>{desc}</p></div>)}</div>
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

      <section className="content-section standard-section" id="standard">
        <span className="section-number">02 / 收录协议</span><h2>以后新增 API，都按同一套标准</h2>
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
        <div><span className="section-number">03 / 使用须知</span><h2>数据有来源，使用有边界</h2></div>
        <div className="quality-list"><p><strong>非投资建议</strong><span>聚合数据与自动生成内容可能存在延迟、遗漏或偏差，不应单独作为交易依据。</span></p><p><strong>遵守来源许可</strong><span>不同数据源的授权范围、署名和使用要求可能不同，请以对应接口详情及原网站条款为准。</span></p><p><strong>合理请求</strong><span>遵守各数据源的访问限制，避免高频轮询；生产环境建议缓存结果，并为失败请求设置退避重试。</span></p></div>
      </section>

      <footer><div><img className="brand-mark small" src={assetPath("/logo.png")} alt="" /><strong>金融信息平权 · FinEqual</strong></div><p>让金融信息不再有门槛。</p><div><a href="#overview">回到顶部 ↑</a></div></footer>
    </main>
  </div>;
}
