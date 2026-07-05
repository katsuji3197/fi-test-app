import type { WordEntry } from "./types";

import fundamentals from "@/data/words/fundamentals.json";
import algorithm from "@/data/words/algorithm.json";
import computerComponents from "@/data/words/computer-components.json";
import systemComponents from "@/data/words/system-components.json";
import software from "@/data/words/software.json";
import hardware from "@/data/words/hardware.json";
import userInterface from "@/data/words/user-interface.json";
import media from "@/data/words/media.json";
import database from "@/data/words/database.json";
import network from "@/data/words/network.json";
import security from "@/data/words/security.json";
import development from "@/data/words/development.json";
import devManagement from "@/data/words/dev-management.json";
import projectManagement from "@/data/words/project-management.json";
import serviceManagement from "@/data/words/service-management.json";
import audit from "@/data/words/audit.json";
import systemStrategy from "@/data/words/system-strategy.json";
import systemPlanning from "@/data/words/system-planning.json";
import businessStrategy from "@/data/words/business-strategy.json";
import techStrategy from "@/data/words/tech-strategy.json";
import businessIndustry from "@/data/words/business-industry.json";
import corporateActivity from "@/data/words/corporate-activity.json";
import legal from "@/data/words/legal.json";

export const ALL_WORDS: WordEntry[] = [
  ...(fundamentals as WordEntry[]),
  ...(algorithm as WordEntry[]),
  ...(computerComponents as WordEntry[]),
  ...(systemComponents as WordEntry[]),
  ...(software as WordEntry[]),
  ...(hardware as WordEntry[]),
  ...(userInterface as WordEntry[]),
  ...(media as WordEntry[]),
  ...(database as WordEntry[]),
  ...(network as WordEntry[]),
  ...(security as WordEntry[]),
  ...(development as WordEntry[]),
  ...(devManagement as WordEntry[]),
  ...(projectManagement as WordEntry[]),
  ...(serviceManagement as WordEntry[]),
  ...(audit as WordEntry[]),
  ...(systemStrategy as WordEntry[]),
  ...(systemPlanning as WordEntry[]),
  ...(businessStrategy as WordEntry[]),
  ...(techStrategy as WordEntry[]),
  ...(businessIndustry as WordEntry[]),
  ...(corporateActivity as WordEntry[]),
  ...(legal as WordEntry[]),
];
