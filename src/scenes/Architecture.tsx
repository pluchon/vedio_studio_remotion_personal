// 架构：像星图一样依次画出两端、网关、五个业务服务与它们之间的调用，最后是底层基础设施
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ChapterMark } from "../components/ChapterMark";
import { enter } from "../components/motion";
import { Paper } from "../components/Paper";
import { COLORS, EASE_IN_OUT, EASE_OUT, FONTS } from "../theme";

type NodeProps = { cx: number; cy: number; w: number; h: number; at: number; name?: string; role: string; accent?: boolean };

// 节点：纸色卡片，上行拉丁名，下行中文职责
const Node: React.FC<NodeProps> = ({ cx, cy, w, h, at, name, role, accent }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [at, at + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  return (
    <g opacity={progress} transform={`translate(0 ${(1 - progress) * 16})`}>
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={10}
        fill="rgba(251, 248, 241, 0.94)"
        stroke={accent ? COLORS.cinnabar : "rgba(92, 81, 69, 0.45)"}
        strokeWidth={accent ? 2 : 1.5}
      />
      {name ? (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fontFamily={FONTS.latin} fontStyle="italic" fontSize={30} fill={COLORS.cinnabar}>
            {name}
          </text>
          <text x={cx} y={cy + 32} textAnchor="middle" fontFamily={FONTS.serif} fontSize={30} fill={COLORS.ink}>
            {role}
          </text>
        </>
      ) : (
        <text x={cx} y={cy + 11} textAnchor="middle" fontFamily={FONTS.serif} fontSize={32} fill={COLORS.ink} letterSpacing="2">
          {role}
        </text>
      )}
    </g>
  );
};

// 虚线逐段描出：只铺到已描出的长度，其余留空（路径长度按 1 计）
const dashPattern = (drawn: number) => {
  const dash = 0.035;
  const gap = 0.025;
  const parts: number[] = [];
  let length = 0;
  while (length + dash + gap <= drawn) {
    parts.push(dash, gap);
    length += dash + gap;
  }
  parts.push(Math.max(0, Math.min(dash, drawn - length)), 2);
  return parts.map((p) => p.toFixed(4)).join(" ");
};

// 连线：按时间描出，可带虚线与标注
const Edge: React.FC<{ d: string; at: number; dashed?: boolean; label?: string; lx?: number; ly?: number; anchor?: "start" | "middle" | "end" }> = ({
  d,
  at,
  dashed,
  label,
  lx = 0,
  ly = 0,
  anchor = "middle",
}) => {
  const frame = useCurrentFrame();
  const drawn = interpolate(frame, [at, at + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });

  return (
    <g>
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke="rgba(92, 81, 69, 0.7)"
        strokeWidth={2}
        strokeDasharray={dashed ? dashPattern(drawn) : 1}
        strokeDashoffset={dashed ? 0 : 1 - drawn}
        markerEnd={drawn > 0.98 ? "url(#arrow)" : undefined}
      />
      {label && (
        <text
          x={lx}
          y={ly}
          textAnchor={anchor}
          fontFamily={FONTS.serif}
          fontSize={26}
          fill={COLORS.text}
          opacity={interpolate(frame, [at + 20, at + 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        >
          {label}
        </text>
      )}
    </g>
  );
};

const INFRA = ["MySQL", "Redis", "RabbitMQ", "Elasticsearch", "Nacos", "XXL-JOB", "通义大模型"];

export const ArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Paper>
      <ChapterMark numeral="II" label="架构" />
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="rgba(92, 81, 69, 0.8)" strokeWidth="1.6" />
          </marker>
        </defs>

        <Edge d="M 760 242 L 900 307" at={36} />
        <Edge d="M 1160 242 L 1020 307" at={40} />
        <Edge d="M 880 383 L 700 450" at={72} />
        <Edge d="M 1040 383 L 1220 450" at={76} />
        <Edge d="M 700 550 L 890 630" at={140} dashed label="RabbitMQ 异步判题" lx={812} ly={574} anchor="start" />
        <Edge d="M 1220 550 L 1030 630" at={150} label="运行标程" lx={1150} ly={640} anchor="start" />
        <Edge d="M 1330 550 L 1520 630" at={160} label="出题 · 分析" lx={1450} ly={570} anchor="start" />
        <Edge d="M 400 630 L 590 550" at={170} label="竞赛结算" lx={470} ly={570} anchor="end" />
        <Edge d="M 640 550 C 640 820, 1300 820, 1466 706" at={190} label="AI 辅导 · 赛后复盘" lx={1000} ly={818} />

        <Node cx={760} cy={210} w={250} h={64} at={15} role="学员端" />
        <Node cx={1160} cy={210} w={250} h={64} at={22} role="管理端" />
        <Node cx={960} cy={345} w={340} h={76} at={48} role="gateway · 网关鉴权" />
        <Node cx={640} cy={500} w={240} h={100} at={84} name="friend" role="学员端业务" />
        <Node cx={1280} cy={500} w={240} h={100} at={92} name="system" role="管理端业务" />
        <Node cx={340} cy={680} w={220} h={100} at={112} name="job" role="定时结算" />
        <Node cx={960} cy={680} w={240} h={100} at={120} name="judge" role="沙箱判题" />
        <Node cx={1580} cy={680} w={220} h={100} at={128} name="ai" role="模型计算" accent />

        <text
          x={1580}
          y={775}
          textAnchor="middle"
          fontFamily={FONTS.serif}
          fontSize={28}
          fill={COLORS.cinnabar}
          opacity={interpolate(frame, [240, 262], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        >
          只计算，不写库
        </text>
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 918,
          display: "flex",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {INFRA.map((name, i) => (
          <span
            key={name}
            style={{
              fontFamily: FONTS.serif,
              fontSize: 28,
              color: COLORS.moss,
              padding: "8px 22px",
              border: "1px solid rgba(53, 68, 53, 0.35)",
              borderRadius: 999,
              backgroundColor: "rgba(251, 248, 241, 0.75)",
              ...enter(frame, 262 + i * 8, 20, 14),
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </Paper>
  );
};
