import { getFormationSlotAnchors } from "@/lib/lineup/formation-coordinates";

console.log(getFormationSlotAnchors("4-2-3-1").map(a => a.key));
