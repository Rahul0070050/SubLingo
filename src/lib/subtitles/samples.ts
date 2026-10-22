export interface SubtitleSample {
  id: string;
  title: string;
  language: string;
  format: "srt" | "vtt";
  description: string;
  content: string;
}

export const SAMPLE_SUBTITLES: SubtitleSample[] = [
  {
    id: "scifi-dialogue",
    title: "Deep Cosmos — Sci-Fi Dialogue",
    language: "en",
    format: "srt",
    description: "Dramatic cinematic sequence between spaceship commander and orbital AI.",
    content: `1
00:00:01,200 --> 00:00:04,500
Commander, telemetry indicates an unexpected gravitational distortion ahead.

2
00:00:05,100 --> 00:00:08,400
Can you stabilize our warp envelope, AURA?

3
00:00:09,000 --> 00:00:13,200
<i>Diverting secondary reactor coils now.</i> Structural integrity is holding at 84 percent.

4
00:00:14,000 --> 00:00:17,800
Keep us steady. We didn't travel twenty light-years to turn around at the threshold.

5
00:00:18,500 --> 00:00:22,300
Sensors detect atmospheric conditions on the third moon. Water vapor and oxygen confirmed.

6
00:00:23,000 --> 00:00:26,900
Prepare the landing module. Humanity's second chapter begins today.
`,
  },
  {
    id: "tech-keynote",
    title: "Quantum Computing — Tech Keynote",
    language: "en",
    format: "vtt",
    description: "Keynote presentation introducing next-generation neural architecture.",
    content: `WEBVTT - Tech Keynote Presentation

00:00:02.000 --> 00:00:05.500 align:middle
Welcome everyone to the Future of Computing summit.

00:00:06.200 --> 00:00:10.800 align:middle
Today, we are thrilled to demonstrate our breakthrough neural architecture.

00:00:11.500 --> 00:00:16.200 align:middle
By reducing inference latency by 90%, real-time multimodal intelligence is now possible.

00:00:17.000 --> 00:00:21.400 align:middle
Developers around the world can now build context-aware applications instantly.

00:00:22.100 --> 00:00:25.900 align:middle
Let's dive into the live developer demo right now.
`,
  },
  {
    id: "nature-documentary",
    title: "Wonders of the Pacific — Nature Doc",
    language: "en",
    format: "srt",
    description: "Atmospheric documentary narration about deep ocean bioluminescence.",
    content: `1
00:00:00,800 --> 00:00:04,600
Beneath the sunlit waves lies an abyss shrouded in perpetual twilight.

2
00:00:05,400 --> 00:00:09,800
Here, creatures generate their own living light through cold bioluminescent chemistry.

3
00:00:10,500 --> 00:00:15,300
A solitary comb jelly pulses with iridescent waves along its delicate cilia.

4
00:00:16,100 --> 00:00:20,500
In this alien expanse, survival is a dance of illumination and complete stealth.
`,
  },
];
