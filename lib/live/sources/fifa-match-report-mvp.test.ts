import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFifaMatchReportArticlePathCandidates,
  buildFifaMatchReportArticleSlug,
  fifaArticleSlugForTeam,
} from "@/lib/live/sources/fifa-match-report-slugs";
import { parseOfficialMvpFromFifaMatchReportRichtext } from "@/lib/live/sources/fifa-match-report-mvp";

const BRA_MAR_RICHTEXT = {
  nodeType: "document",
  content: [
    {
      nodeType: "heading-3",
      content: [
        {
          nodeType: "text",
          value: "Michelob Ultra Superior Player of the Match",
          marks: [{ type: "bold" }],
        },
      ],
    },
    {
      nodeType: "paragraph",
      content: [{ nodeType: "text", value: "Vinicius Jr (Brazil)" }],
    },
  ],
};

const CIV_ECU_RICHTEXT = {
  nodeType: "document",
  content: [
    {
      nodeType: "heading-3",
      content: [
        {
          nodeType: "text",
          value: "Superior Player of the Match",
          marks: [{ type: "bold" }],
        },
      ],
    },
    {
      nodeType: "paragraph",
      content: [
        { nodeType: "text", value: "Yan Diomande ", marks: [{ type: "bold" }] },
        { nodeType: "text", value: "(Côte d\u2019Ivoire)" },
      ],
    },
  ],
};

const HAI_SCO_RICHTEXT = {
  nodeType: "document",
  content: [
    {
      nodeType: "heading-3",
      content: [
        {
          nodeType: "text",
          value: "Michelob Ultra Superior Player of the Match",
          marks: [{ type: "bold" }],
        },
      ],
    },
    {
      nodeType: "paragraph",
      content: [
        { nodeType: "text", value: "John McGinn", marks: [{ type: "bold" }] },
        { nodeType: "text", value: " (Scotland)" },
      ],
    },
  ],
};

test("fifaArticleSlugForTeam aplica overrides conocidos", () => {
  assert.equal(fifaArticleSlugForTeam("South Korea"), "korea-republic");
  assert.equal(fifaArticleSlugForTeam("Czech Republic"), "czechia");
  assert.equal(fifaArticleSlugForTeam("Brazil"), "brazil");
  assert.equal(fifaArticleSlugForTeam("Ivory Coast"), "cote-d-ivoire");
});

test("buildFifaMatchReportArticleSlug compone home-away", () => {
  assert.equal(buildFifaMatchReportArticleSlug("Brazil", "Morocco"), "brazil-morocco");
  assert.equal(
    buildFifaMatchReportArticleSlug("Canada", "Bosnia & Herzegovina"),
    "canada-bosnia-and-herzegovina",
  );
  assert.equal(
    buildFifaMatchReportArticleSlug("Ivory Coast", "Ecuador"),
    "cote-d-ivoire-ecuador",
  );
});

test("buildFifaMatchReportArticlePathCandidates incluye variantes Bosnia y sufijos FIFA", () => {
  const candidates = buildFifaMatchReportArticlePathCandidates(
    "Switzerland",
    "Bosnia & Herzegovina",
  );

  assert.ok(
    candidates.includes(
      "/en/tournaments/mens/worldcup/canadamexicousa2026/articles/switzerland-bosnia-herzegovina-match-report-highlights",
    ),
  );
  assert.ok(
    candidates.includes(
      "/en/tournaments/mens/worldcup/canadamexicousa2026/articles/switzerland-bosnia-and-herzegovina-highlights-match-report",
    ),
  );
});

test("parseOfficialMvpFromFifaMatchReportRichtext lee Brasil-Marruecos", () => {
  const parsed = parseOfficialMvpFromFifaMatchReportRichtext(BRA_MAR_RICHTEXT);
  assert.deepEqual(parsed, {
    playerName: "Vinicius Jr",
    teamName: "Brazil",
  });
});

test("parseOfficialMvpFromFifaMatchReportRichtext lee Costa de Marfil-Ecuador", () => {
  const parsed = parseOfficialMvpFromFifaMatchReportRichtext(CIV_ECU_RICHTEXT);
  assert.deepEqual(parsed, {
    playerName: "Yan Diomande",
    teamName: "Ivory Coast",
  });
});

test("parseOfficialMvpFromFifaMatchReportRichtext concatena nodos de texto", () => {
  const parsed = parseOfficialMvpFromFifaMatchReportRichtext(HAI_SCO_RICHTEXT);
  assert.deepEqual(parsed, {
    playerName: "John McGinn",
    teamName: "Scotland",
  });
});
