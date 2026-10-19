import { useEffect, useRef, useState } from "react";
import {
  PROVIDERS,
  type ApiConfig,
  type Quest,
  type WorldEvent,
  type Attribute,
} from "./lib/types";
import {
  generateQuest,
  testConnection,
} from "./lib/ai";
import { loadBulletin, bulletinTitle } from "./lib/feed";
import WorldClock from "./WorldClock";

const asset = (name: string) =>
  `${import.meta.env.BASE_URL}assets/${name}.webp`;
const badges: Record<Attribute, string> = {
  幸运: "luck",
  探索: "explore",
  勇气: "courage",
  善意: "kindness",
  感知: "perception",
  羁绊: "bond",
  尊严: "dignity",
  想象力: "imagination",
  生命力: "vitality",
};
const Icon = ({ name }: { name: string }) => (
  <img className="icon" src={asset(name)} alt="" />
);
type Phase = "offered" | "accepted" | "completed" | "skipped";
export default function App() {
  const [tab, setTab] = useState<"quest" | "world">("quest");
  const [config, setConfig] = useState<ApiConfig>({
    provider: "aliyun",
    apiKey: "",
    ...PROVIDERS.aliyun,
  });
  const [settings, setSettings] = useState(false),
    [reveal, setReveal] = useState(false),
    [connected, setConnected] = useState(false);
  const [quest, setQuest] = useState<Quest | null>(null),
    [phase, setPhase] = useState<Phase>("offered");
  const [events, setEvents] = useState<WorldEvent[]>([]),
    [interests, setInterests] = useState("");
  const [notice, setNotice] = useState(""),
    [busy, setBusy] = useState("");
  const [feedTime, setFeedTime] = useState("");
  const [feedLoading, setFeedLoading] = useState(false);
  const feedRequest = useRef(false);
  const [feedError, setFeedError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [questSource, setQuestSource] = useState("");
  const [preferences, setPreferences] = useState(false);
  const [animateScene, setAnimateScene] = useState(true);
  const [quote, setQuote] = useState(0);
  const [eventFilter, setEventFilter] = useState("全部");
  const request = useRef<AbortController | null>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const quotes = [
    "你不必成为谁，今天的你就很好。",
    "偶尔绕一点远路，也是在靠近生活。",
    "没有白走的路，只有还没发现的支线。",
  ];
  useEffect(() => {
    if (settings) dialog.current?.showModal();
    else dialog.current?.close();
  }, [settings]);
  useEffect(() => () => request.current?.abort(), []);
  const cancel = () => {
    request.current?.abort();
    request.current = null;
    setBusy("");
  };
  const updateConfig = (next: ApiConfig) => {
    cancel();
    setConfig(next);
    setConnected(false);
    setNotice("");
  };
  async function run(
    label: string,
    work: (signal: AbortSignal) => Promise<void>,
  ) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(label);
    setElapsed(0);
    setNotice("");
    try {
      await work(controller.signal);
    } catch (e) {
      if (!controller.signal.aborted)
        setNotice(e instanceof Error ? e.message : "请求失败，请稍后再试。");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy("");
      }
    }
  }
  const showQuest = (q: Quest) => {
    setQuest(q);
    setPhase("offered");
    setTab("quest");
  };
  const makeQuest = (event?: WorldEvent, theme?: string) => {
    if (!config.apiKey.trim()) {
      setNotice("请先配置 API 密钥，再点击入口生成专属小任务。");
      setSettings(true);
      return;
    }
    void run("正在发现你的支线", async (signal) => {
      try {
        const q = await generateQuest(config, theme ? `${theme}。玩家偏好：${interests}` : interests, event, { signal });
        if (!signal.aborted) { showQuest(q); setQuestSource(`${PROVIDERS[config.provider].name} · ${config.model}`); }
      } catch (e) {
        if (signal.aborted) return;
        setNotice(
          `${e instanceof Error ? e.message : "AI 暂时不可用。"} 原任务已保留，请重新尝试。`,
        );
      }
    });
  };
  const fetchNews = async () => {
    if (feedRequest.current) return;
    feedRequest.current = true;
    setFeedLoading(true);
    setFeedError("");
    try {
      const data = await loadBulletin();
      setEvents(data.events); setFeedTime(data.fetchedAt);
    } catch (error) { setFeedError(error instanceof Error ? error.message : "日报获取失败。"); }
    finally { feedRequest.current = false; setFeedLoading(false); }
  };
  useEffect(() => {
    void fetchNews();
    const timer = setInterval(() => void fetchNews(), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setElapsed(0);
    if (!busy) return;
    const timer = setInterval(() => setElapsed(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  return (
    <>
      <header className="topbar">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("quest");
          }}
        >
          <span className="pixel-earth">✦</span> EARTH ONLINE{" "}
          <span className="version">SIDE QUEST / 01</span>
        </a>
        <div className="top-right">
          <span className="server">
            <i /> HUMAN SERVER 正常运行
          </span>
          <button
            className="settings-trigger"
            onClick={() => setSettings(true)}
          >
            <Icon name="settings" /> API 设置
          </button>
        </div>
      </header>
      <main>
        <section className="hero" aria-label="地球 Online 之人生支线">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> LIFE IS AN OPEN WORLD
            </div>
            <img
              className="logo"
              src={asset("logo")}
              alt="地球 Online 之人生支线"
            />
            <p className="slogan">
              主线由世界安排，<strong>支线由你触发。</strong>
            </p>
            <p className="hero-note">不必改变人生，只给今天增加一点意外。</p>
          </div>
          <div className="landscape" aria-hidden="true">
            <div className="sky-dots">
              ✦ <span>·</span> ✧
            </div>
            <img className="city" src={asset("city")} alt="" />
            <img className="railing" src={asset("railing")} alt="" />
            <img className="traveler" src={asset("traveler")} alt="" />
            <span className="scene-caption">
              某个平凡的日子 · 你的故事正在发生
            </span>
          </div>
          <div className="hero-status">
            <span>
              <i /> 地球 Online 正常运行中
            </span>
            <WorldClock />
            <span>NO SAVE. JUST LIVE.</span>
          </div>
        </section>
        <div className="game-layout">
          <aside className="sidebar">
            <div className="sidebar-heading">
              你的探索地图 <span>MAP</span>
            </div>
            <nav aria-label="游戏导航">
              <button
                className={tab === "quest" ? "nav-item active" : "nav-item"}
                onClick={() => setTab("quest")}
              >
                <Icon name="quest" />
                <span>
                  今日支线<small>DAILY QUEST</small>
                </span>
                <b>›</b>
              </button>
              <button
                className={tab === "world" ? "nav-item active" : "nav-item"}
                onClick={() => setTab("world")}
              >
                <Icon name="world" />
                <span>
                  世界事件<small>WORLD EVENTS</small>
                </span>
                <b>›</b>
              </button>
            </nav>
            <div className="connection">
              <span className={`dot ${connected ? "online" : ""}`} />
              <div>
                {connected
                  ? "AI 已连接"
                  : config.apiKey
                    ? "API 待验证"
                    : "尚未配置 AI"}
                <small>
                  {config.apiKey
                    ? PROVIDERS[config.provider].name
                    : "配置密钥，生成专属小任务"}
                </small>
              </div>
              <button aria-label="配置 AI" onClick={() => setSettings(true)}>
                ↗
              </button>
            </div>
            <div className="world-note">
              <img src={asset("nightcat")} alt="窗边的像素小猫" />
              <p>
                这里没有等级，
                <br />
                没有必须完成的任务。
              </p>
              <small>只有你和生活的偶然相遇。</small>
            </div>
            <div className="signpost">
              <span>
                主线：生活
                <br />
                支线：体验
                <br />
                当前位置：地球
              </span>
            </div>
            <div className="sidebar-garden" aria-hidden="true">
              <img src={asset("lamp")} alt="" />
              <img src={asset("cat")} alt="" />
              <img src={asset("plant")} alt="" />
            </div>
          </aside>
          <section className="play-area">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {tab === "quest"
                    ? "A LITTLE ADVENTURE, JUST FOR YOU"
                    : "EARTH ONLINE / HUMAN SERVER"}
                </span>
                <h1>
                  {tab === "quest" ? "今日人生支线" : "世界正在发生什么"}
                  <span className="tiny-star">✦</span>
                </h1>
              </div>
              <span className="outline-tag">
                {tab === "quest"
                  ? "自由探索 · 随时跳过"
                  : "世界动态 · 支线灵感"}
              </span>
            </div>
            {notice && (
              <div className="notice" role="status">
                {notice}
                <button aria-label="关闭提示" onClick={() => setNotice("")}>
                  ×
                </button>
              </div>
            )}
            {busy && (
              <div className="loading" role="status">
                <span className="spinner" />
                {busy}… 已等待 {elapsed} 秒<button onClick={cancel}>取消请求</button>
              </div>
            )}
            {tab === "quest" ? (
              <>
                <div className="adventure-banner">
                  <img className="banner-shop" src={asset("shop")} alt="" />
                  <div>
                    <span>EVERYDAY IS AN ADVENTURE</span>
                    <h2>在平凡的日子里，遇见一点不平凡。</h2>
                    <p>没有标准答案，只有属于你的体验。</p>
                  </div>
                  <img
                    className="banner-traveler"
                    src={asset("traveler")}
                    alt=""
                  />
                </div>
                <div className="quest-utility"><button onClick={() => setPreferences(!preferences)}>修改兴趣与时长偏好</button>{quest && <button disabled={!!busy} onClick={() => makeQuest()}>重新尝试 / 换一个任务</button>}</div>
                {preferences && <label className="field">兴趣与时长偏好<input maxLength={200} value={interests} placeholder="例如：在家、独处、免费、三分钟" onChange={e => setInterests(e.target.value)} /></label>}
                <article
                  className={`quest-card ${phase === "completed" && quest ? "complete" : ""}`}
                >
                  <div className="card-top">
                    <span>
                      <span className="gold-dot" />{" "}
                      {quest
                        ? "SIDE QUEST / 人生支线"
                        : "NEW QUEST / 未知的可能"}
                    </span>
                    <span>
                      {quest
                        ? `AI 生成 · ${questSource}`
                        : "等待触发"}
                    </span>
                  </div>
                  {!quest ? (
                    <div className="empty-quest">
                      <picture className="welcome-background" aria-hidden="true">
                        <source media="(max-width:999px)" srcSet={asset("earth-side-quests")} />
                        <source media="(prefers-reduced-motion:reduce)" srcSet={asset("welcome-world")} />
                        <img src={asset(animateScene ? "welcome-world-animated" : "welcome-world")} alt="" />
                      </picture>
                      <button className="scene-motion" onClick={() => setAnimateScene(!animateScene)}>{animateScene ? "暂停场景动画" : "播放场景动画"}</button>
                      <div className="empty-copy">
                        <span className="chapter">EARTH ONLINE / YOUR SIDE QUEST</span>
                        <h2>
                          在地球，
                          <br />
                          开启你的<span>人生支线。</span>
                        </h2>
                        <p>
                          看见一处新风景，留意一个小细节，
                          <br />
                          在熟悉的生活里，发现新的可能。
                        </p>
                        <button
                          aria-label="生成今日支线"
                          className="primary"
                          disabled={!!busy}
                          onClick={() => makeQuest()}
                        >
                          <span>✦</span> 生成今日支线 <span>→</span>
                        </button>
                        <small>约 1–15 分钟 · 零花费 · 按你的节奏来</small>
                      </div>
                      <div className="quest-art">
                        <img
                          src={asset("earth-side-quests")}
                          alt="地球上的生活支线：小路连接咖啡馆、书店、花园与观景台，人们探索、阅读和相遇"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="quest-content">
                      <div className="quest-title">
                        <div>
                          <div className="tags">
                            <span>{quest.category}</span>
                            <span>{quest.estimatedMinutes} 分钟</span>
                            <span>{quest.difficulty}</span>
                            <span>
                              {
                                {
                                  offered: "待接受",
                                  accepted: "进行中",
                                  completed: "已完成",
                                  skipped: "已跳过",
                                }[phase]
                              }
                            </span>
                          </div>
                          <h2>{quest.title}</h2>
                        </div>
                        <img
                          src={asset(phase === "completed" ? "luck" : "quest")}
                          alt=""
                        />
                      </div>
                      <p className="story">「{quest.story}」</p>
                      {phase === "completed" ? (
                        <div className="rewards" aria-live="polite">
                          <span className="eyebrow">SIDE QUEST COMPLETED</span>
                          <h3><img className="completion-friends" src={asset("side-quest-friends")} alt="" />支线完成！</h3>
                          <p>恭喜玩家，成功触发一次人生支线！</p>
                          <div className="reward-row">
                            {quest.rewards.map((r) => (
                              <div className="reward" key={r.attribute}>
                                <img src={asset(badges[r.attribute])} alt="" />
                                <strong>
                                  {r.attribute} +{r.amount}
                                </strong>
                              </div>
                            ))}
                          </div>
                          <small>
                            仅为本次体验的象征性奖励，不累计、不存档，也不评价真实的你。
                          </small>
                          <button
                            className="primary"
                            onClick={() => makeQuest()}
                            disabled={!!busy}
                          >
                            探索下一条支线 →
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="quest-description">
                            {quest.description}
                          </p>
                          <ol className="steps">
                            {quest.steps.map((step, i) => (
                              <li key={i}>
                                <span>{String(i + 1).padStart(2, "0")}</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                          <p className="criteria">
                            <strong>完成条件</strong>
                            {quest.completionCriteria}
                          </p>
                          {quest.safeAlternative && (
                            <details>
                              <summary>也可以换一种轻松的方式</summary>
                              <p>{quest.safeAlternative}</p>
                            </details>
                          )}
                          {phase === "skipped" ? (
                            <p className="skip-message">
                              跳过也是一种选择。下一条支线，或许更适合你。
                            </p>
                          ) : (
                            <div className="quest-actions">
                              <button
                                className="primary"
                                disabled={phase !== "offered" || !!busy}
                                onClick={() => setPhase("accepted")}
                              >
                                {phase === "accepted"
                                  ? "已接受支线"
                                  : "接受支线"}
                              </button>
                              <button
                                className="secondary"
                                disabled={phase !== "accepted" || !!busy}
                                onClick={() =>
                                  setPhase((p) =>
                                    p === "accepted" ? "completed" : p,
                                  )
                                }
                              >
                                完成支线
                              </button>
                              <button
                                className="text-button"
                                disabled={!!busy}
                                onClick={() => setPhase("skipped")}
                              >
                                跳过支线
                              </button>
                            </div>
                          )}
                          <div className="card-bottom">
                            <small>
                              奖励在完成后揭晓。是否完成，由你自己决定。
                            </small>
                            <button
                              className="text-button"
                              disabled={!!busy}
                              onClick={() => makeQuest()}
                            >
                              ↻ 重新生成
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
                <div className="lower-grid">
                  <div className="inspiration">
                    <img src={asset("plant")} alt="" />
                    <div>
                      <span className="eyebrow">YOUR KIND OF ADVENTURE</span>
                      <h3>今天，想探索些什么？</h3>
                      <label className="sr-only" htmlFor="interests">
                        兴趣偏好
                      </label>
                      <input
                        id="interests"
                        placeholder="例如：自然、AI、音乐，或什么都试试"
                        maxLength={200}
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="world-teaser"
                    onClick={() => setTab("world")}
                  >
                    <Icon name="world" />
                    <span>
                      世界更新了，
                      <br />
                      <strong>去发现一条新支线</strong>
                    </span>
                    <b>↗</b>
                  </button>
                </div>
                <div className="inspiration-paths" aria-label="更多支线灵感">
                  {[
                    {
                      icon: "life-exploration",
                      name: "生活探索",
                      interest: "生活探索主题：发现身边的新路线、新角落或日常物品的新细节，生成一个简单现实探索任务",
                    },
                    {
                      icon: "sensory-experience",
                      name: "感知体验",
                      interest: "感知体验主题：通过声音、光线、触感等观察当下，生成一个安静专注的感官体验任务",
                    },
                    {
                      icon: "creative-surprise",
                      name: "创造一点意外",
                      interest: "创造一点意外主题：用手边物品或一句话做微型创作，生成一个有趣的小创意任务",
                    },
                  ].map((item) => (
                    <button
                      key={item.name}
                      disabled={!!busy}
                      onClick={() => {
                        makeQuest(undefined, item.interest);
                      }}
                    >
                      <img src={asset(item.icon)} alt="" />
                      <span>
                        <strong>{item.name}</strong>
                        <small>点击生成主题任务</small>
                      </span>
                      <b>›</b>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="world-area">
                <div className="world-toolbar">
                  <p>
                    现实世界持续运行。
                    <br />
                    <span>让真实的新鲜事，成为你的探索起点。</span>
                  </p>
                  <button
                    className="primary"
                    disabled={!!busy}
                    onClick={fetchNews}
                  >
                    刷新 AI 日报 ↗
                  </button>
                </div>
                <p className="hint">AIHOT 日报 · 每天 08:00（北京时间）发布；本站每小时同步，页面每五分钟检查。无需 API Key，不使用 AI 改写。</p>
                <p className="hint">{feedTime ? `最近同步：${new Date(feedTime).toLocaleString("zh-CN", {timeZone:"Asia/Shanghai",hour12:false})} 北京时间` : "正在读取日报…"}</p>
                {feedError && <p role="alert">{feedError} <button onClick={() => void fetchNews()}>重试获取</button></p>}
                <a href="https://aihot.news/daily" target="_blank" rel="noopener noreferrer">前往 AIHOT 阅读完整日报 ↗</a>
                <div className="events">
                  {events.map((event, i) => (
                    <article className="event-card" key={i}>
                      <div className="tags">
                        <span>{event.category}</span>
                        <span>
                          {event.isDemo
                            ? "演示事件"
                            : event.provenance === "user"
                              ? "用户提供 · 未核实"
                              : "AIHOT RSS · 来源原文"}
                        </span>
                      </div>
                      <h2>{bulletinTitle(event.title)}</h2>
                      <p>{event.summary}</p>
                      {!!event.entries?.length && <details><summary>展开本期 {event.entries.length} 条事件</summary><ul className="daily-directory">{event.entries.map(entry => <li key={entry.url}><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.title} ↗</a><button disabled={!!busy || /伤亡|死亡|自杀|色情|凶杀/.test(entry.title)} onClick={() => makeQuest({...event,title:entry.title,sourceTitle:entry.title,summary:entry.title,sourceUrl:entry.url,suggestedQuest:'仅依据标题主题生成安全小任务，不推断新闻正文。'})}>从这条事件生成小任务</button></li>)}</ul></details>}
                      {event.gameNarrative && <div className="event-narrative">
                        <span>AI / 游戏化叙事</span>
                        <p>{event.gameNarrative}</p>
                      </div>}
                      <p className="reason">为什么值得关注 · {event.reason}</p>
                      <details>
                        <summary>原始新闻与来源</summary>
                        <p>{event.original.title}</p>
                        <p className="source-text">{event.original.text}</p>
                        <p>
                          {event.original.name || "来源未确认"} · 发布时间：
                          {event.original.publishedAt || "未确认"}
                        </p>
                        {/^https?:\/\//.test(event.original.url) && (
                          <a
                            href={event.original.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            阅读原文 ↗
                          </a>
                        )}
                      </details>
                      {event.suggestedQuest ? (
                        <button
                          className="secondary"
                          disabled={!!busy}
                          onClick={() => makeQuest(event)}
                        >
                          转化为人生支线
                        </button>
                      ) : (
                        <small>这条事件仅供了解，不生成现实任务。</small>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
            <div className="quote-strip">
              <span>✦ 今日随机语录</span>
              <p>“{quotes[quote]}”</p>
              <button
                aria-label="换一句语录"
                onClick={() => setQuote((quote + 1) % quotes.length)}
              >
                ↻
              </button>
            </div>
          </section>
          <aside className="world-rail" aria-label="世界服务器今日热点">
            <div className="rail-heading">
              <Icon name="world" />
              <h2>
                世界服务器<span>AI 日报</span>
              </h2>
              <button
                disabled={feedLoading}
                onClick={fetchNews}
                aria-label="刷新今日热点"
              >
                ↻
              </button>
            </div>
            <div className="rail-filters" aria-label="事件分类">
              {["全部", "今日", "往期"].map(filter => <button key={filter} aria-pressed={eventFilter === filter} className={eventFilter === filter ? "selected" : ""} onClick={() => setEventFilter(filter)}>{filter}</button>)}
            </div>
            <p className="rail-provenance">
              {feedError || (feedTime ? `${Date.now() - Date.parse(feedTime) > 7200000 ? "同步已延迟 · " : ""}AIHOT · 每日 08:00 发布 · 同步 ${new Date(feedTime).toLocaleTimeString("zh-CN", {timeZone:"Asia/Shanghai",hour12:false})}` : "正在读取 AIHOT 日报…")}
            </p>
            <div className="rail-list">
              {!events.length && <p>暂无日报。<button onClick={() => void fetchNews()}>重新获取</button></p>}
              {eventFilter === "今日" && events.length > 0 && !events.some(event => event.sourceUrl.endsWith(new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Shanghai"}).format(new Date()))) && <p>今日日报尚未同步，可查看往期或稍后刷新。</p>}
              {events
                .filter(
                  (event) =>
                    eventFilter === "全部" || (eventFilter === "今日" ? event.sourceUrl.endsWith(new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Shanghai"}).format(new Date())) : !event.sourceUrl.endsWith(new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Shanghai"}).format(new Date()))),
                )
                .map((event, i) => (
                  <article className="rail-event" key={event.title}>
                    <span className="event-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{bulletinTitle(event.title)}</h3>
                      <p>{event.summary}</p>
                      <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">阅读日报 ↗</a>
                      <button
                        disabled={!!busy || !event.suggestedQuest}
                        onClick={() => makeQuest(event)}
                      >
                        触发关联支线 <span>↗</span>
                      </button>
                    </div>
                  </article>
                ))}
            </div>
            <div className="rail-bottom">
              <img src={asset("camp")} alt="" />
              <p>
                现实世界持续运行，
                <br />
                <strong>下一次好奇，会通向哪里？</strong>
              </p>
            </div>
            <button
              className="secondary rail-open"
              onClick={() => setTab("world")}
            >
              打开世界控制台 <span>→</span>
            </button>
          </aside>
        </div>
        <footer>
          <span>
            EARTH ONLINE <b>·</b> 主线继续，支线随机。
          </span>
          <span>无需登录 · 不设等级 · 不保存人生</span>
          <small>HUMAN SERVER 为世界观设定，非多人在线服务</small>
        </footer>
      </main>
      <dialog
        ref={dialog}
        onCancel={() => setSettings(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setSettings(false);
        }}
        aria-labelledby="settings-title"
      >
        <div className="modal">
          <div className="modal-heading">
            <div>
              <span className="eyebrow">CONNECT YOUR IMAGINATION</span>
              <h2 id="settings-title">AI 能量接口</h2>
            </div>
            <button
              aria-label="关闭 API 设置"
              onClick={() => setSettings(false)}
            >
              ×
            </button>
          </div>
          <p className="setup-intro">
            选择服务商，获取密钥后粘贴到这里，即可开始。模型和接口地址已为你配好。
          </p>
          <label className="field">
            AI 服务商
            <select
              value={config.provider}
              onChange={(e) => {
                const provider = e.target.value as ApiConfig["provider"];
                updateConfig({ provider, apiKey: "", ...PROVIDERS[provider] });
              }}
            >
              <option value="aliyun">阿里云 · 通义千问</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </label>
          <div className="key-help">
            <span>还没有 API Key？</span>
            <a
              href={
                config.provider === "aliyun"
                  ? "https://bailian.console.aliyun.com/cn-beijing/model/settings/api-key"
                  : "https://platform.deepseek.com/api_keys"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              前往{config.provider === "aliyun" ? "阿里云百炼" : "DeepSeek"}
              获取密钥 ↗
            </a>
          </div>
          <label className="field" htmlFor="api-key">
            API Key
          </label>
          <div className="key-field">
            <input
              id="api-key"
              type={reveal ? "text" : "password"}
              value={config.apiKey}
              autoComplete="off"
              spellCheck={false}
              placeholder="仅在当前页面内存中使用"
              onChange={(e) =>
                updateConfig({ ...config, apiKey: e.target.value })
              }
            />
            <button onClick={() => setReveal(!reveal)}>
              {reveal ? "隐藏" : "显示"}密钥
            </button>
          </div>
          <details className="advanced-api">
            <summary>高级设置 · 模型与接口地址已自动配置</summary>
            <label className="field">
              模型名称
              <input
                value={config.model}
                maxLength={100}
                onChange={(e) =>
                  updateConfig({ ...config, model: e.target.value })
                }
              />
            </label>
            <label className="field">
              API Base URL
              <input
                type="url"
                value={config.baseUrl}
                onChange={(e) =>
                  updateConfig({ ...config, baseUrl: e.target.value })
                }
              />
            </label>
            <p className="hint">
              为避免密钥误发，仅支持所选服务商的官方 HTTPS
              域名。阿里云地区地址需与密钥一致；自定义代理不受支持。
            </p>
          </details>
          <div className="privacy-note">
            密钥由你提供，浏览器直接向所选服务商发送请求，不经过本站服务器。密钥与任务只存于页面内存，刷新或关闭即清空；浏览器开发者工具仍可查看请求。调用可能产生服务商费用。
          </div>
          <div className="connection-result" role="status">
            {busy || notice || (connected ? "连接成功" : "尚未测试连接")}
          </div>
          <div className="modal-actions">
            <button
              className="secondary"
              disabled={!!busy || !config.apiKey.trim()}
              onClick={() =>
                void run("正在测试连接", async (signal) => {
                  await testConnection(config, { signal });
                  if (!signal.aborted) {
                    setConnected(true);
                    setNotice("连接成功，可以回到游戏生成支线。");
                  }
                })
              }
            >
              测试连接
            </button>
            <button
              className="text-button"
              onClick={() => updateConfig({ ...config, apiKey: "" })}
            >
              清除当前密钥
            </button>
            <button className="primary" onClick={() => setSettings(false)}>
              回到游戏 →
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
