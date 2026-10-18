import { useEffect, useState } from "react";
import "./world-clock.css";

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "long",
});
const timeFormat = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export default function WorldClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <time
      className="world-clock"
      dateTime={now.toISOString()}
      title="自动读取设备系统时间，按北京时间显示，每秒更新"
    >
      <b>{dateFormat.format(now)}</b>
      <small>北京时间 {timeFormat.format(now)}</small>
    </time>
  );
}
