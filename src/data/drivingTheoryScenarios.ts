export interface TheoryOption {
  id: number;
  textGerman: string;
  textEnglish: string;
  isCorrect: boolean;
}

export interface ScenarioEvent {
  timestampSeconds: number;
  description: string;
  actorAction: string;
}

export interface TheoryScenario {
  id: string;
  titleGerman: string;
  titleEnglish: string;
  category: 'priority' | 'cyclist' | 'hazard' | 'overtaking';
  signEmoji: string;
  speedLimitKmh: number;
  initialSpeedKmh: number;
  durationSeconds: number;
  freezeAtSecond: number;
  points: number; // Official German exam error points (Fehlerpunkte)
  questionGerman: string;
  questionEnglish: string;
  options: TheoryOption[];
  explanationGerman: string;
  explanationEnglish: string;
  stvoSection: string; // e.g. "§ 8 Abs. 1 StVO"
  events: ScenarioEvent[];
}

export const DRIVING_THEORY_SCENARIOS: TheoryScenario[] = [
  {
    id: 'rechts_vor_links',
    titleGerman: 'Rechts vor Links an der Kreuzung',
    titleEnglish: 'Right-Before-Left at Unmarked Intersection',
    category: 'priority',
    signEmoji: '⚠️',
    speedLimitKmh: 30,
    initialSpeedKmh: 30,
    durationSeconds: 11,
    freezeAtSecond: 8.5,
    points: 5,
    questionGerman: 'Wie verhalten Sie sich in dieser Situation richtig?',
    questionEnglish: 'How do you behave correctly in this traffic situation?',
    options: [
      {
        id: 0,
        textGerman: 'Ich muss das blaue Fahrzeug von rechts vorfahren lassen.',
        textEnglish: 'I must yield right of way to the blue car from the right.',
        isCorrect: true,
      },
      {
        id: 1,
        textGerman: 'Ich darf vor dem blauen Fahrzeug fahren, da ich geradeaus fahre.',
        textEnglish: 'I may drive before the blue car because I am going straight.',
        isCorrect: false,
      },
      {
        id: 2,
        textGerman: 'Das grüne Fahrzeug von links muss mir Vorfahrt gewähren.',
        textEnglish: 'The green car on my left must yield right of way to me.',
        isCorrect: true,
      },
    ],
    explanationGerman:
      'An Kreuzungen und Einmündungen ohne vorfahrtregelnde Schilder gilt stets die Grundregel "Rechts vor Links" (§ 8 Abs. 1 StVO). Sie müssen dem blauen Fahrzeug Vorrang gewähren. Das grüne Fahrzeug links von Ihnen muss Ihnen Vorrang gewähren.',
    explanationEnglish:
      'At intersections without priority road signs, the fundamental "Right before Left" rule applies (§ 8 para 1 StVO). You must yield to the vehicle on your right. The vehicle on your left must yield to you.',
    stvoSection: '§ 8 Abs. 1 StVO (Vorfahrt)',
    events: [
      {
        timestampSeconds: 1.0,
        description: 'Driving through residential Zone 30 street at 30 km/h.',
        actorAction: 'own_car_cruising',
      },
      {
        timestampSeconds: 4.5,
        description: 'Approaching crossroad. Blue car visible approaching from the right.',
        actorAction: 'blue_car_approaching_right',
      },
      {
        timestampSeconds: 7.0,
        description: 'Green car approaching slowly from the left road.',
        actorAction: 'green_car_approaching_left',
      },
      {
        timestampSeconds: 8.5,
        description: 'Critical freeze moment: Both vehicles at intersection line.',
        actorAction: 'freeze_for_evaluation',
      },
    ],
  },
  {
    id: 'radfahrer_abwaerts',
    titleGerman: 'Rechtsabbiegen mit Radfahrer im Außenspiegel',
    titleEnglish: 'Turning Right with Cyclist in Exterior Mirror',
    category: 'cyclist',
    signEmoji: '🚴',
    speedLimitKmh: 50,
    initialSpeedKmh: 35,
    durationSeconds: 12,
    freezeAtSecond: 9.0,
    points: 5,
    questionGerman: 'Sie möchten nach rechts abbiegen. Worauf müssen Sie achten?',
    questionEnglish: 'You want to turn right. What must you pay attention to?',
    options: [
      {
        id: 0,
        textGerman: 'Ich muss den Radfahrer auf dem Radweg geradeaus durchfahren lassen.',
        textEnglish: 'I must let the cyclist on the bike lane riding straight pass first.',
        isCorrect: true,
      },
      {
        id: 1,
        textGerman: 'Ich muss vor dem Abbiegen einen Schulterblick nach rechts durchführen.',
        textEnglish: 'I must perform a shoulder check to the right before turning.',
        isCorrect: true,
      },
      {
        id: 2,
        textGerman: 'Da mein Blinker gesetzt ist, muss der Radfahrer hinter mir warten.',
        textEnglish: 'Because my indicator is blinking, the cyclist behind must wait.',
        isCorrect: false,
      },
    ],
    explanationGerman:
      'Wer nach rechts abbiegen will, muss auf in gleicher Richtung geradeaus fahrende Radfahrer besondere Rücksicht nehmen und diese durchfahren lassen (§ 9 Abs. 3 StVO). Ein rechtzeitiger Schulterblick ist zwingend vorgeschrieben.',
    explanationEnglish:
      'Drivers turning right must yield to cyclists traveling straight in the same direction (§ 9 para 3 StVO). Checking the blind spot via a shoulder check is mandatory.',
    stvoSection: '§ 9 Abs. 3 StVO (Abbiegen)',
    events: [
      {
        timestampSeconds: 1.5,
        description: 'Right turn indicator engaged. Decelerating from 35 km/h to 15 km/h.',
        actorAction: 'indicator_right_on',
      },
      {
        timestampSeconds: 5.0,
        description: 'Side mirror check: Cyclist riding at steady pace in parallel bike lane.',
        actorAction: 'cyclist_in_side_mirror',
      },
      {
        timestampSeconds: 8.0,
        description: 'Entering turn radius. Cyclist drawing alongside rear passenger door.',
        actorAction: 'cyclist_in_blind_spot',
      },
      {
        timestampSeconds: 9.0,
        description: 'Critical freeze moment: Cyclist directly beside turn entry path.',
        actorAction: 'freeze_for_evaluation',
      },
    ],
  },
  {
    id: 'bus_warnblinklicht',
    titleGerman: 'Linienbus mit eingeschaltetem Warnblinklicht',
    titleEnglish: 'Public Bus with Hazard Warning Lights at Stop',
    category: 'hazard',
    signEmoji: '🚌',
    speedLimitKmh: 50,
    initialSpeedKmh: 45,
    durationSeconds: 11,
    freezeAtSecond: 8.0,
    points: 5,
    questionGerman: 'Ein Linienbus hält mit Warnblinklicht an einer Haltestelle. Wie verhalten Sie sich?',
    questionEnglish: 'A scheduled bus stops with hazard lights activated. How do you behave?',
    options: [
      {
        id: 0,
        textGerman: 'Ich darf nur mit Schrittgeschwindigkeit (4–7 km/h) und sicherem Abstand vorbeifahren.',
        textEnglish: 'I may only pass at walking speed (4–7 km/h) with safe clearance.',
        isCorrect: true,
      },
      {
        id: 1,
        textGerman: 'Ich muss anhalten, wenn ein Fahrgast die Fahrbahn überqueren möchte.',
        textEnglish: 'I must stop if a passenger wants to cross the roadway.',
        isCorrect: true,
      },
      {
        id: 2,
        textGerman: 'Ich darf mit zulässigen 50 km/h zügig überholen, solange die Gegenspur frei ist.',
        textEnglish: 'I may overtake at 50 km/h as long as the oncoming lane is clear.',
        isCorrect: false,
      },
    ],
    explanationGerman:
      'Hält ein Linienbus mit Warnblinklicht an einer Haltestelle, darf an ihm nur mit Schrittgeschwindigkeit (4–7 km/h) und mit ausreichendem Abstand vorbeigefahren werden (§ 20 Abs. 4 StVO) – dies gilt auch für den Gegenverkehr!',
    explanationEnglish:
      'When a scheduled bus stops with hazard lights at a station, passing vehicles must slow to walking speed (4–7 km/h) with safe clearance (§ 20 para 4 StVO) – this also applies to oncoming traffic!',
    stvoSection: '§ 20 Abs. 4 StVO (Öffentliche Verkehrsmittel)',
    events: [
      {
        timestampSeconds: 1.0,
        description: 'Driving down two-lane boulevard at 45 km/h.',
        actorAction: 'cruising_boulevard',
      },
      {
        timestampSeconds: 4.0,
        description: 'Yellow transit bus indicates hazard warning lights and pulls into stop bay.',
        actorAction: 'bus_hazard_lights_active',
      },
      {
        timestampSeconds: 6.5,
        description: 'Pedestrian with backpack steps onto sidewalk curb ahead of bus bumper.',
        actorAction: 'pedestrian_visible_near_bus',
      },
      {
        timestampSeconds: 8.0,
        description: 'Critical freeze moment: Vehicle is 15 meters behind the stationary bus.',
        actorAction: 'freeze_for_evaluation',
      },
    ],
  },
];
