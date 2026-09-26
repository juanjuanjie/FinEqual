"use client";

import { useMemo, useState } from "react";

const dailyUrl = "https://www.marketgrep.com/api/sentiment-report";
const historyUrl = "https://lite.marketgrep.com/api/sentiment-report/history";
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
  ["report_date", "string · date", "报告对应的交易日，格式为 YYYY-MM-DD"],
  ["session", "string", "报告时段，例如 premarket 或 postclose"],
  ["report_events", "array<object>", "市场概览中的关键事件；每项含 title 与 tickers"],
  ["report_markdown", "string · markdown", "完整中文报告，可直接交给 Markdown 渲染器"],
  ["market_mood", "object", "整体情绪、量化分数与判断理由"],
  ["top_tickers", "array<object>", "热门标的、讨论量、涨跌幅及趋势数据"],
  ["updated_at", "string · date-time", "数据最近更新时间（UTC）"],
  ["data_quality", "object", "数据源状态与陈旧时间说明"],
];
const historyFields = [
  ["count", "integer", "返回的历史报告数量"],
  ["runs", "array<object>", "历史运行记录列表"],
  ["runs[].report_date", "string · date", "报告交易日"],
  ["runs[].session", "string", "premarket 或 postclose"],
  ["runs[].mood / score", "string / number", "情绪标签与量化分数"],
  ["runs[].events", "array<string>", "该期报告的关键事件标题"],
  ["runs[].posts / comments", "integer", "用于生成报告的样本数量"],
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

export default function Home() {
  const [language, setLanguage] = useState<keyof typeof snippets>("Python");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return [
      { name: "每日市场情绪报告", meta: "GET · 实时", href: "#daily" },
      { name: "历史情绪报告", meta: "GET · 历史", href: "#history" },
      { name: "接入规范", meta: "OpenAPI 3.1", href: "#standard" },
    ].filter((item) => `${item.name} ${item.meta}`.toLowerCase().includes(q));
  }, [query]);

  return <div className="site-shell">
    <header className="topbar">
      <a className="brand" href="#overview"><span className="brand-mark">F</span><span>Finance API Hub</span><span className="version">v1.0</span></a>
      <div className="header-actions"><a className="text-link" href="#standard">接入规范</a><a className="github-link" href="https://github.com/akfamily/akquant" target="_blank" rel="noreferrer">参考项目 ↗</a><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="打开导航">☰</button></div>
    </header>

    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="search-wrap"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索 API 或字段…" aria-label="搜索文档" /><kbd>⌘ K</kbd>
        {query && <div className="search-results">{matches.length ? matches.map((item) => <a key={item.href} href={item.href} onClick={() => { setQuery(""); setMenuOpen(false); }}><strong>{item.name}</strong><small>{item.meta}</small></a>) : <p>没有找到匹配内容</p>}</div>}
      </div>
      <nav>
        <p className="nav-label">开始</p><a href="#overview" className="active">概览</a><a href="#quickstart">快速开始</a>
        <p className="nav-label">市场情绪</p><a href="#daily"><span className="method-dot">GET</span> 每日报告</a><a href="#history"><span className="method-dot">GET</span> 历史报告</a>
        <p className="nav-label">维护者指南</p><a href="#standard">API 收录协议</a><a href="#quality">质量与授权</a>
      </nav>
      <div className="sidebar-note"><span className="pulse" /><div><strong>2 个接口在线</strong><small>免费优先 · 持续更新</small></div></div>
    </aside>

    <main>
      <section className="hero" id="overview">
        <div className="eyebrow"><span>精选目录</span><span>•</span><span>开发者友好</span></div>
        <h1>把好用的金融数据<br />变成<span>清晰的接口</span></h1>
        <p className="hero-copy">为中文开发者整理的金融信息 API 指南。每个接口都经过人工筛选，优先免费、无需复杂认证，并提供可直接运行的示例。</p>
        <div className="hero-actions"><a className="primary-button" href="#quickstart">开始调用 <span>→</span></a><a className="secondary-button" href="/openapi.yaml" download>下载 OpenAPI 规范</a></div>
        <div className="stats"><div><strong>2</strong><span>已收录接口</span></div><div><strong>0</strong><span>所需 API Key</span></div><div><strong>3</strong><span>语言示例</span></div></div>
      </section>

      <section className="content-section intro-grid" id="quickstart">
        <div><span className="section-number">01 / 快速开始</span><h2>三十秒拿到第一份报告</h2><p>这是一个标准 HTTP GET 接口，返回 JSON。建议始终设置超时、检查状态码，并保留来源署名。</p></div>
        <div className="code-card"><div className="code-tabs"><div>{Object.keys(snippets).map((item) => <button key={item} className={language === item ? "selected" : ""} onClick={() => setLanguage(item as keyof typeof snippets)}>{item}</button>)}</div><CopyButton value={snippets[language]} compact /></div><pre><code>{snippets[language]}</code></pre></div>
      </section>

      <section className="content-section" id="daily">
        <div className="section-heading"><div><span className="section-number">02 / 市场情绪</span><h2>WallStreetBets 每日市场情绪报告</h2></div><span className="status"><i /> 在线</span></div>
        <p className="lead">抓取社区讨论并汇总成结构化的每日市场报告。<code>report_events</code> 适合做信息流、时间线和提醒；<code>report_markdown</code> 适合直接渲染全文。</p>
        <div className="endpoint-bar"><span>GET</span><code>{dailyUrl}</code><CopyButton value={dailyUrl} compact /></div>
        <div className="callouts">
          <article><span className="callout-icon">◎</span><div><strong>无需认证</strong><p>当前不需要 API Key。建议客户端设置 30 秒超时。</p></div></article>
          <article><span className="callout-icon">↻</span><div><strong>更新频率</strong><p>通常覆盖盘前与盘后时段，以响应中的时间字段为准。</p></div></article>
          <article><span className="callout-icon">CC</span><div><strong>CC BY 4.0</strong><p>复用数据时需注明 “MarketGrep (marketgrep.com)” 并链接来源。</p></div></article>
        </div>
        <h3>响应字段</h3>
        <div className="field-table"><div className="field-head"><span>字段</span><span>类型</span><span>说明</span></div>{fields.map(([name, type, desc]) => <div className="field-row" key={name}><code>{name}</code><span>{type}</span><p>{desc}</p></div>)}</div>
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
      </section>

      <section className="content-section" id="history">
        <div className="section-heading"><div><span className="section-number">03 / 历史数据</span><h2>历史情绪报告</h2></div><span className="status"><i /> 在线</span></div>
        <p className="lead">获取近期报告的轻量索引。适合做归档列表、情绪趋势或关键事件回看；它返回摘要，不包含每期完整的 <code>report_markdown</code>。</p>
        <div className="endpoint-bar"><span>GET</span><code>{historyUrl}</code><CopyButton value={historyUrl} compact /></div>
        <div className="field-table compact-table"><div className="field-head"><span>字段</span><span>类型</span><span>说明</span></div>{historyFields.map(([name, type, desc]) => <div className="field-row" key={name}><code>{name}</code><span>{type}</span><p>{desc}</p></div>)}</div>
      </section>

      <section className="content-section standard-section" id="standard">
        <span className="section-number">04 / 收录协议</span><h2>以后新增 API，都按同一套标准</h2>
        <p className="lead">本站采用 <strong>OpenAPI 3.1</strong> 描述 HTTP 接口，并用 JSON Schema 定义响应结构。这是行业通用规范，可继续生成文档、客户端和测试，而不是自创格式。</p>
        <div className="principles">
          <article><b>1</b><h3>身份明确</h3><p>写清数据提供方、原始地址、授权方式、许可协议与署名要求。</p></article>
          <article><b>2</b><h3>调用明确</h3><p>固定记录方法、URL、请求参数、认证、超时、限频和缓存建议。</p></article>
          <article><b>3</b><h3>结构明确</h3><p>每个字段都有类型、是否可空、示例与语义；不把猜测写成事实。</p></article>
          <article><b>4</b><h3>质量明确</h3><p>标注更新时间、数据延迟、稳定性、已知限制与错误处理方式。</p></article>
        </div>
        <div className="spec-card"><div><span className="spec-badge">OAS</span><div><strong>OpenAPI 3.1 规范文件</strong><p>可导入 Swagger UI、Redoc、Postman 与多数代码生成工具。</p></div></div><a href="/openapi.yaml" download>下载 YAML ↓</a></div>
      </section>

      <section className="content-section quality" id="quality">
        <div><span className="section-number">05 / 使用须知</span><h2>数据有来源，使用有边界</h2></div>
        <div className="quality-list"><p><strong>非投资建议</strong><span>社区情绪与自动生成内容可能存在偏差，不应单独作为交易依据。</span></p><p><strong>保留署名</strong><span>MarketGrep 数据按 CC BY 4.0 开放，公开展示时需附来源链接。</span></p><p><strong>合理请求</strong><span>避免高频轮询；生产环境建议缓存结果，并为失败请求设置退避重试。</span></p></div>
      </section>

      <footer><div><span className="brand-mark small">F</span><strong>Finance API Hub</strong></div><p>精选公开金融数据接口，为研究与开发而整理。</p><div><a href={dailyUrl} target="_blank" rel="noreferrer">数据来源 ↗</a><a href="#overview">回到顶部 ↑</a></div></footer>
    </main>
  </div>;
}
