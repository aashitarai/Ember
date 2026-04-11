export type MockUser = {
  id: string
  name: string
  email: string
  password: string
  avatar: 'fox' | 'crane' | 'bear' | 'dragon'
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'u_aashi',
    name: 'Aashi',
    email: 'aashi@ember.demo',
    password: 'Ember@123',
    avatar: 'fox',
    tier: 'Silver',
  },
  {
    id: 'u_devon',
    name: 'Devon',
    email: 'devon@ember.demo',
    password: 'Ember@123',
    avatar: 'bear',
    tier: 'Bronze',
  },
  {
    id: 'u_mia',
    name: 'Mia',
    email: 'mia@ember.demo',
    password: 'Ember@123',
    avatar: 'crane',
    tier: 'Gold',
  },
  {
    id: 'u_zara',
    name: 'Zara',
    email: 'zara@ember.demo',
    password: 'Ember@123',
    avatar: 'dragon',
    tier: 'Diamond',
  },
]

