export const goalsConfig = {
  house: {
    name: 'Dream Home',
    parts: ['Foundation', 'Walls', 'Roof', 'Windows', 'Door', 'Garden'],
    modelPath: '/models/house.glb',
    buildAnimation: 'pieceByPiece' as const
  },
  mba: {
    name: 'MBA Degree',
    parts: ['Applications', 'GMAT Prep', 'Essays', 'Interviews', 'Acceptance', 'Graduation'],
    modelPath: '/models/diploma.glb',
    buildAnimation: 'fadeIn' as const
  },
  startup: {
    name: 'Launch Startup',
    parts: ['Idea', 'MVP', 'First User', 'Revenue', 'Funding', 'Scale'],
    modelPath: '/models/rocket.glb',
    buildAnimation: 'assemble' as const
  },
  emergency: {
    name: 'Safety Net',
    parts: ['1 Month', '3 Months', '6 Months', '12 Months', 'Invested', 'Peace'],
    modelPath: '/models/vault.glb',
    buildAnimation: 'fill' as const
  }
} as const;

export type GoalType = keyof typeof goalsConfig;
