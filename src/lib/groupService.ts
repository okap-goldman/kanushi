import { db } from './db/client'
import { groups, groupMembers, groupChats, profiles } from './db/schema'
import { eq, and, desc, sql, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'

interface CreateGroupData {
  name: string
  description: string
  groupType: 'free' | 'subscription'
  subscriptionPrice?: number
  memberLimit?: number
}

interface SendMessageData {
  messageType: 'text' | 'image' | 'audio'
  textContent?: string
  mediaUrl?: string
}

interface UpdateGroupData {
  name?: string
  description?: string
  memberLimit?: number
}

export async function createGroup(
  userId: string,
  data: CreateGroupData
) {
  // バリデーション
  if (!data.name) {
    throw new Error('グループ名は必須です')
  }

  if (data.name.length > 100) {
    throw new Error('グループ名は100文字以内で入力してください')
  }

  const groupId = nanoid()

  // Stores.jp連携のモック（実際の実装では外部APIを呼び出す）
  let storesPriceId: string | undefined
  if (data.groupType === 'subscription') {
    storesPriceId = `price_${nanoid()}`
  }

  // トランザクション開始
  return await db.transaction(async (tx) => {
    // グループ作成
    const [group] = await tx.insert(groups).values({
      id: groupId,
      ownerUserId: userId,
      name: data.name,
      description: data.description,
      groupType: data.groupType,
      subscriptionPrice: data.subscriptionPrice,
      storesPriceId,
      memberLimit: data.memberLimit || 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    // オーナーをメンバーとして追加
    await tx.insert(groupMembers).values({
      id: nanoid(),
      groupId: groupId,
      userId: userId,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    })

    return group
  })
}

export async function joinGroup(userId: string, groupId: string) {
  // グループの存在確認
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .execute()

  if (!group) {
    throw new Error('グループが見つかりません')
  }

  // 既に参加しているか確認
  const [existingMember] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .execute()

  if (existingMember) {
    throw new Error('既にグループに参加しています')
  }

  // 現在のメンバー数を確認
  const [memberCount] = await db
    .select({ count: count() })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, 'active')
      )
    )
    .execute()

  if (memberCount.count >= group.memberLimit) {
    throw new Error('グループのメンバー数が上限に達しています')
  }

  // メンバー追加
  const [member] = await db.insert(groupMembers).values({
    id: nanoid(),
    groupId: groupId,
    userId: userId,
    role: 'member',
    status: 'active',
    joinedAt: new Date(),
  }).returning()

  return member
}

export async function leaveGroup(userId: string, groupId: string) {
  // メンバー情報取得
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .execute()

  if (!member) {
    throw new Error('グループのメンバーではありません')
  }

  if (member.role === 'owner') {
    throw new Error('グループオーナーは退出できません')
  }

  // ステータスを'left'に更新
  await db
    .update(groupMembers)
    .set({
      status: 'left',
      leftAt: new Date(),
    })
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .execute()

  return true
}

export async function sendGroupMessage(
  userId: string,
  groupId: string,
  data: SendMessageData
) {
  // メンバー確認
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .execute()

  if (!member) {
    throw new Error('グループのメンバーではありません')
  }

  if (member.status !== 'active') {
    throw new Error('アクティブなメンバーではありません')
  }

  // メッセージ作成
  const [message] = await db.insert(groupChats).values({
    id: nanoid(),
    groupId: groupId,
    userId: userId,
    messageType: data.messageType,
    textContent: data.textContent,
    mediaUrl: data.mediaUrl,
    createdAt: new Date(),
  }).returning()

  return message
}

export async function getGroupMessages(
  userId: string,
  groupId: string,
  options?: { cursor?: string; limit?: number }
) {
  // メンバー確認
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .execute()

  if (!member) {
    throw new Error('グループのメンバーではありません')
  }

  const limit = options?.limit || 50

  // メッセージ取得
  let query = db
    .select({
      id: groupChats.id,
      groupId: groupChats.groupId,
      userId: groupChats.userId,
      messageType: groupChats.messageType,
      textContent: groupChats.textContent,
      mediaUrl: groupChats.mediaUrl,
      createdAt: groupChats.createdAt,
    })
    .from(groupChats)
    .where(eq(groupChats.groupId, groupId))
    .orderBy(desc(groupChats.createdAt))
    .limit(limit + 1)

  if (options?.cursor) {
    // カーソルベースのページネーション実装
    const [cursorMessage] = await db
      .select()
      .from(groupChats)
      .where(eq(groupChats.id, options.cursor))
      .execute()

    if (cursorMessage) {
      query = query.where(
        sql`${groupChats.createdAt} < ${cursorMessage.createdAt}`
      )
    }
  }

  const messages = await query.execute()

  const hasMore = messages.length > limit
  const resultMessages = hasMore ? messages.slice(0, -1) : messages
  const nextCursor = hasMore ? resultMessages[resultMessages.length - 1].id : null

  return {
    messages: resultMessages,
    nextCursor,
  }
}

export async function getGroupMembers(
  userId: string,
  groupId: string,
  options?: { cursor?: string; limit?: number }
) {
  // メンバー確認
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .execute()

  if (!member) {
    throw new Error('グループのメンバーではありません')
  }

  const limit = options?.limit || 50

  // メンバー一覧取得
  const members = await db
    .select({
      id: groupMembers.id,
      groupId: groupMembers.groupId,
      userId: groupMembers.userId,
      role: groupMembers.role,
      status: groupMembers.status,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, 'active')
      )
    )
    .orderBy(desc(groupMembers.joinedAt))
    .limit(limit)
    .execute()

  return {
    members,
    nextCursor: null, // 簡易実装のため、ページネーションは省略
  }
}

export async function removeMember(
  operatorUserId: string,
  groupId: string,
  targetUserId: string
) {
  // 操作者の権限確認
  const [operator] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, operatorUserId)
      )
    )
    .execute()

  if (!operator || operator.role !== 'owner') {
    throw new Error('グループオーナーのみがメンバーを除名できます')
  }

  // 対象メンバーの確認
  const [targetMember] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId)
      )
    )
    .execute()

  if (!targetMember) {
    throw new Error('対象のメンバーが見つかりません')
  }

  if (targetMember.role === 'owner') {
    throw new Error('オーナーは除名できません')
  }

  // ステータスを'removed'に更新
  await db
    .update(groupMembers)
    .set({
      status: 'removed',
      leftAt: new Date(),
    })
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId)
      )
    )
    .execute()

  return true
}

export async function updateGroup(
  userId: string,
  groupId: string,
  data: UpdateGroupData
) {
  // グループ取得と権限確認
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .execute()

  if (!group) {
    throw new Error('グループが見つかりません')
  }

  // オーナー確認
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .execute()

  if (!member || member.role !== 'owner') {
    throw new Error('グループオーナーのみが情報を更新できます')
  }

  // メンバー上限の検証
  if (data.memberLimit !== undefined) {
    const [memberCount] = await db
      .select({ count: count() })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.status, 'active')
        )
      )
      .execute()

    if (data.memberLimit < memberCount.count) {
      throw new Error('メンバー上限は現在のメンバー数より少なくできません')
    }
  }

  // グループ更新
  const [updatedGroup] = await db
    .update(groups)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(groups.id, groupId))
    .returning()

  return updatedGroup
}