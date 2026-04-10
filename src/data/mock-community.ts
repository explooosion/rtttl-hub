import type { RtttlEntry } from "../utils/rtttl_parser";

export const MOCK_COMMUNITY_ITEMS: RtttlEntry[] = [
  {
    id: "community-1",
    artist: "Robby",
    title: "Für Elise: Quad-Sync ESC Mix",
    firstLetter: "F",
    code: "Track1_Motor1:d=8,o=5,b=100:e6,d#6,e6,d#6,e6,b,d6,c6,4a,p,c,e,a,4b,p,e,g#,b,4c6,p,e6,d#6,e6,d#6,e6,b,d6,c6,4a,p,c,e,a,4b,p,e,c6,b,4a",
    collection: "community",
    category: "classical",
    createdAt: "2026-04-10T00:00:00Z",
    tracks: [
      "Track1_Motor1:d=8,o=5,b=100:e6,d#6,e6,d#6,e6,b,d6,c6,4a,p,c,e,a,4b,p,e,g#,b,4c6,p,e6,d#6,e6,d#6,e6,b,d6,c6,4a,p,c,e,a,4b,p,e,c6,b,4a",
      "Track2_Motor2:d=8,o=4,b=100:4p,4p,a,e5,a5,a,e5,a5,e,e5,g#5,e,e5,g#5,a,e5,a5,4p,4p,a,e5,a5,a,e5,a5,e,e5,g#5,e,e5,g#5,4a",
      "Track3_Motor3:d=4,o=4,b=100:2p,2p,a,a,p,e,e,p,a,8p,2p,2p,a,a,p,e,e,p,a",
      "Track4_Motor4:d=4,o=5,b=100:2p,2p,c,c,p,b4,b4,p,c,8p,2p,2p,c,c,p,b4,g#4,p,a4",
    ],
  },
];
