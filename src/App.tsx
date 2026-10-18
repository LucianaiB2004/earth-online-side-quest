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
  fetchWorldEvents,
  gameifyNews,
  testConnection,
} from "./lib/ai";
import { getDemoQuest, getDemoEventQuest, DEMO_EVENTS } from "./lib/demo";
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
  const [news, setNews] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState("");
  const [quote, setQuote] = useState(0);
  const [eventFilter, setEventFilter] = useState("全部");
  const serial = useRef(0),
    request = useRef<AbortController | null>(null),
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
  const makeQuest = (event?: WorldEvent) => {
    if (event && !event.isDemo && !config.apiKey.trim()) {
      setNotice("请先配置 API，再将这条新闻转化为专属支线。");
      setSettings(true);
      return;
    }
    if (!config.apiKey.trim() || event?.isDemo) {
      showQuest(
        event ? getDemoEventQuest(event) : getDemoQuest(serial.current++),
      );
      setNotice(
        event
          ? "已从演示事件触发演示支线，未调用 AI。"
          : "正在体验内置演示支线。配置 API 后可生成专属任务。",
      );
      return;
    }
    void run("正在发现你的支线", async (signal) => {
      try {
        const q = await generateQuest(config, interests, event, { signal });
        if (!signal.aborted) showQuest(q);
      } catch (e) {
        if (signal.aborted) return;
        showQuest(getDemoQuest(serial.current++));
        setNotice(
          `${e instanceof Error ? e.message : "AI 暂时不可用。"} 已切换至明确标记的演示支线，可重新尝试。`,
        );
      }
    });
  };
  const fetchNews = () =>
    void run("正在搜索世界新鲜事", async (signal) => {
      const data = await fetchWorldEvents(config, interests, { signal });
      if (!signal.aborted) {
        setEvents(data);
        setNotice(
          data.length
            ? "已获取带搜索来源的事件。请打开原文核对事实与时间。"
            : "没有找到足够可靠的热点，请稍后再试。",
        );
      }
    });
  const convert = () =>
    void run("正在编写世界事件", async (signal) => {
      const event = await gameifyNews(config, news, { signal });
      if (!signal.aborted) {
        setEvents([event]);
        setNotice("已转化你提供的新闻；原始内容未经独立核实。");
      }
    });
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
                    : "演示模式"}
                <small>
                  {config.apiKey
                    ? PROVIDERS[config.provider].name
                    : "无需密钥，也能先玩一会儿"}
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
                {busy}…<button onClick={cancel}>取消请求</button>
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
                        ? quest.isDemo
                          ? "演示任务"
                          : "AI 生成"
                        : "等待触发"}
                    </span>
                  </div>
                  {!quest ? (
                    <div className="empty-quest">
                      <div className="empty-copy">
                        <span className="chapter">致正在认真生活的你</span>
                        <h2>
                          今天，会遇见
                          <br />
                          怎样的<span>小小意外？</span>
                        </h2>
                        <p>
                          走一条不同的路，留意一束光，
                          <br />
                          或者，向世界释放一点善意。
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
                          src={asset("hello")}
                          alt="两位像素角色友好地打招呼"
                        />
                        <span className="art-tag">下一站：生活里的惊喜</span>
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
                          <h3>支线完成！</h3>
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
                      icon: "plant",
                      name: "生活探索",
                      interest: "自然与日常探索",
                      seed: 0,
                    },
                    {
                      icon: "camera",
                      name: "感知体验",
                      interest: "天空与感知",
                      seed: 1,
                    },
                    {
                      icon: "imagination",
                      name: "创造一点意外",
                      interest: "想象与创作",
                      seed: 4,
                    },
                  ].map((item) => (
                    <button
                      key={item.name}
                      disabled={!!busy}
                      onClick={() => {
                        setInterests(item.interest);
                        showQuest(getDemoQuest(item.seed));
                        setNotice("已触发一条主题演示支线。");
                      }}
                    >
                      <img src={asset(item.icon)} alt="" />
                      <span>
                        <strong>{item.name}</strong>
                        <small>触发主题演示支线</small>
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
                    获取今日热点 ↗
                  </button>
                </div>
                <label className="field">
                  关注方向
                  <input
                    value={interests}
                    maxLength={200}
                    placeholder="AI、科学探索、游戏、体育…"
                    onChange={(e) => setInterests(e.target.value)}
                  />
                </label>
                <p className="hint">
                  实时搜索使用阿里云通义千问的官方联网能力。本项目的 DeepSeek
                  接入可转化你提供的新闻，尚未接入其搜索接口。搜索可能产生服务商费用。
                </p>
                <div className="world-tools">
                  <details>
                    <summary>从一则新闻开始</summary>
                    <label className="field">
                      粘贴新闻标题、正文和原文链接（最多 8000 字）
                      <textarea
                        value={news}
                        maxLength={8000}
                        onChange={(e) => setNews(e.target.value)}
                        placeholder="请尽量提供正文与来源。仅粘贴链接不会自动读取网页。"
                        rows={5}
                      />
                    </label>
                    <button
                      className="secondary"
                      onClick={convert}
                      disabled={!!busy || !news.trim()}
                    >
                      转化为世界事件
                    </button>
                  </details>
                  <button
                    className="text-button"
                    disabled={!!busy}
                    onClick={() => {
                      setEvents(DEMO_EVENTS);
                      setNotice("以下为创作演示事件，并非今日真实新闻。");
                    }}
                  >
                    体验演示事件
                  </button>
                </div>
                {!events.length && (
                  <div className="world-empty">
                    <img src={asset("camp")} alt="像素营火" />
                    <h3>世界很大，从一点好奇开始。</h3>
                    <p>连接 API 获取热点，或先体验演示事件。</p>
                  </div>
                )}
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
                              : "联网搜索 · 含来源"}
                        </span>
                      </div>
                      <h2>{event.title}</h2>
                      <p>{event.summary}</p>
                      <div className="event-narrative">
                        <span>AI / 游戏化叙事</span>
                        <p>{event.gameNarrative}</p>
                      </div>
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
                世界服务器<span>今日热点</span>
              </h2>
              <button
                disabled={!!busy}
                onClick={fetchNews}
                aria-label="刷新今日热点"
              >
                ↻
              </button>
            </div>
            <div className="rail-filters" aria-label="事件分类">
              {["全部", "AI 与科技", "科学探索", "文化与创作"].map((filter) => (
                <button
                  key={filter}
                  aria-pressed={eventFilter === filter}
                  className={eventFilter === filter ? "selected" : ""}
                  onClick={() => setEventFilter(filter)}
                >
                  {filter === "AI 与科技"
                    ? "AI 科技"
                    : filter === "文化与创作"
                      ? "文化"
                      : filter === "科学探索"
                        ? "科学"
                        : filter}
                </button>
              ))}
            </div>
            <p className="rail-provenance">
              {events.length
                ? "事件来自本页获取的数据，请查看来源标签。"
                : "演示世界 · 以下为虚构创作示例，非实时新闻。"}
            </p>
            <div className="rail-list">
              {(events.length ? events : DEMO_EVENTS)
                .filter(
                  (event) =>
                    eventFilter === "全部" || event.category === eventFilter,
                )
                .map((event, i) => (
                  <article className="rail-event" key={event.title}>
                    <span className="event-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="rail-category">
                        {event.category} ·{" "}
                        {event.isDemo
                          ? "演示事件"
                          : event.provenance === "user"
                            ? "用户提供 · 未核实"
                            : "联网搜索"}
                      </span>
                      <h3>{event.title}</h3>
                      <p>{event.gameNarrative}</p>
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
