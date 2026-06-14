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

const CHART_WIDTH = 360;
const CHART_HEIGHT = 280;
const MARGIN_LEFT = 28;
const MARGIN_RIGHT = 12;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 36;
const AVATAR_RADIUS = 11;
const LABEL_OFFSET = 14;

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
  filteredProfileIds: Set<string>;
};

export function RankingEvolutionChart({
  data,
  endMatchdayIndex,
  filteredProfileIds,
}: RankingEvolutionChartProps) {
  const { plotWidth, plotHeight, memberCount, visibleMatchdays, series } = useMemo(() => {
    const visible = data.matchdays.slice(0, endMatchdayIndex + 1);
    const visiblePoints = data.points.slice(0, endMatchdayIndex + 1);
    const count = data.members.length;
    const plotW = CHART_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
    const plotH = CHART_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;
    const colorMap = buildColorMap(data.members);

    const xAt = (index: number) =>
      visible.length <= 1
        ? MARGIN_LEFT + plotW / 2
        : MARGIN_LEFT + (index / (visible.length - 1)) * plotW;

    const yAt = (position: number) =>
      count <= 1
        ? MARGIN_TOP + plotH / 2
        : MARGIN_TOP + ((position - 1) / (count - 1)) * plotH;

    const builtSeries: ChartSeries[] = data.members
      .filter((member) => filteredProfileIds.has(member.profileId))
      .map((member) => {
        const color = colorMap.get(member.profileId) ?? LINE_COLORS[0]!;
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
          points,
        };
      });

    return {
      plotWidth: plotW,
      plotHeight: plotH,
      memberCount: count,
      visibleMatchdays: visible,
      series: builtSeries,
    };
  }, [data, endMatchdayIndex, filteredProfileIds]);

  const gridYPositions = useMemo(() => {
    if (memberCount <= 1) return [MARGIN_TOP + plotHeight / 2];
    return Array.from({ length: memberCount }, (_, index) => {
      const position = index + 1;
      return MARGIN_TOP + ((position - 1) / (memberCount - 1)) * plotHeight;
    });
  }, [memberCount, plotHeight]);

  const gridXPositions = useMemo(() => {
    if (visibleMatchdays.length <= 1) {
      return [MARGIN_LEFT + plotWidth / 2];
    }
    return visibleMatchdays.map((_, index) => {
      return MARGIN_LEFT + (index / (visibleMatchdays.length - 1)) * plotWidth;
    });
  }, [visibleMatchdays.length, plotWidth]);

  if (!visibleMatchdays.length || !series.length) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--tm-muted)]">
        No hay datos de evolucion todavia.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      width="100%"
      height="auto"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Grafico de evolucion de clasificacion por jornada"
      className="block max-h-[min(52dvh,20rem)] w-full"
    >
      <defs>
        {series.map((item) =>
          item.points.map((point, pointIndex) => (
            <clipPath
              key={`clip-${item.profileId}-${pointIndex}`}
              id={`evo-clip-${item.profileId}-${pointIndex}`}
            >
              <circle cx={point.x} cy={point.y} r={AVATAR_RADIUS} />
            </clipPath>
          ))
        )}
      </defs>

      {gridYPositions.map((y, index) => (
        <line
          key={`grid-y-${index}`}
          x1={MARGIN_LEFT}
          y1={y}
          x2={CHART_WIDTH - MARGIN_RIGHT}
          y2={y}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />
      ))}

      {gridXPositions.map((x, index) => (
        <line
          key={`grid-x-${index}`}
          x1={x}
          y1={MARGIN_TOP}
          x2={x}
          y2={CHART_HEIGHT - MARGIN_BOTTOM}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />
      ))}

      {Array.from({ length: memberCount }, (_, index) => {
        const position = index + 1;
        const y =
          memberCount <= 1
            ? MARGIN_TOP + plotHeight / 2
            : MARGIN_TOP + ((position - 1) / (memberCount - 1)) * plotHeight;
        return (
          <text
            key={`y-label-${position}`}
            x={MARGIN_LEFT - 6}
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
            ? MARGIN_LEFT + plotWidth / 2
            : MARGIN_LEFT + (index / (visibleMatchdays.length - 1)) * plotWidth;
        return (
          <text
            key={`x-label-${matchday.id}`}
            x={x}
            y={CHART_HEIGHT - 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.55)"
            fontSize={9}
            fontWeight={600}
          >
            {matchday.shortLabel}
          </text>
        );
      })}

      {series.map((item) => {
        if (item.points.length < 2) return null;
        const pathD = item.points
          .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
          .join(" ");
        return (
          <path
            key={`line-${item.profileId}`}
            d={pathD}
            fill="none"
            stroke={item.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}

      {series.flatMap((item) =>
        item.points.map((point, pointIndex) => {
          const clipId = `evo-clip-${item.profileId}-${pointIndex}`;
          return (
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
                r={AVATAR_RADIUS + 1}
                fill="#0a0618"
                stroke={item.color}
                strokeWidth={1.5}
              />
              {item.avatarUrl ? (
                <image
                  href={item.avatarUrl}
                  x={point.x - AVATAR_RADIUS}
                  y={point.y - AVATAR_RADIUS}
                  width={AVATAR_RADIUS * 2}
                  height={AVATAR_RADIUS * 2}
                  clipPath={`url(#${clipId})`}
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <>
                  <circle cx={point.x} cy={point.y} r={AVATAR_RADIUS} fill="rgba(111,43,255,0.35)" />
                  <text
                    x={point.x}
                    y={point.y + 4}
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
          );
        })
      )}
    </svg>
  );
}
