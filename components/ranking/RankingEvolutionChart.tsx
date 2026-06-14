"use client";

import { useMemo } from "react";
import type { RankingEvolutionData } from "@/lib/ranking/evolution";

const LINE_COLORS = [
  "#FF4D4D",
  "#FF8C00",
  "#4DA6FF",
  "#B366FF",
  "#CCFF00",
  "#FF66B2",
  "#00E5CC",
  "#FFD700",
  "#66FF66",
  "#FF6B9D",
  "#A0A0FF",
];

/** Fondo del área de trazado: morado oscuro de la app. */
const CHART_BG = "var(--tm-bg-elevated)";

/** Espacio vertical entre posiciones (~altura fila ranking: 2.375rem). */
const ROW_GAP_PX = 38;
const CHART_WIDTH = 380;
const MARGIN_LEFT = 18;
const MARGIN_RIGHT = 12;
const MARGIN_TOP = 20;
/** Fila inferior dedicada a etiquetas de jornada (J1, J2…). */
const MATCHDAY_LABEL_ROW_PX = 24;
const PLOT_LABEL_GAP = 6;
const MARGIN_BOTTOM = PLOT_LABEL_GAP + MATCHDAY_LABEL_ROW_PX;
const AVATAR_RADIUS = 11;
const AVATAR_X = 42;
const PLOT_START_X = 64;
const LABEL_OFFSET = 12;

function chartHeightForMemberCount(memberCount: number): number {
  const plotH = memberCount <= 1 ? ROW_GAP_PX : (memberCount - 1) * ROW_GAP_PX;
  return MARGIN_TOP + plotH + MARGIN_BOTTOM;
}

function avatarInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return trimmed.slice(0, 1).toUpperCase();
}

type ChartSeries = {
  profileId: string;
  label: string;
  avatarUrl: string | null;
  color: string;
  initialY: number;
  points: Array<{ x: number; y: number; position: number }>;
};

function buildColorMap(members: RankingEvolutionData["members"]): Map<string, string> {
  const map = new Map<string, string>();
  members.forEach((member, index) => {
    map.set(member.profileId, LINE_COLORS[index % LINE_COLORS.length]!);
  });
  return map;
}

type RankingEvolutionChartProps = {
  data: RankingEvolutionData;
  endMatchdayIndex: number;
};

