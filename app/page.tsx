import { LoveScene } from "./components/LoveScene";

/** 改文案：编辑下方常量即可 */
const COPY = {
  tag: "给你",
  title: "想把这句话，认真说给你听",
  meetDate: "2022年10月1日",
  meetAt: "2022-10-01",
  meetPlace: "贵阳",
  paragraphs: [
    "遇见你的每一天，都像被温柔的光照着。你的笑、你的声音，还有你认真生活的样子，都让我想靠近一点，再近一点。",
    "我不擅长说很华丽的话，但我是真心想陪在你身边：分享琐碎的日常，也一起扛偶尔的不顺利。",
    "谢谢你出现在我的生命里。未来的路，我想和你一起走。",
  ],
  signature: "—— 许士才",
  date: "2026年8月10日",
};

export default function Home() {
  return <LoveScene copy={COPY} />;
}
