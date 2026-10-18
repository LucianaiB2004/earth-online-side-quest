import type { Quest, WorldEvent } from "./types";

const seeds: Array<
  [string, Quest["category"], string, string[], Quest["rewards"]]
> = [
  [
    "寻找被忽略的绿色",
    "探索",
    "附近的世界藏着一小块你还没认真看过的绿色。今天，它正在等待一位观察者。",
    [
      "在安全、熟悉的地方找一片叶子或一盆植物。",
      "观察它的轮廓、纹路和三种不同的颜色。",
      "在心里给它起一个只属于今天的名字。",
    ],
    [
      { attribute: "探索", amount: 2 },
      { attribute: "感知", amount: 1 },
    ],
  ],
  [
    "给天空留一个空位",
    "感知",
    "世界没有暂停键，但你可以把目光从屏幕移开一小会儿。",
    [
      "坐在窗边或安全的室外位置。",
      "抬头观察天空一分钟，不边走边看。",
      "找出一种云的形状，或一种天空的颜色。",
    ],
    [
      { attribute: "感知", amount: 2 },
      { attribute: "想象力", amount: 1 },
    ],
  ],
  [
    "一封不必寄出的感谢",
    "善意",
    "有些温柔已经发生，只是还没有被你命名。",
    [
      "想起最近帮助过你的一件小事。",
      "在纸上写一句具体的感谢。",
      "你可以保留它，也可以在合适的时候表达。",
    ],
    [
      { attribute: "善意", amount: 2 },
      { attribute: "羁绊", amount: 1 },
    ],
  ],
  [
    "边界小小守护者",
    "尊严",
    "今天的背包已经很满了。留一点空间给自己的意愿，也是一种选择。",
    [
      "想一件今天可以暂缓的小事。",
      "对自己说：这件事可以晚一点。",
      "安静坐一分钟，让肩膀放松。",
    ],
    [
      { attribute: "尊严", amount: 2 },
      { attribute: "生命力", amount: 1 },
    ],
  ],
  [
    "平凡物品的第二身份",
    "想象力",
    "一支笔可能是天线，一个杯子可能是小型宇宙。新的设定由你决定。",
    [
      "挑选手边一件属于自己的物品。",
      "想象它在科幻世界中的用途。",
      "画一个草图或给它写一句介绍。",
    ],
    [{ attribute: "想象力", amount: 3 }],
  ],
  [
    "来自旧时光的问候",
    "羁绊",
    "一段熟悉的回忆，可能正等着被轻轻唤醒。无需期待任何回复。",
    [
      "想起一位让你感到自在的朋友。",
      "写一句不要求回复的问候。",
      "你可以发送，也可以只保留在纸上。",
    ],
    [
      { attribute: "羁绊", amount: 2 },
      { attribute: "勇气", amount: 1 },
    ],
  ],
];
export function getDemoQuest(index = 0): Quest {
  const [title, category, story, steps, rewards] =
    seeds[((index % seeds.length) + seeds.length) % seeds.length];
  return {
    title,
    category,
    story,
    description: steps[0],
    steps: [...steps],
    rewards: rewards.map((r) => ({ ...r })),
    difficulty: "轻松",
    estimatedMinutes: 3,
    completionCriteria: "按自己的节奏尝试以上行动，即可自主确认完成。",
    safeAlternative:
      "如果此刻不方便行动，就闭眼回想相关的景象或经历，并在心里描述一个细节。",
    isDemo: true,
  };
}
export function getDemoEventQuest(event: WorldEvent): Quest {
  if (!event.suggestedQuest) throw new Error("这条事件不适合转化为现实任务。");
  const scientific = /科技|科学|AI|探索/.test(event.category);
  return {
    title: `${event.title.slice(0, 30)} · 支线`,
    category: "世界事件",
    story: `一条${event.isDemo ? "演示" : ""}世界事件为你送来灵感。这是本地生成的演示支线，你可以自由尝试或跳过。`,
    description: event.suggestedQuest,
    estimatedMinutes: 3,
    difficulty: "轻松",
    steps: [
      "先确认自己位于安全、舒适的位置，不在驾车或过马路。",
      event.suggestedQuest.slice(0, 160),
      "在心里记下一个观察或想法，觉得足够时即可结束。",
    ],
    completionCriteria:
      "安全、自愿地尝试以上行动，或完成替代方案，即可自主确认。",
    safeAlternative:
      "不方便行动时，在原地想象相关场景，并在心里描述一个细节；不必外出、消费或与陌生人互动。",
    rewards: scientific
      ? [
          { attribute: "探索", amount: 2 },
          { attribute: "感知", amount: 1 },
        ]
      : [
          { attribute: "想象力", amount: 2 },
          { attribute: "生命力", amount: 1 },
        ],
    isDemo: true,
  };
}
export const DEMO_EVENTS: WorldEvent[] = [
  {
    title: "人类科技树 · 好奇心分支",
    summary:
      "这是一条虚构的科技主题演示素材，用来展示新闻如何变成探索灵感，并非真实今日新闻。",
    category: "AI 与科技",
    reason: "从一个简单的问题，发现技术与日常生活的连接。",
    gameNarrative:
      "研究站亮起一盏小灯：新的能力不一定来自升级，也可能来自问出一个好问题。",
    suggestedQuest:
      "挑一件常用工具，想一想它解决了什么问题，再想一个可以改善的小细节。",
    sourceTitle: "创作示例：一件工具的新用途",
    sourceUrl: "",
    sourceName: "内置演示 · 虚构事件",
    publishedAt: "演示素材，无新闻日期",
    isDemo: true,
    provenance: "demo",
    original: {
      title: "创作示例：一件工具的新用途",
      text: "科技主题演示，非真实新闻。",
      url: "",
      name: "内置演示",
      publishedAt: "",
    },
  },
  {
    title: "夜空观察区域已解锁",
    summary: "这是一条虚构的科学主题演示素材，用来示范安全、低成本的现实支线。",
    category: "科学探索",
    reason: "用一分钟，把注意力交还给身边的自然。",
    gameNarrative:
      "观测站发来提示：即使今晚看不到星星，你仍然能发现天空的一种颜色。",
    suggestedQuest:
      "在安全位置观察天空一分钟，辨认一种颜色；不方便时观察窗外光线。",
    sourceTitle: "创作示例：抬头看一次天空",
    sourceUrl: "",
    sourceName: "内置演示 · 虚构事件",
    publishedAt: "演示素材，无新闻日期",
    isDemo: true,
    provenance: "demo",
    original: {
      title: "创作示例：抬头看一次天空",
      text: "科学主题演示，非真实新闻。",
      url: "",
      name: "内置演示",
      publishedAt: "",
    },
  },
  {
    title: "日常灵感补丁已送达",
    summary: "这是一条虚构的文化主题演示素材，不对应实际发布或文化活动。",
    category: "文化与创作",
    reason: "不用任何工具，也能开始一次很小的创作。",
    gameNarrative:
      "世界创作工坊开放中。一件普通物品，等待你赋予它一个意想不到的角色。",
    suggestedQuest: "给手边物品编一个不超过三句话的小故事。",
    sourceTitle: "创作示例：日常微型故事",
    sourceUrl: "",
    sourceName: "内置演示 · 虚构事件",
    publishedAt: "演示素材，无新闻日期",
    isDemo: true,
    provenance: "demo",
    original: {
      title: "创作示例：日常微型故事",
      text: "文化主题演示，非真实新闻。",
      url: "",
      name: "内置演示",
      publishedAt: "",
    },
  },
];