export function RankingEvolutionChart({
  data,
  endMatchdayIndex,
}: RankingEvolutionChartProps) {
  const memberCount = data.members.length;
  const chartHeight = chartHeightForMemberCount(memberCount);

  const { plotWidth, plotHeight, visibleMatchdays, series } = useMemo(() => {
    const visible = data.matchdays.slice(0, endMatchdayIndex + 1);
    const visiblePoints = data.points.slice(0, endMatchdayIndex + 1);
    const count = data.members.length;
    const plotW = CHART_WIDTH - PLOT_START_X - MARGIN_RIGHT;
    const plotH = chartHeight - MARGIN_TOP - MARGIN_BOTTOM;
    const colorMap = buildColorMap(data.members);

    const xAt = (index: number) =>
      visible.length <= 1
        ? PLOT_START_X + plotW / 2
        : PLOT_START_X + (index / (visible.length - 1)) * plotW;

    const yAt = (position: number) =>
      count <= 1
        ? MARGIN_TOP + plotH / 2
        : MARGIN_TOP + ((position - 1) / (count - 1)) * plotH;

    const builtSeries: ChartSeries[] = data.members.map((member) => {
        const color = colorMap.get(member.profileId) ?? LINE_COLORS[0]!;
        const initialStanding = data.initialStandings.find(
          (row) => row.profileId === member.profileId
        );
        const initialPosition = initialStanding?.position ?? count;
        const initialY = yAt(initialPosition);

        const points = visiblePoints.map((point, index) => {
          const standing = point.standings.find((row) => row.profileId === member.profileId);
          const position = standing?.position ?? count;
          return {
            x: xAt(index),
            y: yAt(position),
            position,
          };
        });

        return {
          profileId: member.profileId,
          label: member.label,
          avatarUrl: member.avatarUrl,
          color,
          initialY,
          points,
        };
      });

    return {
      plotWidth: plotW,
      plotHeight: plotH,
      visibleMatchdays: visible,
      series: builtSeries,
    };
  }, [data, endMatchdayIndex, chartHeight]);

  if (!visibleMatchdays.length || !series.length) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--tm-muted)]">
        No hay datos de evolucion todavia.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${chartHeight}`}
      width="100%"
      height={chartHeight}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Grafico de evolucion de clasificacion por jornada"
      className="block w-full"
    >
      <defs>
        {series.map((item) => (
          <clipPath key={`clip-${item.profileId}`} id={`evo-clip-${item.profileId}`}>
            <circle cx={AVATAR_X} cy={item.initialY} r={AVATAR_RADIUS} />
          </clipPath>
        ))}
      </defs>

      <rect x={0} y={0} width={CHART_WIDTH} height={chartHeight} fill={CHART_BG} />

      {Array.from({ length: memberCount }, (_, index) => {
        const position = index + 1;
        const y =
          memberCount <= 1
            ? MARGIN_TOP + plotHeight / 2
            : MARGIN_TOP + ((position - 1) / (memberCount - 1)) * plotHeight;
        return (
          <text
            key={`y-label-${position}`}
            x={MARGIN_LEFT - 2}
            y={y + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.55)"
            fontSize={10}
            fontWeight={600}
          >
            {position}
          </text>
        );
      })}

      {visibleMatchdays.map((matchday, index) => {
        const x =
          visibleMatchdays.length <= 1
            ? PLOT_START_X + plotWidth / 2
            : PLOT_START_X + (index / (visibleMatchdays.length - 1)) * plotWidth;
        const matchdayLabelY =
          MARGIN_TOP + plotHeight + PLOT_LABEL_GAP + MATCHDAY_LABEL_ROW_PX * 0.62;
        return (
          <text
            key={`x-label-${matchday.id}`}
            x={x}
            y={matchdayLabelY}
            textAnchor="middle"
            fill="rgba(255,255,255,0.65)"
            fontSize={10}
            fontWeight={600}
          >
            {matchday.shortLabel}
          </text>
        );
      })}

      {series.map((item) => {
        const pathParts = [`M ${AVATAR_X} ${item.initialY}`];
        for (const point of item.points) {
          pathParts.push(`L ${point.x} ${point.y}`);
        }
        return (
          <path
            key={`line-${item.profileId}`}
            d={pathParts.join(" ")}
            fill="none"
            stroke={item.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}

      {series.map((item) => (
        <g key={`avatar-${item.profileId}`}>
          <circle
            cx={AVATAR_X}
            cy={item.initialY}
            r={AVATAR_RADIUS + 1}
            fill={CHART_BG}
            stroke={item.color}
            strokeWidth={1.5}
          />
          {item.avatarUrl ? (
            <image
              href={item.avatarUrl}
              x={AVATAR_X - AVATAR_RADIUS}
              y={item.initialY - AVATAR_RADIUS}
              width={AVATAR_RADIUS * 2}
              height={AVATAR_RADIUS * 2}
              clipPath={`url(#evo-clip-${item.profileId})`}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <>
              <circle
                cx={AVATAR_X}
                cy={item.initialY}
                r={AVATAR_RADIUS}
              fill="var(--tm-surface-elevated)"
              />
              <text
                x={AVATAR_X}
                y={item.initialY + 4}
                textAnchor="middle"
                fill="rgba(255,255,255,0.85)"
                fontSize={8}
                fontWeight={700}
              >
                {avatarInitials(item.label)}
              </text>
            </>
          )}
        </g>
      ))}

      {series.flatMap((item) =>
        item.points.map((point, pointIndex) => (
          <g key={`node-${item.profileId}-${pointIndex}`}>
            <text
              x={point.x}
              y={point.y - LABEL_OFFSET}
              textAnchor="middle"
              fill={item.color}
              fontSize={9}
              fontWeight={700}
            >
              {point.position}
            </text>
            <circle
              cx={point.x}
              cy={point.y}
              r={3}
              fill={item.color}
              stroke={CHART_BG}
              strokeWidth={1}
            />
          </g>
        ))
      )}
    </svg>
  );
}
