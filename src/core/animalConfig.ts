export const animalConfig = {
  fox: {
    modelPath: '/models/6144ebf03c914977921677a3e4ffffe2.glb',
    scale: 0.30,
    idleAnimation: 'Idle', // Typically mixamo or blender idle name
    happyAnimation: 'Howl',
    sadAnimation: 'Sad',
    eyeColor: '#FFFFFF', // whitish glowy
    furColor: {
      bronze: '#8B7355',
      silver: '#C0C0C0',
      gold: '#DAA520',
      diamond: '#FFFFFF'
    },
    auraColor: {
      bronze: '#8B4513',
      silver: '#A8A8A8',
      gold: '#FFD700',
      diamond: '#E0FFFF'
    }
  },
  dragon: {
    modelPath: '/models/dragon.glb',
    scale: 2.0,
    idleAnimation: 'Dragon_Idle',
    happyAnimation: 'Dragon_Roar',
    sadAnimation: 'Dragon_Sleep',
    eyeColor: '#00FFCC',
    scaleColor: {
      bronze: '#4A3728',
      silver: '#708090',
      gold: '#B8860B',
      diamond: '#40E0D0'
    },
    auraColor: {
      bronze: '#8B4513',
      silver: '#A8A8A8',
      gold: '#FFD700',
      diamond: '#40E0D0'
    }
  },
  deer: {
    modelPath: '/models/deer.glb',
    scale: 2.2,
    idleAnimation: 'Deer_Idle',
    happyAnimation: 'Deer_Jump',
    sadAnimation: 'Deer_Sad',
    eyeColor: '#FFD700',
    furColor: {
      bronze: '#8B7355',
      silver: '#C0C0C0',
      gold: '#DAA520',
      diamond: '#E8E8E8'
    },
    auraColor: {
      bronze: '#8B4513',
      silver: '#A8A8A8',
      gold: '#FFD700',
      diamond: '#AEE1FF'
    }
  },
  owl: {
    modelPath: '/models/owl.glb',
    scale: 1.8,
    idleAnimation: 'Owl_Idle',
    happyAnimation: 'Owl_Fly',
    sadAnimation: 'Owl_Sad',
    eyeColor: '#FFD700',
    furColor: {
      bronze: '#8B7355',
      silver: '#C0C0C0',
      gold: '#DAA520',
      diamond: '#E8E8E8'
    },
    auraColor: {
      bronze: '#8B4513',
      silver: '#A8A8A8',
      gold: '#FFD700',
      diamond: '#E0FFFF'
    }
  }
} as const;

export type AnimalType = keyof typeof animalConfig;
export type TierType = 'bronze' | 'silver' | 'gold' | 'diamond';

export function getTierForUser(userTier?: string): TierType {
  const t = (userTier || '').toLowerCase();
  if (t === 'diamond') return 'diamond';
  if (t === 'gold') return 'gold';
  if (t === 'silver') return 'silver';
  return 'bronze'; // Default
}
