import assert from "node:assert/strict";
import { test } from "node:test";
import {
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
});

test("buildFifaMatchReportArticleSlug compone home-away", () => {
  assert.equal(buildFifaMatchReportArticleSlug("Brazil", "Morocco"), "brazil-morocco");
  assert.equal(
    buildFifaMatchReportArticleSlug("Canada", "Bosnia & Herzegovina"),
    "canada-bosnia-and-herzegovina",
  );
});

test("parseOfficialMvpFromFifaMatchReportRichtext lee Brasil-Marruecos", () => {
  const parsed = parseOfficialMvpFromFifaMatchReportRichtext(BRA_MAR_RICHTEXT);
  assert.deepEqual(parsed, {
    playerName: "Vinicius Jr",
    teamName: "Brazil",
  });
});

test("parseOfficialMvpFromFifaMatchReportRichtext concatena nodos de texto", () => {
  const parsed = parseOfficialMvpFromFifaMatchReportRichtext(HAI_SCO_RICHTEXT);
  assert.deepEqual(parsed, {
    playerName: "John Mcginn",
    teamName: "Scotland",
  });
});
