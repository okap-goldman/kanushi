import { mockUsers } from './users';

export interface MockGroup {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  owner?: typeof mockUsers[0];
  category: 'spiritual' | 'meditation' | 'healing' | 'study' | 'other';
  visibility: 'public' | 'private' | 'secret';
  member_count: number;
  cover_image: string;
  is_member?: boolean;
  created_at: string;
}

export interface MockGroupMember {
  group_id: string;
  user_id: string;
  user?: typeof mockUsers[0];
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export const mockGroups: MockGroup[] = [
  {
    id: '1',
    name: '目醒めの光✨',
    description: 'スピリチュアルな目醒めを求める仲間が集うグループです。\n日々の気づきや体験をシェアし、共に成長していきましょう。',
    owner_id: '1',
    owner: mockUsers[0],
    category: 'spiritual',
    visibility: 'public',
    member_count: 1234,
    cover_image: 'https://picsum.photos/seed/group1/600/300',
    is_member: true,
    created_at: '2023-06-15T10:00:00Z'
  },
  {
    id: '2',
    name: '朝活瞑想会',
    description: '毎朝5時から瞑想を行うグループ。\n一日の始まりを静寂と共に迎えましょう。',
    owner_id: '2',
    owner: mockUsers[1],
    category: 'meditation',
    visibility: 'public',
    member_count: 567,
    cover_image: 'https://picsum.photos/seed/group2/600/300',
    is_member: true,
    created_at: '2023-08-01T05:00:00Z'
  },
  {
    id: '3',
    name: 'レイキヒーリング実践会',
    description: 'レイキヒーラーが集まり、技術向上と情報交換を行うグループ。\n月1回のオンライン練習会も開催。',
    owner_id: '3',
    owner: mockUsers[2],
    category: 'healing',
    visibility: 'private',
    member_count: 234,
    cover_image: 'https://picsum.photos/seed/group3/600/300',
    is_member: false,
    created_at: '2023-09-20T14:00:00Z'
  },
  {
    id: '4',
    name: '占星術研究会',
    description: '西洋占星術を深く学び、研究するグループ。\n初心者から上級者まで歓迎です。',
    owner_id: '4',
    owner: mockUsers[3],
    category: 'study',
    visibility: 'public',
    member_count: 890,
    cover_image: 'https://picsum.photos/seed/group4/600/300',
    is_member: false,
    created_at: '2023-07-10T12:00:00Z'
  }
];

export const mockGroupMembers: MockGroupMember[] = [
  {
    group_id: '1',
    user_id: '1',
    user: mockUsers[0],
    role: 'owner',
    joined_at: '2023-06-15T10:00:00Z'
  },
  {
    group_id: '1',
    user_id: '2',
    user: mockUsers[1],
    role: 'admin',
    joined_at: '2023-06-20T08:00:00Z'
  },
  {
    group_id: '1',
    user_id: '3',
    user: mockUsers[2],
    role: 'member',
    joined_at: '2023-07-01T14:30:00Z'
  },
  {
    group_id: '2',
    user_id: '2',
    user: mockUsers[1],
    role: 'owner',
    joined_at: '2023-08-01T05:00:00Z'
  },
  {
    group_id: '2',
    user_id: '1',
    user: mockUsers[0],
    role: 'member',
    joined_at: '2023-08-05T06:00:00Z'
  }
];

export const getMockGroup = (groupId: string): MockGroup | undefined => {
  return mockGroups.find(group => group.id === groupId);
};

export const getMockGroupMembers = (groupId: string): MockGroupMember[] => {
  return mockGroupMembers.filter(member => member.group_id === groupId);
};

export const getMockUserGroups = (userId: string): MockGroup[] => {
  const userGroupIds = mockGroupMembers
    .filter(member => member.user_id === userId)
    .map(member => member.group_id);
  
  return mockGroups.filter(group => userGroupIds.includes(group.id));
};